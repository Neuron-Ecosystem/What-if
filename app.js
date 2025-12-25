// Конфигурация приложения
const CONFIG = {
    scenariosFile: 'scenarios.json',
    defaultTheme: 'dark',
    animationDelay: 50,
    appStateKey: 'whatIf_appState'
};

// Состояние приложения
const AppState = {
    scenarios: [],
    currentScenarioIndex: 0, // Текущий индекс в массиве сценариев
    theme: CONFIG.defaultTheme
};

// DOM элементы
const DOM = {
    scenarioCard: document.getElementById('scenarioCard'),
    prevScenarioBtn: document.getElementById('prevScenarioBtn'),
    nextScenarioBtn: document.getElementById('nextScenarioBtn'),
    themeToggle: document.getElementById('themeToggle'),
    currentScenarioEl: document.getElementById('currentScenario'),
    totalScenariosEl: document.getElementById('totalScenarios')
};

// Инициализация приложения
async function initApp() {
    // Загружаем сценарии
    await loadScenarios();
    
    // Загружаем состояние
    loadAppState();
    
    // Инициализируем тему
    initTheme();
    
    // Показываем текущий сценарий
    showCurrentScenario();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    console.log('What If MVP инициализирован');
}

// Загрузка сценариев из JSON
async function loadScenarios() {
    try {
        const response = await fetch(CONFIG.scenariosFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        AppState.scenarios = await response.json();
        DOM.totalScenariosEl.textContent = AppState.scenarios.length;
        console.log(`Загружено ${AppState.scenarios.length} сценариев`);
    } catch (error) {
        console.error('Ошибка загрузки сценариев:', error);
        // Если не удалось загрузить, используем fallback сценарии
        AppState.scenarios = getFallbackScenarios();
        DOM.totalScenariosEl.textContent = AppState.scenarios.length;
    }
}

// Fallback сценарии на случай проблем с загрузкой
function getFallbackScenarios() {
    return [
        {
            "id": 1,
            "title": "Что было бы, если бы интернет был изобретен в 19 веке?",
            "intro": "Представьте мир, где технологии телеграфа эволюционировали в глобальную сеть обмена информацией за 100 лет до нашего времени.",
            "changed": [
                "Викторианские \"серверы\" на паровой тяге",
                "Механические поисковые системы с перфокартами",
                "Глобальная телеграфная сеть как предтеча интернета",
                "Криптография как обязательный школьный предмет"
            ],
            "disappeared": [
                "Централизованные монархии (сложнее контролировать информацию)",
                "Медленные дипломатические процессы",
                "Региональные диалекты (более быстрая унификация языка)",
                "Концепция \"местных новостей\""
            ],
            "consequences": {
                "internet": "\"Всемирная паутина\" из медных проводов и телеграфных столбов. Сайты — это физические локации с перфораторами и считывателями.",
                "people": "Общество стало более технически грамотным, но также более параноидальным из-за утечек шифрованных сообщений.",
                "technology": "Паровые компьютеры, аналитические машины Бэббиджа как стандарт, ранняя кибернетика."
            },
            "conclusion": "Технологический прогресс опередил социальный, создав мир продвинутых технологий при архаичных общественных структурах."
        },
        {
            "id": 2,
            "title": "Что было бы, если бы человечество никогда не изобрело колесо?",
            "intro": "Альтернативная история, где фундаментальное изобретение человечества так и не было создано, что изменило всю траекторию развития цивилизации.",
            "changed": [
                "Транспорт на воздушной подушке (изобретен раньше)",
                "Развитые системы каналов и водного транспорта",
                "Архитектура без круглых элементов",
                "Магнитные дороги для перемещения грузов"
            ],
            "disappeared": [
                "Колесный транспорт (автомобили, поезда, велосипеды)",
                "Конвейерное производство",
                "Часы со стрелками",
                "Спортивные игры с мячом"
            ],
            "consequences": {
                "internet": "Развивался бы медленнее из-за сложностей с логистикой и созданием инфраструктуры.",
                "people": "Города были бы компактнее, сосредоточены вокруг водных артерий. Путешествия стали бы редким и значимым событием.",
                "technology": "Акцент на левитации, магнетизме и гидравлике. Механика вращательного движения осталась бы неизведанной областью."
            },
            "conclusion": "Цивилизации пришлось найти обходные пути для фундаментальных проблем, что привело к совершенно иному технологическому укладу."
        },
        {
            "id": 3,
            "title": "Что было бы, если бы книги остались привилегией элиты?",
            "intro": "Мир, где печатный станок Гутенберга был уничтожен сразу после изобретения, а грамотность стала секретом, охраняемым правящим классом.",
            "changed": [
                "Устная традиция как основной способ передачи знаний",
                "Развитая мнемоническая культура",
                "Профессия \"говорящих книг\" (людей, запоминающих тексты)",
                "Табу на письменность для низших классов"
            ],
            "disappeared": [
                "Массовое образование",
                "Научные журналы и академические публикации",
                "Библиотеки в современном понимании",
                "Новости в печатном формате"
            ],
            "consequences": {
                "internet": "Никогда не был бы изобретен, так как не возникло бы концепции демократизации информации.",
                "people": "Общество строго стратифицировано. Власть знания абсолютна. Критическое мышление — навык элиты.",
                "technology": "Технический прогресс замедлен в тысячу раз. Каждое изобретение — тщательно охраняемый секрет гильдий."
            },
            "conclusion": "Контроль над информацией оказался мощнее контроля над ресурсами, создав стабильное, но абсолютно статичное общество."
        }
    ];
}

// Загрузка состояния приложения
function loadAppState() {
    try {
        const saved = localStorage.getItem(CONFIG.appStateKey);
        if (saved) {
            const state = JSON.parse(saved);
            AppState.currentScenarioIndex = state.currentScenarioIndex || 0;
            AppState.theme = state.theme || CONFIG.defaultTheme;
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния:', error);
    }
}

// Сохранение состояния приложения
function saveAppState() {
    try {
        const state = {
            currentScenarioIndex: AppState.currentScenarioIndex,
            theme: AppState.theme
        };
        localStorage.setItem(CONFIG.appStateKey, JSON.stringify(state));
    } catch (error) {
        console.error('Ошибка сохранения состояния:', error);
    }
}

// Показ текущего сценария
function showCurrentScenario() {
    if (AppState.scenarios.length === 0) {
        showErrorMessage();
        return;
    }
    
    const scenario = AppState.scenarios[AppState.currentScenarioIndex];
    if (scenario) {
        showScenario(scenario);
        updateUI();
        saveAppState();
    }
}

// Показ следующего сценария
function showNextScenario() {
    // Анимация нажатия кнопки
    DOM.nextScenarioBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        DOM.nextScenarioBtn.style.transform = '';
    }, 150);
    
    // Увеличиваем индекс на 1
    AppState.currentScenarioIndex++;
    
    // Если достигли конца массива, переходим к началу
    if (AppState.currentScenarioIndex >= AppState.scenarios.length) {
        AppState.currentScenarioIndex = 0;
    }
    
    showCurrentScenario();
}

