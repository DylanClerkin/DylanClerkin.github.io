// ==========================================
// 1. STATE & VARIABLES
// ==========================================
let allQuestions = [];
let sessionQuestions = [];
let currentQuestionIndex = 0;
let selectedOption = null;
let sessionScore = 0;
let sessionXP = 0;

// Default User Data Structure
let userData = {
    xp: 0,
    streak: 0,
    lastLogin: null,
    questionsAnswered: 0,
    correctAnswers: 0
};

// ==========================================
// 2. INITIALIZATION & DATA LOADING
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadUserData();
    fetchQuestions();
    setupEventListeners();
});

async function fetchQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        
        // For V1, we will only load MCQs to ensure the UI doesn't break on a TBS
        allQuestions = data.filter(q => q.question_type === 'MCQ');
        console.log(`Loaded ${allQuestions.length} MCQs successfully! 🚀`);
        
    } catch (error) {
        console.error("Error loading the mainframe: 💥", error);
        document.getElementById('question-text').innerText = "Error loading questions. Are you running a local server?";
    }
}

// ==========================================
// 3. GAMIFICATION & LOCAL STORAGE
// ==========================================
function loadUserData() {
    const savedData = localStorage.getItem('cpaUserData');
    if (savedData) {
        userData = JSON.parse(savedData);
    }

    // Daily Streak Logic ⚡
    const today = new Date().toDateString();
    if (userData.lastLogin !== today) {
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (userData.lastLogin === yesterday.toDateString()) {
            userData.streak++; // Logged in yesterday, increase streak!
        } else {
            userData.streak = 1; // Missed a day, reset to 1
        }
        userData.lastLogin = today;
        saveUserData();
    }

    updateDashboardStats();
}

function saveUserData() {
    localStorage.setItem('cpaUserData', JSON.stringify(userData));
}

function updateDashboardStats() {
    document.getElementById('streak-counter').innerText = userData.streak;
    document.getElementById('xp-counter').innerText = userData.xp;
    
    // Simple mock mastery progress based on total questions answered
    let masteryPercent = Math.min(Math.round((userData.correctAnswers / 50) * 100), 100);
    document.getElementById('prog-area1').style.width = `${masteryPercent}%`;
    document.getElementById('prog-area2').style.width = `${masteryPercent}%`;
    document.getElementById('prog-area3').style.width = `${masteryPercent}%`;
    
    // Unlock badges dynamically
    if (userData.questionsAnswered > 0) {
        document.querySelectorAll('.badge')[0].classList.remove('locked');
    }
    if (userData.correctAnswers >= 10) {
        document.querySelectorAll('.badge')[1].classList.remove('locked');
    }
}

// ==========================================
// 4. VIEW NAVIGATION
// ==========================================
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    // Show target view
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

// ==========================================
// 5. QUIZ LOGIC
// ==========================================
function setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', startSession);
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('quit-btn').addEventListener('click', () => showView('dashboard-view'));
    document.getElementById('return-home-btn').addEventListener('click', () => showView('dashboard-view'));
}

function startSession() {
    // Shuffle and pick 5 random questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    sessionQuestions = shuffled.slice(0, 5); 
    
    // Reset state
    currentQuestionIndex = 0;
    sessionScore = 0;
    sessionXP = 0;
    
    renderQuestion();
    showView('quiz-view');
}

function renderQuestion() {
    const q = sessionQuestions[currentQuestionIndex];
    selectedOption = null;

    // Update Headers & Tags
    document.getElementById('question-tracker').innerText = `Question ${currentQuestionIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('domain-tag').innerText = q.blueprint_area.split(':')[0]; // Just shows "Area I", etc.
    document.getElementById('difficulty-tag').innerText = q.difficulty;
    document.getElementById('question-text').innerText = q.question_text;

    // Clear previous options & explanations
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    const explanationContainer = document.getElementById('explanation-container');
    explanationContainer.classList.add('hidden');

    // Generate Buttons
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = `${opt.key}. ${opt.text}`;
        btn.onclick = () => selectOption(opt.key, btn);
        optionsContainer.appendChild(btn);
    });

    // Reset Footer Buttons
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('submit-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}

function selectOption(key, buttonElement) {
    selectedOption = key;
    
    // Visually deselect all, then select the clicked one
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    
    // Enable submit
    document.getElementById('submit-btn').disabled = false;
}

function submitAnswer() {
    const q = sessionQuestions[currentQuestionIndex];
    const isCorrect = (selectedOption === q.correct_answer);
    
    userData.questionsAnswered++;

    // Update UI for options
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true; // Lock choices
        const btnKey = btn.innerText.charAt(0);
        
        if (btnKey === q.correct_answer) {
            btn.classList.add('correct');
        } else if (btnKey === selectedOption && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    // Score & Gamification Math
    if (isCorrect) {
        sessionScore++;
        sessionXP += 10;
        userData.correctAnswers++;
        userData.xp += 10;
        document.getElementById('explanation-title').innerText = "✅ Correct!";
        document.getElementById('explanation-title').style.color = "var(--success-green)";
    } else {
        document.getElementById('explanation-title').innerText = "❌ Incorrect";
        document.getElementById('explanation-title').style.color = "var(--error-red)";
    }

    // Show Explanation dynamically based on their specific wrong/right choice
    document.getElementById('explanation-text').innerText = q.explanations[selectedOption];
    document.getElementById('explanation-container').classList.remove('hidden');

    // Swap Footer Buttons
    document.getElementById('submit-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    
    saveUserData();
    updateDashboardStats();
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < sessionQuestions.length) {
        renderQuestion();
    } else {
        endSession();
    }
}

// ==========================================
// 6. RESULTS LOGIC
// ==========================================
function endSession() {
    const scorePercentage = Math.round((sessionScore / sessionQuestions.length) * 100);
    
    document.getElementById('final-score').innerText = `${scorePercentage}%`;
    document.getElementById('xp-earned-msg').innerText = `+${sessionXP} XP Earned 🌟`;
    
    // Add bonus XP for 100%
    if (scorePercentage === 100) {
        userData.xp += 50; 
        document.getElementById('xp-earned-msg').innerText += " (Includes Flawless Bonus!)";
        saveUserData();
        updateDashboardStats();
    }

    showView('results-view');
}