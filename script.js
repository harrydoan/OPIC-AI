// ===== ENGLISH LEARNING APP - MAIN SCRIPT =====

// API Configuration
const API_CONFIG = {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: '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',
    model: 'openai/gpt-4o-mini'
};

const OPIC_PROMPT = `bạn là chuyên gia, thầy giáo về luyện thi OPIC chứng chỉ quốc tế. Hôm nay hãy gửi cho tôi 1 câu hỏi ngẫu nhiên trong bộ câu hỏi luyện thi OPIC và câu trả lời mẫu ở trình độ AL cho câu hỏi đó. Kết quả trả về chỉ là câu hỏi và câu trả lời mẫu không có chữ gì khác để tôi luyện tập`;

// Global Application State
const AppState = {
    sentences: [],
    questions: [],
    wrongAnswers: [],
    orderingQuestions: [],
    currentQuestionIndex: 0,
    currentOrderingIndex: 0,
    selectedAnswer: null,
    selectedOrderingAnswer: null,
    currentQuestion: null,
    currentOrderingQuestion: null,
    stats: { total: 0, answered: 0, correct: 0, wrong: 0 },
    orderingStats: { total: 0, answered: 0, correct: 0, wrong: 0 }
};

// Common words for generating wrong answers
const COMMON_WORDS = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'this', 'that',
    'these', 'those', 'here', 'there', 'now', 'then', 'good', 'bad', 'big', 'small',
    'new', 'old', 'first', 'last', 'next', 'make', 'take', 'come', 'go', 'get', 'give',
    'see', 'know', 'think', 'feel', 'work', 'play', 'study', 'read', 'write', 'speak'
];

// Grammar Rules Database
const GRAMMAR_RULES = {
    'the': 'Mạo từ xác định (definite article) - dùng trước danh từ đã được xác định hoặc duy nhất.',
    'a': 'Mạo từ không xác định (indefinite article) - dùng trước danh từ số ít, lần đầu nhắc đến.',
    'an': 'Mạo từ không xác định (indefinite article) - dùng trước danh từ bắt đầu bằng nguyên âm.',
    'and': 'Liên từ (conjunction) - nối các từ, cụm từ hoặc câu có cùng tầm quan trọng.',
    'or': 'Liên từ (conjunction) - diễn tả sự lựa chọn giữa các khả năng.',
    'but': 'Liên từ (conjunction) - diễn tả sự tương phản, đối lập.',
    'in': 'Giới từ (preposition) - chỉ vị trí bên trong, thời gian.',
    'on': 'Giới từ (preposition) - chỉ vị trí bề mặt, ngày trong tuần.',
    'at': 'Giới từ (preposition) - chỉ vị trí cụ thể, thời điểm.',
    'is': 'Động từ "to be" ở ngôi thứ 3 số ít (he/she/it is).',
    'are': 'Động từ "to be" ở ngôi thứ 2 số ít/nhiều và ngôi thứ 3 số nhiều.',
    'was': 'Động từ "to be" ở thì quá khứ, ngôi thứ 1,3 số ít.',
    'were': 'Động từ "to be" ở thì quá khứ, ngôi thứ 2 và số nhiều.',
    'have': 'Động từ "have" - diễn tả sở hữu hoặc thì hiện tại hoàn thành.',
    'has': 'Động từ "have" ở ngôi thứ 3 số ít (he/she/it has).',
    'will': 'Động từ khuyết thiếu (modal verb) - diễn tả tương lai.',
    'would': 'Động từ khuyết thiếu - diễn tả điều kiện, lịch sự.',
    'can': 'Động từ khuyết thiếu - diễn tả khả năng, sự cho phép.',
    'could': 'Động từ khuyết thiếu - quá khứ của "can", diễn tả khả năng trong quá khứ.'
};

// Translation Database
const TRANSLATIONS = {
    "English is a global language spoken by millions of people worldwide": 
        "Tiếng Anh là ngôn ngữ được nói bới hàng triệu người trên thế giới":
};
  // ===== UI MANAGEMENT FUNCTIONS =====

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all tabs and buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

function setupPracticeTab() {
    const practiceMessage = document.getElementById('practiceMessage');
    const startPractice = document.getElementById('startPractice');
    const readyQuestions = document.getElementById('readyQuestions');
    
    practiceMessage.style.display = 'none';
    startPractice.style.display = 'block';
    readyQuestions.textContent = AppState.questions.length;
}

function setupOrderingTab() {
    const orderingMessage = document.getElementById('orderingMessage');
    const startOrdering = document.getElementById('startOrdering');
    const readyOrderingQuestions = document.getElementById('readyOrderingQuestions');
    
    orderingMessage.style.display = 'none';
    startOrdering.style.display = 'block';
    readyOrderingQuestions.textContent = AppState.orderingQuestions.length;
}

