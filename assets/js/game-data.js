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
    position: 0,
    color: "bg-red-500",
    icon: "fa-user-ninja",
    customAvatar: "",
    avatarType: "icon",
    inventory: { lever: 1, pulley: 0, wheel: 0, gear: 0, incline: 0 },
    activeBuffs: { lever: false, pulley: false },
    bankrupted: false
  },
  {
    id: 1,
    name: "玩家 2 (藍)",
    money: 15000,
    loan: 0,
    position: 0,
    color: "bg-blue-500",
    icon: "fa-user-astronaut",
    customAvatar: "",
    avatarType: "icon",
    inventory: { lever: 0, pulley: 1, wheel: 0, gear: 0, incline: 0 },
    activeBuffs: { lever: false, pulley: false },
    bankrupted: false
  }
];

let boardTiles = [
  { id: 0, name: "起點", type: "start", icon: "fa-flag-checkered", pos: [0, 0] },
  { id: 1, name: "槓桿街", type: "property", price: 1200, rent: 220, housePrice: 600, owner: null, houses: 0, pos: [0, 1] },
  { id: 2, name: "斜面坡", type: "physics", machineType: "incline", icon: "fa-truck-ramp-box", pos: [0, 2] },
  { id: 3, name: "滑輪港", type: "property", price: 1500, rent: 260, housePrice: 700, owner: null, houses: 0, pos: [0, 3] },
  { id: 4, name: "機會", type: "chance", icon: "fa-shuffle", pos: [0, 4] },
  { id: 5, name: "齒輪坊", type: "property", price: 1800, rent: 320, housePrice: 850, owner: null, houses: 0, pos: [0, 5] },
  { id: 6, name: "輪軸站", type: "physics", machineType: "wheel", icon: "fa-circle-notch", pos: [0, 6] },
  { id: 7, name: "動能路", type: "property", price: 2000, rent: 360, housePrice: 900, owner: null, houses: 0, pos: [1, 6] },
  { id: 8, name: "命運", type: "fate", icon: "fa-question", pos: [2, 6] },
  { id: 9, name: "支點廣場", type: "property", price: 2200, rent: 420, housePrice: 1000, owner: null, houses: 0, pos: [3, 6] },
  { id: 10, name: "實驗稅", type: "tax", icon: "fa-receipt", pos: [4, 6] },
  { id: 11, name: "螺旋街", type: "property", price: 2400, rent: 460, housePrice: 1100, owner: null, houses: 0, pos: [4, 5] },
  { id: 12, name: "槓桿題", type: "physics", machineType: "lever", icon: "fa-scale-balanced", pos: [4, 4] },
  { id: 13, name: "效率大道", type: "property", price: 2600, rent: 520, housePrice: 1200, owner: null, houses: 0, pos: [4, 3] },
  { id: 14, name: "機會", type: "chance", icon: "fa-shuffle", pos: [4, 2] },
  { id: 15, name: "力臂巷", type: "property", price: 2800, rent: 580, housePrice: 1300, owner: null, houses: 0, pos: [4, 1] },
  { id: 16, name: "滑輪題", type: "physics", machineType: "pulley", icon: "fa-weight-hanging", pos: [4, 0] },
  { id: 17, name: "扭矩角", type: "property", price: 3000, rent: 650, housePrice: 1400, owner: null, houses: 0, pos: [3, 0] },
  { id: 18, name: "命運", type: "fate", icon: "fa-question", pos: [2, 0] },
  { id: 19, name: "齒輪題", type: "physics", machineType: "gear", icon: "fa-gears", pos: [1, 0] },
  { id: 20, name: "能源塔", type: "property", price: 3400, rent: 760, housePrice: 1600, owner: null, houses: 0, pos: [1, 5] },
  { id: 21, name: "摩擦谷", type: "property", price: 3600, rent: 820, housePrice: 1700, owner: null, houses: 0, pos: [2, 5] },
  { id: 22, name: "機械稅", type: "tax", icon: "fa-file-invoice-dollar", pos: [3, 5] },
  { id: 23, name: "冠軍實驗室", type: "property", price: 4000, rent: 950, housePrice: 1900, owner: null, houses: 0, pos: [3, 4] },
  { id: 24, name: "終極輪軸", type: "physics", machineType: "wheel", icon: "fa-circle-notch", pos: [3, 3] },
  { id: 25, name: "鉅力大樓", type: "property", price: 4200, rent: 1050, housePrice: 2000, owner: null, houses: 0, pos: [3, 2] },
  { id: 26, name: "回轉捷徑", type: "chance", icon: "fa-route", pos: [3, 1] }
];

