// assets/js/ui.js

const UI = {
  /**
   * 更新使用者資訊顯示
   */
  updateUserInfo(profile) {
    document.getElementById("userName").textContent = `👤 目前登入者：${profile.displayName}`;
    document.getElementById("name").value = profile.displayName;
    document.getElementById("eventForm").dataset.userId = profile.userId;
  },

  /**
   * 顯示載入錯誤
   */
  showUserError() {
    document.getElementById("userName").textContent = "⚠️ 無法取得使用者資訊";
  },

  /**
   * 載入場次資料到下拉選單
   */
  async loadSessions() {
    const select = document.getElementById('eventName');
    select.innerHTML = '<option value="">載入中...</option>';

    try {
      const data = await API.getSessions();
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

  /**
   * 驗證表單
   */
  validateForm() {
    // 驗證夜衝必填
    if (document.getElementById("nightAttack").value === "") {
      alert("請選擇是否夜衝");
      return false;
    }
    return true;
  },

  /**
   * 顯示成功訊息
   */
  showSuccess(message) {
    alert(message);
  },

  /**
   * 顯示錯誤訊息
   */
  showError(message) {
    alert(message);
  },

  /**
   * 關閉視窗
   */
  closeWindow() {
    if (typeof liff !== 'undefined' && liff.closeWindow) {
      liff.closeWindow();
    }
  },

  /**
   * 綁定表單事件
   */
  bindFormEvents() {
    document.getElementById("eventForm").addEventListener("submit", e => {
      e.preventDefault();
      
      if (!this.validateForm()) {
        return;
      }

      const form = e.target;
      const formData = new FormData(form);
      const userId = form.dataset.userId || "";
      const noteField = formData.get("note") || "";
      formData.set("note", `${noteField}\nLINE UserId: ${userId}`);

      this.submitForm(formData);
    });
  },

  /**
   * 提交表單
   */
  async submitForm(formData) {
    try {
      const data = await API.submitFormData(formData);

      if (data.status === "success") {
        this.showSuccess("✅ 報名成功！資料已寫入 Google Sheets");
        this.closeWindow();
      } else {
        this.showError("❌ 報名失敗：" + data.message);
      }
    } catch (err) {
      this.showError("❌ 系統錯誤，請稍後再試！");
      console.error(err);
    }
  }
};
