const diceIcons = [
  "fa-dice-one",
  "fa-dice-two",
  "fa-dice-three",
  "fa-dice-four",
  "fa-dice-five",
  "fa-dice-six"
];

let currentPlayerIndex = 0;
let isRolling = false;
let editingPlayerIndex = 0;
let tempAvatarState = {
  name: "",
  icon: "fa-user-ninja",
  color: "bg-red-500",
  customAvatar: "",
  avatarType: "icon"
};

let players = [
  {
    id: 0,
    name: "玩家 1 (紅)",
    money: 15000,
    loan: 0,
    floor: 1,
    position: 0,
    color: "bg-red-500",
    icon: "fa-user-ninja",
    customAvatar: "",
    avatarType: "icon",
    scores: { math: 0, english: 0, science: 0, chinese: 0 },
    activeBuffs: {},
    bankrupted: false
  },
  {
    id: 1,
    name: "玩家 2 (藍)",
    money: 15000,
    loan: 0,
    floor: 1,
    position: 0,
    color: "bg-blue-500",
    icon: "fa-user-astronaut",
    customAvatar: "",
    avatarType: "icon",
    scores: { math: 0, english: 0, science: 0, chinese: 0 },
    activeBuffs: {},
    bankrupted: false
  }
];

const baseTiles = [
  { name: "起點", type: "start", icon: "fa-flag-checkered", pos: [0, 0] },
  { name: "數學街", type: "property", price: 1200, rent: 220, housePrice: 600, owner: null, houses: 0, pos: [0, 1] },
  { name: "知識挑戰", type: "physics", machineType: "incline", icon: "fa-book", pos: [0, 2] },
  { name: "英文港", type: "property", price: 1500, rent: 260, housePrice: 700, owner: null, houses: 0, pos: [0, 3] },
  { name: "機會", type: "chance", icon: "fa-shuffle", pos: [0, 4] },
  { name: "自然坊", type: "property", price: 1800, rent: 320, housePrice: 850, owner: null, houses: 0, pos: [0, 5] },
  { name: "彎道", type: "corner", icon: "fa-turn-down", pos: [0, 6] },
  { name: "國文路", type: "property", price: 2000, rent: 360, housePrice: 900, owner: null, houses: 0, pos: [1, 6] },
  { name: "命運", type: "fate", icon: "fa-question", pos: [2, 6] },
  { name: "歷史廣場", type: "property", price: 2200, rent: 420, housePrice: 1000, owner: null, houses: 0, pos: [3, 6] },
  { name: "彎道", type: "corner", icon: "fa-turn-down", pos: [4, 6] },
  { name: "地理街", type: "property", price: 2400, rent: 460, housePrice: 1100, owner: null, houses: 0, pos: [4, 5] },
  { name: "知識挑戰", type: "physics", machineType: "lever", icon: "fa-book", pos: [4, 4] },
  { name: "公民大道", type: "property", price: 2600, rent: 520, housePrice: 1200, owner: null, houses: 0, pos: [4, 3] },
  { name: "機會", type: "chance", icon: "fa-shuffle", pos: [4, 2] },
  { name: "美術巷", type: "property", price: 2800, rent: 580, housePrice: 1300, owner: null, houses: 0, pos: [4, 1] },
  { name: "彎道", type: "corner", icon: "fa-turn-up", pos: [4, 0] },
  { name: "音樂角", type: "property", price: 3000, rent: 650, housePrice: 1400, owner: null, houses: 0, pos: [3, 0] },
  { name: "命運", type: "fate", icon: "fa-question", pos: [2, 0] },
  { name: "彎道", type: "corner", icon: "fa-turn-up", pos: [1, 0] },
  { name: "體育塔", type: "property", price: 3400, rent: 760, housePrice: 1600, owner: null, houses: 0, pos: [1, 5] },
  { name: "家政谷", type: "property", price: 3600, rent: 820, housePrice: 1700, owner: null, houses: 0, pos: [2, 5] },
  { name: "書籍稅", type: "tax", icon: "fa-file-invoice-dollar", pos: [3, 5] },
  { name: "資訊實驗室", type: "property", price: 4000, rent: 950, housePrice: 1900, owner: null, houses: 0, pos: [3, 4] },
  { name: "知識挑戰", type: "physics", machineType: "wheel", icon: "fa-book", pos: [3, 3] },
  { name: "生活大樓", type: "property", price: 4200, rent: 1050, housePrice: 2000, owner: null, houses: 0, pos: [3, 2] },
  { name: "升學捷徑", type: "chance", icon: "fa-route", pos: [3, 1] }
];

const floorLengths = [27, 24, 20, 16, 12, 8];
let allFloorTiles = {};
for (let f = 1; f <= 6; f++) {
  const len = floorLengths[f - 1];
  allFloorTiles[f] = baseTiles.slice(0, len).map((t, idx) => ({ ...t, id: idx, floor: f }));
}
let boardTiles = allFloorTiles[1];

const chanceCards = [
  {
    title: "獎學金",
    desc: "考試成績優異，獲得獎學金 $1,200！",
    action: (p) => changeMoney(p, 1200)
  },
  {
    title: "補習費",
    desc: "報名課後輔導，支付 $800。",
    action: (p) => changeMoney(p, -800)
  },
  {
    title: "圖書館直達",
    desc: "找到讀書捷徑，向前進 3 格。",
    action: (p) => movePlayerRelative(p, 3)
  },
  {
    title: "靈感爆發",
    desc: "突然開竅，隨機科目獲得 100 積分！",
    action: (p) => {
      const keys = ["math", "english", "science", "chinese"];
      const key = keys[Math.floor(Math.random() * keys.length)];
      p.scores[key] = (p.scores[key] || 0) + 100;
      addLog(`🧰 ${p.name} 靈感爆發！獲得 ${subjectNames[key] || key} 積分 100 分！`, "text-emerald-300 font-black");
    }
  }
];

const fateCards = [
  {
    title: "能量守恆",
    desc: "整理實驗紀錄得到靈感，獲得 $900。",
    action: (p) => changeMoney(p, 900)
  },
  {
    title: "摩擦損失",
    desc: "裝置卡住了，支付 $700 排除問題。",
    action: (p) => changeMoney(p, -700)
  },
  {
    title: "回到起點",
    desc: "老師請你回起點重新校準裝置，領取起點獎勵 $2,000。",
    action: (p) => {
      p.position = 0;
      changeMoney(p, 2000);
      renderPlayers();
      addLog(`🚩 ${p.name} 回到起點並獲得 $2,000！`, "text-emerald-300 font-black");
    }
  },
  {
    title: "同儕協作",
    desc: "你教會對手一題物理，對手轉給你 $600 感謝金。",
    action: (p) => {
      const otherP = players[(p.id + 1) % players.length];
      otherP.money -= 600;
      p.money += 600;
      checkBankruptcy(otherP);
    }
  }
];
