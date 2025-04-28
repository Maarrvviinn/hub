const container = document.getElementById('container');
const configAreaDiv = document.getElementById('config-area');
const quizAreaDiv = document.getElementById('quiz-area');
const resultsAreaDiv = document.getElementById('results-area');
const configOptionsContainer = document.getElementById('config-options-container');
const enableTimeLimitCheckbox = document.getElementById('enable-time-limit');
const timeLimitValueInput = document.getElementById('time-limit-value-input');
const timeLimitUnitSpan = document.getElementById('time-limit-unit');
const timerElement = document.getElementById('timer');
const stopQuizButton = document.getElementById('stop-quiz-button');
const startQuizButton = document.getElementById('start-quiz-button');
const scoreDisplayElement = document.getElementById('score-display');
const questionStartElement = document.getElementById('question-start');
const questionBlankElement = document.getElementById('question-blank');
const questionEndElement = document.getElementById('question-end');
const dassButton = document.getElementById('dass-button');
const dasButton = document.getElementById('das-button');
const feedbackElement = document.getElementById('feedback');
const finalScoreValueElement = document.getElementById('final-score-value');
const finalScoreContextElement = document.getElementById('final-score-context');
const showWrongAnswersButton = document.getElementById('show-wrong-answers-button');
const wrongAnswersDisplayDiv = document.getElementById('wrong-answers-display');
const repeatQuizButton = document.getElementById('repeat-quiz-button');
const mainMenuButton = document.getElementById('main-menu-button');
const creditsFooter = document.getElementById('credits-footer');
const themeToggleButton = document.getElementById('theme-toggle-button');

let quizSentences = [];
let isTimeLimitEnabled = false;
let configuredTimeLimit = 60;
let currentQuizRound = [];
let questionPointer = 0;
let currentQuestionData = null;
let currentCorrectAnswer = '';
let score = 0;
let questionsAttempted = 0;
let timerInterval = null;
let timeLeft = 0;
let autoContinueTimeout = null;
let wrongAnswers = [];
let quizStoppedManually = false;

function loadQuizData() {
    fetch('sentences.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            quizSentences = data;
            console.log("Quiz sentences loaded successfully.");
            initialize();
        })
        .catch(error => {
            console.error('Error loading or parsing sentences:', error);
            const startButtonContainer = document.getElementById('start-button-container');
            if (startButtonContainer) {
                 startButtonContainer.innerHTML = '<p style="color: var(--danger-color); font-weight: bold;">Fehler beim Laden der Quizfragen. Bitte überprüfe die Konsole und die Datei `sentences.json`.</p>';
            }
            if(startQuizButton) startQuizButton.disabled = true;
        });
}

