// --- Import Firebase Modules ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


document.addEventListener('DOMContentLoaded', () => {
    // --- Globals ---
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    // --- Firebase Config ---
    const firebaseConfig = {
      apiKey: "AIzaSyCfRQU4l2Tcheqi5JBeqH3u3XY8fYu7iC4", // Use your actual key
      authDomain: "watchlist-webapp.firebaseapp.com",
      projectId: "watchlist-webapp",
      storageBucket: "watchlist-webapp.appspot.com",
      messagingSenderId: "1018209532618",
      appId: "1:1018209532618:web:0ce6290f8f18f334ce1233",
      measurementId: "G-P7XM9RJSW2"
    };

    // --- Initialize Firebase ---
    let app, auth, db;
    let currentUser = null;
    let dataLoadedFromFirebase = false;
    let firebaseInitialized = false;

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        firebaseInitialized = true;
        console.log("Firebase Initialized Successfully.");

        enableIndexedDbPersistence(db)
          .then(() => console.log("Firestore offline persistence enabled."))
          .catch((err) => {
              if (err.code == 'failed-precondition') { console.warn("Firestore Persistence failed: Multiple tabs open?"); }
              else if (err.code == 'unimplemented') { console.log("Firestore Persistence not available in this browser."); }
              else { console.error("Firestore Persistence error:", err); }
          });

    } catch (error) {
        console.error("FIREBASE INITIALIZATION FAILED:", error);
        alert("Firebase konnte nicht initialisiert werden. Login & Sync sind deaktiviert.");
    }


    // --- Element References (Declare ALL variables here) ---
    let appContainer, settingsCog, searchInput, openFilterBtn, tabButtons, watchlists,
        openAddModalBtn, addModal, addTitleInput, addTypeRadios, addTagsInput, addTagsContainer,
        addDurationInput, addUpcomingCheckbox, saveAddBtn, cancelAddBtn,
        editModal, editItemIdInput, editItemTypeInput, editTitleInput, editTagsInput, editTagsContainer,
        editDurationDateInput, editUpcomingCheckboxGroup, editUpcomingCheckbox, saveEditBtn, cancelEditBtn,
        settingsModal, themeToggleButton, accentColorPicker, textSizeSlider, textSizeValue, maxItemsInput,
        resetSettingsBtn, exportBtn, importBtn, importFileInput, copyHelpBtn, closeSettingsBtn,
        exportStatus, importStatus, copyStatus, syncStatus,
        extendedSearchModal, filterTagsContainer, filterTypeCheckboxes, resetFiltersBtn, applyFiltersBtn,
        // Login Modal Elements
        loginBtnSettings, loginModal, loginEmailInput, loginPasswordInput, loginEmailBtn,
        signupEmailBtn, closeLoginModalBtn, loginErrorMessage,
        // Settings Auth Elements
        authSectionContent, userInfoSettings, userEmailSettings, logoutBtnSettings;


    // --- D&D State ---
    let draggedItemElement = null, dropIndicator = null, scrollInterval = null;
    const SCROLL_SPEED = 10, SCROLL_ZONE = 60;


    // --- App State ---
    const DEFAULT_THEME = 'dark', DEFAULT_ACCENT_COLOR_DARK = '#4a90e2', DEFAULT_ACCENT_COLOR_LIGHT = '#007bff', DEFAULT_TEXT_SIZE = 16, DEFAULT_MAX_ITEMS = 10, AUTO_SAVE_DELAY = 1500;
    let watchListsData = { serien: [], filme: [] }, activeTabId = 'serien', lastActiveTabBeforeSearch = 'serien', currentSearchTerm = '', activeFilters = { type: ['serien', 'filme'], tags: [] }, currentTheme = DEFAULT_THEME, userAccentColorLight = null, userAccentColorDark = null, currentAppliedAccentColor = DEFAULT_ACCENT_COLOR_DARK, currentTextSize = DEFAULT_TEXT_SIZE, currentMaxItems = DEFAULT_MAX_ITEMS, autoSaveTimeout = null;
    const LS_SETTINGS_PREFIX = 'watchlistSettings_v1_';
    const LS_KEYS = { ACTIVE_TAB: `${LS_SETTINGS_PREFIX}activeTab`, THEME: `${LS_SETTINGS_PREFIX}theme`, ACCENT_COLOR_LIGHT: `${LS_SETTINGS_PREFIX}accentColorLight`, ACCENT_COLOR_DARK: `${LS_SETTINGS_PREFIX}accentColorDark`, TEXT_SIZE: `${LS_SETTINGS_PREFIX}textSize`, MAX_ITEMS: `${LS_SETTINGS_PREFIX}maxItems` };


    // --- Function to Assign Element References ---
    function assignElementVariables() {
        console.log("Assigning element variables..."); // Add log
        try { // Add try-catch here for robustness during assignment
            appContainer = document.getElementById('app-container');
            settingsCog = document.getElementById('settings-cog');
            searchInput = document.getElementById('search-input');
            openFilterBtn = document.getElementById('open-filter-btn');
            tabButtons = document.querySelectorAll('.tab-button');
            watchlists = document.querySelectorAll('.watchlist');
            openAddModalBtn = document.getElementById('open-add-modal-btn');
            addModal = document.getElementById('add-modal');
            addTitleInput = document.getElementById('add-title');
            addTypeRadios = document.querySelectorAll('input[name="add-item-type"]');
            addTagsInput = document.getElementById('add-tags-input');
            addTagsContainer = document.getElementById('add-tags-container');
            addDurationInput = document.getElementById('add-duration');
            addUpcomingCheckbox = document.getElementById('add-upcoming-checkbox');
            saveAddBtn = document.getElementById('save-add-btn');
            cancelAddBtn = document.getElementById('cancel-add-btn');
            editModal = document.getElementById('edit-modal');
            editItemIdInput = document.getElementById('edit-item-id');
            editItemTypeInput = document.getElementById('edit-item-type');
            editTitleInput = document.getElementById('edit-title');
            editTagsInput = document.getElementById('edit-tags-input');
            editTagsContainer = document.getElementById('edit-tags-container');
            editDurationDateInput = document.getElementById('edit-duration-date');
            editUpcomingCheckboxGroup = document.getElementById('edit-upcoming-checkbox-group');
            editUpcomingCheckbox = document.getElementById('edit-upcoming-checkbox');
            saveEditBtn = document.getElementById('save-edit-btn');
            cancelEditBtn = document.getElementById('cancel-edit-btn');
            settingsModal = document.getElementById('settings-modal');
            themeToggleButton = document.getElementById('theme-toggle-btn');
            accentColorPicker = document.getElementById('accent-color-picker');
            textSizeSlider = document.getElementById('text-size-slider');
            textSizeValue = document.getElementById('text-size-value');
            maxItemsInput = document.getElementById('max-items-input');
            resetSettingsBtn = document.getElementById('reset-settings-btn');
            exportBtn = document.getElementById('export-btn');
            importBtn = document.getElementById('import-btn');
            importFileInput = document.getElementById('import-file-input');
            copyHelpBtn = document.getElementById('copy-help-btn');
            closeSettingsBtn = document.getElementById('close-settings-btn');
            exportStatus = document.getElementById('export-status');
            importStatus = document.getElementById('import-status');
            copyStatus = document.getElementById('copy-status');
            syncStatus = document.getElementById('sync-status');
            extendedSearchModal = document.getElementById('extended-search-modal');
            filterTagsContainer = document.getElementById('filter-tags-container');
            filterTypeCheckboxes = document.querySelectorAll('input[name="filter-type"]');
            resetFiltersBtn = document.getElementById('reset-filters-btn');
            applyFiltersBtn = document.getElementById('apply-filters-btn');
            // Login Modal Elements
            loginBtnSettings = document.getElementById('login-btn-settings');
            loginModal = document.getElementById('login-modal');
            loginEmailInput = document.getElementById('login-email-input');
            loginPasswordInput = document.getElementById('login-password-input');
            loginEmailBtn = document.getElementById('login-email-btn');
            signupEmailBtn = document.getElementById('signup-email-btn');
            closeLoginModalBtn = document.getElementById('close-login-modal-btn');
            loginErrorMessage = document.getElementById('login-error-message');
            // Settings Auth Elements
            authSectionContent = document.getElementById('auth-section-content');
            userInfoSettings = document.getElementById('user-info-settings');
            userEmailSettings = document.getElementById('user-email-settings');
            logoutBtnSettings = document.getElementById('logout-btn-settings');

            // Check a few critical elements after assignment
            if (!appContainer || !settingsCog || !watchlists || !loginModal || !settingsModal) {
                console.error("Critical elements missing after assignment!");
                return false;
            }

            console.log("DOM Elements Assigned.");
            return true;
        } catch(error) {
            console.error("Error assigning element variables:", error);
            bodyElement.innerHTML = '<p style="color:red; padding: 20px;">Fehler beim Initialisieren der UI-Elemente. Bitte Konsole prüfen.</p>';
            return false;
        }
     } // End assignElementVariables

    // --- Data Persistence (Settings Only) ---
    function saveSettingsData() {
        try {
            localStorage.setItem(LS_KEYS.ACTIVE_TAB, lastActiveTabBeforeSearch);
            localStorage.setItem(LS_KEYS.THEME, currentTheme);
            localStorage.setItem(LS_KEYS.ACCENT_COLOR_LIGHT, userAccentColorLight || '');
            localStorage.setItem(LS_KEYS.ACCENT_COLOR_DARK, userAccentColorDark || '');
            localStorage.setItem(LS_KEYS.TEXT_SIZE, currentTextSize.toString());
            localStorage.setItem(LS_KEYS.MAX_ITEMS, currentMaxItems.toString());
        } catch (e) { console.error("Error saving settings data:", e); }
    } // End saveSettingsData

    function loadSettingsData() {
        try {
            const savedTab = localStorage.getItem(LS_KEYS.ACTIVE_TAB);
            activeTabId = ['serien', 'filme', 'upcoming'].includes(savedTab) ? savedTab : 'serien';
            lastActiveTabBeforeSearch = activeTabId;
            const savedTheme = localStorage.getItem(LS_KEYS.THEME);
            currentTheme = savedTheme === 'light' ? 'light' : DEFAULT_THEME;
            userAccentColorLight = localStorage.getItem(LS_KEYS.ACCENT_COLOR_LIGHT) || null;
            userAccentColorDark = localStorage.getItem(LS_KEYS.ACCENT_COLOR_DARK) || null;
            if (currentTheme === 'dark') {
                currentAppliedAccentColor = userAccentColorDark || DEFAULT_ACCENT_COLOR_DARK;
            } else {
                currentAppliedAccentColor = userAccentColorLight || DEFAULT_ACCENT_COLOR_LIGHT;
            }
            const savedTextSize = localStorage.getItem(LS_KEYS.TEXT_SIZE);
            currentTextSize = parseInt(savedTextSize, 10) || DEFAULT_TEXT_SIZE;
            if (currentTextSize < 12 || currentTextSize > 20) currentTextSize = DEFAULT_TEXT_SIZE;
            const savedMaxItems = localStorage.getItem(LS_KEYS.MAX_ITEMS);
            currentMaxItems = parseInt(savedMaxItems, 10) || DEFAULT_MAX_ITEMS;
            if (currentMaxItems < 3 || currentMaxItems > 50) currentMaxItems = DEFAULT_MAX_ITEMS;
            currentSearchTerm = '';
            if (searchInput) searchInput.value = '';
            resetActiveFilters();
            console.log("Settings loaded from Local Storage. Current theme:", currentTheme);
        } catch (error) {
            console.error("Error loading settings:", error);
            currentTheme = DEFAULT_THEME;
            currentTextSize = DEFAULT_TEXT_SIZE;
            currentMaxItems = DEFAULT_MAX_ITEMS;
             if (currentTheme === 'dark') {
                currentAppliedAccentColor = DEFAULT_ACCENT_COLOR_DARK;
            } else {
                currentAppliedAccentColor = DEFAULT_ACCENT_COLOR_LIGHT;
            }
        }
    } // End loadSettingsData

    // --- Sanitization ---
    function sanitizeItem(typeKey) { return item => ({ id: item.id || (Date.now().toString() + Math.random()), type: typeKey, title: typeof item.title === 'string' ? item.title : "Unbenannt", tags: Array.isArray(item.tags) ? item.tags.filter(t => typeof t === 'string') : [], duration: typeof item.duration === 'string' ? item.duration : "N/A", isUpcoming: typeof item.isUpcoming === 'boolean' ? item.isUpcoming : false }); }


    // --- Setup Event Listeners ---
    function safelyAttachListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        } else {
            // console.warn(`Listener attachment skipped: Element not found for handler ${handler.name}`);
        }
    }
    function safelyAttachNodeListListener(nodeList, event, handler) {
         if (nodeList && nodeList.length > 0) {
             nodeList.forEach(el => el.addEventListener(event, handler));
         }
    }

    function addEventListeners() {
         console.log("Attaching event listeners...");
         try {
            safelyAttachListener(settingsCog, 'click', () => { console.log("Settings cog clicked!"); openSettingsModal(); });
            safelyAttachListener(openAddModalBtn, 'click', () => { console.log("Add button clicked!"); openAddModal(); });
            safelyAttachNodeListListener(tabButtons, 'click', (e) => { const button = e.currentTarget; if(searchInput) searchInput.value = ''; currentSearchTerm = ''; setActiveTab(button.getAttribute('data-tab')); });
            safelyAttachListener(searchInput, 'input', handleSearchInput);
            safelyAttachListener(openFilterBtn, 'click', openExtendedSearchModal);
            safelyAttachListener(cancelAddBtn, 'click', closeAddModal);
            safelyAttachListener(saveAddBtn, 'click', saveAddItem);
            safelyAttachListener(addTagsInput, 'keypress', (e) => handleTagInputKeyPress(e, addTagsContainer));
            safelyAttachListener(addModal, 'click', (e) => { if (e.target === addModal) closeAddModal(); });
            safelyAttachListener(cancelEditBtn, 'click', closeEditModal);
            safelyAttachListener(saveEditBtn, 'click', saveEditItem);
            safelyAttachListener(editTagsInput, 'keypress', (e) => handleTagInputKeyPress(e, editTagsContainer));
            safelyAttachListener(editModal, 'click', (e) => { if (e.target === editModal) closeEditModal(); });
            safelyAttachListener(closeSettingsBtn, 'click', closeSettingsModal);
            safelyAttachListener(settingsModal, 'click', (e) => { if (e.target === settingsModal) closeSettingsModal(); });
            safelyAttachListener(themeToggleButton, 'click', handleThemeToggle);
            safelyAttachListener(accentColorPicker, 'input', handleAccentColorChange);
            safelyAttachListener(textSizeSlider, 'input', handleTextSizeChange);
            safelyAttachListener(maxItemsInput, 'input', handleMaxItemsChange);
            safelyAttachListener(resetSettingsBtn, 'click', handleResetSettings);
            safelyAttachListener(exportBtn, 'click', exportData);
            safelyAttachListener(importBtn, 'click', () => {if(importFileInput) importFileInput.click()});
            safelyAttachListener(importFileInput, 'change', importData);
            safelyAttachListener(copyHelpBtn, 'click', copyHelpText);
            safelyAttachListener(extendedSearchModal, 'click', (e) => { if (e.target === extendedSearchModal) closeExtendedSearchModal(false); });
            safelyAttachListener(resetFiltersBtn, 'click', resetAndCloseFilters);
            safelyAttachListener(applyFiltersBtn, 'click', applyAndCloseFilters);
            safelyAttachNodeListListener(filterTypeCheckboxes, 'change', handleFilterTypeChange);
            safelyAttachListener(loginBtnSettings, 'click', openLoginModal);
            safelyAttachListener(closeLoginModalBtn, 'click', closeLoginModal);
            safelyAttachListener(loginModal, 'click', (e) => { if (e.target === loginModal) closeLoginModal(); });
            safelyAttachListener(loginEmailBtn, 'click', handleEmailLogin);
            safelyAttachListener(signupEmailBtn, 'click', handleEmailSignup);
            safelyAttachListener(logoutBtnSettings, 'click', handleLogout);

            console.log("Event listeners setup process completed.");
            return true;
         } catch (error) {
             console.error("Error attaching event listeners:", error);
             return false;
         }
     } // End addEventListeners

    // --- Helper Function ---
    function adjustColor(hex, percent) {
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
        const num = parseInt(hex.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    } // End adjustColor

    // --- Settings Application ---
    function applyAllSettings() {
        try {
            console.log("Applying settings. Current theme:", currentTheme);
            applyThemeVisuals(currentTheme);
            applyAccentColorForCurrentTheme();
            applyTextSize(currentTextSize);
            applyMaxItems(currentMaxItems);
            updateSettingsControls();
            console.log(`Applied settings: Theme=${currentTheme}, Accent=${currentAppliedAccentColor}, Size=${currentTextSize}, MaxItems=${currentMaxItems}`);
        } catch (error) { console.error("Error applying settings:", error); }
    }
    function applyThemeVisuals(theme) {
        console.log(`Setting body class: dark-mode = ${theme === 'dark'}`);
        bodyElement.classList.toggle('dark-mode', theme === 'dark');
        if(themeToggleButton){
            themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeToggleButton.title = theme === 'dark' ? "Light Mode wechseln" : "Dark Mode wechseln";
        }
    }
    function applyAccentColorForCurrentTheme() {
        let colorToApply = (currentTheme === 'dark') ? (userAccentColorDark || DEFAULT_ACCENT_COLOR_DARK) : (userAccentColorLight || DEFAULT_ACCENT_COLOR_LIGHT);
        setAccentCssVariables(colorToApply);
    }
    function setAccentCssVariables(color) {
        const hoverPercent = currentTheme === 'dark' ? 15 : -15;
        const hoverColor = adjustColor(color, hoverPercent);
        htmlElement.style.setProperty('--primary-color', color);
        htmlElement.style.setProperty('--primary-hover-color', hoverColor);
        currentAppliedAccentColor = color;
    }
    function applyTextSize(size) { htmlElement.style.fontSize = `${size}px`; }
    function applyMaxItems(count) { const itemHeightEstimate = 65; const listPadding = 20; const maxHeight = (count * itemHeightEstimate) + listPadding; if(watchlists) { watchlists.forEach(list => { if(list) list.style.maxHeight = `${maxHeight}px`; }); } }
    function updateSettingsControls() { if(accentColorPicker) accentColorPicker.value = currentAppliedAccentColor; if(textSizeSlider) textSizeSlider.value = currentTextSize; if(textSizeValue) textSizeValue.textContent = `${currentTextSize}px`; if(maxItemsInput) maxItemsInput.value = currentMaxItems; }
    function handleThemeToggle() { currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; applyThemeVisuals(currentTheme); applyAccentColorForCurrentTheme(); updateSettingsControls(); saveSettingsData(); }
    function handleAccentColorChange(event) { const newColor = event.target.value; if (currentTheme === 'dark') { userAccentColorDark = newColor; } else { userAccentColorLight = newColor; } setAccentCssVariables(newColor); saveSettingsData(); }
    function handleTextSizeChange(event) { const newSize = parseInt(event.target.value, 10); currentTextSize = newSize; applyTextSize(newSize); if(textSizeValue) textSizeValue.textContent = `${newSize}px`; saveSettingsData(); }
    function handleMaxItemsChange(event) { let newCount = parseInt(event.target.value, 10); if (isNaN(newCount) || newCount < 3) newCount = 3; else if (newCount > 50) newCount = 50; event.target.value = newCount; currentMaxItems = newCount; applyMaxItems(newCount); saveSettingsData(); }
    function handleResetSettings() { if (confirm("Darstellungseinstellungen zurücksetzen?")) { currentTheme = DEFAULT_THEME; userAccentColorLight = null; userAccentColorDark = null; currentTextSize = DEFAULT_TEXT_SIZE; currentMaxItems = DEFAULT_MAX_ITEMS; localStorage.removeItem(LS_KEYS.THEME); localStorage.removeItem(LS_KEYS.ACCENT_COLOR_LIGHT); localStorage.removeItem(LS_KEYS.ACCENT_COLOR_DARK); localStorage.removeItem(LS_KEYS.TEXT_SIZE); localStorage.removeItem(LS_KEYS.MAX_ITEMS); applyAllSettings(); } }

    // --- Search, Tab, Filtering Logic ---
    function handleSearchInput() { if(!searchInput) return; const newSearchTerm = searchInput.value.toLowerCase(); if (newSearchTerm !== currentSearchTerm) { currentSearchTerm = newSearchTerm; if (currentSearchTerm && activeTabId !== 'upcoming' && activeTabId !== 'search') { setActiveTab('search', true); } else if (!currentSearchTerm && activeTabId === 'search') { setActiveTab(lastActiveTabBeforeSearch); } else { renderLists(); } } }
    function setActiveTab(tabId, isInternalCall = false) { activeTabId = tabId; if (activeTabId !== 'search') { lastActiveTabBeforeSearch = tabId; if (!isInternalCall) saveSettingsData(); } updateTabButtonVisuals(); if (!isInternalCall || activeTabId === 'search') { renderLists(); } }
    function updateTabButtonVisuals() { if(!tabButtons) return; tabButtons.forEach(btn => { const btnTabId = btn.getAttribute('data-tab'); if (activeTabId === 'search' && btnTabId !== 'upcoming') { btn.classList.remove('active'); btn.classList.add('inactive-search'); } else { btn.classList.toggle('active', btnTabId === activeTabId); btn.classList.remove('inactive-search'); } }); }
    function applyFilters(items) { let filtered = items; if (currentSearchTerm) { filtered = filtered.filter(item => item.title.toLowerCase().includes(currentSearchTerm)); } if (activeTabId !== 'upcoming') { if (activeFilters.type.length > 0 && activeFilters.type.length < 2) { filtered = filtered.filter(item => activeFilters.type.includes(item.type)); } if (activeFilters.tags.length > 0) { filtered = filtered.filter(item => Array.isArray(item.tags) && item.tags.some(itemTag => activeFilters.tags.includes(itemTag))); } } return filtered; }

    // --- Rendering Lists ---
    function renderLists() {
        console.log("renderLists called. Active tab:", activeTabId, "Data:", JSON.parse(JSON.stringify(watchListsData)));
        try {
            let baseItems = [];
            let targetListElementId = 'serien-list';
            let showTypeIndicator = false;

            if (activeTabId === 'search') {
                baseItems = [...(watchListsData.serien || []).filter(item => !item.isUpcoming), ...(watchListsData.filme || []).filter(item => !item.isUpcoming)];
                targetListElementId = 'serien-list'; showTypeIndicator = true;
            } else if (activeTabId === 'upcoming') {
                baseItems = [...(watchListsData.serien || []).filter(item => item.isUpcoming), ...(watchListsData.filme || []).filter(item => item.isUpcoming)];
                targetListElementId = 'upcoming-list'; showTypeIndicator = true;
            } else if (activeTabId === 'serien') {
                baseItems = (watchListsData.serien || []).filter(item => !item.isUpcoming);
                targetListElementId = 'serien-list';
            } else if (activeTabId === 'filme') {
                baseItems = (watchListsData.filme || []).filter(item => !item.isUpcoming);
                targetListElementId = 'filme-list';
            } else { console.warn("Unknown activeTabId:", activeTabId); baseItems = []; }

             baseItems = Array.isArray(baseItems) ? baseItems : [];
            const itemsToDisplay = applyFilters(baseItems);
            console.log("Items to display after filtering:", itemsToDisplay.length);

             if (!watchlists) { console.error("watchlists NodeList missing!"); return; }
             watchlists.forEach(list => { if (list) list.classList.remove('active'); });

             const listElement = document.getElementById(targetListElementId);
             if (!listElement) { console.error(`Target list element #${targetListElementId} not found!`); return; }

             listElement.innerHTML = '';

             if (itemsToDisplay.length === 0) {
                 console.log("No items to display, creating 'no-entries' message.");
                 const li = document.createElement('li');
                 li.classList.add('no-entries');
                 li.textContent = (currentSearchTerm || activeFilters.tags.length > 0 || (activeFilters.type.length > 0 && activeFilters.type.length < 2)) ? 'Keine Einträge entsprechen den Filtern.' : 'Keine Einträge vorhanden.';
                 listElement.appendChild(li);
             } else {
                 console.log(`Rendering ${itemsToDisplay.length} items.`);
                 itemsToDisplay.forEach((item, index) => {
                     try {
                         const listItemElement = createListItemElement(item, showTypeIndicator);
                         if (listItemElement) { listElement.appendChild(listItemElement); }
                         else { console.warn(`createListItemElement returned null for item at index ${index}:`, item); }
                     } catch (e) { console.error(`Error creating list item element for index ${index}:`, item, e); }
                 });
             }

             listElement.classList.add('active');
             addDragAndDropListeners();
             updateTabButtonVisuals();
             console.log("renderLists finished successfully.");

        } catch (error) { console.error("!!!! CRITICAL ERROR IN renderLists !!!!", error); }
    } // End renderLists

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    } // End escapeHtml

    function createListItemElement(item, showTypeIndicator = false) {
         try {
            const li = document.createElement('li');
            if (!item || !item.id || !item.type || typeof item.title === 'undefined') { console.error("Invalid item data passed to createListItemElement:", item); li.textContent = "Fehler"; li.style.color = 'red'; return li; }
            const isDraggable = (activeTabId === 'serien' || activeTabId === 'filme');
            li.setAttribute('draggable', isDraggable);
            li.dataset.id = item.id;
            li.dataset.type = item.type;
            const tagsText = (Array.isArray(item.tags) && item.tags.length > 0) ? item.tags.map(escapeHtml).join(', ') : 'Keine Angabe';
            const durationText = item.duration ?? 'N/A';
            const titleText = item.title ?? 'Unbekannter Titel';
            let titleHtml = escapeHtml(titleText);
            if (showTypeIndicator) { const typeLabel = item.type === 'serien' ? 'Serie' : 'Film'; titleHtml += ` <span class="item-type-label">(${typeLabel})</span>`; }
            li.innerHTML = `<div class="item-details"><strong>${titleHtml}</strong><div class="item-meta"><span><span class="label">Tags:</span> ${tagsText}</span><span><span class="label">Dauer:</span> ${escapeHtml(durationText)}</span></div></div><div class="item-actions"><button class="icon-btn edit-icon-btn" title="Bearbeiten">✏️</button><button class="icon-btn delete-icon-btn" title="Löschen">🗑️</button></div>`;
            const editBtn = li.querySelector('.edit-icon-btn');
            safelyAttachListener(editBtn, 'click', (e) => { console.log(`Edit clicked for ${item.id}`); e.stopPropagation(); openEditModal(item); });
            const deleteBtn = li.querySelector('.delete-icon-btn');
            safelyAttachListener(deleteBtn, 'click', (e) => { console.log(`Delete clicked for ${item.id}`); e.stopPropagation(); deleteItem(item.id, item.type); });
            if (!isDraggable) li.style.cursor = 'default';
            return li;
         } catch(error) { console.error(`Error creating element for item ${item?.id}:`, error); return null; }
    } // End createListItemElement


    // --- Tag Handling ---
    function handleTagInputKeyPress(event, containerElement) { if (event.key === 'Enter') { event.preventDefault(); const inputElement = event.target; if(!inputElement) return; const tagText = inputElement.value.trim(); if (tagText && containerElement) { const existingTags = Array.from(containerElement.querySelectorAll('.tag span:first-child')).map(span => span.textContent.toLowerCase()); if (!existingTags.includes(tagText.toLowerCase())) { addTag(tagText, containerElement); } inputElement.value = ''; } } }
    function addTag(tagText, containerElement) { const tag = document.createElement('div'); tag.classList.add('tag'); tag.innerHTML = `<span>${escapeHtml(tagText)}</span><span class="remove-tag" title="Tag entfernen">×</span>`; tag.querySelector('.remove-tag').addEventListener('click', (e) => { e.stopPropagation(); tag.remove(); if (containerElement.childElementCount === 0) containerElement.classList.remove('visible'); }); containerElement.appendChild(tag); containerElement.classList.add('visible'); }
    function getTagsFromTagsContainer(containerElement) { if (!containerElement) return []; return Array.from(containerElement.querySelectorAll('.tag span:first-child')).map(span => span.textContent); }
    function populateTagsContainer(tagsArray, containerElement) { if (!containerElement) return; containerElement.innerHTML = ''; (tagsArray || []).forEach(tagText => addTag(tagText, containerElement)); containerElement.classList.toggle('visible', containerElement.childElementCount > 0); }

    // --- Modal Management ---
    function openModal(modalElement) { if (modalElement) { modalElement.style.display = 'flex'; setTimeout(() => bodyElement.classList.add('modal-open'), 10); } else { console.warn("Attempted to open a null modal element."); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.style.display = 'none'; const anyModalOpen = document.querySelector('.modal[style*="display: flex"]'); if (!anyModalOpen) { bodyElement.classList.remove('modal-open'); } clearScrollInterval(); } else { console.warn("Attempted to close a null modal element."); } }
    function openLoginModal() { if(loginErrorMessage) loginErrorMessage.textContent = ''; if(loginEmailInput) loginEmailInput.value = ''; if(loginPasswordInput) loginPasswordInput.value = ''; closeSettingsModal(); openModal(loginModal); }
    function closeLoginModal() { closeModal(loginModal); }

    // --- Add Item / Delete Item / Edit Item ---
    function openAddModal() { clearAddModal(); openModal(addModal); if(addTitleInput) addTitleInput.focus(); }
    function closeAddModal() { closeModal(addModal); }
    function clearAddModal() { if(addTitleInput) addTitleInput.value = ''; if(addTagsInput) addTagsInput.value = ''; if(addTagsContainer) { addTagsContainer.innerHTML = ''; addTagsContainer.classList.remove('visible'); } if(addDurationInput) addDurationInput.value = ''; if(addUpcomingCheckbox) addUpcomingCheckbox.checked = false; const defaultRadio = document.querySelector('input[name="add-item-type"][value="serien"]'); if(defaultRadio) defaultRadio.checked = true; }
    function saveAddItem() { const title = addTitleInput?.value.trim(); if (!title) { alert("Bitte Titel angeben."); if(addTitleInput) addTitleInput.focus(); return; } const itemTypeRadio = document.querySelector('input[name="add-item-type"]:checked'); const itemType = itemTypeRadio ? itemTypeRadio.value : 'serien'; const tags = getTagsFromTagsContainer(addTagsContainer); const duration = addDurationInput ? addDurationInput.value.trim() || 'N/A' : 'N/A'; const isUpcoming = addUpcomingCheckbox ? addUpcomingCheckbox.checked : false; const newItem = { id: Date.now().toString() + Math.random(), type: itemType, title: title, tags: tags, duration: duration, isUpcoming: isUpcoming }; if (!watchListsData[itemType]) { watchListsData[itemType] = []; } watchListsData[itemType].push(newItem); renderLists(); triggerAutoSave(); closeAddModal(); }
    function deleteItem(itemId, itemType) { if (!itemId || !itemType || !watchListsData[itemType]) return; const list = watchListsData[itemType]; const itemIndex = list.findIndex(item => item?.id === itemId); if (itemIndex > -1) { if (confirm(`"${list[itemIndex].title}" wirklich löschen?`)) { list.splice(itemIndex, 1); renderLists(); triggerAutoSave(); } } else { console.warn("Item to delete not found:", itemId, itemType); alert("Fehler: Eintrag zum Löschen nicht gefunden."); } }
    function openEditModal(item) { if (!item || !item.id || !item.type) return; if(editItemIdInput) editItemIdInput.value = item.id; if(editItemTypeInput) editItemTypeInput.value = item.type; if(editTitleInput) editTitleInput.value = item.title; populateTagsContainer(item.tags || [], editTagsContainer); if(editTagsInput) editTagsInput.value = ''; if(editDurationDateInput) editDurationDateInput.value = item.duration || ''; const canEditUpcoming = item.isUpcoming; if(editUpcomingCheckboxGroup) editUpcomingCheckboxGroup.classList.toggle('hidden', !canEditUpcoming); if(editUpcomingCheckbox) editUpcomingCheckbox.checked = item.isUpcoming; openModal(editModal); if(editTitleInput) { editTitleInput.focus(); editTitleInput.select(); } }
    function closeEditModal() { closeModal(editModal); }
    function saveEditItem() { const itemId = editItemIdInput?.value; const itemType = editItemTypeInput?.value; if (!itemId || !itemType || !watchListsData[itemType]) { alert("Fehler beim Speichern: Ungültige Daten."); return; } const list = watchListsData[itemType]; const itemIndex = list.findIndex(item => item?.id === itemId); if (itemIndex > -1) { const item = list[itemIndex]; item.title = editTitleInput ? editTitleInput.value.trim() || 'Unbenannt' : 'Unbenannt'; item.tags = getTagsFromTagsContainer(editTagsContainer); item.duration = editDurationDateInput ? editDurationDateInput.value.trim() || 'N/A' : 'N/A'; if (editUpcomingCheckboxGroup && !editUpcomingCheckboxGroup.classList.contains('hidden') && editUpcomingCheckbox) { item.isUpcoming = editUpcomingCheckbox.checked; } renderLists(); triggerAutoSave(); closeEditModal(); } else { alert("Fehler: Eintrag zum Bearbeiten nicht gefunden."); closeEditModal(); } }

    // --- Extended Search Modal ---
    function openExtendedSearchModal() { populateFilterTags(); if(filterTypeCheckboxes) { filterTypeCheckboxes.forEach(cb => { cb.checked = activeFilters.type.includes(cb.value); }); } if(filterTagsContainer) { filterTagsContainer.querySelectorAll('.filter-tag-btn').forEach(btn => { btn.classList.toggle('active', activeFilters.tags.includes(btn.dataset.tag)); }); } openModal(extendedSearchModal); }
    function closeExtendedSearchModal(shouldApplyFilters = false) { if (shouldApplyFilters) { activeFilters.type = []; if(filterTypeCheckboxes) { filterTypeCheckboxes.forEach(cb => { if (cb.checked) activeFilters.type.push(cb.value); }); } activeFilters.tags = []; if(filterTagsContainer) { filterTagsContainer.querySelectorAll('.filter-tag-btn.active').forEach(btn => { activeFilters.tags.push(btn.dataset.tag); }); } const filtersAreActive = currentSearchTerm || activeFilters.tags.length > 0 || (activeFilters.type.length > 0 && activeFilters.type.length < 2); if (filtersAreActive) { if(activeTabId !== 'search' && activeTabId !== 'upcoming') { setActiveTab('search', true); } else { renderLists(); } } else { if (activeTabId === 'search') { setActiveTab(lastActiveTabBeforeSearch); } else { renderLists(); } } } closeModal(extendedSearchModal); }
    function populateFilterTags() { const allTags = new Set(); (watchListsData.serien || []).forEach(item => item.tags?.forEach(tag => allTags.add(tag))); (watchListsData.filme || []).forEach(item => item.tags?.forEach(tag => allTags.add(tag))); if(!filterTagsContainer) return; filterTagsContainer.innerHTML = ''; if (allTags.size === 0) { filterTagsContainer.innerHTML = '<span style="color: var(--text-muted-color);">Keine Tags vorhanden.</span>'; return; } const sortedTags = Array.from(allTags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); sortedTags.forEach(tag => { const btn = document.createElement('button'); btn.classList.add('filter-tag-btn'); btn.textContent = tag; btn.dataset.tag = tag; btn.addEventListener('click', () => { btn.classList.toggle('active'); }); btn.classList.toggle('active', activeFilters.tags.includes(tag)); filterTagsContainer.appendChild(btn); }); }
    function resetActiveFilters() { activeFilters.type = ['serien', 'filme']; activeFilters.tags = []; }
    function resetAndCloseFilters() { resetActiveFilters(); if (currentSearchTerm) { renderLists(); } else { setActiveTab(lastActiveTabBeforeSearch); } closeModal(extendedSearchModal); }
    function applyAndCloseFilters() { closeExtendedSearchModal(true); }
    function handleFilterTypeChange(event) { const checkedCheckboxes = document.querySelectorAll('input[name="filter-type"]:checked'); if (checkedCheckboxes.length === 0 && event.target) { event.target.checked = true; } }

    // --- Drag and Drop ---
    function clearScrollInterval() { if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; } }
    function addDragAndDropListeners() { const draggableItems = document.querySelectorAll('#serien-list li[draggable="true"], #filme-list li[draggable="true"]'); draggableItems.forEach(item => { item.removeEventListener('dragstart', handleDragStart); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragstart', handleDragStart); item.addEventListener('dragend', handleDragEnd); }); ['serien-list', 'filme-list'].forEach(listId => { const el = document.getElementById(listId); if(el){ el.removeEventListener('dragover', handleDragOver); el.removeEventListener('drop', handleDrop); el.removeEventListener('dragleave', handleDragLeave); el.addEventListener('dragover', handleDragOver); el.addEventListener('drop', handleDrop); el.addEventListener('dragleave', handleDragLeave); } else { console.warn(`D&D target list element not found: #${listId}`); } }); }
    function handleDragStart(e) { const listItem = e.target.closest('li[draggable="true"]'); if (!listItem) { e.preventDefault(); return; } draggedItemElement = listItem; if (!draggedItemElement.dataset.id || !draggedItemElement.dataset.type) { e.preventDefault(); console.error("Drag Error: Missing data-id or data-type"); draggedItemElement = null; return; } e.dataTransfer.setData('text/plain', draggedItemElement.dataset.id); e.dataTransfer.setData('text/itemtype', draggedItemElement.dataset.type); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if (draggedItemElement) draggedItemElement.classList.add('dragging'); }, 0); if (!dropIndicator) { dropIndicator = document.createElement('div'); dropIndicator.classList.add('drop-indicator'); } clearScrollInterval(); }
    function handleDragOver(e) { e.preventDefault(); if (!draggedItemElement) return; e.dataTransfer.dropEffect = 'move'; const listElement = e.target.closest('.watchlist:not(#upcoming-list)'); if (!listElement) { clearScrollInterval(); if (dropIndicator?.parentNode) dropIndicator.style.display = 'none'; return; } const listRect = listElement.getBoundingClientRect(); const mouseY = e.clientY; let scrollDirection = 0; if (mouseY < listRect.top + SCROLL_ZONE) scrollDirection = -1; else if (mouseY > listRect.bottom - SCROLL_ZONE) scrollDirection = 1; if (scrollDirection !== 0) { if (!scrollInterval) { scrollInterval = setInterval(() => { listElement.scrollTop += scrollDirection * SCROLL_SPEED; }, 30); } } else { clearScrollInterval(); } if (dropIndicator && dropIndicator.parentNode !== listElement) { listElement.appendChild(dropIndicator); } const targetLi = e.target.closest('li:not(.dragging):not(.no-entries)'); if (targetLi === draggedItemElement || (targetLi && targetLi.classList.contains('no-entries'))) { if(dropIndicator) dropIndicator.style.display = 'none'; return; } let indicatorY = -1; if (targetLi) { const rect = targetLi.getBoundingClientRect(); const midpoint = rect.top + rect.height / 2; if (e.clientY < midpoint) { indicatorY = targetLi.offsetTop - 3; } else { indicatorY = targetLi.offsetTop + targetLi.offsetHeight + 2; } } else { const listItems = listElement.querySelectorAll('li:not(.dragging):not(.no-entries)'); if (listItems.length === 0) { indicatorY = 5; } else { if (e.clientY < listRect.top + listRect.height / 2) { indicatorY = listItems[0].offsetTop - 3; } else { indicatorY = listItems[listItems.length - 1].offsetTop + listItems[listItems.length - 1].offsetHeight + 2; } } } if (dropIndicator && indicatorY !== -1) { dropIndicator.style.top = `${indicatorY}px`; dropIndicator.style.display = 'block'; } else if (dropIndicator) { dropIndicator.style.display = 'none'; } }
    function handleDragLeave(e) { const listElement = e.target.closest('.watchlist'); if (listElement && !listElement.contains(e.relatedTarget)) { clearScrollInterval(); if (dropIndicator?.parentNode === listElement) { dropIndicator.style.display = 'none'; } } }
    function handleDragEnd() { if (draggedItemElement) { draggedItemElement.classList.remove('dragging'); } draggedItemElement = null; if (dropIndicator?.parentNode) { dropIndicator.parentNode.removeChild(dropIndicator); } clearScrollInterval(); }
    function handleDrop(e) { e.preventDefault(); clearScrollInterval(); if (!draggedItemElement) { handleDragEnd(); return; } const targetListElement = e.target.closest('.watchlist:not(#upcoming-list)'); if (!targetListElement) { handleDragEnd(); return; } const potentialTargetLi = e.target.closest('li'); if (potentialTargetLi === draggedItemElement) { handleDragEnd(); return; } const targetListType = targetListElement.id.replace('-list', ''); const draggedItemId = e.dataTransfer.getData('text/plain'); const originalListType = e.dataTransfer.getData('text/itemtype'); if (!draggedItemId || !originalListType || !watchListsData[originalListType] || !watchListsData[targetListType]) { console.error("D&D Error: Invalid data transfer."); handleDragEnd(); return; } const originalList = watchListsData[originalListType]; const targetList = watchListsData[targetListType]; const itemIndex = originalList.findIndex(item => item?.id === draggedItemId); if (itemIndex === -1) { console.error("D&D Error: Dragged item not found."); handleDragEnd(); return; } const [itemData] = originalList.splice(itemIndex, 1); if (originalListType !== targetListType) { itemData.type = targetListType; } let insertBeforeIndex = -1; if (dropIndicator && dropIndicator.parentNode === targetListElement && dropIndicator.style.display !== 'none') { const indicatorTop = dropIndicator.offsetTop; const nextElement = Array.from(targetListElement.children).find(child => child.offsetTop >= indicatorTop && !child.classList.contains('dragging') && !child.classList.contains('drop-indicator') && !child.classList.contains('no-entries')); if (nextElement?.dataset?.id) { const idx = targetList.findIndex(item => item?.id === nextElement.dataset.id); if (idx !== -1) insertBeforeIndex = idx; } } if (insertBeforeIndex === -1) { insertBeforeIndex = targetList.length; } targetList.splice(insertBeforeIndex, 0, itemData); handleDragEnd(); renderLists(); triggerAutoSave(); }

    // --- Settings Modal Data Logic ---
    function openSettingsModal() { applyAllSettings(); openModal(settingsModal); clearStatusMessages(); }
    function closeSettingsModal() { closeModal(settingsModal); }
    function clearStatusMessages() { if(exportStatus) { exportStatus.textContent = ''; exportStatus.className = ''; } if(importStatus) { importStatus.textContent = ''; importStatus.className = ''; } if(copyStatus) { copyStatus.textContent = ''; copyStatus.className = ''; } if(syncStatus) { syncStatus.textContent = ''; syncStatus.className = ''; } }
    function showStatus(element, message, type = 'info', duration = 4000) { if (!element) return; element.textContent = message; element.className = type; setTimeout(() => { if (element.textContent === message) { element.textContent = ''; element.className = ''; } }, duration); }
    function exportData() { try { const now = new Date(); const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); const dataToExport = { serien: watchListsData.serien || [], filme: watchListsData.filme || [] }; const dataStr = JSON.stringify(dataToExport, null, 2); const dataBlob = new Blob([dataStr], {type: "application/json;charset=utf-8"}); const url = URL.createObjectURL(dataBlob); const link = document.createElement('a'); link.href = url; link.download = `watchlist_export_${dateStr}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); showStatus(exportStatus, "Export erfolgreich!", 'success'); } catch (error) { console.error("Export failed:", error); showStatus(exportStatus, "Export fehlgeschlagen.", 'error'); } }
    function importData(event) { const file = event.target?.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const importedRaw = JSON.parse(e.target.result); if (typeof importedRaw === 'object' && importedRaw !== null && Array.isArray(importedRaw.serien) && Array.isArray(importedRaw.filme)) { if (confirm("Aktuelle Watchlist (lokal angezeigt) durch Import ersetzen? Änderungen werden automatisch in die Cloud übertragen (falls eingeloggt).")) { watchListsData.serien = (importedRaw.serien || []).map(sanitizeItem('serien')); watchListsData.filme = (importedRaw.filme || []).map(sanitizeItem('filme')); renderLists(); showStatus(importStatus, "Import erfolgreich (lokal)!", 'success'); closeSettingsModal(); triggerAutoSave(); } else { showStatus(importStatus, "Import abgebrochen.", 'info'); } } else { throw new Error("Ungültiges Dateiformat."); } } catch (error) { console.error("Import failed:", error); showStatus(importStatus, `Import fehlgeschlagen: ${error.message}`, 'error'); } finally { if(importFileInput) importFileInput.value = null; } }; reader.onerror = () => { showStatus(importStatus, "Fehler beim Lesen der Datei.", 'error'); if(importFileInput) importFileInput.value = null; }; reader.readAsText(file); }
    const aiHelpPrompt = `
Bitte formatiere die folgende Liste von Filmen und Serien in das JSON-Format für meine Watchlist-Anwendung. Das JSON-Hauptobjekt muss zwei Schlüssel enthalten: "serien" und "filme". Beide Schlüssel sollten ein Array von Objekten als Wert haben.
Jedes Objekt innerhalb der Arrays repräsentiert einen Film oder eine Serie und sollte die folgenden Schlüssel haben:
"id": Ein eindeutiger String (kannst du generieren, z.B. mit Zeitstempel + Zufallszahl).
"type": Ein String, entweder "serien" oder "filme", je nachdem, in welchem Array es sich befindet.
"title": Der Titel des Films oder der Serie (String).
"tags": Ein Array von Strings, das die Tags (früher Tags) auflistet (z.B. ["Action", "Sci-Fi"]). Wenn keine Tags angegeben sind, verwende ein leeres Array [].
"duration": Ein String, der die Dauer beschreibt (z.B. "148 min", "3 Staffeln", "N/A"). Wenn keine Dauer angegeben ist, verwende "N/A".
"isUpcoming": Ein boolescher Wert (true oder false). Setze ihn standardmäßig auf false, es sei denn, die Liste deutet darauf hin, dass er "upcoming" ist.
Hier ist die Liste, die du formatieren sollst:
[SIEHE ANGEHÄNGTE Watchlist]
Nutze von der Watchlist nur den Tab Serien, Upcoming und Filme ignoriere die anderen
Beispiel für ein Objekt im "filme"-Array:
{
"id": "1700000000000-0.123",
"type": "filme",
"title": "Inception",
"tags": ["Action", "Sci-Fi", "Thriller"],
"duration": "148 min",
"isUpcoming": false
}
Beispiel für ein Objekt im "serien"-Array:
{
"id": "1700000000001-0.456",
"type": "serien",
"title": "Stranger Things",
"tags": ["Drama", "Fantasy", "Horror"],
"duration": "4 Staffeln",
"isUpcoming": true
}
Bitte gib nur das vollständige JSON-Objekt zurück, beginnend mit { und endend mit }.
    `;
    function copyHelpText() { if (!navigator.clipboard) { showStatus(copyStatus, "Clipboard API nicht verfügbar.", 'error'); return; } const promptToCopy = aiHelpPrompt.trim(); navigator.clipboard.writeText(promptToCopy).then(() => { showStatus(copyStatus, "AI Prompt kopiert!", 'success'); }).catch(err => { console.error('Kopieren fehlgeschlagen:', err); showStatus(copyStatus, "Kopieren fehlgeschlagen.", 'error'); }); }


    // --- ======================================== ---
    // --- FIREBASE AUTHENTICATION & DATA FUNCTIONS ---
    // --- ======================================== ---

    // --- Authentication Handlers ---
    async function handleEmailSignup() { if (!firebaseInitialized || !auth) { showStatus(syncStatus, "Sync nicht verfügbar.", "error"); return; } if (!loginEmailInput || !loginPasswordInput || !loginErrorMessage) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; loginErrorMessage.textContent = ''; try { showStatus(syncStatus, "Registriere...", 'info', 10000); const userCredential = await createUserWithEmailAndPassword(auth, email, password); console.log("Signed up:", userCredential.user); await saveWatchlistData(true); closeLoginModal(); /* Status handled by save */ } catch (error) { console.error("Signup Error:", error.code, error.message); loginErrorMessage.textContent = `Registrierung fehlgeschlagen: ${mapAuthError(error.code)}`; showStatus(syncStatus, "Registrierung fehlgeschlagen", 'error'); } }
    async function handleEmailLogin() { if (!firebaseInitialized || !auth) { showStatus(syncStatus, "Sync nicht verfügbar.", "error"); return; } if (!loginEmailInput || !loginPasswordInput || !loginErrorMessage) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; loginErrorMessage.textContent = ''; try { showStatus(syncStatus, "Logge ein...", 'info', 10000); const userCredential = await signInWithEmailAndPassword(auth, email, password); console.log("Logged in:", userCredential.user); closeLoginModal(); /* Status handled by load */ } catch (error) { console.error("Login Error:", error.code, error.message); loginErrorMessage.textContent = `Login fehlgeschlagen: ${mapAuthError(error.code)}`; showStatus(syncStatus, "Login fehlgeschlagen", 'error'); } }
    async function handleLogout() { if (!firebaseInitialized || !auth) { showStatus(syncStatus, "Sync nicht verfügbar.", "error"); return; } try { await signOut(auth); console.log("Logged out successfully"); showStatus(syncStatus, "Erfolgreich ausgeloggt", 'success'); } catch (error) { console.error("Logout Error:", error); showStatus(syncStatus, "Logout fehlgeschlagen", 'error'); } }
    function mapAuthError(errorCode) { switch (errorCode) { case 'auth/invalid-email': return 'Ungültige E-Mail-Adresse.'; case 'auth/user-disabled': return 'Benutzerkonto deaktiviert.'; case 'auth/user-not-found': return 'Benutzer nicht gefunden.'; case 'auth/wrong-password': return 'Falsches Passwort.'; case 'auth/email-already-in-use': return 'E-Mail wird bereits verwendet.'; case 'auth/weak-password': return 'Passwort ist zu schwach (mind. 6 Zeichen).'; default: return 'Unbekannter Fehler.'; } }

    // --- Firestore Data Functions ---
    function triggerAutoSave() { if (!firebaseInitialized || !currentUser) return; console.log("Change detected, triggering auto-save..."); clearTimeout(autoSaveTimeout); autoSaveTimeout = setTimeout(() => { saveWatchlistData(); }, AUTO_SAVE_DELAY); }
    async function saveWatchlistData(isInitialSave = false) { if (!firebaseInitialized || !currentUser) { if (!isInitialSave && firebaseInitialized) { console.log("Not logged in, cannot save."); } return; } if (!db) { console.error("DB not init!"); showStatus(syncStatus, "DB Fehler.", 'error'); return; } const dataToSave = { serien: [...(watchListsData.serien || [])], filme: [...(watchListsData.filme || [])] }; if (!isInitialSave) { console.log("Executing debounced save for user:", currentUser.uid); showStatus(syncStatus, "Speichere Änderungen...", 'info', 5000); } else { console.log("Executing initial save for user:", currentUser.uid); } try { const userDocRef = doc(db, "userWatchlists", currentUser.uid); await setDoc(userDocRef, dataToSave); console.log("Watchlist saved successfully to Firestore!"); if (isInitialSave) { showStatus(syncStatus, "Konto erstellt & gespeichert!", 'success'); } else { showStatus(syncStatus, "Änderungen gespeichert!", 'success'); } } catch (error) { console.error("Error saving watchlist to Firestore:", error); showStatus(syncStatus, "Fehler beim Cloud-Speichern.", 'error'); } }
    async function loadWatchlistData() {
        console.log("loadWatchlistData called.");
        if (!firebaseInitialized || !currentUser) { console.log("Cannot load: No user or Firebase not ready."); watchListsData = { serien: [], filme: [] }; dataLoadedFromFirebase = false; renderLists(); return; }
        if (!db) { console.error("Firestore DB not initialized!"); renderLists(); return; } // Render empty on DB error
        console.log("Attempting to load data for user:", currentUser.uid);
        showStatus(syncStatus, "Lade Daten...", 'info', 10000);
        const userDocRef = doc(db, "userWatchlists", currentUser.uid);
        let loadedSuccessfully = false;
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                console.log("Firestore document data found.");
                const loadedData = docSnap.data();
                watchListsData.serien = (loadedData.serien || []).map(sanitizeItem('serien'));
                watchListsData.filme = (loadedData.filme || []).map(sanitizeItem('filme'));
                console.log("Watchlist loaded and sanitized.");
                showStatus(syncStatus, "Daten geladen!", 'success');
            } else {
                console.log("No watchlist document found. Initializing empty.");
                watchListsData = { serien: [], filme: [] };
                showStatus(syncStatus, "Keine Cloud-Daten.", 'info');
            }
            dataLoadedFromFirebase = true;
            loadedSuccessfully = true;
        } catch (error) {
            console.error("!!!! ERROR loading watchlist from Firestore !!!!", error);
            showStatus(syncStatus, "Fehler beim Laden.", 'error');
            watchListsData = { serien: [], filme: [] };
            dataLoadedFromFirebase = false;
        } finally {
            console.log(`Calling renderLists from loadWatchlistData finally block. Success: ${loadedSuccessfully}`);
            renderLists(); // Ensure render happens
        }
    } // End loadWatchlistData


    // --- Authentication State Listener ---
    function setupAuthObserver() {
        console.log("setupAuthObserver function entered.");
        if (!firebaseInitialized || !auth) { console.warn("Auth service not available, cannot set up observer."); if(loginBtnSettings) loginBtnSettings.style.display = 'inline-block'; if(userInfoSettings) userInfoSettings.style.display = 'none'; renderLists(); return; }
        console.log("Attaching onAuthStateChanged listener...");
        onAuthStateChanged(auth, async (user) => {
            console.log(">>> onAuthStateChanged callback fired! User:", user ? user.uid : 'None');
            try {
                if (user) {
                    // --- User is signed IN ---
                    if (currentUser?.uid !== user.uid) {
                        currentUser = user;
                        console.log("Processing LOGGED IN state for new user:", user.uid);
                        if(loginBtnSettings) loginBtnSettings.style.display = 'none';
                        if(userInfoSettings) userInfoSettings.style.display = 'flex';
                        if(userEmailSettings) userEmailSettings.textContent = user.email || 'Angemeldet';
                        console.log("=== Calling loadWatchlistData from Auth Observer ===");
                        await loadWatchlistData();
                        console.log("=== Returned from loadWatchlistData in Auth Observer ===");
                    } else { currentUser = user; console.log("Auth state updated for current user (no data reload needed)."); }
                } else {
                    // --- User is signed OUT ---
                    if (currentUser !== null) {
                        console.log("Processing LOGGED OUT state.");
                        currentUser = null;
                        dataLoadedFromFirebase = false;
                        if(loginBtnSettings) loginBtnSettings.style.display = 'inline-block';
                        if(userInfoSettings) userInfoSettings.style.display = 'none';
                        if(syncStatus) syncStatus.textContent = '';
                        watchListsData = { serien: [], filme: [] };
                        console.log("Calling renderLists from Auth Observer (Logout).");
                        renderLists();
                        console.log("Local watchlist data cleared on logout.");
                    } else {
                         console.log("Auth state: No user logged in (initial/redundant check).");
                         if(loginBtnSettings) loginBtnSettings.style.display = 'inline-block';
                         if(userInfoSettings) userInfoSettings.style.display = 'none';
                         if (!dataLoadedFromFirebase && currentUser === null) {
                             console.log("Calling renderLists from Auth Observer (Initial Logged Out).");
                             renderLists();
                         }
                    }
                }
             } catch (error) {
                 console.error("!!!! ERROR in onAuthStateChanged handler !!!!", error);
                 currentUser = null;
                 if(loginBtnSettings) loginBtnSettings.style.display = 'inline-block';
                 if(userInfoSettings) userInfoSettings.style.display = 'none';
                 watchListsData = { serien: [], filme: [] };
                 renderLists();
             }
        }); // End onAuthStateChanged
        console.log("onAuthStateChanged listener attached.");
    } // End setupAuthObserver


    // --- Initial Load Sequence ---
    function initializeAppAndUI() {
        console.log("Starting App Initialization...");
        if (!assignElementVariables()) { console.error("Halting initialization: Element assignment failed."); return; }
        loadSettingsData();
        applyAllSettings(); // Apply theme BEFORE setupAuthObserver
        setActiveTab(activeTabId, true);
        if (!addEventListeners()) { console.error("Halting initialization: Event listener attachment failed."); return; }
        console.log("Firebase Initialized Flag:", firebaseInitialized);
        console.log("Auth Object (type):", auth ? typeof auth : 'null');
        if (firebaseInitialized && auth) {
            console.log("Calling setupAuthObserver...");
            setupAuthObserver();
        } else {
            console.error("Skipping setupAuthObserver because Firebase init failed or auth is null.");
            renderLists(); // Manually render empty state if auth isn't ready
        }
        console.log("Watchlist App Initialized (V1.5)");
    }

    initializeAppAndUI(); // Execute the initialization

}); // --- End DOMContentLoaded wrapper ---