// Показ предыдущего сценария
function showPreviousScenario() {
    // Анимация нажатия кнопки
    DOM.prevScenarioBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        DOM.prevScenarioBtn.style.transform = '';
    }, 150);
    
    // Уменьшаем индекс на 1
    AppState.currentScenarioIndex--;
    
    // Если индекс стал меньше 0, переходим к последнему сценарию
    if (AppState.currentScenarioIndex < 0) {
        AppState.currentScenarioIndex = AppState.scenarios.length - 1;
    }
    
    showCurrentScenario();
}

// Отображение сценария
function showScenario(scenario) {
    // Создаем HTML для сценария
    const scenarioHTML = `
        <h2 class="scenario-title fade-in">${scenario.title}</h2>
        
        <div class="scenario-intro fade-in delay-1">${scenario.intro}</div>
        
        <div class="scenario-section fade-in delay-2">
            <h3 class="section-title"><i class="fas fa-plus-circle"></i> Что изменилось</h3>
            <ul class="changed-list">
                ${scenario.changed.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        
        <div class="scenario-section fade-in delay-3">
            <h3 class="section-title"><i class="fas fa-minus-circle"></i> Что исчезло</h3>
            <ul class="disappeared-list">
                ${scenario.disappeared.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        
        <div class="scenario-section fade-in delay-4">
            <h3 class="section-title"><i class="fas fa-project-diagram"></i> Последствия</h3>
            <div class="consequences-grid">
                <div class="consequence-item">
                    <h4 class="consequence-title">Интернет</h4>
                    <p>${scenario.consequences.internet}</p>
                </div>
                <div class="consequence-item">
                    <h4 class="consequence-title">Люди</h4>
                    <p>${scenario.consequences.people}</p>
                </div>
                <div class="consequence-item">
                    <h4 class="consequence-title">Технологии</h4>
                    <p>${scenario.consequences.technology}</p>
                </div>
            </div>
        </div>
        
        <div class="scenario-conclusion fade-in delay-5">${scenario.conclusion}</div>
    `;
    
    // Устанавливаем HTML с анимацией
    DOM.scenarioCard.style.opacity = '0';
    
    setTimeout(() => {
        DOM.scenarioCard.innerHTML = scenarioHTML;
        DOM.scenarioCard.style.opacity = '1';
    }, 300);
}

// Обновление UI
function updateUI() {
    // Обновляем счетчик (индекс + 1, так как индексация с 0)
    DOM.currentScenarioEl.textContent = AppState.currentScenarioIndex + 1;
    DOM.totalScenariosEl.textContent = AppState.scenarios.length;
}

// Показ сообщения об ошибке
function showErrorMessage() {
    DOM.scenarioCard.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
            <h3>Не удалось загрузить сценарии</h3>
            <p>Пожалуйста, проверьте подключение к интернету и обновите страницу.</p>
            <button class="btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Обновить страницу
            </button>
        </div>
    `;
}

// Инициализация темы
function initTheme() {
    // Устанавливаем тему
    setTheme(AppState.theme);
    
    // Обновляем иконку кнопки
    updateThemeIcon();
}

// Установка темы
function setTheme(theme) {
    AppState.theme = theme;
    document.body.classList.toggle('light-theme', theme === 'light');
    saveAppState();
}

// Переключение темы
function toggleTheme() {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateThemeIcon();
}

// Обновление иконки темы
function updateThemeIcon() {
    const icon = DOM.themeToggle.querySelector('i');
    if (AppState.theme === 'dark') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка "Следующий сценарий"
    DOM.nextScenarioBtn.addEventListener('click', showNextScenario);
    
    // Кнопка "Предыдущий сценарий"
    DOM.prevScenarioBtn.addEventListener('click', showPreviousScenario);
    
    // Кнопка переключения темы
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Обработка клавиатуры
    document.addEventListener('keydown', (e) => {
        // Стрелка вправо или пробел для следующего сценария
        if (e.code === 'ArrowRight' || e.code === 'Space') {
            e.preventDefault();
            showNextScenario();
        }
        
        // Стрелка влево для предыдущего сценария
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            showPreviousScenario();
        }
        
        // T для переключения темы
        if (e.code === 'KeyT' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    // Предотвращаем прокрутку страницы при нажатии пробела
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);
