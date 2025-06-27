// ===================================================================================
// FIREBASE SETUP
// ===================================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyCfRQU4l2Tcheqi5JBeqH3u3XY8fYu7iC4",
    authDomain: "watchlist-webapp.firebaseapp.com",
    projectId: "watchlist-webapp",
    storageBucket: "watchlist-webapp.firebasestorage.app",
    messagingSenderId: "1018209532618",
    appId: "1:1018209532618:web:0ce6290f8f18f334ce1233",
    measurementId: "G-P7XM9RJSW2"
};
// ---------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================================================================================
// GAME CONFIG & STATE
// ===================================================================================
const GAME_TICK_MS = 100;
const INITIAL_STATE = { cash: 0n, multiplier: 1n, rebirths: 0n, superRebirths: 0n, prestige: 0n };
const CONFIG = {
    cash: { title: 'Cash' },
    multiplier: { title: 'Multiplier', color: 'var(--c-multiplier)', costCurrency: 'cash', rewardBoostedBy: { currency: 'rebirths', factor: 2n }, tiers: [ { amount: 1n, cost: 10n }, { amount: 2n, cost: 35n }, { amount: 5n, cost: 120n }, { amount: 10n, cost: 500n }, { amount: 25n, cost: 3_000n }, { amount: 100n, cost: 25_000n }, { amount: 500n, cost: 150_000n }, { amount: 1_000n, cost: 400_000n }, { amount: 5_000n, cost: 2_500_000n }, { amount: 10_000n, cost: 6_000_000n }, { amount: 25_000n, cost: 18_000_000n }, { amount: 50_000n, cost: 40_000_000n } ] },
    rebirths: { title: 'Rebirths', color: 'var(--c-rebirths)', costCurrency: 'multiplier', resets: ['cash', 'multiplier'], rewardBoostedBy: { currency: 'superRebirths', factor: 2n }, tiers: [ { amount: 1n, cost: 75_000n }, { amount: 3n, cost: 500_000n }, { amount: 10n, cost: 2_500_000n }, { amount: 50n, cost: 50_000_000n }, { amount: 250n, cost: 1_000_000_000n }, { amount: 1_000n, cost: 5_000_000_000n }, { amount: 5_000n, cost: 30_000_000_000n }, { amount: 25_000n, cost: 200_000_000_000n } ] },
    superRebirths: { title: 'S-Rebirths', color: 'var(--c-superRebirths)', costCurrency: 'rebirths', resets: ['cash', 'multiplier', 'rebirths'], rewardBoostedBy: { currency: 'prestige', factor: 2n }, tiers: [ { amount: 1n, cost: 750n }, { amount: 5n, cost: 8_000n }, { amount: 20n, cost: 50_000n }, { amount: 100n, cost: 400_000n }, { amount: 500n, cost: 3_000_000n }, { amount: 1_000n, cost: 7_500_000n }, { amount: 2_500n, cost: 20_000_000n }, { amount: 5_000n, cost: 50_000_000n } ] },
    prestige: { title: 'Prestige', color: 'var(--c-prestige)', costCurrency: 'superRebirths', resets: ['cash', 'multiplier', 'rebirths', 'superRebirths'], tiers: [ { amount: 1n, cost: 7_500n }, { amount: 2n, cost: 57_500n }, { amount: 5n, cost: 250_000n }, { amount: 10n, cost: 1_000_000n }, { amount: 25n, cost: 3_000_000n }, { amount: 50n, cost: 7_500_000n }, { amount: 100n, cost: 20_000_000n } ] }
};

let gameState = { ...INITIAL_STATE };
let authState = { user: null, isAdmin: false };
let firestoreSaveInterval = null;

const topBar = document.getElementById('top-bar-currencies');
const shopsContainer = document.getElementById('shops-container');
const cornerCpsDisplay = document.getElementById('corner-cps-display');
const authFlowButton = document.getElementById('auth-flow-button');
const adminPanelButton = document.getElementById('admin-panel-button');

