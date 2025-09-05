const API = {
  /** 取得場次資料 **/
  async getSessions() {
    const notionSessionURL = `${CONFIG.scriptURL}?action=getUpcomingEvents`;
    
    try {
      const res = await fetch(notionSessionURL);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('載入場次失敗：', err);
      throw err;
    }
  },

  /** 提交表單資料 **/
  async submitFormData(formData) {
    try {
      const res = await fetch(CONFIG.scriptURL, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('提交表單失敗：', err);
      throw err;
    }
  }
};
