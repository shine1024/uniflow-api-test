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
      <input type="text" id="systemName-${id}" value="${v.systemName || ""}" placeholder="업무시스템명 입력">
    </div>
    <label>BASE_URL: <input type="text" id="baseUrl-${id}" size="50" value="${v.baseUrl}"></label><br>
    <label>FORM_ID: <input type="text" id="formId-${id}" size="50" value="${v.formId}"></label><br>
    <label>CLIENT_KEY: <input type="text" id="clientKey-${id}" size="50" value="${v.clientKey}"></label><br>
    <label>USER_ID: <input type="text" id="userId-${id}" size="50" value="${v.userId}"></label><br><br>
    <button onclick="runTest(${id})">테스트 실행</button>
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

// 테스트 실행 함수 (샘플용)
// 실제 API 호출 로직은 utils.js 활용 가능
// 테스트 실행 함수
async function runTest(id) {
  const systemName = document.getElementById(`systemName-${id}`).value;
  const baseUrl = document.getElementById(`baseUrl-${id}`).value;
  const formId = document.getElementById(`formId-${id}`).value;
  const clientKey = document.getElementById(`clientKey-${id}`).value;
  const userId = document.getElementById(`userId-${id}`).value;

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
    const JSON_HTML_DATA = {"HEADER": {"PUM_KEY": "35909", "MODULEID": "INFRA", "DOCTYPE": "LGL_INFRA_STATEMENT", "SUBJECT": "2025년 08월  차량 보험료 납부 요청건", "OBJECTID": "G_ALIB202508193391", "ETC1": "", "ETC2": "", "ETC3": "", "REMARK": "택배사업본부 서울구로지점[54304] 개봉(대)[11336] 대구81자2131 차량 - 2025년08월", "TOTAL_SUM": "46,347", "PROCESS_SIGNER": {"EMPLOYEE_NUM": "", "DEPT_CD": "", "SIGN_TYPE": ""}}, "BODY": [{"MST": {"SAPNO": "", "TITLE": "매입_2025년 08월  차량 보험료 납부 요청건", "EVIDENCEURL": "", "STATEMENTNO": "NI2025081900002", "TEAM_CODE": "H1000", "TEAMNM": "택배운영부문", "USERNM": "시스템관리자(개발)", "DATEEVIDENCE": "2025-08-19", "CURRENCY": "KRW", "EXCHANGE": "0", "ACCOUNT_TYPE_CODE": "HA", "ACCOUNT_TYPE": "매입", "PAYMENTDATE": "2025-08-20", "DEPT_CD": "H1000", "DEPT_NM": "택배운영부문", "SUPPLYVALUE": "13,322", "TAX": "0", "DEBTOR_SUM": "13,322", "CREDITOR_SUM": "13,322", "FOREIGN_DEBTOR_SUM": "", "FOREIGN_CREDITOR_SUM": "", "SUM": "13,322", "ACCOUNT": "선급비용", "TAX_CODE": "99", "SUMMARY": "매입_2025년 08월  차량 보험료 납부 요청건", "DOCUMENTNO": "NI2025081900002", "BUSINESS_NUMBER": "418-82-01190", "CUSTOMER_CODE_NM": "전국화물자동차공제조합", "EVIDENCE_YN": "N", "PROFIT_CENTER_NM": "인천지점", "BILLING_RECEIPT": "청구", "PURC_TAX_MAPPING": "예외", "TAX_APPR_NO": "", "SUBJECT": "2025년 08월  차량 보험료 납부 요청건", "OBJECTID": "ALIB202508194935", "DATE": "2025-08-19", "PAYMENT_CODE" : "", "PAYMENT_CODE_NAME" : "", "PAYMENTMETHOD": "현금", "PAYMENTMETHOD_NAME": "", "SUGI_YN" : "", "BANK_NAME": "", "ACCT_OWNER": "", "ACCT_NUMBER" : ""}, "DTL": [{"NO": "1", "DEBTOR_CREDITOR": "31", "ENTRYKEY": "31", "ACCOUNT_CODE": "21003010", "ACCOUNT_CODENM": "미지급금(업체)", "SALESCUSTOMER_CODE": "418-82-01190", "SALESCUSTOMERNM": "전국화물자동차공제조합", "SAP_CLIENT_CODE": "41052617", "SAP_CLIENT": "전국화물자동차공제조합", "AREA_CODE": "T000", "AREA_NAME": "택배부문", "PLACE_CODE": "0000", "PLACE": "", "PROFIT_CENTER_CODE": "40000", "PROFIT_CENTER": "인천지점", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "99", "TAX_NM": "매입-기타(부가세 무관)", "SUMMARY": "위수탁/직영 차량 보험료 선급금", "PAYMENTDATE": "2025-08-20", "DEBTOR": "0", "FOREIGN_SUMNM": "", "CREDITOR": "13,322", "FOREIGN_CREDITOR": ""}, {"NO": "2", "DEBTOR_CREDITOR": "40", "ENTRYKEY": "40", "ACCOUNT_CODE": "11109001", "ACCOUNT_CODENM": "선급비용", "SALESCUSTOMER_CODE": "418-82-01190", "SALESCUSTOMERNM": "전국화물자동차공제조합", "SAP_CLIENT_CODE": "41052617", "SAP_CLIENT": "전국화물자동차공제조합", "AREA_CODE": "T000", "AREA_NAME": "택배부문", "PLACE_CODE": "0000", "PLACE": "", "PROFIT_CENTER_CODE": "15300", "PROFIT_CENTER": "서울구로지점", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "99", "TAX_NM": "매입-기타(부가세 무관)", "SUMMARY": "위수탁/직영 차량(대구81자2131)종합 보험료(2025.08.19 - 2025.10.18)", "PAYMENTDATE": "2025-08-20", "DEBTOR": "13,322", "FOREIGN_SUMNM": "", "CREDITOR": "0", "FOREIGN_CREDITOR": ""}]}, {"MST": {"SAPNO": "", "TITLE": "매입_2025년 08월  차량 보험료 납부 요청건", "EVIDENCEURL": "", "STATEMENTNO": "NI2025081900003", "TEAM_CODE": "H1000", "TEAMNM": "택배운영부문", "USERNM": "시스템관리자(개발)", "DATEEVIDENCE": "2025-08-19", "CURRENCY": "KRW", "EXCHANGE": "0", "ACCOUNT_TYPE_CODE": "I1", "ACCOUNT_TYPE": "매입", "PAYMENTDATE": "2025-08-20", "DEPT_CD": "H1000", "DEPT_NM": "택배운영부문", "SUPPLYVALUE": "33,025", "TAX": "0", "PAYMENTMETHOD": "현금", "DEBTOR_SUM": "33,025", "CREDITOR_SUM": "33,025", "FOREIGN_DEBTOR_SUM": "", "FOREIGN_CREDITOR_SUM": "", "SUM": "33,025", "ACCOUNT": "가지급금(업무가불)", "TAX_CODE": "", "SUMMARY": "매입_2025년 08월  차량 보험료 납부 요청건", "DOCUMENTNO": "NI2025081900003", "BUSINESS_NUMBER": "418-82-01190", "CUSTOMER_CODE_NM": "전국화물자동차공제조합", "EVIDENCE_YN": "N", "PROFIT_CENTER_NM": "유한킴벌리운영", "BILLING_RECEIPT": "청구", "PURC_TAX_MAPPING": "예외", "TAX_APPR_NO": "", "SUBJECT": "2025년 08월  차량 보험료 납부 요청건", "OBJECTID": "ALIB202508194936", "DATE": "2025-08-19", "PAYMENT_CODE" : "", "PAYMENT_CODE_NAME" : "", "PAYMENTMETHOD": "현금", "PAYMENTMETHOD_NAME": "", "SUGI_YN" : "", "BANK_NAME": "", "ACCT_OWNER": "", "ACCT_NUMBER" : ""}, "DTL": [{"NO": "1", "DEBTOR_CREDITOR": "31", "ENTRYKEY": "31", "ACCOUNT_CODE": "21003010", "ACCOUNT_CODENM": "미지급금(업체)", "SALESCUSTOMER_CODE": "418-82-01190", "SALESCUSTOMERNM": "전국화물자동차공제조합", "SAP_CLIENT_CODE": "41052617", "SAP_CLIENT": "전국화물자동차공제조합", "AREA_CODE": "M000", "AREA_NAME": "제조물류 부문", "PLACE_CODE": "", "PLACE": "", "PROFIT_CENTER_CODE": "M3901", "PROFIT_CENTER": "유한킴벌리운영", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "", "TAX_NM": "", "SUMMARY": "지입차량 보험료 가지급금", "PAYMENTDATE": "2025-08-20", "DEBTOR": "0", "FOREIGN_SUMNM": "", "CREDITOR": "33,025", "FOREIGN_CREDITOR": ""}, {"NO": "2", "DEBTOR_CREDITOR": "29", "ENTRYKEY": "29", "ACCOUNT_CODE": "11112010", "ACCOUNT_CODENM": "가지급금(업무가불)", "SALESCUSTOMER_CODE": "126-25-15375", "SALESCUSTOMERNM": "롯데글로벌로지스_경기92바3111", "SAP_CLIENT_CODE": "40149116", "SAP_CLIENT": "롯데글로벌로지스_경기92바3111", "AREA_CODE": "M000", "AREA_NAME": "제조물류 부문", "PLACE_CODE": "", "PLACE": "", "PROFIT_CENTER_CODE": "M3901", "PROFIT_CENTER": "유한킴벌리운영", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "", "TAX_NM": "", "SUMMARY": "지입차량(경기92바3111)종합 보험료", "PAYMENTDATE": "2025-08-20", "DEBTOR": "10,002", "FOREIGN_SUMNM": "", "CREDITOR": "0", "FOREIGN_CREDITOR": ""}, {"NO": "3", "DEBTOR_CREDITOR": "29", "ENTRYKEY": "29", "ACCOUNT_CODE": "11112010", "ACCOUNT_CODENM": "가지급금(업무가불)", "SALESCUSTOMER_CODE": "126-25-15375", "SALESCUSTOMERNM": "롯데글로벌로지스_경기92바3111", "SAP_CLIENT_CODE": "40149116", "SAP_CLIENT": "롯데글로벌로지스_경기92바3111", "AREA_CODE": "M000", "AREA_NAME": "제조물류 부문", "PLACE_CODE": "", "PLACE": "", "PROFIT_CENTER_CODE": "M3901", "PROFIT_CENTER": "유한킴벌리운영", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "", "TAX_NM": "", "SUMMARY": "지입차량(경기92바3111)종합 보험료", "PAYMENTDATE": "2025-08-20", "DEBTOR": "23,023", "FOREIGN_SUMNM": "", "CREDITOR": "0", "FOREIGN_CREDITOR": ""}]}]}

    // 일반
    // const JSON_HTML_DATA = {"HEADER": {"PUM_KEY": "35909", "MODULEID": "INFRA", "DOCTYPE": "LGL_INFRA_STATEMENT", "SUBJECT": "2025년 08월  차량 보험료 납부 요청건", "OBJECTID": "G_ALIB202508193391", "ETC1": "", "ETC2": "", "ETC3": "", "REMARK": "택배사업본부 서울구로지점[54304] 개봉(대)[11336] 대구81자2131 차량 - 2025년08월", "TOTAL_SUM": "46,347", "PROCESS_SIGNER": {"EMPLOYEE_NUM": "", "DEPT_CD": "", "SIGN_TYPE": ""}}, "BODY": [{"MST": {"SAPNO": "", "TITLE": "매입_2025년 08월  차량 보험료 납부 요청건", "EVIDENCEURL": "", "STATEMENTNO": "NI2025081900003", "TEAM_CODE": "H1000", "TEAMNM": "택배운영부문", "USERNM": "시스템관리자(개발)", "DATEEVIDENCE": "2025-08-19", "CURRENCY": "KRW", "EXCHANGE": "0", "ACCOUNT_TYPE_CODE": "I1", "ACCOUNT_TYPE": "매입", "PAYMENTDATE": "2025-08-20", "DEPT_CD": "H1000", "DEPT_NM": "택배운영부문", "SUPPLYVALUE": "33,025", "TAX": "0", "PAYMENTMETHOD": "현금", "DEBTOR_SUM": "33,025", "CREDITOR_SUM": "33,025", "FOREIGN_DEBTOR_SUM": "", "FOREIGN_CREDITOR_SUM": "", "SUM": "33,025", "ACCOUNT": "가지급금(업무가불)", "TAX_CODE": "", "SUMMARY": "매입_2025년 08월  차량 보험료 납부 요청건", "DOCUMENTNO": "NI2025081900003", "BUSINESS_NUMBER": "418-82-01190", "CUSTOMER_CODE_NM": "전국화물자동차공제조합", "EVIDENCE_YN": "N", "PROFIT_CENTER_NM": "유한킴벌리운영", "BILLING_RECEIPT": "청구", "PURC_TAX_MAPPING": "예외", "TAX_APPR_NO": "", "SUBJECT": "2025년 08월  차량 보험료 납부 요청건", "OBJECTID": "ALIB202508194936", "DATE": "2025-08-19", "PAYMENT_CODE": "", "PAYMENT_CODE_NAME": "", "PAYMENTMETHOD": "현금", "PAYMENTMETHOD_NAME": "", "SUGI_YN": "", "BANK_NAME": "", "ACCT_OWNER": "", "ACCT_NUMBER": ""}, "DTL": [{"NO": "1", "DEBTOR_CREDITOR": "31", "ENTRYKEY": "31", "ACCOUNT_CODE": "21003010", "ACCOUNT_CODENM": "미지급금(업체)", "SALESCUSTOMER_CODE": "418-82-01190", "SALESCUSTOMERNM": "전국화물자동차공제조합", "SAP_CLIENT_CODE": "41052617", "SAP_CLIENT": "전국화물자동차공제조합", "AREA_CODE": "M000", "AREA_NAME": "제조물류 부문", "PLACE_CODE": "", "PLACE": "", "PROFIT_CENTER_CODE": "M3901", "PROFIT_CENTER": "유한킴벌리운영", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "", "TAX_NM": "", "SUMMARY": "지입차량 보험료 가지급금", "PAYMENTDATE": "2025-08-20", "DEBTOR": "0", "FOREIGN_SUMNM": "", "CREDITOR": "33,025", "FOREIGN_CREDITOR": ""}, {"NO": "2", "DEBTOR_CREDITOR": "29", "ENTRYKEY": "29", "ACCOUNT_CODE": "11112010", "ACCOUNT_CODENM": "가지급금(업무가불)", "SALESCUSTOMER_CODE": "126-25-15375", "SALESCUSTOMERNM": "롯데글로벌로지스_경기92바3111", "SAP_CLIENT_CODE": "40149116", "SAP_CLIENT": "롯데글로벌로지스_경기92바3111", "AREA_CODE": "M000", "AREA_NAME": "제조물류 부문", "PLACE_CODE": "", "PLACE": "", "PROFIT_CENTER_CODE": "M3901", "PROFIT_CENTER": "유한킴벌리운영", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "", "TAX_NM": "", "SUMMARY": "지입차량(경기92바3111)종합 보험료", "PAYMENTDATE": "2025-08-20", "DEBTOR": "10,002", "FOREIGN_SUMNM": "", "CREDITOR": "0", "FOREIGN_CREDITOR": ""}, {"NO": "3", "DEBTOR_CREDITOR": "29", "ENTRYKEY": "29", "ACCOUNT_CODE": "11112010", "ACCOUNT_CODENM": "가지급금(업무가불)", "SALESCUSTOMER_CODE": "126-25-15375", "SALESCUSTOMERNM": "롯데글로벌로지스_경기92바3111", "SAP_CLIENT_CODE": "40149116", "SAP_CLIENT": "롯데글로벌로지스_경기92바3111", "AREA_CODE": "M000", "AREA_NAME": "제조물류 부문", "PLACE_CODE": "", "PLACE": "", "PROFIT_CENTER_CODE": "M3901", "PROFIT_CENTER": "유한킴벌리운영", "PAYMENT_CONDITION_CODE": "", "PAYMENT_CONDITION": "", "TAX_CODE": "", "TAX_NM": "", "SUMMARY": "지입차량(경기92바3111)종합 보험료", "PAYMENTDATE": "2025-08-20", "DEBTOR": "23,023", "FOREIGN_SUMNM": "", "CREDITOR": "0", "FOREIGN_CREDITOR": ""}]}]};

    // 3. 팝업 오픈
    const params = {
      token,
      apiKey: "approvalWrite",
      jsonData: JSON.stringify({
        aprvTitle: `API 테스트 - ${systemName} - ${formatDate()}`,
        formId,
        ifAppId: Date.now().toString(),
        docAddCont: JSON_HTML_DATA,
        isViewTempBtn: "Y",
        lstAprvSCDocLine: [
          {
            aprvlnUsVal: "demo002",
            aprvlnUsMod: "S",
            aprvlnOdr: "1",
            editYn: "Y",
          },
          {
            aprvlnUsVal: "demo001",
            aprvlnUsMod: "S",
            aprvlnOdr: "2",
            editYn: "Y",
          },
        ],
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
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // 월
  const dd = String(date.getDate()).padStart(2, '0');      // 일
  const hh = String(date.getHours()).padStart(2, '0');     // 시
  const mi = String(date.getMinutes()).padStart(2, '0');   // 분
  const ss = String(date.getSeconds()).padStart(2, '0');   // 초

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
