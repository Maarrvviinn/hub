// ===================================================================================
// FIREBASE SETUP
// ===================================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCfRQU4l2Tcheqi5JBeqH3u3XY8fYu7iC4",
    authDomain: "watchlist-webapp.firebaseapp.com",
    projectId: "watchlist-webapp",
    storageBucket: "watchlist-webapp.firebasestorage.app",
    messagingSenderId: "1018209532618",
    appId: "1:1018209532618:web:0ce6290f8f18f334ce1233",
    measurementId: "G-P7XM9RJSW2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================================================================================
// GAME CONFIG & STATE
// ===================================================================================
const GAME_TICK_MS = 100;
const INITIAL_STATE = { cash: 0n, multiplier: 1n, rebirths: 0n, superRebirths: 0n, prestige: 0n, playtime: 0n, displayName: 'Anonymous' };
const CONFIG = {
    cash: { title: 'Cash', color: 'var(--c-cash)' },
    multiplier: { title: 'Multiplier', color: 'var(--c-multiplier)', costCurrency: 'cash', rewardBoostedBy: { currency: 'rebirths', factor: 2n }, tiers: [ { amount: 1n, cost: 10n }, { amount: 2n, cost: 35n }, { amount: 5n, cost: 120n }, { amount: 10n, cost: 500n }, { amount: 25n, cost: 3_000n }, { amount: 100n, cost: 25_000n }, { amount: 500n, cost: 150_000n }, { amount: 1_000n, cost: 400_000n }, { amount: 5_000n, cost: 2_500_000n }, { amount: 10_000n, cost: 6_000_000n }, { amount: 25_000n, cost: 18_000_000n }, { amount: 50_000n, cost: 40_000_000n } ] },
    rebirths: { title: 'Rebirths', color: 'var(--c-rebirths)', costCurrency: 'multiplier', resets: ['cash', 'multiplier'], rewardBoostedBy: { currency: 'superRebirths', factor: 2n }, tiers: [ { amount: 1n, cost: 75_000n }, { amount: 3n, cost: 500_000n }, { amount: 10n, cost: 2_500_000n }, { amount: 50n, cost: 50_000_000n }, { amount: 250n, cost: 1_000_000_000n }, { amount: 1_000n, cost: 5_000_000_000n }, { amount: 5_000n, cost: 30_000_000_000n }, { amount: 25_000n, cost: 200_000_000_000n } ] },
    superRebirths: { title: 'S-Rebirths', color: 'var(--c-superRebirths)', costCurrency: 'rebirths', resets: ['cash', 'multiplier', 'rebirths'], rewardBoostedBy: { currency: 'prestige', factor: 2n }, tiers: [ { amount: 1n, cost: 750n }, { amount: 5n, cost: 8_000n }, { amount: 20n, cost: 50_000n }, { amount: 100n, cost: 400_000n }, { amount: 500n, cost: 3_000_000n }, { amount: 1_000n, cost: 7_500_000n }, { amount: 2_500n, cost: 20_000_000n }, { amount: 5_000n, cost: 50_000_000n } ] },
    prestige: { title: 'Prestige', color: 'var(--c-prestige)', costCurrency: 'superRebirths', resets: ['cash', 'multiplier', 'rebirths', 'superRebirths'], tiers: [ { amount: 1n, cost: 7_500n }, { amount: 2n, cost: 57_500n }, { amount: 5n, cost: 250_000n }, { amount: 10n, cost: 1_000_000n }, { amount: 25n, cost: 3_000_000n }, { amount: 50n, cost: 7_500_000n }, { amount: 100n, cost: 20_000_000n } ] },
    playtime: { title: 'Playtime', color: 'var(--c-playtime)'}
};

let gameState = { ...INITIAL_STATE };
let authState = { user: null, isAdmin: false };
let firestoreSaveInterval = null;
let leaderboardData = null;
let playtimeInterval = null;

