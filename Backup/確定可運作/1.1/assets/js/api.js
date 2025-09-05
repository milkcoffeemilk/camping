// assets/js/api.js

/**
 * 從 Notion 取得露營場次資料
 * 僅抓 End_Date 大於今天的項目
 */
async function fetchCampSessions() {
  try {
    const response = await fetch(`${CONFIG.GAS_URL}?action=getSessions`);
    const result = await response.json();

    if (!result || !result.data) {
      throw new Error("無資料回傳");
    }

    return result.data;
  } catch (error) {
    console.error("取得場次資料失敗:", error);
    throw error;
  }
}

/**
 * 將報名資料寫入 Google Sheets 與 Notion
 */
async function submitRegistration(formData) {
  try {
    const response = await fetch(CONFIG.GAS_URL, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "資料寫入失敗");
    }

    return result;
  } catch (error) {
    console.error("送出報名資料失敗:", error);
    throw error;
  }
}
