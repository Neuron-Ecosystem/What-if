// --- PWA LOGIC ---
let deferredPrompt;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW active'))
            .catch(err => console.error('SW error', err));
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.style.display = 'flex';
});

async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn) installBtn.style.display = 'none';
    }
    deferredPrompt = null;
}

// --- CONFIGURATION ---
const CONFIG = {
    scenariosFile: 'scenarios.json',
    defaultTheme: 'dark',
    appStateKey: 'whatIf_v2_state',
    dayMs: 86400000
};

// --- GLOBAL STATE ---
const AppState = {
    scenarios: [],
    filteredScenarios: [],
    currentIndex: 0,
    currentCategory: 'all',
    theme: CONFIG.defaultTheme,
    dailyScenarioId: null
};

// --- DOM ELEMENTS ---
const DOM = {
    card: document.getElementById('scenarioCard'),
    prevBtn: document.getElementById('prevScenarioBtn'),
    nextBtn: document.getElementById('nextScenarioBtn'),
    shareBtn: document.getElementById('shareBtn'),
    dailyBtn: document.getElementById('dailyScenarioBtn'),
    themeToggle: document.getElementById('themeToggle'),
    categoryPills: document.querySelectorAll('.category-pill'),
    metaCategory: document.getElementById('scenarioCategory'),
    metaTime: document.getElementById('readingTime'),
    toast: document.getElementById('toast'),
    installBtn: document.getElementById('installAppBtn')
};

// --- INITIALIZATION ---
async function initApp() {
    loadTheme();
    setupEventListeners();
    
    try {
        await loadScenarios();
        calculateDailyScenario();
        handleRouting();
    } catch (error) {
        console.error("Init Error:", error);
        showErrorState();
    }
}

async function loadScenarios() {
    const response = await fetch(CONFIG.scenariosFile);
    AppState.scenarios = await response.json();
    filterScenarios('all');
}

function filterScenarios(category) {
    AppState.currentCategory = category;
    AppState.filteredScenarios = category === 'all' 
        ? [...AppState.scenarios] 
        : AppState.scenarios.filter(s => s.category === category);
    AppState.currentIndex = 0;
    updateCategoryUI();
}

function calculateDailyScenario() {
    const dateCode = Math.floor(Date.now() / CONFIG.dayMs);
    const index = dateCode % AppState.scenarios.length;
    AppState.dailyScenarioId = AppState.scenarios[index].id;
}

function handleRouting() {
    const hash = window.location.hash;
    if (hash.startsWith('#id=')) {
        const id = parseInt(hash.replace('#id=', ''));
        const foundIndex = AppState.scenarios.findIndex(s => s.id === id);
        if (foundIndex !== -1) {
            filterScenarios('all');
            AppState.currentIndex = foundIndex;
        }
    }
    renderCurrentScenario();
}

function updateHash() {
    const s = AppState.filteredScenarios[AppState.currentIndex];
    if (s) history.replaceState(null, null, `#id=${s.id}`);
}

function renderCurrentScenario() {
    const s = AppState.filteredScenarios[AppState.currentIndex];
    if (!s) return;

    DOM.metaCategory.textContent = getCategoryName(s.category);
    
    const isDaily = s.id === AppState.dailyScenarioId;
    const dailyBadge = isDaily ? `<div style="color: var(--accent-primary); font-size: 0.9rem; margin-bottom: 8px; font-weight: 600;"><i class="fas fa-star"></i> ВЫБОР ВСЕЛЕННОЙ</div>` : '';

    DOM.card.innerHTML = `
        <div class="scenario-content fade-in">
            ${dailyBadge}
            <h2 class="scenario-title">${s.title}</h2>
            <div class="scenario-intro">${s.intro}</div>
            <div class="comparison-grid">
                <div class="comparison-column col-changed">
                    <h3><i class="fas fa-plus"></i> Появилось</h3>
                    <ul class="feature-list">${s.changed.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
                <div class="comparison-column col-disappeared">
                    <h3><i class="fas fa-minus"></i> Исчезло</h3>
                    <ul class="feature-list">${s.disappeared.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
            </div>
            <div class="deep-dive">
                <button class="deep-dive-toggle" onclick="toggleDeepDive(this)">
                    <i class="fas fa-layer-group"></i>
                    <span>Последствия и выводы</span>
                    <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
                </button>
                <div class="deep-dive-content">
                    <div class="consequence-block"><h4>🌍 Сеть</h4><p>${s.consequences.internet}</p></div>
                    <div class="consequence-block"><h4>👥 Общество</h4><p>${s.consequences.people}</p></div>
                    <div class="consequence-block"><h4>🔧 Технологии</h4><p>${s.consequences.technology}</p></div>
                    <div class="consequence-block" style="border-top: 1px dashed var(--border-color); padding-top: 15px;">
                        <h4>🏁 Итог</h4><p><i>${s.conclusion}</i></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.toggleDeepDive = function(btn) {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('.fa-chevron-down');
    content.classList.toggle('visible');
    icon.style.transform = content.classList.contains('visible') ? 'rotate(180deg)' : 'rotate(0deg)';
};

function getCategoryName(cat) {
    const map = { 'tech': 'Технологии', 'society': 'Общество', 'nature': 'Природа', 'human': 'Человек' };
    return map[cat] || 'Разное';
}

function updateCategoryUI() {
    DOM.categoryPills.forEach(p => p.classList.toggle('active', p.dataset.category === AppState.currentCategory));
}

function loadTheme() {
    const saved = localStorage.getItem('theme') || CONFIG.defaultTheme;
    AppState.theme = saved;
    document.body.className = saved === 'light' ? 'light-theme' : '';
    updateThemeIcon();
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.body.className = AppState.theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('theme', AppState.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = DOM.themeToggle.querySelector('i');
    icon.className = AppState.theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

function setupEventListeners() {
    DOM.nextBtn.addEventListener('click', () => { AppState.currentIndex = (AppState.currentIndex + 1) % AppState.filteredScenarios.length; renderCurrentScenario(); updateHash(); window.scrollTo({top:0, behavior:'smooth'}); });
    DOM.prevBtn.addEventListener('click', () => { AppState.currentIndex = (AppState.currentIndex - 1 + AppState.filteredScenarios.length) % AppState.filteredScenarios.length; renderCurrentScenario(); updateHash(); window.scrollTo({top:0, behavior:'smooth'}); });
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.shareBtn.addEventListener('click', () => {
        const s = AppState.filteredScenarios[AppState.currentIndex];
        const url = `${window.location.origin}${window.location.pathname}#id=${s.id}`;
        navigator.clipboard.writeText(url).then(() => { DOM.toast.classList.add('show'); setTimeout(() => DOM.toast.classList.remove('show'), 2000); });
    });
    DOM.dailyBtn.addEventListener('click', () => {
        const idx = AppState.scenarios.findIndex(s => s.id === AppState.dailyScenarioId);
        if (idx !== -1) { filterScenarios('all'); AppState.currentIndex = idx; renderCurrentScenario(); updateHash(); }
    });
    DOM.categoryPills.forEach(p => p.addEventListener('click', () => { filterScenarios(p.dataset.category); renderCurrentScenario(); updateHash(); }));
}

function showErrorState() {
    DOM.card.innerHTML = `<div style="text-align:center; padding: 40px;"><h3>Сбой матрицы</h3><p>Не удалось загрузить данные.</p></div>`;
}

document.addEventListener('DOMContentLoaded', initApp);
