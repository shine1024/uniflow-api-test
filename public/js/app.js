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

    const HTML = `<div class="unidocu-approval-contents">
    <style>
        body{
        user-select: initial;
    }
        .unidocu-approval-contents {
        min-width: 730px;
        font-size: 12px;
    }
        .unidocu-approval-contents table {
        border-collapse: collapse;
        width: 100%;
    }
        .unidocu-approval-contents table td,
        .unidocu-approval-contents table th {
        font-size: 12px;
        border: 1px solid #ccc;
        word-break: break-all;
        text-align: center;
        height: 20px;
        background-color: #ffffff;
        padding: 3px;
    }
        .unidocu-approval-contents table th {
        background-color: #eee;
    }
        .unidocu-approval-contents .statement-evidence-link {
        width: 17px;
        height: 16px;
        display: inline-block;
        vertical-align: bottom;
        cursor: pointer;
        margin-left: 5px;
        background-image: url(data:image/gif;base64,R0lGODlhEQAQALMAANvb29PT0/z8/GppaePj4+jo6PX19eXl5erq6uvr63h4ePf39+Hh4bS0tP///wAAACH5BAAAAAAALAAAAAARABAAAARpUJjCqr2sGAma/+AHTE3gnGjqBA3VnEssy2dTvbKiz4tjM7iFIjfz3RzC2DAZMwIdCUU0QZVSna+pdXr9vRAIBTg8RmAdY51YBz4f3vDDQHc4Owj4PEFXy5RUgCwaHSGFDSMSFBgYGgIRADs=);
    }
    </style>
    <div style="margin-top: 35px;"></div>
    <table id="header" style="margin-top: 10px; table-layout: fixed; word-wrap: break-word">
        <tbody><tr style="text-align: center">
            <th style="width: 11%">전표번호</th>
            <th style="width: 13%">전표유형</th>
            <th style="width: 10%">전기일</th>
            <th style="width: 10%">증빙일</th>
            <th style="width: 35%">헤더텍스트</th>
            <th style="width: 8%">전표통화</th>
            <th style="width: 10%">환율</th>
        </tr>
        <tr>
            <td data-test="1234" style="text-align: center" data-field-description="BELNR">3200000096</td>
            <td style="text-align: center" data-field-description="BLART_TXT">현금영수증/종이증빙</td>
            <td style="text-align: center" data-field-description="BUDAT">2024-07-29</td>
            <td style="text-align: center" data-field-description="BLDAT">2024-07-29</td>
            <td data-field-description="BKTXT" class="ellipsis"><span></span></td>
            <td style="text-align: center" data-field-description="WAERS">KRW</td>
            <td style="text-align: center;" data-field-description="KURSF">0.00000</td>
        </tr>
        </tbody></table>
    <table id="contents" style="table-layout: fixed; margin-top: 10px;">
        <tbody><tr>
            <th rowspan="2" style="width: 5%;"><p>순 번</p></th>
            <th style="width: 18%;">계정과목</th>
            <th style="width: 18%;">거래처</th>
            <th style="width: 12%;">사업자번호</th>
            <th style="width: 12%;">지급예정일</th>
            <th style="width: 13%;">차변(LC)</th>
            <th style="width: 13%;">대변(LC)</th>
        </tr>
        <tr>
            <th>CC/IO/WBS</th>
            <th>세금코드</th>
            <th colspan="2">적요</th>
            <th>차변(TC)</th>
            <th>대변(TC)</th>
        </tr>
        <tr><!--순번~대변(LC)-->
            <td rowspan="2" style="text-align: center" data-field-description="BUZEI">001</td>
            <td data-field-description="HKONT_TXT">미지급금-종업원</td>
            <td data-field-description="LIFNR_TXT">유니포스트</td>
            <td data-field-description="STCD2_TXT"></td>
            <td data-field-description="NETDT">2024-07-31</td>
            <td data-field-description="ot_data2.DMBTR_S_TXT ot_data2.WRBTR_S_TXT" rowspan="2" style="text-align: right"><br></td>
            <td data-field-description="ot_data2.DMBTR_H_TXT ot_data2.WRBTR_H_TXT" rowspan="2" style="text-align: right">                        5,061<br></td>
        </tr>
        <tr><!--CC/IO/WBS~대변(TC)-->
            <td data-field-description="KOSTL_TXT"></td>
            <td data-field-description="MWSKZ_TXT"></td>
            <td colspan="2" data-field-description="SGTXT">aaa</td>
        </tr>
        <tr><!--순번~대변(LC)-->
            <td rowspan="2" style="text-align: center" data-field-description="BUZEI">002</td>
            <td data-field-description="HKONT_TXT">(일)여비교통비-시내교통비</td>
            <td data-field-description="LIFNR_TXT"></td>
            <td data-field-description="STCD2_TXT"></td>
            <td data-field-description="NETDT">0000-00-00</td>
            <td data-field-description="ot_data2.DMBTR_S_TXT ot_data2.WRBTR_S_TXT" rowspan="2" style="text-align: right">                        5,061<br></td>
            <td data-field-description="ot_data2.DMBTR_H_TXT ot_data2.WRBTR_H_TXT" rowspan="2" style="text-align: right"><br></td>
        </tr>
        <tr><!--CC/IO/WBS~대변(TC)-->
            <td data-field-description="KOSTL_TXT">솔루션팀</td>
            <td data-field-description="MWSKZ_TXT"></td>
            <td colspan="2" data-field-description="SGTXT">aaa</td>
        </tr>
        <tr>
            <td rowspan="2" colspan="3" style="text-align: center;height: 40px">소계</td>
            <td colspan="2" data-field-description="ot_data1.LWAERS">KRW</td>
            <td data-field-description="ot_data1.DMBTR_S_TXT" style="text-align: right;">                        5,061</td>
            <td data-field-description="ot_data1.DMBTR_H_TXT" style="text-align: right;">                        5,061</td>
        </tr>
        <tr>
            <td colspan="2" data-field-description="ot_data1.WAERS">KRW</td>
            <td data-field-description="ot_data1.WRBTR_S_TXT" style="text-align: right;">                        5,061</td>
            <td data-field-description="ot_data1.WRBTR_H_TXT" style="text-align: right;">                        5,061</td>
        </tr>
        </tbody></table>
    <table id="footer" style="margin-top: 10px">
        <tbody><tr>
            <td style="width: 434px; height: 40px">총계</td>
            <td data-field-description="os_head.WAERS" style="width: 249px"></td>
            <td data-field-description="os_head.TOTAL_TXT" style="width: 132px; text-align: right;">                        5,061</td>
            <td data-field-description="os_head.TOTAL_TXT" style="width: 132px; text-align: right;">                        5,061</td>
        </tr>
        </tbody></table>
</div>`;

    // 3. 팝업 오픈
    const params = {
      token,
      apiKey: "approvalWrite",
      jsonData: JSON.stringify({
        aprvTitle: new Date().toISOString() + " API 테스트",
        formId,
        ifAppId: Date.now().toString(),
        docAddCont: encodeUnicode(HTML),
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
