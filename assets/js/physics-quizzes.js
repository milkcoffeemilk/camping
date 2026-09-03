let physicsQuizzes = [];

const quizRewardConfig = {
  lever: { label: "槓桿", colorClass: "text-amber-300 font-black" },
  pulley: { label: "滑輪", colorClass: "text-blue-300 font-black" },
  wheel: { label: "輪軸", colorClass: "text-emerald-300 font-black" },
  gear: { label: "齒輪", colorClass: "text-indigo-300 font-black" },
  incline: { label: "斜面", colorClass: "text-cyan-300 font-black" }
};

const fallbackQuizRows = [
  {
    title: "槓桿原理挑戰",
    question: "想用比較小的力抬起重物，施力點通常應該放在哪裡？",
    optionA: "離支點遠一點",
    optionB: "離支點近一點",
    optionC: "直接放在支點上",
    optionD: "",
    answer: "A",
    explanation: "答對了！施力臂越長，越容易產生足夠力矩。"
  },
  {
    title: "滑輪省力挑戰",
    question: "動滑輪最主要的效果是什麼？",
    optionA: "改變物體顏色",
    optionB: "省力但拉繩距離較長",
    optionC: "讓重力消失",
    optionD: "",
    answer: "B",
    explanation: "答對了！動滑輪能分擔重量，所以比較省力。"
  },
  {
    title: "輪軸傳動挑戰",
    question: "輪軸能讓工作變輕鬆，關鍵原因比較接近哪一個？",
    optionA: "利用較大的輪半徑增加力矩",
    optionB: "讓物體變輕",
    optionC: "讓時間停止",
    optionD: "",
    answer: "A",
    explanation: "答對了！輪越大，同樣的力可以產生更大的轉動效果。"
  },
  {
    title: "齒輪咬合挑戰",
    question: "兩個互相咬合的齒輪，轉動方向會如何？",
    optionA: "方向相同",
    optionB: "方向相反",
    optionC: "完全不會轉",
    optionD: "",
    answer: "B",
    explanation: "答對了！相鄰齒輪會朝相反方向旋轉。"
  },
  {
    title: "斜面省力挑戰",
    question: "斜面為什麼能省力？",
    optionA: "把重物推上較長距離，降低需要的力",
    optionB: "讓重量直接歸零",
    optionC: "只靠運氣",
    optionD: "",
    answer: "A",
    explanation: "答對了！斜面用較長路徑換取較小施力。"
  }
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(field);
      if (row.some(value => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some(value => value.trim() !== "")) rows.push(row);
  return rows;
}

function csvTextToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(header => header.trim());
  return rows.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (row[index] || "").trim();
    });
    return item;
  });
}

function rowToQuiz(row) {
  let answerNumber = Number.parseInt(row.answer, 10);
  if (Number.isNaN(answerNumber) && typeof row.answer === 'string') {
    const ansStr = row.answer.toUpperCase().trim();
    if (ansStr === 'A') answerNumber = 1;
    else if (ansStr === 'B') answerNumber = 2;
    else if (ansStr === 'C') answerNumber = 3;
    else if (ansStr === 'D') answerNumber = 4;
  }
  
  const rewardItem = row.rewardItem || row.machine || "lever";
  const reward = quizRewardConfig[rewardItem] || quizRewardConfig.lever;

  return {
    machine: row.machine || "lever",
    title: row.title,
    question: row.question,
    options: [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean),
    answer: Number.isFinite(answerNumber) ? Math.max(0, answerNumber - 1) : 0,
    explanation: row.explanation,
    reward: (p) => {
      p.inventory[rewardItem] = (p.inventory[rewardItem] || 0) + 1;
      addLog(`🎁 ${p.name} 獲得【${reward.label}道具卡】！`, reward.colorClass);
    }
  };
}

function buildPhysicsQuizzes(rows) {
  return rows
    .filter(row => row.title && row.question && row.optionA && row.answer)
    .map(rowToQuiz);
}

async function loadPhysicsQuizzes() {
  try {
    const response = await fetch("assets/data/physics-quizzes.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);

    const csvText = await response.text();
    const loadedQuizzes = buildPhysicsQuizzes(csvTextToObjects(csvText));
    physicsQuizzes = loadedQuizzes.length > 0 ? loadedQuizzes : buildPhysicsQuizzes(fallbackQuizRows);
  } catch (err) {
    console.warn("Using fallback physics quizzes.", err);
    physicsQuizzes = buildPhysicsQuizzes(fallbackQuizRows);
  }

  return physicsQuizzes;
}

window.physicsQuizzesReady = loadPhysicsQuizzes();
