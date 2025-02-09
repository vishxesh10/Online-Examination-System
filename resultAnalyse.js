let questions = [];
let userAnswers = {};
let timeLeft = 300; // 5 minutes (300 seconds) instead of 3600 (60 minutes)

document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    restoreProgress();
});

async function loadQuestions() {
    const questionsContainer = document.getElementById('questions');
    
    // Show loading state
    questionsContainer.innerHTML = `
        <div class="loading-message">
            Loading questions...
        </div>
    `;

    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        questions = data;
        
        // Clear loading message
        questionsContainer.innerHTML = '';
        
        displayQuestions();
        startTimer();
        setupQuestionNavigation();
    } catch (error) {
        console.error('Error loading questions:', error);
        questionsContainer.innerHTML = `
            <div class="error-message" style="margin: 20px 0;">
                Unable to load questions. Please refresh the page.
            </div>
        `;
    }
}

function setupQuestionNavigation() {
    const navigationDiv = document.createElement('div');
    navigationDiv.className = 'question-number';
    
    questions.questions.forEach((_, index) => {
        const numberIndicator = document.createElement('div');
        numberIndicator.className = 'number-indicator';
        numberIndicator.textContent = index + 1;
        numberIndicator.onclick = () => scrollToQuestion(index + 1);
        navigationDiv.appendChild(numberIndicator);
    });
    
    document.querySelector('.exam-container').insertBefore(
        navigationDiv, 
        document.getElementById('questions')
    );

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            const nextQuestion = document.querySelector('.question:not(.answered):first-of-type');
            if (nextQuestion) nextQuestion.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function scrollToQuestion(questionNumber) {
    const questionElement = document.querySelector(`.question:nth-child(${questionNumber})`);
    questionElement.scrollIntoView({ behavior: 'smooth' });
}

function displayQuestions() {
    const questionsContainer = document.getElementById('questions');
    questions.questions.forEach(q => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <h3>${q.question}</h3>
            <div class="options">
                ${q.options.map(option => `
                    <div class="option" onclick="selectOption(${q.id}, '${option}')">${option}</div>
                `).join('')}
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
    });

    // Add progress bar - Fixed positioning
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress" style="width: 0%"></div>';
    
    // Insert progress bar in the exam footer
    const examFooter = document.querySelector('.exam-footer');
    if (examFooter) {
        examFooter.insertBefore(progressBar, examFooter.firstChild);
    }
}

function selectOption(questionId, option) {
    userAnswers[questionId] = option;
    
    // Update UI to show selected option
    const questionOptions = document.querySelectorAll(`.question:nth-child(${questionId}) .option`);
    questionOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.textContent === option) {
            opt.classList.add('selected');
        }
    });

    // Update question indicator
    const indicator = document.querySelector(`.number-indicator:nth-child(${questionId})`);
    indicator.classList.add('answered');

    // Update progress bar
    updateProgress();
}

function updateProgress() {
    const totalQuestions = questions.questions.length;
    const answeredQuestions = Object.keys(userAnswers).length;
    const progress = (answeredQuestions / totalQuestions) * 100;
    
    document.querySelector('.progress').style.width = `${progress}%`;
}

function startTimer() {
    const timerElement = document.getElementById('time');
    
    const timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Add warning class when less than 5 minutes remaining
        if (timeLeft <= 300) {
            timerElement.classList.add('timer-warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            submitExam();
        }
    }, 1000);
}

function submitExam() {
    const unansweredQuestions = questions.questions.length - Object.keys(userAnswers).length;
    
    if (unansweredQuestions > 0 && timeLeft > 0) {
        if (!confirm(`You have ${unansweredQuestions} unanswered questions. Are you sure you want to submit?`)) {
            return;
        }
    }

    let score = 0;
    questions.questions.forEach(q => {
        if (userAnswers[q.id] === q.correctAnswer) {
            score++;
        }
    });

    const percentage = (score / questions.questions.length) * 100;

    const examResult = {
        score,
        total: questions.questions.length,
        percentage,
        answers: userAnswers,
        username: JSON.parse(localStorage.getItem('currentUser')).username,
        date: new Date().toISOString()
    };

    // Save for result page
    localStorage.setItem('examResult', JSON.stringify(examResult));

    // Save to results history
    const allResults = JSON.parse(localStorage.getItem('examResults')) || [];
    allResults.push(examResult);
    localStorage.setItem('examResults', JSON.stringify(allResults));

    window.location.href = 'resultWindow.html';
}

// Save progress periodically
setInterval(() => {
    if (Object.keys(userAnswers).length > 0) {
        localStorage.setItem('examProgress', JSON.stringify({
            answers: userAnswers,
            timeLeft: timeLeft
        }));
    }
}, 5000);

// Restore progress on page load
function restoreProgress() {
    const progress = JSON.parse(localStorage.getItem('examProgress'));
    if (progress) {
        if (confirm('Would you like to restore your previous progress?')) {
            userAnswers = progress.answers;
            timeLeft = progress.timeLeft;
            // Update UI
            Object.entries(userAnswers).forEach(([id, answer]) => {
                selectOption(parseInt(id), answer, false);
            });
        }
        localStorage.removeItem('examProgress');
    }
}
