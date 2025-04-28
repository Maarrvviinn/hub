const allEuStaaten = [
    { land: "Belgien", hauptstadt: "Brüssel" },
    { land: "Bulgarien", hauptstadt: "Sofia" },
    { land: "Dänemark", hauptstadt: "Kopenhagen" },
    { land: "Deutschland", hauptstadt: "Berlin" },
    { land: "Estland", hauptstadt: "Tallinn" },
    { land: "Finnland", hauptstadt: "Helsinki" },
    { land: "Frankreich", hauptstadt: "Paris" },
    { land: "Griechenland", hauptstadt: "Athen" },
    { land: "Irland", hauptstadt: "Dublin" },
    { land: "Italien", hauptstadt: "Rom" },
    { land: "Kroatien", hauptstadt: "Zagreb" },
    { land: "Lettland", hauptstadt: "Riga" },
    { land: "Litauen", hauptstadt: "Vilnius" },
    { land: "Luxemburg", hauptstadt: "Luxemburg" },
    { land: "Malta", hauptstadt: "Valletta" },
    { land: "Niederlande", hauptstadt: "Amsterdam" },
    { land: "Österreich", hauptstadt: "Wien" },
    { land: "Polen", hauptstadt: "Warschau" },
    { land: "Portugal", hauptstadt: "Lissabon" },
    { land: "Rumänien", hauptstadt: "Bukarest" },
    { land: "Schweden", hauptstadt: "Stockholm" },
    { land: "Slowakei", hauptstadt: "Bratislava" },
    { land: "Slowenien", hauptstadt: "Ljubljana" },
    { land: "Spanien", hauptstadt: "Madrid" },
    { land: "Tschechien", hauptstadt: "Prag" },
    { land: "Ungarn", hauptstadt: "Budapest" },
    { land: "Zypern", hauptstadt: "Nikosia" }
];

const container = document.getElementById('container');
const configAreaDiv = document.getElementById('config-area');
const quizAreaDiv = document.getElementById('quiz-area');
const resultsAreaDiv = document.getElementById('results-area');

const modeButtons = document.querySelectorAll('.mode-button');
const configOptionsContainer = document.getElementById('config-options-container');

const enableTimeLimitCheckbox = document.getElementById('enable-time-limit');
const timeLimitValueInput = document.getElementById('time-limit-value-input');
const timeLimitUnitSpan = document.getElementById('time-limit-unit');
const timerElement = document.getElementById('timer');
const stopQuizButton = document.getElementById('stop-quiz-button');

const toggleCountryListButton = document.getElementById('toggle-country-list-btn');
const countryListContainer = document.getElementById('country-list-container');
const countryListDiv = document.getElementById('country-list');
const selectAllButton = document.getElementById('select-all-countries');
const deselectAllButton = document.getElementById('deselect-all-countries');

const startQuizButton = document.getElementById('start-quiz-button');

const scoreDisplayElement = document.getElementById('score-display');
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const feedbackElement = document.getElementById('feedback');

const finalScoreValueElement = document.getElementById('final-score-value');
const finalScoreContextElement = document.getElementById('final-score-context');
const showWrongAnswersButton = document.getElementById('show-wrong-answers-button');
const wrongAnswersDisplayDiv = document.getElementById('wrong-answers-display');
const repeatQuizButton = document.getElementById('repeat-quiz-button');
const mainMenuButton = document.getElementById('main-menu-button');
const creditsFooter = document.getElementById('credits-footer');
const themeToggleButton = document.getElementById('theme-toggle-button');

let quizMode = '';
let isTimeLimitEnabled = false;
let configuredTimeLimit = 60;
let activeQuizData = [];
let currentQuizRound = [];
let questionPointer = 0;
let currentQuestionData = null;
let currentCorrectAnswer = '';
let currentQuestionText = '';
let score = 0;
let questionsAttempted = 0;
let timerInterval = null;
let timeLeft = 0;
let autoContinueTimeout = null;
let wrongAnswers = [];
let quizStoppedManually = false;
let flashTimeout = null;

