// 공통 fetch 함수
async function fetchData(path, body = {}) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// SecretKey 발급 (clientKey → header)
async function getSecretKey(baseUrl, clientKey) {
  return await fetchData("/api/proxy", {
    baseUrl,
    path: "/auth/getSecretKey",
    headers: { clientKey }, // ✅ 헤더에 clientKey
    body: {},
  });
}

// Token 발급 (secretKey → header, usAuthVal → body)
async function getToken(baseUrl, secretKey, userId) {
  return await fetchData("/api/proxy", {
    baseUrl,
    path: "/auth/getInterfaceUserToken",
    headers: { secretKey }, // ✅ 헤더에 secretKey
    body: { usAuthVal: userId }, // ✅ body에 userId
  });
}

// 공통 POST 창 열기
function openWithPost(url, data, target = "popup") {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = target;

  for (let key in data) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = data[key];
    form.appendChild(input);
  }

 // 팝업 크기
  const width = 1800;
  const height = 1200;

  // 화면 크기 가져오기
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  // 중앙 좌표 계산
  const left = Math.max(0, (screenWidth - width) / 2);
  const top = Math.max(0, (screenHeight - height) / 2);

  // 중앙에 위치한 새 창 열기
  window.open("", target, `width=${width},height=${height},left=${left},top=${top}`);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
