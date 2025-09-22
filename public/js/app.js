let systemCount = 0;

// 페이지 최초 로드 시 실행
// 저장된 설정 불러오기 (있으면 반영, 없으면 빈 상태 유지)
window.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
});

// 테스트 항목 추가 버튼 이벤트
// 새 시스템 항목 박스를 기본값과 함께 추가
document.getElementById("addSystemBtn").addEventListener("click", () => {
  systemCount++;
  addSystemBox(systemCount);
});

// 저장 버튼 이벤트
// 현재 화면의 항목들을 모두 수집하여 서버에 저장
document.getElementById("saveConfigBtn").addEventListener("click", async () => {
  const systems = collectSystems();
  await fetch("/api/save-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(systems),
  });
  alert("설정 저장 완료!");
});

// 불러오기 버튼 이벤트
// 서버에서 저장된 설정 불러오기
document.getElementById("loadConfigBtn").addEventListener("click", async () => {
  await loadConfig();
  alert("설정 불러오기 완료!");
});

// 초기화 버튼 이벤트
// 저장된 설정을 비우고, 화면도 초기화
document
  .getElementById("resetConfigBtn")
  .addEventListener("click", async () => {
    await fetch("/api/reset-config", { method: "POST" });
    await loadConfig();
    alert("설정이 초기화되었습니다.");
  });

// 설정 불러오기 함수
async function loadConfig() {
  const res = await fetch("/api/load-config");
  const systems = await res.json();

  // 기존 화면 비우기
  document.getElementById("systemsContainer").innerHTML = "";
  systemCount = 0;

  // 저장된 설정이 있으면 항목 생성
  if (systems.length > 0) {
    systems.forEach((sys) => {
      systemCount++;
      addSystemBox(systemCount, sys);
    });
  }
}

// 현재 화면의 입력값 수집 함수
function collectSystems() {
  const systems = [];
  document.querySelectorAll(".system-box").forEach((box) => {
    const id = box.dataset.id;
    systems.push({
      systemName: document.getElementById(`systemName-${id}`).value,
      baseUrl: document.getElementById(`baseUrl-${id}`).value,
      formId: document.getElementById(`formId-${id}`).value,
      clientKey: document.getElementById(`clientKey-${id}`).value,
      userId: document.getElementById(`userId-${id}`).value,
      multiJson: document.getElementById(`multiJson-${id}`).value,
      simpleJson: document.getElementById(`simpleJson-${id}`).value,
    });
  });
  return systems;
}

// 시스템 항목 박스 추가 함수
function addSystemBox(id, values = {}) {
  // 기본값 정의
  const defaults = {
    systemName: `업무시스템 #${id}`,
    baseUrl: "https://uniflow.unipost.co.kr",
    formId: "21D7A8C088B24A579F37DA1B85F7AA54",
    clientKey: "861905132B80441D906AAF31C47BB968",
    userId: "demo001",
  };

  // 전달된 값이 있으면 병합, 없으면 기본값 사용
  const v = { ...defaults, ...values };

  // 시스템 박스 생성
  const container = document.getElementById("systemsContainer");
  const box = document.createElement("div");
  box.className = "system-box";
  box.dataset.id = id;

  box.innerHTML = `
    <div class="system-title">
      #${id}. 업무시스템:
      <input type="text" id="systemName-${id}" value="${
    v.systemName || ""
  }" placeholder="업무시스템명 입력">
    </div>
    <label>BASE_URL: <input type="text" id="baseUrl-${id}" size="50" value="${
    v.baseUrl
  }"></label><br>
    <label>FORM_ID: <input type="text" id="formId-${id}" size="50" value="${
    v.formId
  }"></label><br>
    <label>CLIENT_KEY: <input type="text" id="clientKey-${id}" size="50" value="${
    v.clientKey
  }"></label><br>
    <label>USER_ID: <input type="text" id="userId-${id}" size="50" value="${
    v.userId
  }"></label><br>
    <label>통합결재_JSON_DATA:<br>
      <textarea id="multiJson-${id}" rows="2" cols="60">${
    v.multiJson || ""
  }</textarea>
    </label><br>
    <label>일반결재_JSON_DATA:<br>
      <textarea id="simpleJson-${id}" rows="2" cols="60">${
    v.simpleJson || ""
  }</textarea>
    </label><br>
    <button onclick="runMultiTest(${id})">통합결재 테스트 실행</button>
    <button onclick="runSimpleTest(${id})">일반결재 테스트 실행</button>
    <button onclick="removeSystem(${id})">삭제</button>
  `;

  container.appendChild(box);
}