function showSection(sectionId) {
    [configAreaDiv, quizAreaDiv, resultsAreaDiv].forEach(div => {
        div.classList.remove('active');
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    if (sectionId === 'config-area') {
        creditsFooter.classList.remove('hidden');
        themeToggleButton.classList.remove('hidden');
    } else {
        creditsFooter.classList.add('hidden');
        themeToggleButton.classList.add('hidden');
    }
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
        console.warn("Could not save theme preference to localStorage.");
    }
}

function saveSelectedCountries() {
     try {
         const checkboxes = countryListDiv.querySelectorAll('input[type="checkbox"]');
         const selectionState = {};
         checkboxes.forEach(cb => {
             selectionState[cb.value] = cb.checked;
         });
         localStorage.setItem('selectedCountries', JSON.stringify(selectionState));
     } catch (e) {
         console.warn("Could not save country selection to localStorage.");
     }
 }

 function loadSelectedCountries() {
     try {
         const savedSelection = localStorage.getItem('selectedCountries');
         if (savedSelection) {
             const selectionState = JSON.parse(savedSelection);
             const checkboxes = countryListDiv.querySelectorAll('input[type="checkbox"]');
             checkboxes.forEach(cb => {
                 if (selectionState.hasOwnProperty(cb.value)) {
                     cb.checked = selectionState[cb.value];
                 }
             });
         }
     } catch (e) {
         console.error("Could not load or parse country selection from localStorage.", e);
     }
 }


 function initialize() {
    populateCountryList();
    loadSelectedCountries();
    addEventListeners();

    let savedTheme = 'light';
    try {
         savedTheme = localStorage.getItem('quizTheme') || 'light';
    } catch (e) {
         console.warn("Could not read theme preference from localStorage.");
    }
    applyTheme(savedTheme);

    configOptionsContainer.classList.add('hidden');
    isTimeLimitEnabled = enableTimeLimitCheckbox.checked;
    updateTimeLimitControlsVisibility();
    checkCanStartQuiz();
    showSection('config-area');
}

function addEventListeners() {
    themeToggleButton.addEventListener('click', toggleTheme);

    modeButtons.forEach(button => {
        button.addEventListener('click', () => selectMode(button.id));
    });

    enableTimeLimitCheckbox.addEventListener('change', updateTimeLimitControlsVisibility);
    toggleCountryListButton.addEventListener('click', toggleCountryList);

    selectAllButton.addEventListener('click', () => toggleAllCountries(true));
    deselectAllButton.addEventListener('click', () => toggleAllCountries(false));

    countryListDiv.addEventListener('change', () => {
        checkCanStartQuiz();
        saveSelectedCountries();
    });

    startQuizButton.addEventListener('click', startConfiguredQuiz);

    stopQuizButton.addEventListener('click', () => {
        endQuiz('stopped');
    });

    submitButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !submitButton.disabled) {
            checkAnswer();
        }
    });

     showWrongAnswersButton.addEventListener('click', toggleWrongAnswersDisplay);
    repeatQuizButton.addEventListener('click', repeatQuiz);
    mainMenuButton.addEventListener('click', resetToConfigMenu);
}


function selectMode(selectedId) {
     quizMode = selectedId.includes('country-to-capital') ? 'country-to-capital' : 'capital-to-country';
     modeButtons.forEach(button => {
         button.classList.toggle('selected', button.id === selectedId);
     });
     configOptionsContainer.classList.remove('hidden');
     checkCanStartQuiz();
 }

 function updateTimeLimitControlsVisibility() {
    isTimeLimitEnabled = enableTimeLimitCheckbox.checked;
    timeLimitValueInput.classList.toggle('hidden', !isTimeLimitEnabled);
    timeLimitUnitSpan.classList.toggle('hidden', !isTimeLimitEnabled);
    timerElement.classList.toggle('hidden', !isTimeLimitEnabled);
    stopQuizButton.classList.toggle('hidden', isTimeLimitEnabled);
 }

function populateCountryList() {
    countryListDiv.innerHTML = '';
    allEuStaaten.forEach((item, index) => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `country-${index}`;
        checkbox.value = item.land;
        checkbox.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `country-${index}`;
        label.textContent = `${item.land} / ${item.hauptstadt}`;

        div.appendChild(checkbox);
        div.appendChild(label);
        countryListDiv.appendChild(div);
    });
}
function toggleCountryList() {
     const isVisible = countryListContainer.classList.toggle('visible');
     toggleCountryListButton.textContent = isVisible ? 'Länderliste ausblenden' : 'Länderliste einblenden';
}

