# Watchlist Web App 🇩🇪

Verwalte deine persönliche Watchlist für Filme und Serien mit dieser einfachen Webanwendung. Organisiere, was du sehen möchtest, passe das Aussehen an und synchronisiere deine Daten über ein optionales Konto – alles direkt im Browser.

[Watchlist Screenshot](https://i.imgur.com/eKdInHb.png)


---

## ✨ Funktionen

*   **Listen-Verwaltung:**
    *   Separate Listen für "Serien", "Filme" und "Upcoming".
    *   Einträge hinzufügen, bearbeiten und löschen.
    *   Details pro Eintrag: Titel, Typ (Serie/Film), Tags (z.B. Genres), Dauer (z.B. "3 Staffeln", "120 min").
    *   Einträge als "Upcoming" markieren für zukünftige Veröffentlichungen.
*   **Cloud-Synchronisation (Firebase):**
    *   **Optionales Konto:** Erstelle ein Konto (E-Mail/Passwort), um deine Watchlist sicher in der Cloud zu speichern.
    *   **Geräteübergreifend:** Greife von verschiedenen Geräten auf deine synchronisierte Liste zu (Login erforderlich).
*   **Interaktive Bedienung:**
    *   **Drag & Drop:** Einträge innerhalb der "Serien"- und "Filme"-Listen einfach per Drag & Drop neu anordnen.
    *   **Automatisches Speichern:** Änderungen an der Watchlist werden bei eingeloggtem Konto kurz nach der Aktion automatisch gespeichert und synchronisiert.
    *   **Auto-Scroll:** Die Liste scrollt automatisch, wenn beim Ziehen eines Eintrags der Rand erreicht wird.
*   **Suche & Filter:**
    *   **Schnellsuche:** Suche nach Titeln direkt im Hauptbereich.
    *   **Erweiterte Suche:** Filtere Einträge nach Typ (Serie/Film) und/oder mehreren Tags gleichzeitig.
*   **Anpassbare Darstellung:** 🎨
    *   **Theme:** Wähle zwischen einem hellen und einem dunklen Design.
    *   **Akzentfarbe:** Passe die primäre Farbe der Benutzeroberfläche an (wirkt sich auf beide Themes aus).
    *   **Textgröße:** Ändere die globale Schriftgröße.
    *   **Listenhöhe:** Stelle ein, wie viele Einträge maximal angezeigt werden, bevor gescrollt wird.
*   **Datenverwaltung:**
    *   **Cloud-Speicher (Firestore):** Deine Watchlist-Daten werden sicher in deinem Firebase-Konto gespeichert, wenn du eingeloggt bist.
    *   **Lokaler Einstellungs-Speicher (LocalStorage):** Deine Darstellungseinstellungen (Theme, Farben, etc.) werden lokal im Browser gespeichert.
    *   **Lokaler Import/Export:** Exportiere deine *aktuelle* Watchlist als JSON-Datei zur Sicherung oder zum manuellen Übertragen. Importiere eine JSON-Datei, um die *aktuelle* Liste zu ersetzen (wird bei Login synchronisiert).
    *   **AI Format Hilfe:** Kopiere einen Prompt für eine AI (wie ChatGPT), um eine Textliste in das korrekte JSON-Format für den Import umzuwandeln.
*   **Einstellungen:** Zentrales Einstellungsmenü für alle Anpassungen und Datenaktionen.

---

## 🚀 Technologie-Stack

*   **HTML5:** Struktur der Anwendung.
*   **CSS3:** Styling, Layout (Flexbox) und Theming (CSS Variablen).
*   **Vanilla JavaScript (ES6+):** Komplette Anwendungslogik, DOM-Manipulation, Event Handling, Drag & Drop.
*   **Firebase Authentication:** Benutzerregistrierung und Login (E-Mail/Passwort).
*   **Cloud Firestore:** NoSQL-Datenbank zur Speicherung der Watchlist-Daten in der Cloud pro Benutzer.
*   **LocalStorage:** Clientseitige Speicherung der Benutzereinstellungen (Theme, Farben etc.).

---

## 💻 Setup & Ausführung

Diese Anwendung kann direkt online genutzt oder lokal ausgeführt werden. Für die Cloud-Synchronisation ist eine Internetverbindung erforderlich.

**Online (Empfohlen):**
*   Die App ist über GitHub Pages verfügbar: [**https://maarrvviinn.github.io/Watchlist/**] 

**Lokal:**
1.  Klone das Repository oder lade die Dateien `index.html`, `style.css` und `script.js` in denselben Ordner herunter.
2.  Öffne die Datei `index.html` in einem modernen Webbrowser (Chrome, Firefox, Edge, Safari).

---

## 🖱️ Benutzung

*   **Tabs:** Klicke auf "Serien", "Filme" oder "Upcoming", um die Listen zu wechseln.
*   **Hinzufügen:** Klicke auf "Hinzufügen", fülle die Details aus und speichere. Die Speicherung in der Cloud erfolgt automatisch, wenn du eingeloggt bist.
*   **Bearbeiten/Löschen:** Fahre über einen Eintrag und klicke auf ✏️ (Bearbeiten) oder 🗑️ (Löschen). Änderungen werden automatisch gespeichert/synchronisiert.
*   **Sortieren:** Klicke und ziehe einen Eintrag in den "Serien"- oder "Filme"-Listen, um ihn neu zu positionieren. Die neue Reihenfolge wird automatisch gespeichert/synchronisiert.
*   **Suchen/Filtern:** Nutze das Suchfeld oder die erweiterte Suche (🔍).
*   **Einstellungen/Login:** Klicke auf das Zahnrad (⚙️) oben rechts.

---

## ⚙️ Einstellungen erklärt

Im Einstellungsmenü (Zugriff über ⚙️):

*   **Darstellung:**
    *   **Theme (☀️/🌙):** Heller oder dunkler Modus.
    *   **Akzentfarbe:** Wähle die Hauptfarbe der UI.
    *   **Textgröße:** Passe die Schriftgröße an.
    *   **Max. Einträge:** Definiere die sichtbare Listenhöhe vor dem Scrollen.
    *   **Zurücksetzen (↩️):** Setzt *nur* die Darstellungseinstellungen zurück.
*   **Daten & Sync:**
    *   **Login/Logout:** Zeigt entweder den "Login / Sync"-Button (wenn ausgeloggt) oder deine E-Mail und den Logout-Button (🚪) (wenn eingeloggt). Login ermöglicht Cloud-Speicherung und Synchronisation.
    *   **Export (Lokal):** Lädt die *momentan angezeigte* Watchlist als JSON-Datei herunter (lokales Backup).
    *   **Import (Lokal):** Ersetzt die *momentan angezeigte* Watchlist mit Daten aus einer JSON-Datei. Wenn du eingeloggt bist, wird diese importierte Liste anschließend automatisch in die Cloud synchronisiert.
    *   **Format Hilfe (?):** Kopiert einen Prompt für AIs zur JSON-Formatierung für den Import.

---

## 💾 Datenformat (für Import/Export)

Das JSON-Format bleibt unverändert:

```json
{
  "serien": [
    {
      "id": "generierte-id-1",
      "type": "serien",
      "title": "Beispiel Serie",
      "tags": ["Genre1", "Genre2"],
      "duration": "X Staffeln",
      "isUpcoming": false
    }
    // ...
  ],
  "filme": [
    {
      "id": "generierte-id-2",
      "type": "filme",
      "title": "Beispiel Film",
      "tags": ["Genre3"],
      "duration": "120 min",
      "isUpcoming": false
    }
    // ...
  ]
}
```
**Wichtige Felder:**
*   `id`: Eindeutiger String (wird automatisch generiert).
*   `type`: Muss `"serien"` oder `"filme"` sein.
*   `title`: Titel (String).
*   `tags`: Array von Strings (leeres Array `[]` wenn keine Tags).
*   `duration`: Beschreibung der Dauer (String, z.B. "120 min", "3 Staffeln", "N/A").
*   `isUpcoming`: `true` oder `false` (Boolean).

---

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe die [LICENSE](LICENSE)-Datei für Details.

---

## ❤️ Credits

Erstellt von Marvin mit ❤️