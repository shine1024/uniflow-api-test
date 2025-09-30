const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const https = require("https"); 
const xmlparser = require("express-xml-bodyparser"); // ✅ XML 파서 추가

const app = express();
const PORT = 3000;

// JSON 파서
app.use(express.json());

// XML 파서 (Content-Type: application/xml 또는 text/xml)
app.use(xmlparser({ explicitArray: false }));

app.use(express.static(path.join(__dirname, "..")));





// configs.json 경로
const CONFIG_FILE = path.join(__dirname, "configs.json");

// ======================
// 공통 프록시
// ======================
app.post("/api/proxy", async (req, res) => {
  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const { baseUrl, path: apiPath, headers, body } = req.body;
    const response = await axios.post(`${baseUrl}${apiPath}`, body || {}, {
      headers,
      httpsAgent,
    });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Proxy 호출 실패:", err.message);
    res.status(500).json({ error: "Proxy 호출 실패", detail: err.message });
  }
});

// ======================
// 설정 저장
// ======================
app.post("/api/save-config", (req, res) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 설정 저장 실패:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 설정 불러오기
// ======================
app.get("/api/load-config", (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      res.json(JSON.parse(data));
    } else {
      res.json([]); // 파일 없으면 빈 배열
    }
  } catch (err) {
    console.error("❌ 설정 불러오기 실패:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 설정 초기화
// ======================
app.post("/api/reset-config", (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE); // 파일 삭제
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 설정 초기화 실패:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// AnyLink EAI 연계 데이터 => 레거시 수신 로그 API
// ======================
app.post("/VPAY/TEST/returnMoinData_i.do", (req, res) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
      try {
        console.log("📥 AnyLink EAI 수신 성공:", JSON.stringify(req.body, null, 2));
        res.json({ MSGTY: 'S', MSG: "AnyLink EAI 수신 완료" });
      } catch (err) {
        console.error("❌ AnyLink EAI 수신 실패:", err.message);
        res.status(500).json({ MSGTY: 'S', MSG: err.message });
      } finally {
        console.log(" ");
        console.log(" ");
      }
  } else {
  try {
    console.log("📥 iGate EAI 수신 성공:");
    console.log(JSON.stringify(req.body, null, 2));

    // 예시: 처리 성공 여부 판단 (여기선 임시로 true로 설정)
    const isSuccess = true; // 또는 실제 로직에 따라 판단

    const status = isSuccess ? "S" : "E";
    const message = isSuccess
      ? "레거시 XML 수신 완료"
      : "정의되지 않은 DOCTYPE 입니다.";

    const xmlResponse = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <soap:Body>
          <PushAlarmResopnse xmlns="http://tempuri.org/">
            <status>${status}</status>
            <message>${message}</message>
          </PushAlarmResopnse>
        </soap:Body>
      </soap:Envelope>
    `.trim();

    res.set("Content-Type", "application/xml");
    res.status(200).send(xmlResponse);
  } catch (err) {
    console.error("❌ iGate EAI 수신 실패:", err.message);

    const errorXml = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <soap:Body>
          <PushAlarmResopnse xmlns="http://tempuri.org/">
            <status>error</status>
            <message>${err.message}</message>
          </PushAlarmResopnse>
        </soap:Body>
      </soap:Envelope>
    `.trim();

    res.set("Content-Type", "application/xml");
    res.status(500).send(errorXml);
  }
  }
});

// ======================
// 서버 실행
// ======================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
