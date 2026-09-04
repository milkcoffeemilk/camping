// assets/js/main.js

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 初始化 LIFF
    await liff.init({ liffId: CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // 取得使用者資料
    const profile = await liff.getProfile();
    document.getElementById("userName").value = profile.displayName;
    document.getElementById("userId").value = profile.userId;

    // 載入場次資料
    const sessions = await fetchCampSessions();
    renderCampOptions(sessions);

  } catch (error) {
    showErrorMessage("初始化失敗，請稍後再試。");
    console.error(error);
  }

  // 送出表單
  document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      userId: document.getElementById("userId").value,
      name: document.getElementById("userName").value,
      campSessionId: document.getElementById("campSession").value,
      timestamp: new Date().toISOString(),
    };

    try {
      const result = await submitRegistration(formData);
      alert("報名成功！");
    } catch (error) {
      showErrorMessage("報名失敗，請稍後再試。");
    }
  });
});
