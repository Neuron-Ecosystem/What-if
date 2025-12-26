// CONFIGURATION
const CONFIG = {
    scenariosFile: 'scenarios.json',
    defaultTheme: 'dark',
    appStateKey: 'whatIf_v2_state',
    dayMs: 86400000 // 24 hours in ms
};

// GLOBAL STATE
const AppState = {
    scenarios: [],
    filteredScenarios: [], // For categories
    currentIndex: 0,
    currentCategory: 'all',
    theme: CONFIG.defaultTheme,
    dailyScenarioId: null
};

// DOM ELEMENTS
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
    toast: document.getElementById('toast')
};

// --- INITIALIZATION ---

async function initApp() {
    loadTheme();
    setupEventListeners();
    
    try {
        await loadScenarios();
        calculateDailyScenario();
        handleRouting(); // Check URL hash
    } catch (error) {
        console.error("Critical Init Error:", error);
        showErrorState();
    }
}

// --- DATA LOGIC ---

async function loadScenarios() {
    try {
        const response = await fetch(CONFIG.scenariosFile);
        if (!response.ok) throw new Error('Failed to load scenarios');
        
        AppState.scenarios = await response.json();
        
        // Initial filter (all)
        filterScenarios('all');
        
    } catch (error) {
        // Fallback or Alert
        DOM.card.innerHTML = `<div class="loading-state"><p>Ошибка связи с реальностью.</p></div>`;
        throw error;
    }
}

function filterScenarios(category) {
    AppState.currentCategory = category;
    
    if (category === 'all') {
        AppState.filteredScenarios = [...AppState.scenarios];
    } else {
        AppState.filteredScenarios = AppState.scenarios.filter(s => s.category === category);
    }
    
    // Reset index when changing category, unless navigating via ID
    AppState.currentIndex = 0;
    
    updateCategoryUI();
}

function calculateDailyScenario() {
    // Deterministic algorithm: uses Date to pick a scenario index
    const dateCode = Math.floor(Date.now() / CONFIG.dayMs);
    const index = dateCode % AppState.scenarios.length;
    AppState.dailyScenarioId = AppState.scenarios[index].id;
}

// --- ROUTING & NAVIGATION ---

function handleRouting() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#id=')) {
        // Load specific scenario
        const id = parseInt(hash.replace('#id=', ''));
        const foundIndex = AppState.filteredScenarios.findIndex(s => s.id === id);
        
        if (foundIndex !== -1) {
            AppState.currentIndex = foundIndex;
        } else {
            // Check in global if not in filter
            const globalIndex = AppState.scenarios.findIndex(s => s.id === id);
            if (globalIndex !== -1) {
                // Reset filter to all to show this one
                filterScenarios('all');
                AppState.currentIndex = globalIndex;
            }
        }
    } else if (hash === '#daily') {
        loadDailyScenario();
        return;
    }
    
    renderCurrentScenario();
}

function updateHash() {
    const currentScenario = AppState.filteredScenarios[AppState.currentIndex];
    if (currentScenario) {
        history.replaceState(null, null, `#id=${currentScenario.id}`);
    }
}

function nextScenario() {
    AppState.currentIndex++;
    if (AppState.currentIndex >= AppState.filteredScenarios.length) {
        AppState.currentIndex = 0; // Loop
    }
    renderCurrentScenario();
    updateHash();
    scrollToTop();
}

function prevScenario() {
    AppState.currentIndex--;
    if (AppState.currentIndex < 0) {
        AppState.currentIndex = AppState.filteredScenarios.length - 1; // Loop back
    }
    renderCurrentScenario();
    updateHash();
    scrollToTop();
}

function loadDailyScenario() {
    const dailyIndex = AppState.scenarios.findIndex(s => s.id === AppState.dailyScenarioId);
    if (dailyIndex !== -1) {
        filterScenarios('all');
        AppState.currentIndex = dailyIndex;
        renderCurrentScenario();
        updateHash();
        showToast('🌟 Сценарий дня загружен');
    }
}

// --- RENDERING ---