// ===== PRACTICE FUNCTIONS =====

function startPracticing() {
    if (AppState.questions.length === 0) return;
    
    document.getElementById('startPractice').style.display = 'none';
    showQuestion();
}

function showQuestion() {
    if (AppState.questions.length === 0) {
        document.getElementById('practiceMessage').style.display = 'block';
        return;
    }
    
    // Prioritize wrong answers (70% chance)
    if (AppState.wrongAnswers.length > 0 && Math.random() < 0.7) {
        AppState.currentQuestion = AppState.wrongAnswers.shift();
    } else {
        if (AppState.currentQuestionIndex >= AppState.questions.length) {
            AppState.currentQuestionIndex = 0;
            AppState.questions = shuffleArray(AppState.questions);
        }
        AppState.currentQuestion = AppState.questions[AppState.currentQuestionIndex];
        AppState.currentQuestionIndex++;
    }
    
    // Update UI
    document.getElementById('practiceMessage').style.display = 'none';
    document.getElementById('startPractice').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'block';
    document.getElementById('feedbackContainer').style.display = 'none';
    
    // Display question
    document.getElementById('questionText').innerHTML = AppState.currentQuestion.question;
    
    // Create answer buttons
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
    AppState.currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = option;
        button.dataset.answer = option;
        button.addEventListener('click', () => selectAnswer(option, button));
        answersContainer.appendChild(button);
    });
    
    AppState.selectedAnswer = null;
    document.getElementById('submitAnswer').disabled = true;
}

function selectAnswer(answer, button) {
    // Remove selection from all buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select clicked button
    button.classList.add('selected');
    AppState.selectedAnswer = answer;
    document.getElementById('submitAnswer').disabled = false;
}

function submitAnswer() {
    if (!AppState.selectedAnswer) return;
    
    const isCorrect = AppState.selectedAnswer === AppState.currentQuestion.correctAnswer;
    
    // Update stats
    AppState.stats.answered++;
    if (isCorrect) {
        AppState.stats.correct++;
    } else {
        AppState.stats.wrong++;
        AppState.wrongAnswers.push(AppState.currentQuestion);
    }
    
    showFeedback(isCorrect);
    updateStats();
}

function showFeedback(isCorrect) {
    document.getElementById('questionContainer').style.display = 'none';
    document.getElementById('feedbackContainer').style.display = 'block';
    
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackText = document.getElementById('feedbackText');
    
    // Mark correct/incorrect answers
    document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn.textContent === AppState.currentQuestion.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.textContent === AppState.selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Set feedback title and color
    if (isCorrect) {
        feedbackTitle.textContent = '✅ Chính xác!';
        feedbackTitle.style.color = '#28a745';
    } else {
        feedbackTitle.textContent = '❌ Sai rồi!';
        feedbackTitle.style.color = '#dc3545';
    }
    
    // Create detailed explanation
    const detailedExplanation = `
        <div style="margin-bottom: 15px;">
            <strong>Giải thích:</strong> ${AppState.currentQuestion.explanation}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Ngữ pháp:</strong> ${AppState.currentQuestion.grammar}
        </div>
        <div>
            <strong>Dịch nghĩa:</strong> ${AppState.currentQuestion.translation}
        </div>
    `;
    
    feedbackText.innerHTML = detailedExplanation;
}

function nextQuestion() {
    showQuestion();
}

// ===== ORDERING FUNCTIONS =====

function startOrderingPractice() {
    if (AppState.orderingQuestions.length === 0) return;
    
    document.getElementById('startOrdering').style.display = 'none';
    showOrderingQuestion();
}

function showOrderingQuestion() {
    if (AppState.orderingQuestions.length === 0) {
        document.getElementById('orderingMessage').style.display = 'block';
        return;
    }
    
    if (AppState.currentOrderingIndex >= AppState.orderingQuestions.length) {
        AppState.currentOrderingIndex = 0;
        AppState.orderingQuestions = shuffleArray(AppState.orderingQuestions);
    }
    
    AppState.currentOrderingQuestion = AppState.orderingQuestions[AppState.currentOrderingIndex];
    AppState.currentOrderingIndex++;
    
    // Update UI
    document.getElementById('orderingMessage').style.display = 'none';
    document.getElementById('startOrdering').style.display = 'none';
    document.getElementById('orderingQuestionContainer').style.display = 'block';
    document.getElementById('orderingFeedbackContainer').style.display = 'none';
    
    // Display question (NO original paragraph as requested)
    document.getElementById('orderingQuestionText').textContent = AppState.currentOrderingQuestion.sentence;
    
    // Create position buttons
    const answersContainer = document.getElementById('orderingAnswersContainer');
    answersContainer.innerHTML = '';
    
    AppState.currentOrderingQuestion.options.forEach(position => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = `Vị trí ${position}`;
        button.dataset.position = position;
        button.addEventListener('click', () => selectOrderingAnswer(position, button));
        answersContainer.appendChild(button);
    });
    
    AppState.selectedOrderingAnswer = null;
    document.getElementById('submitOrderingAnswer').disabled = true;
}

