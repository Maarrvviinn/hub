const themeToggleButton = document.getElementById('theme-toggle-button');

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
        localStorage.setItem('hubTheme', newTheme);
    } catch (e) {
        console.warn("Konnte Theme-Einstellung nicht im localStorage speichern.");
    }
}

function initializeHub() {
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    } else {
        console.warn("Theme toggle button not found.");
    }

    let savedTheme = 'light';
    try {
         savedTheme = localStorage.getItem('hubTheme') || 'light';
    } catch (e) {
         console.warn("Konnte Theme-Einstellung nicht aus localStorage laden.");
    }
    applyTheme(savedTheme);
}

initializeHub();