function showSection(sectionId) {
    [configAreaDiv, quizAreaDiv, resultsAreaDiv].forEach(div => {
        div.classList.remove('active');
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    creditsFooter.classList.remove('hidden');
    themeToggleButton.classList.remove('hidden');
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = '☀️';
        themeToggleButton.title = "Light Mode wechseln";
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.textContent = '🌙';
        themeToggleButton.title = "Dark Mode wechseln";
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    try {
        localStorage.setItem('quizTheme', newTheme);
    } catch (e) {
        console.warn("Konnte Theme-Einstellung nicht im localStorage speichern.");
    }
}

 function initialize() {
    addEventListeners();
    let savedTheme = 'light';
    try {
         savedTheme = localStorage.getItem('quizTheme') || 'light';
    } catch (e) {
         console.warn("Konnte Theme-Einstellung nicht aus localStorage laden.");
    }
    applyTheme(savedTheme);
    isTimeLimitEnabled = enableTimeLimitCheckbox.checked;
    updateTimeLimitControlsVisibility();
    checkCanStartQuiz();
    showSection('config-area');
}

function addEventListeners() {
    themeToggleButton.addEventListener('click', toggleTheme);
    enableTimeLimitCheckbox.addEventListener('change', updateTimeLimitControlsVisibility);
    startQuizButton.addEventListener('click', startConfiguredQuiz);
    stopQuizButton.addEventListener('click', () => endQuiz('stopped'));
    dassButton.addEventListener('click', () => checkAnswer('dass'));
    dasButton.addEventListener('click', () => checkAnswer('das'));
    showWrongAnswersButton.addEventListener('click', toggleWrongAnswersDisplay);
    repeatQuizButton.addEventListener('click', repeatQuiz);
    mainMenuButton.addEventListener('click', resetToConfigMenu);
}

 function updateTimeLimitControlsVisibility() {
    isTimeLimitEnabled = enableTimeLimitCheckbox.checked;
    timeLimitValueInput.classList.toggle('hidden', !isTimeLimitEnabled);
    timeLimitUnitSpan.classList.toggle('hidden', !isTimeLimitEnabled);
    timerElement.classList.add('hidden');
    stopQuizButton.classList.add('hidden');
 }

function checkCanStartQuiz() {
     startQuizButton.disabled = quizSentences.length === 0;
     startQuizButton.textContent = quizSentences.length > 0 ? 'Quiz starten!' : 'Lade Fragen...';
}

function startConfiguredQuiz() {
    if (quizSentences.length === 0) {
        console.error("Kann Quiz nicht starten, keine Sätze geladen.");
        alert("Fehler: Quizfragen konnten nicht geladen werden.");
        return;
    }
    isTimeLimitEnabled = enableTimeLimitCheckbox.checked;
    score = 0;
    questionsAttempted = 0;
    questionPointer = 0;
    wrongAnswers = [];
    currentQuizRound = shuffleArray([...quizSentences]);
    timeLeft = 0;
    clearTimeout(autoContinueTimeout);
    stopTimer();
    quizStoppedManually = false;
    showWrongAnswersButton.classList.add('hidden');
    wrongAnswersDisplayDiv.classList.add('hidden');
    wrongAnswersDisplayDiv.innerHTML = '';

    if (isTimeLimitEnabled) {
        configuredTimeLimit = parseInt(timeLimitValueInput.value, 10) || 60;
        if (configuredTimeLimit < 10) configuredTimeLimit = 10;
        timeLeft = configuredTimeLimit;
        timerElement.classList.remove('hidden');
        stopQuizButton.classList.add('hidden');
        updateTimerDisplay();
        startTimer();
    } else {
         timerElement.classList.add('hidden');
         stopQuizButton.classList.remove('hidden');
    }
    updateScoreDisplay();
    showSection('quiz-area');
    displayNextQuestion();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            endQuiz('time');
         }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    timerElement.textContent = `Zeit: ${formatTime(timeLeft)}`;
}

function displayNextQuestion() {
    clearTimeout(autoContinueTimeout);
     if (quizStoppedManually || (isTimeLimitEnabled && timeLeft <= 0)) {
        return;
     }

     if (questionPointer >= currentQuizRound.length) {
         if (isTimeLimitEnabled) {
             endQuiz('completed');
             return;
         }
         else {
            let lastQuestionSentence = currentQuestionData?.sentenceStart + currentQuestionData?.sentenceEnd;
            if (quizSentences && quizSentences.length > 0) {
                 currentQuizRound = shuffleArray([...quizSentences]);
            } else {
                 console.error("Fehler: Keine Sätze zum Mischen vorhanden.");
                 endQuiz('error');
                 return;
            }
            questionPointer = 0;
            if (currentQuizRound.length > 1) {
                let nextQuestionSentence = currentQuizRound[0]?.sentenceStart + currentQuizRound[0]?.sentenceEnd;
                if (nextQuestionSentence === lastQuestionSentence) {
                     [currentQuizRound[0], currentQuizRound[1]] = [currentQuizRound[1], currentQuizRound[0]];
                }
            }
        }
    }

    currentQuestionData = currentQuizRound[questionPointer];
     if (!currentQuestionData) {
         console.error("Fehler: Konnte nächste Frage nicht laden.");
         endQuiz('error');
         return;
     }

    questionStartElement.textContent = currentQuestionData.sentenceStart + " ";
    questionEndElement.textContent = " " + currentQuestionData.sentenceEnd;
    questionBlankElement.textContent = " [ ___ ] ";
    questionBlankElement.style.color = 'var(--primary-color)';
    questionBlankElement.style.borderColor = 'var(--primary-color)';
    currentCorrectAnswer = currentQuestionData.correct.toLowerCase();

    feedbackElement.textContent = '';
    feedbackElement.className = '';
    dassButton.disabled = false;
    dasButton.disabled = false;
}

function checkAnswer(chosenWord) {
    if (quizStoppedManually || (isTimeLimitEnabled && timeLeft <= 0)) {
        return;
    }

    dassButton.disabled = true;
    dasButton.disabled = true;

    questionsAttempted++;
    let isCorrect = chosenWord === currentCorrectAnswer;
    let delay = 2000;

     const fullCorrectSentence = currentQuestionData.sentenceStart + " " + currentQuestionData.correct + " " + currentQuestionData.sentenceEnd;

    if (isCorrect) {
        feedbackElement.textContent = 'Richtig!';
        feedbackElement.className = 'correct';
        score++;
        delay = 1200;
        questionBlankElement.textContent = ` ${currentQuestionData.correct} `;
        questionBlankElement.style.color = 'var(--success-color)';
        questionBlankElement.style.borderColor = 'var(--success-color)';

    } else {
        feedbackElement.innerHTML = `Falsch. Richtig ist: <strong>${currentQuestionData.correct}</strong>`;
        feedbackElement.className = 'incorrect';
        delay = 2500;
        wrongAnswers.push({
            questionStart: currentQuestionData.sentenceStart,
            questionEnd: currentQuestionData.sentenceEnd,
            userAnswer: chosenWord,
            correctAnswer: currentQuestionData.correct
        });
         questionBlankElement.textContent = ` ${currentQuestionData.correct} `;
         questionBlankElement.style.color = 'var(--danger-color)';
         questionBlankElement.style.borderColor = 'var(--danger-color)';
    }

    questionPointer++;
    updateScoreDisplay();

    clearTimeout(autoContinueTimeout);
    if (!quizStoppedManually && !(isTimeLimitEnabled && timeLeft <= 0)) {
         autoContinueTimeout = setTimeout(() => {
            displayNextQuestion();
         }, delay);
    } else if (isTimeLimitEnabled && timeLeft <= 0) {
         endQuiz('time');
    } else if (questionPointer >= currentQuizRound.length && isTimeLimitEnabled) {
         autoContinueTimeout = setTimeout(() => endQuiz('completed'), delay);
    }
}

function updateScoreDisplay() {
    scoreDisplayElement.textContent = `Punkte: ${score} / ${questionsAttempted}`;
}

function endQuiz(reason = 'unknown') {
    if (!quizAreaDiv.classList.contains('active') && resultsAreaDiv.classList.contains('active')) {
        return;
    }

    quizStoppedManually = (reason === 'stopped');
    stopTimer();
    clearTimeout(autoContinueTimeout);

    dassButton.disabled = true;
    dasButton.disabled = true;
    stopQuizButton.classList.add('hidden');

    finalScoreValueElement.textContent = `${score} von ${questionsAttempted} richtig`;

    let contextMessage = '';
    finalScoreContextElement.classList.add('hidden');
    if (reason === 'time' && isTimeLimitEnabled) {
        contextMessage = `Zeit (${formatTime(configuredTimeLimit)}) ist abgelaufen.`;
        finalScoreContextElement.classList.remove('hidden');
    } else if (reason === 'stopped') {
         contextMessage = `Quiz manuell gestoppt.`;
         finalScoreContextElement.classList.remove('hidden');
    } else if (reason === 'completed' && isTimeLimitEnabled) {
         contextMessage = `Alle Fragen im Zeitlimit beantwortet!`;
         finalScoreContextElement.classList.remove('hidden');
    } else if (reason === 'error') {
         contextMessage = `Ein interner Fehler ist aufgetreten.`;
         finalScoreContextElement.classList.remove('hidden');
    }
    finalScoreContextElement.textContent = contextMessage;

    if (wrongAnswers.length > 0) {
         showWrongAnswersButton.classList.remove('hidden');
         showWrongAnswersButton.textContent = "Falsche Antworten anzeigen";
     } else {
          showWrongAnswersButton.classList.add('hidden');
     }
     wrongAnswersDisplayDiv.classList.add('hidden');
     wrongAnswersDisplayDiv.innerHTML = '';

    showSection('results-area');
}

 function toggleWrongAnswersDisplay() {
     const isHidden = wrongAnswersDisplayDiv.classList.toggle('hidden');
     if (!isHidden) {
         wrongAnswersDisplayDiv.innerHTML = '<h3>Falsche Antworten:</h3>';
         if (wrongAnswers.length === 0) {
             wrongAnswersDisplayDiv.innerHTML += '<p>Keine Fehler gemacht!</p>';
         } else {
             wrongAnswers.forEach(item => {
                 const p = document.createElement('p');
                 const userAnsText = item.userAnswer;
                 const fullSentenceCorrect = item.questionStart + ` <strong>${item.correctAnswer}</strong> ` + item.questionEnd;

                 p.innerHTML = `
                     <span class="full-sentence"><em>${item.questionStart} ___ ${item.questionEnd}</em></span>
                     Deine Wahl: <span class="user-answer">${userAnsText}</span><br/>
                     Richtig wäre: <strong>${item.correctAnswer}</strong><br/>
                     Satz: ${fullSentenceCorrect}`;
                 wrongAnswersDisplayDiv.appendChild(p);
             });
         }
         showWrongAnswersButton.textContent = "Falsche Antworten ausblenden";
     } else {
          showWrongAnswersButton.textContent = "Falsche Antworten anzeigen";
     }
 }

function repeatQuiz() {
     quizStoppedManually = false;
     startConfiguredQuiz();
}

function resetToConfigMenu() {
    quizStoppedManually = false;
    stopTimer();
    clearTimeout(autoContinueTimeout);

    score = 0;
    questionsAttempted = 0;
    questionPointer = 0;
    currentQuizRound = [];
    wrongAnswers = [];

    updateTimeLimitControlsVisibility();

    showWrongAnswersButton.classList.add('hidden');
    wrongAnswersDisplayDiv.classList.add('hidden');
    wrongAnswersDisplayDiv.innerHTML = '';

    feedbackElement.textContent = '';
    feedbackElement.className = '';
    timerElement.classList.add('hidden');
    stopQuizButton.classList.add('hidden');

    checkCanStartQuiz();
    showSection('config-area');
}

loadQuizData();