// 인코딩
function encodeUnicode(str) {
  const bytes = new TextEncoder().encode(str); // UTF-8 바이트 배열
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary); // Base64 인코딩
}

async function runMultiTest(id) {
  runTest("M", id);
}

async function runSimpleTest(id) {
  runTest("S", id);
}

// 테스트 실행 함수 (샘플용)
// 실제 API 호출 로직은 utils.js 활용 가능
// 테스트 실행 함수
async function runTest(type, id) {
  const systemName = document.getElementById(`systemName-${id}`).value;
  const baseUrl = document.getElementById(`baseUrl-${id}`).value;
  const formId = document.getElementById(`formId-${id}`).value;
  const clientKey = document.getElementById(`clientKey-${id}`).value;
  const userId = document.getElementById(`userId-${id}`).value;
  const multiJson = document.getElementById(`multiJson-${id}`).value;
  const simpleJson = document.getElementById(`simpleJson-${id}`).value;

  try {
    // 1. SecretKey 발급
    const secretRes = await getSecretKey(baseUrl, clientKey);
    const secretKey = secretRes?.response?.secretKey;
    if (!secretKey) throw new Error("시크릿키 발급 실패");

    // 2. Token 발급
    const tokenRes = await getToken(baseUrl, secretKey, userId);
    const token = tokenRes?.response?.token;
    if (!token) throw new Error("토큰 발급 실패");

    // 통합
    const JSON_DATA =
      type === "M"
        ? JSON.parse(replacePlaceholders(multiJson))
        : JSON.parse(replacePlaceholders(simpleJson));

    // 3. 팝업 오픈
    const params = {
      token,
      apiKey: "approvalWrite",
      jsonData: JSON.stringify({
        aprvTitle: `API 테스트 - ${systemName} - ${formatDate()}`,
        formId,
        ifAppId: `IFAPPID${Date.now().toString()}`,
        docAddCont: JSON_DATA,
        isViewTempBtn: "Y",
      }),
    };

    openWithPost(
      `${baseUrl}/unicloud/api/call-service-page`,
      params,
      `popup-${id}`
    );

    console.log(`✅ 시스템 #${id} 실행 완료`, {
      baseUrl,
      formId,
      clientKey,
      userId,
      token,
    });
  } catch (err) {
    console.error("runTest 실패:", err);
    alert(`테스트 실패: ${err.message}`);
  }
}

// 시스템 항목 삭제 함수
function removeSystem(id) {
  const box = document.querySelector(`.system-box[data-id="${id}"]`);
  if (box) {
    box.remove();
  }
}

// 날짜 포맷 함수
function formatDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // 월
  const dd = String(date.getDate()).padStart(2, "0"); // 일
  const hh = String(date.getHours()).padStart(2, "0"); // 시
  const mi = String(date.getMinutes()).padStart(2, "0"); // 분
  const ss = String(date.getSeconds()).padStart(2, "0"); // 초

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

const idSequences = {}; // prefix별 시퀀스 저장 객체
function generateCustomId(text) {
  const now = new Date();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  // prefix별 시퀀스 초기화 및 증가
  if (!idSequences[text]) {
    idSequences[text] = 0;
  }
  idSequences[text] = (idSequences[text] + 1) % 100; // 2자리 순번 (00~99)
  const seq = String(idSequences[text]).padStart(2, "0");

  // 8자리 랜덤 숫자 생성 (10000000 ~ 99999999)
  const randomPart = String(Math.floor(10000000 + Math.random() * 90000000));

  // 최종 ID 조합
  const prefix = `${text}${MM}${dd}${randomPart}`;
  return `${prefix}${seq}`; // 예: A-25091818000000123456
}

// 테스트 데이터 유니크 값으로 치환처리
function replacePlaceholders(jsonStr, context) {
  return jsonStr.replace(/{{(.*?)}}/g, (_, key) => {
    switch (key) {
      case "KEY1":
        return generateCustomId("A");
      case "KEY2":
        return generateCustomId("B");
      case "KEY3":
        return generateCustomId("C");
      case "KEY4":
        return generateCustomId("D");
      default:
        return context[key] || "";
    }
  });
}
