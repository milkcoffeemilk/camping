const API = {
  /** 取得場次資料 **/
  async loadSessions() {
    const notionSessionURL = `${CONFIG.scriptURL}?action=getUpcomingEvents`;
    const select = document.getElementById('eventName');
    select.innerHTML = '<option value="">載入中...</option>';

    try {
      const res = await fetch(notionSessionURL);
      const data = await res.json();

      console.log("取得到的場次資料：", data); // 除錯用

      if (!data || data.length === 0) {
        select.innerHTML = '<option value="">目前無可報名場次</option>';
        return;
      }

      select.innerHTML = '<option value="">請選擇場次</option>';
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.location} (${item.date})`;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('載入場次失敗：', err);
      select.innerHTML = '<option value="">載入失敗</option>';
    }
  },

  /** 表單送出 **/
  async submitForm(e) {
    const form = e.target;

    // 驗證夜衝必填
    if (document.getElementById("nightAttack").value === "") {
      alert("請選擇是否夜衝");
      return;
    }

    const formData = new FormData(form);
    const userId = form.dataset.userId || "";
    const noteField = formData.get("note") || "";
    formData.set("note", `${noteField}\nLINE UserId: ${userId}`);

    try {
      const res = await fetch(CONFIG.scriptURL, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.status === "success") {
        alert("✅ 報名成功！資料已寫入 Google Sheets");
        liff.closeWindow();
      } else {
        alert("❌ 報名失敗：" + data.message);
      }
    } catch (err) {
      alert("❌ 系統錯誤，請稍後再試！");
      console.error(err);
    }
  }
};
