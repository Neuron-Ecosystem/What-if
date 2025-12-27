// --- PWA LOGIC ---
let deferredPrompt;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
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
    if (outcome === 'accepted') document.getElementById('installAppBtn').style.display = 'none';
    deferredPrompt = null;
}

const CONFIG = { scenariosFile: 'scenarios.json', defaultTheme: 'dark', dayMs: 86400000 };
const AppState = { scenarios: [], filteredScenarios: [], currentIndex: 0, currentCategory: 'all', theme: CONFIG.defaultTheme, dailyScenarioId: null };

const DOM = {
    card: document.getElementById('scenarioCard'),
    prevBtn: document.getElementById('prevScenarioBtn'),
    nextBtn: document.getElementById('nextScenarioBtn'),
    shareBtn: document.getElementById('shareBtn'),
    dailyBtn: document.getElementById('dailyScenarioBtn'),
    themeToggle: document.getElementById('themeToggle'),
    categoryPills: document.querySelectorAll('.category-pill'),
    metaCategory: document.getElementById('scenarioCategory'),
    toast: document.getElementById('toast')
};

async function initApp() {
    loadTheme();
    setupEventListeners();
    try {
        await loadScenarios();
        calculateDailyScenario();
        handleRouting();
    } catch (error) {
        console.error("Init Error:", error);
    }
}

async function loadScenarios() {
    const response = await fetch(CONFIG.scenariosFile);
    AppState.scenarios = await response.json();
    filterScenarios('all');
}

function filterScenarios(category) {
    AppState.currentCategory = category;
    AppState.filteredScenarios = category === 'all' ? [...AppState.scenarios] : AppState.scenarios.filter(s => s.category === category);
    AppState.currentIndex = 0;
    updateCategoryUI();
}

function calculateDailyScenario() {
    const dateCode = Math.floor(Date.now() / CONFIG.dayMs);
    AppState.dailyScenarioId = AppState.scenarios[dateCode % AppState.scenarios.length].id;
}

function handleRouting() {
    const hash = window.location.hash;
    if (hash.startsWith('#id=')) {
        const id = parseInt(hash.replace('#id=', ''));
        const idx = AppState.scenarios.findIndex(s => s.id === id);
        if (idx !== -1) { filterScenarios('all'); AppState.currentIndex = idx; }
    }
    renderCurrentScenario();
}

function renderCurrentScenario() {
    const s = AppState.filteredScenarios[AppState.currentIndex];
    if (!s) return;

    if (DOM.metaCategory) DOM.metaCategory.textContent = getCategoryName(s.category);
    const isDaily = s.id === AppState.dailyScenarioId;
    const dailyBadge = isDaily ? `<div style="color: var(--accent-primary); font-size: 0.9rem; margin-bottom: 12px; font-weight: 700;"><i class="fas fa-star"></i> ВЫБОР ВСЕЛЕННОЙ НА СЕГОДНЯ</div>` : '';

    DOM.card.innerHTML = `
        <div class="scenario-content fade-in">
            ${dailyBadge}
            <h2 class="scenario-title">${s.title}</h2>
            <div class="scenario-intro">${s.intro}</div>

            <div class="comparison-grid">
                <div class="comparison-column col-changed">
                    <h3><i class="fas fa-plus-circle"></i> ЧТО ПОЯВИЛОСЬ</h3>
                    <ul class="feature-list">${s.changed.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
                <div class="comparison-column col-disappeared">
                    <h3><i class="fas fa-minus-circle"></i> ЧТО ИСЧЕЗЛО</h3>
                    <ul class="feature-list">${s.disappeared.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
            </div>

            <div class="deep-dive">
                <button class="deep-dive-toggle" onclick="toggleDeepDive(this)">
                    <i class="fas fa-layer-group"></i>
                    <span>Копнуть глубже: Последствия</span>
                    <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
                </button>
                <div class="deep-dive-content">
                    <div class="consequence-block"><h4>🌍 Цифровая среда</h4><p>${s.consequences.internet}</p></div>
                    <div class="consequence-block"><h4>👥 Социум</h4><p>${s.consequences.people}</p></div>
                    <div class="consequence-block"><h4>🔧 Прогресс</h4><p>${s.consequences.technology}</p></div>
                    <div class="consequence-block" style="border-top: 1px dashed var(--border-color); padding-top: 15px; margin-top: 20px;">
                        <h4>🏁 Резюме</h4><p><i>${s.conclusion}</i></p>
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

function updateHash() {
    const s = AppState.filteredScenarios[AppState.currentIndex];
    if (s) history.replaceState(null, null, `#id=${s.id}`);
}

document.addEventListener('DOMContentLoaded', initApp);