const topBar = document.getElementById('top-bar-currencies');
const cornerCpsDisplay = document.getElementById('corner-cps-display');
const authFlowButtonLogin = document.getElementById('auth-flow-button-login');
const authFlowButtonLogout = document.getElementById('auth-flow-button-logout');
const adminPanelButton = document.getElementById('admin-panel-button');
const accountInfoDiv = document.getElementById('account-info');
const profileCard = document.getElementById('profile-card');
const actionsCard = document.getElementById('actions-card');
const displayNameInput = document.getElementById('displayName-input');
const playtimeDisplay = document.getElementById('playtime-display');
const leaderboardTable = document.getElementById('leaderboard-table');
const leaderboardSorts = document.getElementById('leaderboard-sort-buttons');
const leaderboardTimestamp = document.getElementById('leaderboard-timestamp');

// ===================================================================================
// UTILITIES
// ===================================================================================
const stringifyBigInts = (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v;
const parseBigInts = (k, v) => typeof v === 'string' && v.endsWith('n') ? BigInt(v.slice(0, -1)) : v;
const formatNumber = (num) => {
    num = BigInt(num); if (num < 1000n) return num.toString();
    const s = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const e = Math.floor(Math.log10(Number(num.toString())) / 3);
    if (e >= s.length) return num.toExponential(2);
    const val = Number(num.toString()) / (1000 ** e);
    return val.toFixed(val < 10 ? 2 : val < 100 ? 1 : 0).replace(/\.00$/, '') + s[e];
};
const formatPlaytime = (secondsBigInt) => {
    const seconds = Number(secondsBigInt);
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
}
const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'never';
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
    if (seconds < 60) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "a few seconds ago";
}

// ===================================================================================
// UI RENDERING & PAGE MANAGEMENT
// ===================================================================================
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    feather.replace();
    if (pageId === 'leaderboard-page') {
        fetchAndDisplayLeaderboard('prestige');
    }
}

function renderTopBar() {
    topBar.innerHTML = Object.keys(INITIAL_STATE).filter(k => k !== 'displayName' && k !== 'playtime').map(key => {
        const colorVar = `var(--c-${key})`;
        return `<div class="top-stat"><span class="top-stat-label">${CONFIG[key]?.title}</span><span id="stat-${key}" class="top-stat-value" style="color: ${colorVar};"></span></div>`;
    }).join('');
}

function updateAllUI() {
    for (const key in gameState) { const el = document.getElementById(`stat-${key}`); if (el) el.textContent = formatNumber(gameState[key]); }
    cornerCpsDisplay.textContent = `${formatNumber(calculateCashPerSecond())} cash/sec`;
    playtimeDisplay.textContent = formatPlaytime(gameState.playtime);
    renderShops();
}

function renderShops() {
    document.getElementById('shops-container').innerHTML = Object.keys(CONFIG).filter(key => CONFIG[key].tiers).map(currency => {
        const shopData = CONFIG[currency];
        const buttonsHTML = shopData.tiers.map((tier, index) => {
            const actualReward = calculateReward(currency, tier.amount);
            const canAfford = gameState[shopData.costCurrency] >= tier.cost;
            return `<button class="purchase-button" style="background-color: ${shopData.color};" ${canAfford ? '' : 'disabled'} data-currency="${currency}" data-tier="${index}"><span class="purchase-reward">+${formatNumber(actualReward)} ${currency.replace(/s$/, '')}</span><span class="purchase-cost">Cost: ${formatNumber(tier.cost)} ${shopData.costCurrency}</span></button>`;
        }).join('');
        return `<div class="shop-section"><h2 class="shop-title" style="border-color: ${shopData.color}; color: ${shopData.color};">${shopData.title}</h2><div class="shop-buttons">${buttonsHTML}</div></div>`;
    }).join('');
}