// ===================================================================================
// UTILITIES & BIGINT HELPERS
// ===================================================================================
const stringifyBigInts = (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value;
const parseBigInts = (key, value) => typeof value === 'string' && value.endsWith('n') ? BigInt(value.slice(0, -1)) : value;
const formatNumber = (num) => {
    num = BigInt(num); if (num < 1000n) return num.toString();
    const s = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const e = Math.floor(Math.log10(Number(num.toString())) / 3);
    if (e >= s.length) return num.toExponential(2);
    const val = Number(num.toString()) / (1000 ** e);
    return val.toFixed(val < 10 ? 2 : val < 100 ? 1 : 0).replace(/\.00$/, '') + s[e];
};

// ===================================================================================
// UI RENDERING
// ===================================================================================
function renderTopBar() {
    topBar.innerHTML = '';
    for (const key in INITIAL_STATE) {
        const statDiv = document.createElement('div');
        statDiv.className = 'top-stat';
        const colorVar = `var(--c-${key})`;
        statDiv.innerHTML = `<span class="top-stat-label">${CONFIG[key]?.title}</span><span id="stat-${key}" class="top-stat-value" style="color: ${colorVar};">${formatNumber(gameState[key])}</span>`;
        topBar.appendChild(statDiv);
    }
}

function updateAllUI() {
    for (const key in gameState) { const el = document.getElementById(`stat-${key}`); if (el) el.textContent = formatNumber(gameState[key]); }
    cornerCpsDisplay.textContent = `${formatNumber(calculateCashPerSecond())} cash/sec`;
    renderShops();
}

function renderShops() {
    shopsContainer.innerHTML = '';
    for (const currency in CONFIG) {
        if(currency === 'cash') continue;
        const shopData = CONFIG[currency];
        const shopDiv = document.createElement('div');
        shopDiv.className = 'shop-section';
        shopDiv.innerHTML = `<h2 class="shop-title" style="border-color: ${shopData.color}; color: ${shopData.color};">${shopData.title}</h2><div class="shop-buttons"></div>`;
        const buttonsContainer = shopDiv.querySelector('.shop-buttons');
        shopData.tiers.forEach((tier, index) => {
            const actualReward = calculateReward(currency, tier.amount);
            const canAfford = gameState[shopData.costCurrency] >= tier.cost;
            const button = document.createElement('button');
            button.className = 'purchase-button';
            button.style.backgroundColor = shopData.color;
            button.disabled = !canAfford;
            button.dataset.currency = currency;
            button.dataset.tier = index;
            button.innerHTML = `<span class="purchase-reward">+${formatNumber(actualReward)} ${currency.replace(/s$/, '')}</span><span class="purchase-cost">Cost: ${formatNumber(tier.cost)} ${shopData.costCurrency}</span>`;
            buttonsContainer.appendChild(button);
        });
        shopsContainer.appendChild(shopDiv);
    }
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
        if (shopData.resets) { shopData.resets.forEach(key => { gameState[key] = INITIAL_STATE[key]; }); }
        gameState[currency] += calculateReward(currency, tierData.amount);
        updateAllUI();
    }
}
function gameTick() {
    gameState.cash += gameState.multiplier;
    document.getElementById('stat-cash').textContent = formatNumber(gameState.cash);
}

// ===================================================================================
// SAVING & LOADING (LOCAL & CLOUD)
// ===================================================================================
const LOCAL_SAVE_KEY = 'stratPathSave_v11';
const saveToLocalStorage = () => localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(gameState, stringifyBigInts));
const loadFromLocalStorage = () => {
    const saved = localStorage.getItem(LOCAL_SAVE_KEY);
    if (saved) { try { gameState = { ...INITIAL_STATE, ...JSON.parse(saved, parseBigInts) }; } catch (e) { console.error("Local save corrupted", e); gameState = {...INITIAL_STATE}; } }
    else { gameState = {...INITIAL_STATE}; }
    updateAllUI();
};

async function saveToFirestore() {
    if (!authState.user) return;
    const saveData = { "Button Simulator": JSON.parse(JSON.stringify(gameState, stringifyBigInts)) };
    try {
        // CHANGED: Saving to the 'userStats' collection
        await setDoc(doc(db, "userStats", authState.user.uid), saveData, { merge: true });
        console.log("Game saved to cloud.");
    } catch (error) { console.error("Error saving to cloud:", error); }
}