function toggleAllCountries(select) {
      const checkboxes = countryListDiv.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
          cb.checked = select;
      });
      checkCanStartQuiz();
      saveSelectedCountries();
}

function getSelectedCountriesData() {
    const selectedNames = [];
    const checkboxes = countryListDiv.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => selectedNames.push(cb.value));
    return allEuStaaten.filter(item => selectedNames.includes(item.land));
}
function checkCanStartQuiz() {
    const countriesSelectedCount = countryListDiv.querySelectorAll('input[type="checkbox"]:checked').length;
    const modeSelected = quizMode !== '';
    const canStart = countriesSelectedCount > 0 && modeSelected;
    startQuizButton.disabled = !canStart;

    if (configOptionsContainer && !configOptionsContainer.classList.contains('hidden')) {
         startQuizButton.textContent = canStart ? 'Quiz starten!' : (modeSelected ? 'Wähle mind. ein Land!' : 'Modus & Länder wählen!');
    } else {
         startQuizButton.textContent = 'Einstellungen wählen & Quiz starten!';
    }
}

function startConfiguredQuiz() {
     activeQuizData = getSelectedCountriesData();
     isTimeLimitEnabled = enableTimeLimitCheckbox.checked;

     if (activeQuizData.length === 0) {
         alert("Bitte wähle mindestens ein Land/Hauptstadt Paar aus!");
         checkCanStartQuiz();
         return;
     }
     if (!quizMode) { alert("Interner Fehler: Kein Modus ausgewählt."); return; }

    score = 0;
    questionsAttempted = 0;
    questionPointer = 0;
    wrongAnswers = [];
    currentQuizRound = shuffleArray([...activeQuizData]);
    timeLeft = 0;
    clearTimeout(autoContinueTimeout);
    stopTimer();
    quizStoppedManually = false;
    clearTimeout(flashTimeout);
    answerInput.classList.remove('flash-correct', 'flash-incorrect');

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
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) { endQuiz('time'); }
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
    clearTimeout(flashTimeout);
    answerInput.classList.remove('flash-correct', 'flash-incorrect');


     if (quizStoppedManually || (isTimeLimitEnabled && timeLeft <= 0)) {
        return;
     }

    if (questionPointer >= currentQuizRound.length) {
         if (isTimeLimitEnabled) {
             return;
         }
         else {
            let lastQuestionIdentifier = quizMode === 'country-to-capital' ? currentQuestionData?.land : currentQuestionData?.hauptstadt;
            currentQuizRound = shuffleArray([...activeQuizData]);
            questionPointer = 0;
            if (currentQuizRound.length > 1) {
                let nextQuestionIdentifier = quizMode === 'country-to-capital' ? currentQuizRound[0]?.land : currentQuizRound[0]?.hauptstadt;
                if (nextQuestionIdentifier === lastQuestionIdentifier) {
                     [currentQuizRound[0], currentQuizRound[1]] = [currentQuizRound[1], currentQuizRound[0]];
                }
            }
        }
    }

    if (!currentQuizRound || currentQuizRound.length === 0) {
        console.error("Error: currentQuizRound is empty or undefined.");
        endQuiz('error');
        return;
    }
     currentQuestionData = currentQuizRound[questionPointer];
     if (!currentQuestionData) {
         console.error("Error: currentQuestionData is undefined after selecting from round.");
         endQuiz('error');
         return;
     }


    if (quizMode === 'country-to-capital') {
        currentQuestionText = `Was ist die Hauptstadt von ${currentQuestionData.land}?`;
        currentCorrectAnswer = currentQuestionData.hauptstadt;
    } else {
        currentQuestionText = `Welches Land hat die Hauptstadt ${currentQuestionData.hauptstadt}?`;
        currentCorrectAnswer = currentQuestionData.land;
    }
    questionElement.textContent = currentQuestionText;

    answerInput.value = '';
    feedbackElement.textContent = '';
    feedbackElement.className = '';
    submitButton.disabled = false;
    answerInput.disabled = false;
    answerInput.focus();
}