async function fetchAndDisplayLeaderboard(sortBy) {
    leaderboardTable.innerHTML = `<div class="loader"></div>`;
    leaderboardTimestamp.textContent = 'Loading...';
    try {
        const docRef = doc(db, "leaderboard", "ButtonSimulator");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { leaderboardData = docSnap.data(); }
        else { leaderboardTable.innerHTML = `<p>Leaderboard data not found. An admin needs to generate it.</p>`; leaderboardTimestamp.textContent = ''; return; }
    } catch (error) { leaderboardTable.innerHTML = `<p>Could not load leaderboard.</p>`; leaderboardTimestamp.textContent = ''; return; }
    
    leaderboardTimestamp.textContent = `Last updated: ${formatTimeAgo(leaderboardData.lastUpdated)}`;
    
    const LEADERBOARD_ORDER = ['cash', 'multiplier', 'rebirths', 'superRebirths', 'prestige', 'playtime'];
    leaderboardSorts.innerHTML = LEADERBOARD_ORDER.map(key => {
        if (!leaderboardData[key]) return '';
        const categoryConfig = CONFIG[key];
        const color = categoryConfig.color;
        return `<button style="background-color: ${color};" class="${key === sortBy ? 'active' : ''}" data-sortby="${key}" data-color="${color}">${categoryConfig.title}</button>`;
    }).join('');
    leaderboardSorts.querySelectorAll('button').forEach(btn => {
        if (btn.classList.contains('active')) {
            btn.style.boxShadow = `0 0 10px 0px ${btn.dataset.color}`;
        }
        btn.onclick = () => fetchAndDisplayLeaderboard(btn.dataset.sortby);
    });

    const entries = leaderboardData[sortBy] || [];
    if (entries.length === 0) { leaderboardTable.innerHTML = `<p>No entries for this category yet.</p>`; return; }
    leaderboardTable.innerHTML = entries.map((entry, index) => {
        const value = sortBy === 'playtime' ? formatPlaytime(BigInt(entry.score.slice(0,-1))) : formatNumber(BigInt(entry.score.slice(0, -1)));
        return `<div class="leaderboard-row"><span class="leaderboard-rank">#${index + 1}</span><span>${entry.name || 'Anonymous'}</span><span>${value}</span></div>`;
    }).join('');
}

// ===================================================================================
// GAME LOGIC
// ===================================================================================
function calculateCashPerSecond() { return gameState.multiplier * (1000n / BigInt(GAME_TICK_MS)); }
function calculateReward(currencyToGain, baseAmount) {
    const shopData = CONFIG[currencyToGain];
    if (shopData.rewardBoostedBy) {
        const boosterAmount = gameState[shopData.rewardBoostedBy.currency];
        const totalBoost = boosterAmount > 0n ? boosterAmount * shopData.rewardBoostedBy.factor : 1n;
        return baseAmount * totalBoost;
    }
    return baseAmount;
}

function handlePurchase(e) {
    const button = e.target.closest('.purchase-button');
    if (!button || button.disabled) return;
    const currency = button.dataset.currency;
    const tierIndex = parseInt(button.dataset.tier);
    const shopData = CONFIG[currency];
    const tierData = shopData.tiers[tierIndex];

    if (gameState[shopData.costCurrency] >= tierData.cost) {
        gameState[shopData.costCurrency] -= tierData.cost;
        
        // --- BUG FIX: CORRECTED RESET LOGIC ---
        if (shopData.resets) {
            const preservedStats = {
                displayName: gameState.displayName,
                playtime: gameState.playtime,
                rebirths: gameState.rebirths,
                superRebirths: gameState.superRebirths,
                prestige: gameState.prestige
            };
            
            gameState = { ...INITIAL_STATE }; // Start fresh

            gameState.displayName = preservedStats.displayName;
            gameState.playtime = preservedStats.playtime;
            
            if (!shopData.resets.includes('rebirths')) gameState.rebirths = preservedStats.rebirths;
            if (!shopData.resets.includes('superRebirths')) gameState.superRebirths = preservedStats.superRebirths;
            if (!shopData.resets.includes('prestige')) gameState.prestige = preservedStats.prestige;
        }
        
        gameState[currency] += calculateReward(currency, tierData.amount);
        updateAllUI();
    }
}

function gameTick() {
    gameState.cash += gameState.multiplier;
    const cashDisplay = document.getElementById('stat-cash');
    if (cashDisplay) cashDisplay.textContent = formatNumber(gameState.cash);
}