function selectOrderingAnswer(position, button) {
    // Remove selection from all buttons
    document.querySelectorAll('#orderingAnswersContainer .answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select clicked button
    button.classList.add('selected');
    AppState.selectedOrderingAnswer = position;
    document.getElementById('submitOrderingAnswer').disabled = false;
}

function submitOrderingAnswer() {
    if (!AppState.selectedOrderingAnswer) return;
    
    const isCorrect = AppState.selectedOrderingAnswer === AppState.currentOrderingQuestion.correctPosition;
    
    // Update stats
    AppState.orderingStats.answered++;
    if (isCorrect) {
        AppState.orderingStats.correct++;
    } else {
        AppState.orderingStats.wrong++;
    }
    
    showOrderingFeedback(isCorrect);
    updateOrderingStats();
}

function showOrderingFeedback(isCorrect) {
    document.getElementById('orderingQuestionContainer').style.display = 'none';
    document.getElementById('orderingFeedbackContainer').style.display = 'block';
    
    const feedbackTitle = document.getElementById('orderingFeedbackTitle');
    const feedbackText = document.getElementById('orderingFeedbackText');
    
    // Mark correct/incorrect answers
    document.querySelectorAll('#orderingAnswersContainer .answer-btn').forEach(btn => {
        const position = parseInt(btn.dataset.position);
        if (position === AppState.currentOrderingQuestion.correctPosition) {
            btn.classList.add('correct');
        } else if (position === AppState.selectedOrderingAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Set feedback title and color
    if (isCorrect) {
        feedbackTitle.textContent = '✅ Chính xác!';
        feedbackTitle.style.color = '#28a745';
    } else {
        feedbackTitle.textContent = '❌ Sai rồi!';
        feedbackTitle.style.color = '#dc3545';
    }
    
    feedbackText.textContent = AppState.currentOrderingQuestion.explanation;
}

function nextOrderingQuestion() {
    showOrderingQuestion();
}

// ===== STATS FUNCTIONS =====

function updateStats() {
    updateElement('totalQuestions', AppState.stats.total);
    updateElement('answeredQuestions', AppState.stats.answered);
    updateElement('correctAnswers', AppState.stats.correct);
    updateElement('wrongAnswers', AppState.stats.wrong);
    
    const progress = AppState.stats.total > 0 ? (AppState.stats.answered / AppState.stats.total) * 100 : 0;
    updateProgress('progressFill', progress);
}

function updateOrderingStats() {
    updateElement('orderingTotalQuestions', AppState.orderingStats.total);
    updateElement('orderingAnswered', AppState.orderingStats.answered);
    updateElement('orderingCorrect', AppState.orderingStats.correct);
    updateElement('orderingWrong', AppState.orderingStats.wrong);
    
    const progress = AppState.orderingStats.total > 0 ? (AppState.orderingStats.answered / AppState.orderingStats.total) * 100 : 0;
    updateProgress('orderingProgressFill', progress);
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // Tab functionality
    setupTabs();
    
    // Input tab events
    document.getElementById('getOPICBtn').addEventListener('click', getOPICData);
    document.getElementById('processTextBtn').addEventListener('click', processText);
    
    // Practice tab events
    document.getElementById('startPracticeBtn').addEventListener('click', startPracticing);
    document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
    
    // Ordering tab events
    document.getElementById('startOrderingBtn').addEventListener('click', startOrderingPractice);
    document.getElementById('submitOrderingAnswer').addEventListener('click', submitOrderingAnswer);
    document.getElementById('nextOrderingBtn').addEventListener('click', nextOrderingQuestion);
}

// ===== INITIALIZATION =====

function initApp() {
    // Set default text
    document.getElementById('textInput').value = 
        "English is a global language spoken by millions of people worldwide. " +
        "It is the primary language of international business, science, and technology. " +
        "Learning English opens many opportunities for personal and professional growth. " +
        "Many students around the world study English as a second language. " +
        "The internet has made English learning resources more accessible than ever before.";
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize stats
    updateStats();
    updateOrderingStats();
    
    console.log('English Learning App initialized successfully!');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
