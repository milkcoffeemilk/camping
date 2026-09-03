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

const playerColors = [
  { name: "紅", color: "bg-red-500", icon: "fa-user-ninja" },
  { name: "藍", color: "bg-blue-500", icon: "fa-user-astronaut" },
  { name: "綠", color: "bg-green-500", icon: "fa-user-secret" },
  { name: "黃", color: "bg-yellow-500", icon: "fa-user-tie" },
  { name: "紫", color: "bg-purple-500", icon: "fa-user-graduate" },
  { name: "橙", color: "bg-orange-500", icon: "fa-user-doctor" },
  { name: "青", color: "bg-cyan-500", icon: "fa-user-shield" },
  { name: "粉", color: "bg-pink-500", icon: "fa-user-group" }
];

let maxPlayers = 2; // Default, changeable in lobby
let quizWeights = {}; // Will store topic weights

let players = [];
for (let i = 0; i < 8; i++) {
  players.push({
    id: i,
    name: `玩家 ${i + 1} (${playerColors[i].name})`,
    money: 15000,
    loan: 0,
    floor: 1,
    position: 0,
    color: playerColors[i].color,
    icon: playerColors[i].icon,
    customAvatar: "",
    avatarType: "icon",
    scores: {}, // Will be populated dynamically based on titles
    activeBuffs: {},
    bankrupted: false
  });
}


const baseTiles = [
  { name: "起點", type: "start", icon: "fa-flag-checkered", pos: [0, 0] },
  { name: "數學街", type: "property", conqueredBy: null, pos: [0, 1] },
  { name: "知識挑戰", type: "physics", machineType: "incline", icon: "fa-book", pos: [0, 2] },
  { name: "英文港", type: "property", conqueredBy: null, pos: [0, 3] },
  { name: "機會", type: "chance", icon: "fa-shuffle", pos: [0, 4] },
  { name: "自然坊", type: "property", conqueredBy: null, pos: [0, 5] },
  { name: "彎道", type: "corner", icon: "fa-turn-down", pos: [0, 6] },
  { name: "國文路", type: "property", conqueredBy: null, pos: [1, 6] },
  { name: "命運", type: "fate", icon: "fa-question", pos: [2, 6] },
  { name: "歷史廣場", type: "property", conqueredBy: null, pos: [3, 6] },
  { name: "彎道", type: "corner", icon: "fa-turn-down", pos: [4, 6] },
  { name: "地理街", type: "property", conqueredBy: null, pos: [4, 5] },
  { name: "知識挑戰", type: "physics", machineType: "lever", icon: "fa-book", pos: [4, 4] },
  { name: "公民大道", type: "property", conqueredBy: null, pos: [4, 3] },
  { name: "機會", type: "chance", icon: "fa-shuffle", pos: [4, 2] },
  { name: "美術巷", type: "property", conqueredBy: null, pos: [4, 1] },
  { name: "彎道", type: "corner", icon: "fa-turn-up", pos: [4, 0] },
  { name: "音樂角", type: "property", conqueredBy: null, pos: [3, 0] },
  { name: "命運", type: "fate", icon: "fa-question", pos: [2, 0] },
  { name: "彎道", type: "corner", icon: "fa-turn-up", pos: [1, 0] },
  { name: "體育塔", type: "property", conqueredBy: null, pos: [1, 5] },
  { name: "家政谷", type: "property", conqueredBy: null, pos: [2, 5] },
  { name: "書籍稅", type: "tax", icon: "fa-file-invoice-dollar", pos: [3, 5] },
  { name: "資訊實驗室", type: "property", conqueredBy: null, pos: [3, 4] },
  { name: "知識挑戰", type: "physics", machineType: "wheel", icon: "fa-book", pos: [3, 3] },
  { name: "生活大樓", type: "property", conqueredBy: null, pos: [3, 2] },
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
    title: "獲得道具",
    desc: "在圖書館找到一本秘笈，獲得「安全氣囊卡」！",
    action: (p) => {
      p.activeBuffs = p.activeBuffs || {};
      p.activeBuffs["shield"] = (p.activeBuffs["shield"] || 0) + 1;
      addLog(`🛡️ ${p.name} 獲得安全氣囊卡！`, "text-emerald-300 font-black");
    }
  },
  {
    title: "圖書館直達",
    desc: "找到讀書捷徑，免費獲得隨機類別積分 150 分！",
    action: (p) => {
      const titles = window.uniqueQuizTitles || ["槓桿原理"];
      const key = titles[Math.floor(Math.random() * titles.length)];
      p.scores[key] = (p.scores[key] || 0) + 150;
      addLog(`🎁 ${p.name} 獲得 ${key} 積分 150 分！`, "text-emerald-300 font-black");
    }
  }
];

const fateCards = [
  {
    title: "獲得道具",
    desc: "運氣爆棚，獲得「雙倍衝刺卡」！",
    action: (p) => {
      p.activeBuffs = p.activeBuffs || {};
      p.activeBuffs["doubleMove"] = (p.activeBuffs["doubleMove"] || 0) + 1;
      addLog(`⚡ ${p.name} 獲得雙倍衝刺卡！`, "text-amber-300 font-black");
    }
  },
  {
    title: "裝置故障",
    desc: "實驗裝置卡住了，遺失部分積分！",
    action: (p) => {
      const titles = Object.keys(p.scores || {});
      if (titles.length > 0) {
        const key = titles[Math.floor(Math.random() * titles.length)];
        p.scores[key] = Math.max(0, p.scores[key] - 50);
        addLog(`📉 ${p.name} 的 ${key} 積分減少了 50 分！`, "text-rose-400 font-black");
      }
    }
  }
];

const ITEM_SHOP = [
  { id: "doubleMove", name: "雙倍衝刺卡", desc: "下一題答對可前進 2 格", cost: 100, icon: "fa-bolt" },
  { id: "shield", name: "安全氣囊卡", desc: "下一題答錯不會倒退", cost: 150, icon: "fa-shield-halved" },
  { id: "trap", name: "干擾卡", desc: "指定隨機對手倒退 1 格", cost: 200, icon: "fa-skull-crossbones" }
];
