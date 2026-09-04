// Mock quiz data for now, later populated from CSV to JS
let quizBank = [
    { subject: '數學', title: '加法', question: '1 + 1 = ?', optionA: '1', optionB: '2', optionC: '3', optionD: '4', answer: 'B', explanation: '基礎數學' },
    { subject: '自然', title: '光合作用', question: '植物行光合作用需要什麼氣體？', optionA: '氧氣', optionB: '氮氣', optionC: '二氧化碳', optionD: '氫氣', answer: 'C', explanation: '吸收二氧化碳釋放氧氣' },
    { subject: '英文', title: '打招呼', question: 'How are you?', optionA: 'I am fine', optionB: 'Yes', optionC: 'No', optionD: 'Apple', answer: 'A', explanation: '常見問候語' }
];

function getRandomQuiz() {
    if (quizBank.length === 0) return null;
    // Currently purely random, later can implement weight system
    const index = Math.floor(Math.random() * quizBank.length);
    return quizBank[index];
}

function checkAnswer(quiz, selectedOption) {
    return quiz.answer === selectedOption;
}
