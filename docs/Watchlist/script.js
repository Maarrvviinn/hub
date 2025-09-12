document.addEventListener('DOMContentLoaded', () => {

    // --- FIREBASE SETUP ---
    const firebaseConfig = {
        apiKey: "AIzaSyCfRQU4l2Tcheqi5JBeqH3u3XY8fYu7iC4",
        authDomain: "watchlist-webapp.firebaseapp.com",
        projectId: "watchlist-webapp",
        storageBucket: "watchlist-webapp.appspot.com",
        messagingSenderId: "1018209532618",
        appId: "1:1018209532618:web:0ce6290f8f18f334ce1233",
        measurementId: "G-P7XM9RJSW2"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- Element Selectors ---
    const watchlistArea = document.getElementById('watchlist-area');
    const addEntryBtn = document.getElementById('add-entry-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const mainSearchBar = document.querySelector('.search-bar');

    // Modals
    const entryModal = document.getElementById('entry-modal');
    const settingsModal = document.getElementById('settings-modal');
    const searchPanel = document.getElementById('search-panel');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    
    // Auth & Settings
    const authFormContainer = document.getElementById('auth-form-container');
    const userView = document.getElementById('user-view');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupBtn = document.getElementById('signup-btn');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const authError = document.getElementById('auth-error');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    // Entry Modal
    const entryId = document.getElementById('entry-id');
    const entryName = document.getElementById('entry-name');
    const typeDropdown = document.getElementById('type-dropdown');
    const entryDuration = document.getElementById('entry-duration');
    const entryTags = document.getElementById('entry-tags');
    const saveEntryBtn = document.getElementById('save-entry-btn');
    const deleteEntryBtn = document.getElementById('delete-entry-btn');
    const cancelEntryBtn = document.getElementById('cancel-entry-btn');
    
    // Delete Confirmation Modal
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // Advanced Search
    const advSearchBtn = document.getElementById('advanced-search-btn');
    const advSearchInput = document.getElementById('adv-search-input');
    const maxDurationInput = document.getElementById('max-duration-input');
    const typeFilterContainer = document.getElementById('type-filter-container');
    const sortFilterContainer = document.getElementById('sort-filter-container');
    const applySearchBtn = document.getElementById('apply-search-btn');
    const resetSearchBtn = document.getElementById('reset-search-btn');
    
    let watchlist = [];
    let currentUser = null;
    let entryIdToDelete = null;

    // --- FIREBASE AUTH & DATA ---
    auth.onAuthStateChanged(async user => {
        authError.style.display = 'none';
        if (user) {
            currentUser = user;
            authFormContainer.style.display = 'none';
            userView.style.display = 'block';
            userEmailDisplay.textContent = user.email;
            await loadWatchlistFromFirestore();
        } else {
            currentUser = null;
            authFormContainer.style.display = 'block';
            userView.style.display = 'none';
            watchlist = [];
            renderWatchlist();
        }
    });
    
    // --- AUTH FORM LOGIC ---
    loginBtn.addEventListener('click', () => {
        auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
            .catch(error => {
                authError.textContent = error.message;
                authError.style.display = 'block';
            });
    });

    signupBtn.addEventListener('click', () => {
        auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
            .catch(error => {
                authError.textContent = error.message;
                authError.style.display = 'block';
            });
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        signupView.style.display = 'flex';
        authError.style.display = 'none';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.style.display = 'none';
        loginView.style.display = 'flex';
        authError.style.display = 'none';
    });

    // --- FIRESTORE DATA HANDLING ---
    const loadWatchlistFromFirestore = async () => {
        if (!currentUser) return;
        try {
            const doc = await db.collection('watchlists').doc(currentUser.uid).get();
            watchlist = doc.exists ? (doc.data().entries || []) : [];
            renderWatchlist();
        } catch (error) {
            console.error("Error loading watchlist:", error);
        }
    };
    
    const saveWatchlistToFirestore = async () => {
        if (!currentUser) return;
        try {
            await db.collection('watchlists').doc(currentUser.uid).set({ entries: watchlist });
        } catch (error) {
            console.error("Error saving watchlist:", error);
        }
    };

    // --- IMPORT LOGIC ---
    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData && Array.isArray(importedData.entries)) {
                    const existingIds = new Set(watchlist.map(item => item.id));
                    const newItems = importedData.entries.filter(item => !existingIds.has(item.id));
                    
                    if (newItems.length > 0) {
                        watchlist.push(...newItems);
                        await saveWatchlistToFirestore();
                        renderWatchlist();
                        alert(`Successfully imported ${newItems.length} new entries!`);
                    } else {
                        alert("No new entries found to import.");
                    }
                } else {
                    throw new Error("Invalid JSON format.");
                }
            } catch (error) {
                alert("Failed to import file. Please ensure it's a valid JSON file.");
                console.error("Import error:", error);
            } finally {
                importFileInput.value = '';
            }
        };
        reader.readAsText(file);
    });

    // --- UI & Rendering ---
    const renderWatchlist = (itemsToRender = watchlist) => {
        watchlistArea.innerHTML = '';
        itemsToRender.forEach(item => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            card.setAttribute('draggable', true);
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="card-main-content">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
                </div>
                <div class="card-meta">
                    <div class="card-type"><span>${item.type === 'tv-show' ? 'TV Show' : 'Movie'}</span></div>
                    <div class="card-duration">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${item.duration} min</span>
                    </div>
                </div>`;
            card.addEventListener('click', () => openEditModal(item.id));
            card.addEventListener('dragstart', (e) => {
                e.target.classList.add('dragging');
            });
            watchlistArea.appendChild(card);
        });
    };

    // --- MODAL & ENTRY LOGIC ---
    const openModal = (modal) => modal.style.display = 'flex';
    const closeModal = (modal) => modal.style.display = 'none';

    addEntryBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("Please log in to add entries.");
            return;
        }
        entryModal.querySelector('.modal-title').textContent = 'Add Entry';
        entryId.value = '';
        entryName.value = '';
        entryDuration.value = '';
        entryTags.value = '';
        const selected = typeDropdown.querySelector('.dropdown-selected');
        selected.dataset.value = 'movie';
        selected.querySelector('span').textContent = 'Movie';
        deleteEntryBtn.style.display = 'none';
        openModal(entryModal);
    });

    const openEditModal = (id) => {
        const item = watchlist.find(i => i.id === id);
        if (!item) return;
        entryModal.querySelector('.modal-title').textContent = 'Edit Entry';
        entryId.value = item.id;
        entryName.value = item.name;
        entryDuration.value = item.duration;
        entryTags.value = item.tags.join(', ');
        const selected = typeDropdown.querySelector('.dropdown-selected');
        selected.dataset.value = item.type;
        selected.querySelector('span').textContent = item.type === 'tv-show' ? 'TV Show' : 'Movie';
        deleteEntryBtn.style.display = 'inline-block';
        openModal(entryModal);
    };

    saveEntryBtn.addEventListener('click', async () => {
        const id = entryId.value;
        const name = entryName.value.trim();
        const type = typeDropdown.querySelector('.dropdown-selected').dataset.value;
        const duration = parseInt(entryDuration.value, 10);
        const tags = entryTags.value.split(',').map(tag => tag.trim()).filter(Boolean);
        if (!name || isNaN(duration) || duration <= 0) {
            alert('A valid name and duration are required.');
            return;
        }
        if (id) {
            const index = watchlist.findIndex(item => item.id === id);
            if (index > -1) watchlist[index] = { ...watchlist[index], name, type, duration, tags };
        } else {
            watchlist.push({ id: Date.now().toString(), name, type, duration, tags });
        }
        await saveWatchlistToFirestore();
        renderWatchlist();
        closeModal(entryModal);
    });

    deleteEntryBtn.addEventListener('click', () => {
        entryIdToDelete = entryId.value;
        closeModal(entryModal);
        openModal(deleteConfirmModal);
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (entryIdToDelete) {
            watchlist = watchlist.filter(item => item.id !== entryIdToDelete);
            await saveWatchlistToFirestore();
            renderWatchlist();
        }
        closeModal(deleteConfirmModal);
        entryIdToDelete = null;
    });

    // --- OTHER EVENT LISTENERS ---
    cancelEntryBtn.addEventListener('click', () => closeModal(entryModal));
    cancelDeleteBtn.addEventListener('click', () => closeModal(deleteConfirmModal));
    settingsBtn.addEventListener('click', () => openModal(settingsModal));
    
    [entryModal, settingsModal, searchPanel, deleteConfirmModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        }
    });
    
    // --- SEARCH, SORT, DRAG & DROP ---
    function initDropdown(dropdownEl) {
        const selected = dropdownEl.querySelector('.dropdown-selected');
        const options = dropdownEl.querySelector('.dropdown-options');
        selected.addEventListener('click', () => dropdownEl.classList.toggle('open'));
        options.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                selected.querySelector('span').textContent = e.target.textContent;
                selected.dataset.value = e.target.dataset.value;
                dropdownEl.classList.remove('open');
            }
        });
    }
    document.querySelectorAll('.custom-dropdown').forEach(initDropdown);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown').forEach(dd => dd.classList.remove('open'));
        }
    });

    mainSearchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = watchlist.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        renderWatchlist(filtered);
    });

    advSearchBtn.addEventListener('click', () => openModal(searchPanel));

    const handleFilterClick = (container, event) => {
        if (event.target.tagName === 'BUTTON') {
            [...container.children].forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }
    };
    typeFilterContainer.addEventListener('click', (e) => handleFilterClick(typeFilterContainer, e));
    sortFilterContainer.addEventListener('click', (e) => handleFilterClick(sortFilterContainer, e));

    applySearchBtn.addEventListener('click', () => {
        let results = [...watchlist];
        const searchTerm = advSearchInput.value.toLowerCase();
        const typeFilter = typeFilterContainer.querySelector('.active').dataset.type;
        const maxDuration = parseInt(maxDurationInput.value, 10);
        const sortBy = sortFilterContainer.querySelector('.active').dataset.sort;
        if (searchTerm) results = results.filter(item => item.name.toLowerCase().includes(searchTerm) || item.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        if (typeFilter !== 'all') results = results.filter(item => item.type === typeFilter);
        if (!isNaN(maxDuration) && maxDuration > 0) results = results.filter(item => item.duration <= maxDuration);
        results.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'duration') return a.duration - b.duration;
            return 0;
        });
        renderWatchlist(results);
        closeModal(searchPanel);
    });

    resetSearchBtn.addEventListener('click', () => {
        advSearchInput.value = '';
        maxDurationInput.value = '';
        typeFilterContainer.querySelector('.active').classList.remove('active');
        typeFilterContainer.querySelector('[data-type="all"]').classList.add('active');
        sortFilterContainer.querySelector('.active').classList.remove('active');
        sortFilterContainer.querySelector('[data-sort="name"]').classList.add('active');
        renderWatchlist(watchlist);
    });

    watchlistArea.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(watchlistArea, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            watchlistArea.appendChild(dragging);
        } else {
            watchlistArea.insertBefore(dragging, afterElement);
        }
    });

    watchlistArea.addEventListener('dragend', (e) => {
        const draggedElement = e.target;
        if (!draggedElement.classList.contains('entry-card')) return;
        
        const newOrder = [];
        document.querySelectorAll('#watchlist-area .entry-card').forEach(cardEl => {
            const foundItem = watchlist.find(item => item.id === cardEl.dataset.id);
            if (foundItem) {
                newOrder.push(foundItem);
            }
        });
        watchlist = newOrder;
        saveWatchlistToFirestore();
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.entry-card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});