async function loadFromFirestore() {
    if (!authState.user) return;
    // CHANGED: Loading from the 'userStats' collection
    const docRef = doc(db, "userStats", authState.user.uid);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data()["Button Simulator"]) {
            console.log("Cloud save found, loading data.");
            const cloudData = docSnap.data()["Button Simulator"];
            gameState = JSON.parse(JSON.stringify(cloudData), parseBigInts);
        } else {
            console.log("No cloud save found for this game, using local state.");
        }
        updateAllUI();
    } catch (error) { console.error("Error loading from cloud:", error); }
}

// ===================================================================================
// AUTHENTICATION & PERMISSIONS
// ===================================================================================
onAuthStateChanged(auth, async (user) => {
    authState.user = user;
    if (user) {
        authFlowButton.textContent = 'Logout';
        authFlowButton.classList.add('logout');
        await loadFromFirestore();
        const userPermsRef = doc(db, "userPermissions", user.uid);
        const docSnap = await getDoc(userPermsRef);
        authState.isAdmin = (docSnap.exists() && docSnap.data().rank >= 5);
        adminPanelButton.classList.toggle('hidden', !authState.isAdmin);
        document.getElementById('login-panel').classList.remove('visible');
        firestoreSaveInterval = setInterval(saveToFirestore, 60000);
    } else {
        authFlowButton.textContent = 'Login';
        authFlowButton.classList.remove('logout');
        authState.isAdmin = false;
        adminPanelButton.classList.add('hidden');
        if (firestoreSaveInterval) clearInterval(firestoreSaveInterval);
        loadFromLocalStorage();
    }
});

// Event Listeners
document.getElementById('settings-toggle').onclick = () => document.getElementById('settings-panel').classList.add('visible');
document.querySelectorAll('.modal-close-btn').forEach(btn => btn.onclick = () => document.getElementById(btn.dataset.target).classList.remove('visible'));
authFlowButton.onclick = () => { if (authState.user) { signOut(auth); } else { document.getElementById('login-panel').classList.add('visible'); } };
adminPanelButton.onclick = () => document.getElementById('admin-panel').classList.add('visible');
const loginErrorMsg = document.getElementById('login-error-msg');
document.getElementById('login-button').onclick = async () => {
    try { await signInWithEmailAndPassword(auth, document.getElementById('email-input').value, document.getElementById('password-input').value); loginErrorMsg.textContent = ''; }
    catch (error) { loginErrorMsg.textContent = error.code; }
};
document.getElementById('register-button').onclick = async () => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, document.getElementById('email-input').value, document.getElementById('password-input').value);
        await setDoc(doc(db, "userPermissions", userCredential.user.uid), { rank: 1 });
        loginErrorMsg.textContent = 'Success! You can now log in.';
    } catch (error) { loginErrorMsg.textContent = error.code; }
};

const getAdminAmount = () => BigInt(document.getElementById('admin-amount').value.replace(/(\d+)e(\d+)/i, '$1' + '0'.repeat(parseInt('$2'))) || '1000000');
document.getElementById('admin-add-cash').onclick = () => { gameState.cash += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-multiplier').onclick = () => { gameState.multiplier += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-rebirths').onclick = () => { gameState.rebirths += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-superRebirths').onclick = () => { gameState.superRebirths += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-add-prestige').onclick = () => { gameState.prestige += getAdminAmount(); updateAllUI(); };
document.getElementById('admin-reset').onclick = () => { if (confirm("HARD RESET LOCAL SAVE?")) { localStorage.removeItem(LOCAL_SAVE_KEY); location.reload(); } };

// ===================================================================================
// INITIALIZATION
// ===================================================================================
shopsContainer.addEventListener('click', handlePurchase);
loadFromLocalStorage();
renderTopBar();
updateAllUI();
setInterval(gameTick, GAME_TICK_MS);
setInterval(updateAllUI, 2000);
setInterval(saveToLocalStorage, 5000);
window.addEventListener('beforeunload', saveToLocalStorage);