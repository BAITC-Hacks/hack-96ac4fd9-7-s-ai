"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const store = window.FirebirdStore;
  let language = store ? store.getLanguage() : "kk";
  let catalogMeta = null;
  const originalTexts = {};
  document.querySelectorAll("[data-i18n]").forEach(node => { originalTexts[node.dataset.i18n] = node.textContent; });
  const ru = {
    skip: "Перейти к содержанию", navHome: "Главная", navMatch: "Подбор", navPlanner: "Планировщик", navCatalog: "Каталог", navSaved: "Избранное", navCompare: "Сравнение", navHistory: "История",
    eyebrow: "КАЖДЫЙ БОЛЬШОЙ МОМЕНТ НАЧИНАЕТСЯ С ИДЕИ", heroLine1: "Подарите идее", heroLine2: "своё настроение.",
    heroText: "Тёплый семейный вечер или необычный корпоратив? Найдите идею, соберите план и сравните подходящих подрядчиков с понятными объяснениями.",
    startPlan: "Спланировать событие", findVendor: "Подобрать подрядчика", heroNote: "У каждого выбора есть причина. Каждое решение — за вами.",
    artLabel: "ВАШ СЛЕДУЮЩИЙ ОСОБЕННЫЙ ДЕНЬ", artIdea: "Одна хорошая идея", artIdeaSub: "тысяча памятных моментов", artCalendar: "Сравните даты", artCalendarSub: "выбор зависит от дня", artStep1: "ИДЕЯ", artStep2: "ПЛАН", artStep3: "ВЫБОР",
    statProfiles: "профилей в каталоге", statCategories: "категорий услуг", statDays: "дней в календаре", dataWindow: "Даты каталога: 23.09–31.12.2026. Выбор на основе исходных данных.",
    formatEyebrow: "НАЧНЁМ С НАСТРОЕНИЯ", formatTitle: "Какой момент вы планируете?", formatAside: "Ваша идея. Понятная точка старта.",
    ideasEyebrow: "ГОТОВЫЕ ИДЕИ, КОТОРЫЕ МОЖНО МЕНЯТЬ", ideasTitle: "Начнём с «А что, если?..»", ideasText: "Одна тема, несколько подходящих услуг. Откройте шаблон и настройте город, дату и бюджет под себя.",
    templateNote: "Дата и бюджет — редактируемые примеры. Сумма бюджета не является оценкой стоимости; цена подрядчика «от» показывается отдельно.",
    categoriesEyebrow: "НУЖНЫХ ЛЮДЕЙ ЛЕГЧЕ НАЙТИ", categoriesTitle: "Для каждой детали — свой специалист.", allCatalog: "Весь каталог", loading: "Загружаем категории каталога…",
    toolsEyebrow: "ДЕРЖИТЕ ПЛАН В ОДНОМ МЕСТЕ", toolsTitle: "Не забудем и о мелочах.", plannerKicker: "КОНСТРУКТОР СОБЫТИЯ", plannerTitle: "От отдельных услуг к целой команде.",
    plannerText: "Выберите несколько категорий, распределите общий бюджет и посмотрите подрядчиков для вашего плана.", openPlanner: "Собрать план",
    radarTitle: "Попробуйте другую дату", radarText: "Если один день не подошёл, сравните выбор в ближайшие даты.", openRadar: "Радар дат",
    compareTitle: "Поставьте троих рядом", compareText: "Цена, язык, формат и занятость в выбранную дату — в одной таблице.", openCompare: "Открыть сравнение",
    savedTitle: "Не потеряйте понравившихся", savedText: "Избранное хранится в этом браузере. Вернитесь позже и примите решение без спешки.", openSaved: "Моё избранное",
    howEyebrow: "ТРИ ПРОСТЫХ ШАГА", howTitle: "От списка к уверенному решению.", howText: "Почему именно этот подрядчик? Ответ есть в каждой карточке.", tryNow: "Попробовать сейчас",
    step1Title: "Расскажите о пожеланиях", step1Text: "Город, дата, формат и бюджет. При необходимости добавьте язык и особое пожелание.",
    step2Title: "Посмотрите на причины", step2Text: "До трёх вариантов. Особенности каждого и исходное описание, которое их подтверждает.",
    step3Title: "Сделайте свой выбор", step3Text: "Откройте профиль, проверьте календарь, сохраните или сравните.",
    finalTitle: "Следующий особенный момент — ваш.", finalText: "Для первого шага не обязательно иметь готовый план.", footerTagline: "От идеи к осознанному выбору.", footerIdeas: "Идеи",
    footerNote: "Анонимизированный каталог. Сервис рекомендаций и планирования. Итоговую цену и доступность нужно уточнять.",
  };
  const words = {
    kk: { open: "Үлгіден бастау", plan: "Команда құру", single: "Бір мердігерді іріктеу", budget: "Бюджет үлгісі", retry: "Қайта жүктеу", loadError: "Санаттарды жүктеу мүмкін болмады. Каталогты ашып көріңіз.", storeError: "Бұл браузер жоспар үлгісін сақтай алмады. Жоспарлаушыда шарттарды қолмен енгізіңіз.", profiles: "профиль" },
    ru: { open: "Начать с шаблона", plan: "Собрать команду", single: "Подобрать одну услугу", budget: "Пример бюджета", retry: "Загрузить снова", loadError: "Не удалось загрузить категории. Попробуйте открыть каталог.", storeError: "Браузер не сохранил шаблон. Введите условия вручную в планировщике.", profiles: "профилей" },
  };
  const choose = pair => pair[language === "kk" ? 0 : 1];
  const paths = {
    rings: '<circle cx="10" cy="13" r="6"/><circle cx="18" cy="13" r="6"/><path d="m8 5 2-3 2 3M16 5l2-3 2 3"/>',
    team: '<circle cx="14" cy="7" r="3"/><circle cx="5" cy="11" r="2.5"/><circle cx="23" cy="11" r="2.5"/><path d="M8 24v-6c0-7 12-7 12 0v6M1 23v-6c0-4 5-5 8-2m18 8v-6c0-4-5-5-8-2"/>',
    toi: '<path d="M3 15c0-6 5-10 11-10s11 4 11 10v9H3v-9ZM1 15h26M10 24v-7h8v7M14 2v3M7 7l14 8M21 7 7 15"/>',
    mic: '<rect x="10" y="2" width="8" height="15" rx="4"/><path d="M6 12v2a8 8 0 0 0 16 0v-2M14 22v4m-5 0h10"/>',
    cake: '<path d="M4 16h20v10H4zM4 20c3 4 6-4 10 0s7 1 10 0M8 16v-5h12v5M14 11V7"/><path d="M14 2c-4 4-1 6 0 5 2 0 3-2 0-5Z"/>',
    gift: '<path d="M4 12h20v14H4zM2 8h24v5H2zM14 8v18M14 8C4 8 5 0 9 2c3 1 5 6 5 6Zm0 0c10 0 9-8 5-6-3 1-5 6-5 6Z"/>',
    camera: '<path d="M3 8h5l2-4h8l2 4h5v17H3V8Z"/><circle cx="14" cy="16" r="5"/><path d="M21 11h1"/>',
    music: '<path d="M10 22V6l14-3v16M10 10l14-3"/><ellipse cx="6" cy="23" rx="4" ry="3"/><ellipse cx="20" cy="20" rx="4" ry="3"/>',
    flower: '<path d="M14 17v10m0-6 7-5m-7 8-6-5"/><circle cx="14" cy="10" r="3"/><path d="M11 8C5-1 18-2 17 6c10-1 10 11 2 9-3 9-13 5-9-2C1 12 5 4 11 8Z"/>',
    venue: '<path d="m2 11 12-8 12 8M4 11h20v15H4V11Zm7 15V16h6v10M8 13v4m12-4v4"/>',
    star: '<path d="m14 2 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z"/>',
    video: '<rect x="2" y="7" width="16" height="17" rx="2"/><path d="m18 12 8-4v15l-8-4M6 2l4 5m4-5 4 5"/>',
  };
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 28 28"); svg.setAttribute("aria-hidden", "true"); svg.classList.add("line-icon");
    svg.innerHTML = paths[name] || paths.star;
    return svg;
  }
  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  const categories = {
    "Ведущий": ["Жүргізуші", "mic"], "Фотограф": ["Фотограф", "camera"], "Банкетный зал": ["Банкет залы", "venue"],
    "Ресторан": ["Мейрамхана", "venue"], "Флорист": ["Флорист", "flower"], "Декоратор": ["Декоратор", "flower"],
    "Видеограф": ["Видеограф", "video"], "Ведущий церемонии": ["Рәсім жүргізушісі", "rings"], "Лайв-бэнд": ["Жанды музыка тобы", "music"],
    "Инструменталист": ["Аспапшы", "music"], "Национальный ансамбль": ["Ұлттық ансамбль", "toi"], "Танцевальный коллектив": ["Би ұжымы", "team"],
    "Шоу-программа": ["Шоу-бағдарлама", "star"], "Фото и видеобудки": ["Фото және бейнебудка", "camera"], "Подарки и сувениры": ["Сыйлықтар мен кәдесыйлар", "gift"],
    "Отель": ["Қонақүй", "venue"], "Загородная площадка": ["Қала сыртындағы алаң", "venue"],
  };
  const categoryLabel = value => language === "kk" ? (categories[value]?.[0] || value) : value;
  const formats = [
    { value: "свадьба", title: ["Үйлену тойы", "Свадьба"], subtitle: ["Өз тарихыңыз", "Ваша история"], icon: "rings" },
    { value: "корпоратив", title: ["Корпоратив", "Корпоратив"], subtitle: ["Командамен бірге", "Вместе с командой"], icon: "team" },
    { value: "той", title: ["Ұлттық той", "Той"], subtitle: ["Дәстүр мен қуаныш", "Традиции и радость"], icon: "toi" },
    { value: "конференция", title: ["Конференция", "Конференция"], subtitle: ["Үлкен идеялар", "Большие идеи"], icon: "mic" },
    { value: "юбилей", title: ["Мерейтой", "Юбилей"], subtitle: ["Жақындар ортасы", "В кругу близких"], icon: "cake" },
    { value: "день рождения", title: ["Туған күн", "День рождения"], subtitle: ["Тек сіздің күніңіз", "Только ваш день"], icon: "gift" },
  ];
  const ideas = [
    { id: "team", format: "корпоратив", icon: "team", title: ["Бір толқындағы команда", "Команда на одной волне"], description: ["Жанды диалог, шағын командалық ойындар және кеш соңындағы музыка. Ресми кешке аздап еркіндік беріңіз.", "Живой диалог, небольшие командные игры и музыка к финалу. Добавьте официальному вечеру немного свободы."], categories: ["Ведущий", "Фотограф", "Лайв-бэнд"], total: 3000000, single: "Ведущий", budget: 1000000, preferences: "импровизация интерактив", bg: "#e7d9c6", ink: "#a87a50" },
    { id: "acoustic", format: "свадьба", icon: "music", title: ["Акустикалық сезім", "Свадьба в акустике"], description: ["Жанды аспап, табиғи кадрлар және шағын гүл композициялары. Әуен мен естелікке көбірек орын қалдырыңыз.", "Живой инструмент, естественные кадры и небольшие цветочные композиции. Больше места музыке и воспоминаниям."], categories: ["Инструменталист", "Фотограф", "Флорист"], total: 1800000, single: "Инструменталист", budget: 600000, preferences: "скрипка джаз", bg: "#dce3d0", ink: "#7b8c61" },
    { id: "tradition", format: "той", icon: "toi", title: ["Дәстүрдің жаңа ырғағы", "Новое звучание традиций"], description: ["Домбыра үні, ұрпақтарды біріктіретін жүргізуші және ұлттық нақыш. Тойдың өз болмысын сақтаңыз.", "Звук домбры, ведущий для разных поколений и национальные мотивы. Сохраните характер вашего тоя."], categories: ["Национальный ансамбль", "Ведущий", "Фотограф"], total: 3000000, single: "Национальный ансамбль", budget: 1000000, preferences: "домбыра дәстүр ұлттық", bg: "#e7d4c4", ink: "#b17a58" },
    { id: "conference", format: "конференция", icon: "mic", title: ["Сахнадағы ашық диалог", "Форум с живым разговором"], description: ["Ойы анық жүргізуші, іскерлік кадрлар және оқиғаны сақтайтын бейне. Мазмұнға назар аударыңыз.", "Ведущий с ясной подачей, деловые кадры и видео события. Сосредоточьтесь на содержании."], categories: ["Ведущий", "Фотограф", "Видеограф"], total: 3000000, single: "Ведущий", budget: 1000000, preferences: "деловые встречи конференция", bg: "#dce1d4", ink: "#7b8870" },
    { id: "family", format: "юбилей", icon: "camera", title: ["Бір үстелдегі естеліктер", "Истории за одним столом"], description: ["Отбасылық әңгімелер, таныс әуен және шынайы эмоциялар. Әр буынға жақын жылы мерейтой.", "Семейные истории, знакомые мелодии и искренние эмоции. Тёплый юбилей для каждого поколения."], categories: ["Фотограф", "Ведущий", "Флорист"], total: 2000000, single: "Фотограф", budget: 500000, preferences: "семейные естественные эмоции", bg: "#eadfcc", ink: "#a99668" },
    { id: "light", format: "день рождения", icon: "star", title: ["Жарық пен қозғалыс", "Свет, движение, праздник"], description: ["Жарық шоуын фотосәттермен үйлестіріңіз. Шағын туған күнге де есте қалатын бір акцент жеткілікті.", "Соедините световое шоу с фотомоментами. Даже небольшому дню рождения хватит одного яркого акцента."], categories: ["Шоу-программа", "Фото и видеобудки", "Фотограф"], total: 1800000, single: "Шоу-программа", budget: 600000, preferences: "световое шоу пиксели", bg: "#dce1de", ink: "#7b9390" },
  ];
  const baseQuery = () => ({ city: "Алматы", date: "2026-10-09", event_format: "корпоратив", category: "Ведущий", budget_kzt: 1000000, language: "", duration_hours: null, preferences: "", ui_language: language });
  function notice(message) {
    const area = $("#home-notice"); area.textContent = message; area.hidden = false;
    setTimeout(() => { area.hidden = true; }, 7000);
  }
  function openMatch(query) {
    const fullQuery = { ...baseQuery(), ...query, ui_language: language };
    try { sessionStorage.setItem("firebird.prefill", JSON.stringify(fullQuery)); window.location.assign("/match"); }
    catch { window.location.assign("/match?prefill=" + encodeURIComponent(JSON.stringify(fullQuery))); }
  }
  function openPlan(idea) {
    const query = { city: "Алматы", date: "2026-10-09", event_format: idea.format, budget_kzt: idea.total, categories: [...idea.categories], language: "", duration_hours: null, preferences: idea.preferences };
    try { sessionStorage.setItem("firebird.plannerPrefill", JSON.stringify(query)); window.location.assign("/planner"); }
    catch { notice(words[language].storeError); }
  }
  function renderFormats() {
    const grid = $("#format-grid"); grid.replaceChildren();
    formats.forEach(format => {
      const button = node("button", "format-tile"); button.type = "button"; button.dataset.format = format.value;
      button.setAttribute("aria-label", choose(format.title) + " — " + words[language].open);
      const artwork = node("span", "format-icon"); artwork.append(icon(format.icon));
      button.append(artwork, node("strong", "", choose(format.title)), node("small", "", choose(format.subtitle)));
      button.addEventListener("click", () => openMatch({ event_format: format.value })); grid.append(button);
    });
  }
  function ideaArt(idea, index) {
    const art = node("div", "idea-art"); art.setAttribute("aria-hidden", "true");
    art.style.setProperty("--idea-bg", idea.bg); art.style.setProperty("--idea-ink", idea.ink);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 170 120");
    svg.innerHTML = '<path d="M34 111V61a51 51 0 0 1 102 0v50" fill="currentColor" opacity=".15"/><circle cx="85" cy="54" r="36" fill="#fffaf0" opacity=".7"/><path d="M17 105h136" stroke="currentColor" opacity=".35"/><path d="m25 28 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="currentColor" opacity=".4"/><circle cx="145" cy="65" r="3" fill="currentColor" opacity=".4"/><g transform="translate(57 26) scale(2)" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none">' + paths[idea.icon] + '</g><ellipse cx="85" cy="106" rx="49" ry="5" fill="currentColor" opacity=".13"/>';
    art.append(svg, node("span", "idea-tag", choose(formats.find(format => format.value === idea.format).title)), node("span", "idea-number", "0" + (index + 1)));
    return art;
  }
  function renderIdeas() {
    const grid = $("#idea-grid"); grid.replaceChildren();
    ideas.forEach((idea, index) => {
      const article = node("article", "idea-card"); article.dataset.idea = idea.id;
      const body = node("div", "idea-body");
      body.append(node("h3", "", choose(idea.title)), node("p", "idea-description", choose(idea.description)));
      const services = node("ul", "idea-services"); idea.categories.forEach(category => services.append(node("li", "", categoryLabel(category))));
      const budget = node("div", "idea-budget"); budget.append(node("span", "", words[language].budget), node("strong", "", new Intl.NumberFormat(language === "kk" ? "kk-KZ" : "ru-RU").format(idea.total) + " ₸"));
      const actions = node("div", "idea-actions");
      const plan = node("button", "button"); plan.type = "button"; plan.dataset.planIdea = idea.id;
      plan.append(node("span", "", words[language].plan), node("span", "", "↗")); plan.addEventListener("click", () => openPlan(idea));
      const single = node("button", "single-action", words[language].single); single.type = "button"; single.dataset.matchIdea = idea.id;
      single.addEventListener("click", () => openMatch({ event_format: idea.format, category: idea.single, budget_kzt: idea.budget, preferences: idea.preferences }));
      actions.append(plan, single); body.append(services, budget, actions); article.append(ideaArt(idea, index), body); grid.append(article);
    });
  }
  function renderCategories() {
    if (!catalogMeta) return;
    const grid = $("#category-grid"); grid.replaceChildren();
    const ordered = [...catalogMeta.categories].sort((a, b) => (catalogMeta.category_counts[b] || 0) - (catalogMeta.category_counts[a] || 0) || a.localeCompare(b));
    ordered.forEach(category => {
      const link = node("a", "category-link"); link.href = "/catalog?category=" + encodeURIComponent(category);
      const art = node("span", "category-icon"); art.append(icon(categories[category]?.[1] || "star"));
      link.append(art, node("span", "category-name", categoryLabel(category)));
      const count = catalogMeta.category_counts[category];
      if (Number.isInteger(count) && count >= 0) {
        const badge = node("span", "category-count", String(count)); badge.setAttribute("aria-label", count + " " + words[language].profiles); link.append(badge);
      }
      grid.append(link);
    });
  }
  async function loadMeta() {
    try {
      const response = await fetch("/api/meta"); if (!response.ok) throw new Error("Metadata unavailable");
      const meta = await response.json(); if (!Array.isArray(meta.categories)) throw new Error("Invalid metadata");
      if (!meta.category_counts || typeof meta.category_counts !== "object") {
        const results = await Promise.all(meta.categories.map(async category => {
          const result = await fetch("/api/catalog?category=" + encodeURIComponent(category) + "&page_size=1");
          if (!result.ok) return [category, null];
          const data = await result.json(); return [category, Number.isInteger(data.total) ? data.total : null];
        }));
        meta.category_counts = Object.fromEntries(results);
      }
      catalogMeta = meta;
      if (Number.isInteger(meta.stats?.profiles)) $("#stat-profiles").textContent = String(meta.stats.profiles);
      $("#stat-categories").textContent = String(meta.categories.length);
      if (meta.calendar?.min && meta.calendar?.max) {
        const count = Math.round((Date.parse(meta.calendar.max + "T00:00:00Z") - Date.parse(meta.calendar.min + "T00:00:00Z")) / 86400000) + 1;
        if (Number.isFinite(count) && count > 0) $("#stat-days").textContent = String(count);
      }
      renderCategories();
    } catch {
      const grid = $("#category-grid"); const message = node("p", "loading-message", words[language].loadError);
      const retry = node("button", "button secondary", words[language].retry); retry.type = "button"; retry.addEventListener("click", loadMeta);
      grid.replaceChildren(message, retry);
    }
  }
  function updateBadges() {
    [["#saved-count", store?.getFavorites().length || 0], ["#compare-count", store?.getCompare().length || 0]].forEach(([selector, count]) => {
      const badge = $(selector); badge.textContent = String(count); badge.hidden = count === 0;
    });
  }
  function renderLanguage() {
    document.documentElement.lang = language;
    document.title = language === "kk" ? "Firebird — Идеядан есте қалар сәтке" : "Firebird — От идеи к особенному событию";
    document.querySelectorAll("[data-i18n]").forEach(element => { element.textContent = language === "ru" ? (ru[element.dataset.i18n] || originalTexts[element.dataset.i18n]) : originalTexts[element.dataset.i18n]; });
    document.querySelectorAll("[data-lang]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
    renderFormats(); renderIdeas(); renderCategories(); updateBadges();
  }
  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => { language = button.dataset.lang; if (store) store.setLanguage(language); renderLanguage(); }));
  window.addEventListener("firebird:storechange", event => { if (event.detail?.key === "language" && store) { language = store.getLanguage(); renderLanguage(); } else updateBadges(); });
  renderLanguage(); loadMeta();
})();
