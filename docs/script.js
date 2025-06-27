document.addEventListener('DOMContentLoaded', () => {

    // Ein Willkommensgruß in der Entwicklerkonsole
    console.log("Willkommen auf meinem Projekt-Hub! Viel Spaß beim Stöbern.");

    // Alle Projektkarten auswählen
    const projectCards = document.querySelectorAll('.project-card');

    // Optionen für den Intersection Observer
    // Die Animation startet, wenn 10% der Karte sichtbar sind
    const observerOptions = {
        root: null, // Beobachtet im Verhältnis zum Viewport
        rootMargin: '0px',
        threshold: 0.1 
    };

    // Callback-Funktion, die ausgeführt wird, wenn eine Karte sichtbar wird
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            // Wenn das Element den Viewport betritt
            if (entry.isIntersecting) {
                // Füge die 'visible'-Klasse hinzu, um die CSS-Transition auszulösen
                entry.target.classList.add('visible');
                // Stoppe die Beobachtung für dieses Element, damit die Animation nur einmal abläuft
                observer.unobserve(entry.target);
            }
        });
    };

    // Erstelle einen neuen Intersection Observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Wende den Observer auf jede einzelne Projektkarte an
    projectCards.forEach(card => {
        observer.observe(card);
    });

});