// ===================================================================================
// SAVING & LOADING
// ===================================================================================
const LOCAL_SAVE_KEY = 'stratPathSave_v15';
const saveToLocalStorage = () => localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(gameState, stringifyBigInts));
const loadFromLocalStorage = () => {
    const saved = localStorage.getItem(LOCAL_SAVE_KEY);
    if (saved) { try { gameState = { ...INITIAL_STATE, ...JSON.parse(saved, parseBigInts) }; } catch (e) { gameState = {...INITIAL_STATE}; } }
    else { gameState = {...INITIAL_STATE}; }
    updateAllUI();
};
async function saveToFirestore() {
    if (!authState.user) return;
    // --- BUG FIX: Ensure the latest display name from the input is included in the save state ---
    gameState.displayName = displayNameInput.value.trim() || gameState.displayName;
    const saveData = { "Button Simulator": JSON.parse(JSON.stringify(gameState, stringifyBigInts)) };
    try { await setDoc(doc(db, "userStats", authState.user.uid), saveData, { merge: true }); console.log("Game saved to cloud."); }
    catch (error) { console.error("Error saving to cloud:", error); }
}
async function loadFromFirestore() {
    if (!authState.user) return;
    const docRef = doc(db, "userStats", authState.user.uid);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data()["Button Simulator"]) {
            const cloudData = docSnap.data()["Button Simulator"];
            gameState = { ...INITIAL_STATE, ...JSON.parse(JSON.stringify(cloudData), parseBigInts) };
        }
    } catch (error) { console.error("Error loading from cloud:", error); }
    updateAllUI();
}

// ===================================================================================
// AUTHENTICATION & PERMISSIONS
// ===================================================================================
onAuthStateChanged(auth, async (user) => {
    authState.user = user;
    if (user) {
        accountInfoDiv.querySelector('p').innerHTML = `Logged in as: <strong>${user.email}</strong>`;
        authFlowButtonLogin.classList.add('hidden');
        profileCard.classList.remove('hidden');
        actionsCard.classList.remove('hidden');
        
        await loadFromFirestore();
        displayNameInput.value = gameState.displayName;
        if(displayNameInput.value) displayNameInput.parentElement.classList.add('has-content');

        const userPermsRef = doc(db, "userPermissions", user.uid);
        const docSnap = await getDoc(userPermsRef);
        authState.isAdmin = (docSnap.exists() && docSnap.data().rank >= 5);
        adminPanelButton.classList.toggle('hidden', !authState.isAdmin);
        
        if (firestoreSaveInterval) clearInterval(firestoreSaveInterval);
        firestoreSaveInterval = setInterval(saveToFirestore, 60000);
    } else {
        accountInfoDiv.querySelector('p').textContent = 'You are not logged in.';
        authFlowButtonLogin.classList.remove('hidden');
        profileCard.classList.add('hidden');
        actionsCard.classList.add('hidden');
        authState.isAdmin = false;
        adminPanelButton.classList.add('hidden');
        if (firestoreSaveInterval) clearInterval(firestoreSaveInterval);
        loadFromLocalStorage();
    }
});

// ===================================================================================
// EVENT LISTENERS
// ===================================================================================
document.querySelectorAll('.navbar__link').forEach(link => { if(link.classList.contains('disabled')) return; link.addEventListener('click', (e) => { e.preventDefault(); showPage(link.dataset.page); }); });
document.getElementById('shops-container').addEventListener('click', handlePurchase);
document.querySelectorAll('.modal-close-btn').forEach(btn => btn.onclick = () => document.getElementById(btn.dataset.target).classList.remove('visible'));
authFlowButtonLogin.onclick = () => document.getElementById('login-panel').classList.add('visible');
authFlowButtonLogout.onclick = () => signOut(auth);
adminPanelButton.onclick = () => document.getElementById('admin-panel').classList.add('visible');
const loginErrorMsg = document.getElementById('login-error-msg');
document.getElementById('login-button').onclick = async () => { try { await signInWithEmailAndPassword(auth, document.getElementById('email-input').value, document.getElementById('password-input').value); loginErrorMsg.textContent = ''; document.getElementById('login-panel').classList.remove('visible');} catch (error) { loginErrorMsg.textContent = error.code; } };
document.getElementById('register-button').onclick = async () => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, document.getElementById('email-input').value, document.getElementById('password-input').value);
        await setDoc(doc(db, "userPermissions", userCredential.user.uid), { rank: 1 });
        // --- BUG FIX: CORRECTED REGISTRATION LOGIC ---
        const defaultName = `User#${Math.floor(1000 + Math.random() * 9000)}`;
        const initialData = { ...INITIAL_STATE, displayName: defaultName };
        await setDoc(doc(db, "userStats", userCredential.user.uid), { "Button Simulator": JSON.parse(JSON.stringify(initialData, stringifyBigInts)) });
        loginErrorMsg.textContent = 'Success! You can now log in.';
    } catch (error) { loginErrorMsg.textContent = error.code; }
};

