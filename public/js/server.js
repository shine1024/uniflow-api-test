const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));


// configs.json 경로
const CONFIG_FILE = path.join(__dirname, "configs.json");

// ======================
// 공통 프록시
// ======================
app.post("/api/proxy", async (req, res) => {
  try {
    const { baseUrl, path: apiPath, headers, body } = req.body;

    const response = await axios.post(`${baseUrl}${apiPath}`, body || {}, {
      headers,
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
// 서버 실행
// ======================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
