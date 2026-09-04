let questionsDB = [];
let floorRules = [];

const quizRewardConfig = {
  lever: { label: "槓桿", colorClass: "text-amber-300 font-black" },
  pulley: { label: "滑輪", colorClass: "text-blue-300 font-black" },
  wheel: { label: "輪軸", colorClass: "text-emerald-300 font-black" },
  gear: { label: "齒輪", colorClass: "text-indigo-300 font-black" },
  incline: { label: "斜面", colorClass: "text-cyan-300 font-black" }
};

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

  const headers = rows[0].map(header => header.trim().replace(/^\uFEFF/, '').replace(/^ï»¿/, ''));
  return rows.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (row[index] || "").trim();
    });
    return item;
  });
}

const subjectNames = {
  math: "數學",
  english: "英文",
  science: "自然",
  chinese: "國文"
};

function rowToQuiz(row) {
  let answerNumber = Number.parseInt(row.answer, 10);
  if (Number.isNaN(answerNumber) && typeof row.answer === 'string') {
    const ansStr = row.answer.toUpperCase().trim();
    if (ansStr === 'A') answerNumber = 1;
    else if (ansStr === 'B') answerNumber = 2;
    else if (ansStr === 'C') answerNumber = 3;
    else if (ansStr === 'D') answerNumber = 4;
  }
  
  const subj = row.subject ? row.subject.toLowerCase() : 'chinese';
  const subjName = subjectNames[subj] || subj;

  return {
    subject: subj,
    title: row.title,
    question: row.question,
    options: [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean),
    answer: Number.isFinite(answerNumber) ? Math.max(0, answerNumber - 1) : 0,
    explanation: row.explanation,
    reward: (p) => {
      p.scores = p.scores || { math: 0, english: 0, science: 0, chinese: 0 };
      p.scores[subj] = (p.scores[subj] || 0) + 100;
      addLog(`🎁 ${p.name} 答對了！獲得【${subjName}】積分 100 分！`, "text-amber-300 font-black");
    }
  };
}

function buildQuizzes(rows) {
  return rows
    .filter(row => row.title && row.question && row.optionA && row.answer)
    .map(rowToQuiz);
}



async function loadQuestions() {
  try {
    // 嚴格檢查是否有引入 question.js 中的 questionsData
    if (typeof questionsData !== 'undefined' && Array.isArray(questionsData) && questionsData.length > 0) {
      const loadedQuizzes = buildQuizzes(questionsData);
      questionsDB = loadedQuizzes;
      console.log("✅ 成功從 assets/data/question.js 載入題庫");
    } else {
      throw new Error("找不到 questionsData。請確認 assets/data/question.js 是否存在且格式正確。");
    }
  } catch (err) {
    console.error("⚠️ 載入題庫失敗：", err);
    questionsDB = []; // 載入失敗則清空
  }
  
  // Extract unique titles for weight configuration
  const uniqueTitles = [...new Set(questionsDB.map(q => q.title))];
  // Initialize default weights if not set (equal weight)
  if (typeof quizWeights === 'undefined') {
    window.quizWeights = {};
  }
  if (Object.keys(window.quizWeights || {}).length === 0) {
    uniqueTitles.forEach(t => window.quizWeights[t] = 100 / uniqueTitles.length);
  }
  
  window.uniqueQuizTitles = uniqueTitles;
}

function getQuizByWeight() {
  if (questionsDB.length === 0) return null;
  
  // Filter questions that have >0 weight
  const validTitles = Object.keys(quizWeights).filter(t => quizWeights[t] > 0);
  if (validTitles.length === 0) {
    // If all zero, just random from all
    return questionsDB[Math.floor(Math.random() * questionsDB.length)];
  }

  // Pick a random title based on weights
  const totalWeight = validTitles.reduce((sum, t) => sum + quizWeights[t], 0);
  let randomVal = Math.random() * totalWeight;
  let selectedTitle = validTitles[0];
  
  for (const t of validTitles) {
    randomVal -= quizWeights[t];
    if (randomVal <= 0) {
      selectedTitle = t;
      break;
    }
  }

  // Filter questions with selected title
  const questionsOfTitle = questionsDB.filter(q => q.title === selectedTitle);
  if (questionsOfTitle.length === 0) return questionsDB[Math.floor(Math.random() * questionsDB.length)];
  
  return questionsOfTitle[Math.floor(Math.random() * questionsOfTitle.length)];
}

function loadFloorRules() {
  try {
    if (typeof rawFloorRulesCSV !== 'undefined' && rawFloorRulesCSV) {
      floorRules = csvTextToObjects(rawFloorRulesCSV).map(r => ({
        floor: parseInt(r.floor),
        math: parseInt(r.math) || 0,
        english: parseInt(r.english) || 0,
        science: parseInt(r.science) || 0,
        chinese: parseInt(r.chinese) || 0
      }));
    }
  } catch (err) {
    console.error("Failed to load floor rules", err);
  }
}

// Re-enable Promise.all to wait for fetch
window.quizzesReady = Promise.all([loadQuestions(), Promise.resolve(loadFloorRules())]);
window.getQuizByWeight = getQuizByWeight;