function checkAnswer() {
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) {
         feedbackElement.textContent = 'Bitte gib eine Antwort ein.';
         feedbackElement.className = 'incorrect';
         return;
    }

    if (quizStoppedManually || (isTimeLimitEnabled && timeLeft <= 0)) {
        return;
    }

    clearTimeout(flashTimeout);
    answerInput.classList.remove('flash-correct', 'flash-incorrect');

    questionsAttempted++;
    submitButton.disabled = true;
    answerInput.disabled = true;

    let isCorrect = userAnswer.toLowerCase() === currentCorrectAnswer.toLowerCase();
    let delay = 2000;
    let flashClass = '';

    if (isCorrect) {
        feedbackElement.textContent = 'Richtig!';
        feedbackElement.className = 'correct';
        score++;
        delay = 1000;
        flashClass = 'flash-correct';
    } else {
        feedbackElement.textContent = `Falsch. Richtig ist: ${currentCorrectAnswer}`;
        feedbackElement.className = 'incorrect';
        delay = 3000;
        wrongAnswers.push({
            question: currentQuestionText,
            userAnswer: userAnswer,
            correctAnswer: currentCorrectAnswer
        });
        flashClass = 'flash-incorrect';
    }

    if (flashClass) {
         answerInput.classList.add(flashClass);
         flashTimeout = setTimeout(() => {
             answerInput.classList.remove(flashClass);
         }, 600);
    }

    questionPointer++;
    updateScoreDisplay();

    clearTimeout(autoContinueTimeout);
    if (!quizStoppedManually && !(isTimeLimitEnabled && timeLeft <= 0)) {
         autoContinueTimeout = setTimeout(displayNextQuestion, delay);
    }
}

function updateScoreDisplay() {
    scoreDisplayElement.textContent = `Punkte: ${score} / ${questionsAttempted}`;
}

function endQuiz(reason = 'unknown') {
    if (quizStoppedManually && reason !== 'stopped') return;
    if (!isTimeLimitEnabled && quizStoppedManually && reason !== 'stopped') return;
    if (isTimeLimitEnabled && timerInterval === null && reason === 'time') return;

    quizStoppedManually = (reason === 'stopped');
    stopTimer();
    clearTimeout(autoContinueTimeout);
    stopQuizButton.classList.add('hidden');
     clearTimeout(flashTimeout);
     answerInput.classList.remove('flash-correct', 'flash-incorrect');

    finalScoreValueElement.textContent = `${score} von ${questionsAttempted} richtig`;

    let contextMessage = '';
    finalScoreContextElement.classList.add('hidden');

    if (isTimeLimitEnabled && reason === 'time') {
        contextMessage = `Zeit (${formatTime(configuredTimeLimit)}) ist abgelaufen.`;
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

    showSection('results-area');
}


 function toggleWrongAnswersDisplay() {
     const isHidden = wrongAnswersDisplayDiv.classList.toggle('hidden');
     if (!isHidden) {
         wrongAnswersDisplayDiv.innerHTML = '<h3>Falsche Antworten:</h3>';
         wrongAnswers.forEach(item => {
             const p = document.createElement('p');
             const userAnsSanitized = item.userAnswer.replace(/</g, "<").replace(/>/g, ">");
             p.innerHTML = `${item.question}<br/>Deine Antwort: <span class="user-answer">${userAnsSanitized}</span><br/>Richtig: <strong>${item.correctAnswer}</strong>`;
             wrongAnswersDisplayDiv.appendChild(p);
         });
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
    clearTimeout(flashTimeout);
    answerInput.classList.remove('flash-correct', 'flash-incorrect');

    quizMode = '';
    score = 0;
    questionsAttempted = 0;
    questionPointer = 0;
    currentQuizRound = [];
    activeQuizData = [];
    wrongAnswers = [];

    modeButtons.forEach(button => button.classList.remove('selected'));
    configOptionsContainer.classList.add('hidden');
    enableTimeLimitCheckbox.checked = false;
    isTimeLimitEnabled = false;
    updateTimeLimitControlsVisibility();

    if (countryListContainer.classList.contains('visible')) {
         toggleCountryList();
     }

    showWrongAnswersButton.classList.add('hidden');
    wrongAnswersDisplayDiv.classList.add('hidden');
    wrongAnswersDisplayDiv.innerHTML = '';

    timerElement.classList.add('hidden');
    stopQuizButton.classList.add('hidden');

    checkCanStartQuiz();
    showSection('config-area');
}

initialize();