function renderCurrentScenario() {
    const scenario = AppState.filteredScenarios[AppState.currentIndex];
    if (!scenario) return;

    // Calculate reading time (Roughly 200 words/min)
    const textContent = JSON.stringify(scenario);
    const words = textContent.split(' ').length;
    const timeSec = Math.ceil(words / 3.5); // Fast reading adjustment
    
    // Update Meta
    DOM.metaCategory.textContent = getCategoryName(scenario.category);
    DOM.metaTime.innerHTML = `<i class="far fa-clock"></i> ~${timeSec} сек`;

    // Is Daily?
    const isDaily = scenario.id === AppState.dailyScenarioId;
    const dailyBadge = isDaily ? `<div style="color: var(--accent-primary); font-size: 0.9rem; margin-bottom: 8px; font-weight: 600;"><i class="fas fa-star"></i> Выбор вселенной на сегодня</div>` : '';

    // Generate HTML
    const html = `
        <div class="scenario-content fade-in">
            ${dailyBadge}
            <h2 class="scenario-title">${scenario.title}</h2>
            <div class="scenario-intro">${scenario.intro}</div>

            <div class="comparison-grid">
                <div class="comparison-column col-changed">
                    <h3><i class="fas fa-plus"></i> Появилось</h3>
                    <ul class="feature-list">
                        ${scenario.changed.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="comparison-column col-disappeared">
                    <h3><i class="fas fa-minus"></i> Исчезло</h3>
                    <ul class="feature-list">
                        ${scenario.disappeared.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="deep-dive">
                <button class="deep-dive-toggle" onclick="toggleDeepDive(this)">
                    <i class="fas fa-layer-group"></i>
                    <span>Копнуть глубже: Последствия</span>
                    <i class="fas fa-chevron-down" style="margin-left: auto; font-size: 0.8em;"></i>
                </button>
                <div class="deep-dive-content">
                    <div class="consequence-block">
                        <h4>🌍 Интернет и Сеть</h4>
                        <p>${scenario.consequences.internet}</p>
                    </div>
                    <div class="consequence-block">
                        <h4>👥 Общество</h4>
                        <p>${scenario.consequences.people}</p>
                    </div>
                    <div class="consequence-block">
                        <h4>🔧 Технологии</h4>
                        <p>${scenario.consequences.technology}</p>
                    </div>
                    <div class="consequence-block" style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
                        <h4>🏁 Вывод</h4>
                        <p style="font-style: italic; color: var(--text-primary);">${scenario.conclusion}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    DOM.card.innerHTML = html;
}

// Global function for onclick handler in HTML
window.toggleDeepDive = function(btn) {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('.fa-chevron-down');
    
    if (content.classList.contains('visible')) {
        content.classList.remove('visible');
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('visible');
        icon.style.transform = 'rotate(180deg)';
    }
}

// --- UTILS & UI ---

function getCategoryName(catKey) {
    const map = {
        'tech': 'Технологии',
        'society': 'Общество',
        'nature': 'Природа',
        'human': 'Человек'
    };
    return map[catKey] || 'Разное';
}

function updateCategoryUI() {
    DOM.categoryPills.forEach(pill => {
        if (pill.dataset.category === AppState.currentCategory) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        AppState.theme = saved;
        document.body.className = saved === 'light' ? 'light-theme' : '';
        updateThemeIcon();
    }
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

function shareScenario() {
    const current = AppState.filteredScenarios[AppState.currentIndex];
    const url = `${window.location.origin}${window.location.pathname}#id=${current.id}`;
    const text = `Что было бы, если... "${current.title}" 🌌\n\n${url}`;

    if (navigator.share) {
        navigator.share({
            title: 'What If',
            text: text,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Ссылка скопирована!');
        });
    }
}

function showToast(msg) {
    DOM.toast.textContent = msg;
    DOM.toast.classList.add('show');
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 2500);
}

function showErrorState() {
    DOM.card.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <h3>Сбой матрицы</h3>
            <p>Не удалось загрузить варианты реальности.</p>
        </div>
    `;
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    DOM.nextBtn.addEventListener('click', nextScenario);
    DOM.prevBtn.addEventListener('click', prevScenario);
    DOM.shareBtn.addEventListener('click', shareScenario);
    DOM.dailyBtn.addEventListener('click', loadDailyScenario);
    DOM.themeToggle.addEventListener('click', toggleTheme);

    DOM.categoryPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            const cat = e.target.dataset.category;
            filterScenarios(cat);
            renderCurrentScenario();
            updateHash();
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
            e.preventDefault(); // Stop scroll
            nextScenario();
        }
        if (e.key === 'ArrowLeft') prevScenario();
    });
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