document.getElementById('save-displayName-button').onclick = () => {
    const newName = displayNameInput.value.trim();
    if (newName && newName.length > 0 && newName.length <= 20) {
        gameState.displayName = newName;
        saveToFirestore();
        alert("Display name saved!");
    } else {
        alert("Name must be between 1 and 20 characters.");
    }
};

document.getElementById('reset-stats-button').onclick = () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    const confirmation = prompt(`This will reset ALL your stats for this game. This cannot be undone. To confirm, please type: ${randomString}`);
    if (confirmation === randomString) {
        const oldDisplayName = gameState.displayName;
        gameState = { ...INITIAL_STATE, displayName: oldDisplayName };
        saveToFirestore();
        updateAllUI();
        alert("Your stats have been reset.");
    } else {
        alert("Incorrect code. Reset cancelled.");
    }
};

const getAdminAmount = () => { let input = document.getElementById('admin-amount').value.toLowerCase().trim(); if (input.includes('e')) { const parts = input.split('e'); return BigInt(parts[0]) * (10n ** BigInt(parts[1])); } return BigInt(input || '1000000'); };
document.getElementById('admin-add-cash').onclick = () => { gameState.cash += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-multiplier').onclick = () => { gameState.multiplier += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-rebirths').onclick = () => { gameState.rebirths += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-superRebirths').onclick = () => { gameState.superRebirths += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-prestige').onclick = () => { gameState.prestige += getAdminAmount(); updateAllUI(); };

async function handleLeaderboardRefresh() {
    if (!authState.isAdmin) { alert("You are not authorized."); return; }
    const button = document.getElementById('refresh-leaderboard-button');
    button.textContent = 'Processing...'; button.disabled = true;
    try {
        const usersSnapshot = await getDocs(collection(db, "userStats"));
        const allStats = {};
        const LEADERBOARD_CATEGORIES = ["cash", "multiplier", "rebirths", "superRebirths", "prestige", "playtime"];
        LEADERBOARD_CATEGORIES.forEach(cat => allStats[cat] = []);

        usersSnapshot.forEach(doc => {
            const gameData = doc.data()["Button Simulator"];
            if (gameData) {
                const displayName = gameData.displayName || "Anonymous";
                LEADERBOARD_CATEGORIES.forEach(category => {
                    const statValue = gameData[category];
                    if (statValue && typeof statValue === 'string' && statValue.endsWith('n')) {
                        allStats[category].push({ name: displayName, score: BigInt(statValue.slice(0, -1)) });
                    }
                });
            }
        });
        const finalLeaderboardData = {};
        LEADERBOARD_CATEGORIES.forEach(category => {
            allStats[category].sort((a, b) => (b.score > a.score) ? 1 : -1);
            finalLeaderboardData[category] = allStats[category].slice(0, 50).map(entry => ({ name: entry.name, score: entry.score.toString() + 'n' }));
        });
        
        finalLeaderboardData.lastUpdated = serverTimestamp();

        await setDoc(doc(db, "leaderboard", "ButtonSimulator"), finalLeaderboardData);
        alert("Leaderboard refreshed successfully!");
        leaderboardData = null; // Clear cache
    } catch (error) { alert(`Leaderboard refresh failed: ${error.message}`); }
    finally { button.textContent = 'Refresh Leaderboard'; button.disabled = false; }
}
document.getElementById('refresh-leaderboard-button').addEventListener('click', handleLeaderboardRefresh);

// ===================================================================================
// INITIALIZATION
// ===================================================================================
loadFromLocalStorage();
renderTopBar();
updateAllUI();
showPage('main-page');
setInterval(gameTick, GAME_TICK_MS);
if (playtimeInterval) clearInterval(playtimeInterval);
playtimeInterval = setInterval(() => { if(authState.user) { gameState.playtime++; playtimeDisplay.textContent = formatPlaytime(gameState.playtime); } }, 1000);
setInterval(updateAllUI, 2000);
setInterval(saveToLocalStorage, 5000);
window.addEventListener('beforeunload', saveToLocalStorage);