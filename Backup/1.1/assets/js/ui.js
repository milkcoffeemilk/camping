// assets/js/ui.js

/**
 * 將露營場次載入到下拉選單
 */
function renderCampOptions(sessionData) {
  const selectElement = document.getElementById("campSession");

  // 先清空
  selectElement.innerHTML = "";

  // 預設值
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "請選擇露營場次";
  selectElement.appendChild(defaultOption);

  // 動態加入選項
  sessionData.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;  // Notion 資料庫的 ID
    option.textContent = item.name; // 地點_M
    selectElement.appendChild(option);
  });
}

/**
 * 顯示錯誤訊息
 */
function showErrorMessage(msg) {
  alert(msg);
}