const physicsQuizzes = [
  {
    machine: "lever",
    title: "槓桿原理挑戰",
    question: "想用比較小的力抬起重物，施力點通常應該放在哪裡？",
    options: ["離支點遠一點", "離支點近一點", "直接放在支點上"],
    answer: 0,
    explanation: "答對了！施力臂越長，越容易產生足夠力矩。",
    reward: (p) => {
      p.inventory.lever++;
      addLog(`🎁 ${p.name} 獲得【槓桿道具卡】！`, "text-amber-300 font-black");
    }
  },
  {
    machine: "pulley",
    title: "滑輪省力挑戰",
    question: "動滑輪最主要的效果是什麼？",
    options: ["改變物體顏色", "省力但拉繩距離較長", "讓重力消失"],
    answer: 1,
    explanation: "答對了！動滑輪能分擔重量，所以比較省力。",
    reward: (p) => {
      p.inventory.pulley++;
      addLog(`🎁 ${p.name} 獲得【滑輪道具卡】！`, "text-blue-300 font-black");
    }
  },
  {
    machine: "wheel",
    title: "輪軸傳動挑戰",
    question: "輪軸能讓工作變輕鬆，關鍵原因比較接近哪一個？",
    options: ["利用較大的輪半徑增加力矩", "讓物體變輕", "讓時間停止"],
    answer: 0,
    explanation: "答對了！輪越大，同樣的力可以產生更大的轉動效果。",
    reward: (p) => {
      p.inventory.wheel++;
      addLog(`🎁 ${p.name} 獲得【輪軸道具卡】！`, "text-emerald-300 font-black");
    }
  },
  {
    machine: "gear",
    title: "齒輪咬合挑戰",
    question: "兩個互相咬合的齒輪，轉動方向會如何？",
    options: ["方向相同", "方向相反", "完全不會轉"],
    answer: 1,
    explanation: "答對了！相鄰齒輪會朝相反方向旋轉。",
    reward: (p) => {
      p.inventory.gear++;
      addLog(`🎁 ${p.name} 獲得【齒輪道具卡】！`, "text-indigo-300 font-black");
    }
  },
  {
    machine: "incline",
    title: "斜面省力挑戰",
    question: "斜面為什麼能省力？",
    options: ["把重物推上較長距離，降低需要的力", "讓重量直接歸零", "只靠運氣"],
    answer: 0,
    explanation: "答對了！斜面用較長路徑換取較小施力。",
    reward: (p) => {
      p.inventory.incline++;
      addLog(`🎁 ${p.name} 獲得【斜面道具卡】！`, "text-cyan-300 font-black");
    }
  }
];

const chanceCards = [
  {
    title: "實驗成功",
    desc: "你做出漂亮的省力裝置，獲得研究補助 $1,200！",
    action: (p) => changeMoney(p, 1200)
  },
  {
    title: "器材維修",
    desc: "齒輪箱需要校正，支付維修費 $800。",
    action: (p) => changeMoney(p, -800)
  },
  {
    title: "捷徑滑行",
    desc: "找到一段低摩擦斜面，向前滑行 3 格。",
    action: (p) => movePlayerRelative(p, 3)
  },
  {
    title: "工具箱補給",
    desc: "獲得一張隨機簡單機械道具卡。",
    action: (p) => {
      const keys = ["lever", "pulley", "wheel", "gear", "incline"];
      const key = keys[Math.floor(Math.random() * keys.length)];
      p.inventory[key]++;
      addLog(`🧰 ${p.name} 從工具箱拿到一張道具卡！`, "text-emerald-300 font-black");
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
