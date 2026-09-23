"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const text = {
    kk: {
      navHome: "Басты бет", navPlanner: "Менің іс-шарам", navMatching: "Іріктеу", navCatalog: "Каталог", navSaved: "Таңдаулылар", navCompare: "Салыстыру", navHistory: "Іздеу тарихы",
      viewProfile: "Профильді ашу ↗", saveProfile: "♡ Таңдаулыға", savedProfile: "♥ Сақталды", compareProfile: "+ Салыстыру", comparedProfile: "✓ Салыстыруда",
      compareFull: "Бір мезетте ең көбі 3 мердігерді салыстыруға болады. Салыстыру бетінде біреуін алып тастаңыз.",
      comparePrompt: "Айырмашылықты бір кестеден көріңіз: баға, тіл, формат және бос күн.", compareOpen: "Салыстыруды ашу →",
      skip: "Сұранысқа өту", headerCaption: "Каталогтан дәл таңдау", profiles: "профиль",
      eyebrow: "СӘТТІ ІС-ШАРА ОСЫНДАН БАСТАЛАДЫ", title: "Іс-шараңызға дәл келетін адамдар.",
      subtitle: "Шарттарыңызды айтыңыз. Біз ең сәйкес үш нұсқаны ұсынып, әр таңдауды түсіндіреміз.",
      introNote: "ұзын тізімнен нақты таңдауға", requestTitle: "Сіздің іс-шараңыз", city: "Қала", date: "Күні",
      eventFormat: "Іс-шара форматы", category: "Кім керек?", budget: "Бюджет шегі", extraOptions: "Қосымша шарттар",
      optional: "міндетті емес", language: "Қызмет көрсету тілі", duration: "Ұзақтығы, сағат", preferences: "Ерекше тілектер",
      preferencesPlaceholder: "Мысалы, командалық ойындар, жайлы атмосфера…", preferencesHint: "Сипаттамадағы сәйкес ерекшеліктерді ескереміз.",
      find: "Мердігерлерді таңдау", formFootnote: "Ең көбі 3 нұсқа. Әрқайсысының нақты себебі бар.", formChanged: "Шарттар өзгерді. Нәтижені жаңартыңыз.",
      resultsTitle: "Сізге арналған таңдау", artCaption: "Сәйкестік — нақты деректе", welcomeTitle: "Ұзын тізімнің қажеті жоқ.",
      welcomeText: "Іс-шара шарттарын толтырыңыз — қала, күн мен бюджетке сәйкес мердігерлерді осы жерден көресіз.",
      trustDate: "Күнге сәйкестік", trustBudget: "Бюджетке сай", trustEvidence: "Дәлелді таңдау", demoTitle: "Дайын мысалдан бастаңыз", demoHint: "бір басу жеткілікті",
      footer: "Каталог деректеріне сүйенген таңдау", footerPrice: "«Бастап» бағасы. Соңғы құнды мердігермен нақтылаңыз.",
      anyLanguage: "Маңызды емес", loading: "Сәйкестігін тексеріп жатырмыз…", loadingDetail: "Күнді, бюджетті және сипаттамаларды салыстырып жатырмыз.",
      errorTitle: "Нәтижені жүктеу мүмкін болмады", networkError: "Серверге қосылу мүмкін болмады. Қолданбаның іске қосылғанын тексеріп, қайта көріңіз.",
      metadataError: "Каталогты жүктеу мүмкін болмады. Бетті жаңартып көріңіз.", retry: "Қайта көру", why: "Неліктен сәйкес келеді", from: "бастап",
      bestMatch: "№1 таңдау", evidence: "Каталогтағы дәлелдерді көру", synthetic: "Синтетикалық профиль", priceImputed: "Баға толықтырылған",
      cityImputed: "Қала толықтырылған", sourceId: "Каталогтағы ID", maxHours: "сағатқа дейін", audit: "Іріктеу қалай өтті?",
      auditDescription: "Әр профиль бірінші сәйкес келмеген шарт бойынша бір рет есептеледі.",
      candidates: "Қала мен санаттағы профильдер", eligible: "Барлық шартқа сәйкес", busy_date: "Таңдалған күнде бос емес", event_format: "Форматы сәйкес емес",
      budgetExcluded: "Бюджеттен жоғары", languageExcluded: "Тілі сәйкес емес", durationExcluded: "Ұзақтығы сәйкес емес",
      noCategory: "Бұл қалада мұндай санат әлі жоқ", noEligible: "Бұл шарттарға сәйкес нұсқа табылмады",
      noCategoryText: "Каталогта таңдалған қала мен санатқа сәйкес профиль жоқ. Басқа қала немесе санат таңдап көріңіз.",
      noEligibleText: "Каталогта бұл санат бар, бірақ күн, бюджет немесе қосымша шарттар бойынша ешкім сәйкес келмеді.",
      suggestionTitle: "Шағын өзгеріс жаңа мүмкіндік ашады", suggestionHint: "Төмендегі ұсынысты таңдасаңыз, көрсетілген шарт қана өзгереді.",
      dateChanged: "Күн өзгерді: ұсыныстар жаңартылды.", busyOnNewDate: "жаңа күнде бос емес", availableOnNewDate: "жаңа күнге қолжетімді",
      categoryCount: "санат", resultWord: "нұсқа", foundPrefix: "Сәйкес профильдер", shownPrefix: "Көрсетілгені", noResults: "Сәйкес нұсқа жоқ",
      loadingCatalog: "Каталог жүктеліп жатыр…", resetFilters: "Шарттарды өзгертіп, қайта таңдаңыз.", availableDate: "Каталогта бұл күн бос емес деп белгіленбеген."
    },
    ru: {
      navHome: "Главная", navPlanner: "Моё событие", navMatching: "Подбор", navCatalog: "Каталог", navSaved: "Избранное", navCompare: "Сравнение", navHistory: "История",
      viewProfile: "Открыть профиль ↗", saveProfile: "♡ В избранное", savedProfile: "♥ Сохранено", compareProfile: "+ Сравнить", comparedProfile: "✓ В сравнении",
      compareFull: "Можно сравнить не больше 3 подрядчиков. Удалите одного на странице сравнения.",
      comparePrompt: "Сравните цену, языки, форматы и доступность на дату в одной таблице.", compareOpen: "Открыть сравнение →",
      skip: "Перейти к запросу", headerCaption: "Точный выбор из каталога", profiles: "профилей",
      eyebrow: "ХОРОШЕЕ СОБЫТИЕ НАЧИНАЕТСЯ ЗДЕСЬ", title: "Те самые люди для вашего события.",
      subtitle: "Расскажите о событии. Мы предложим три подходящих варианта и объясним каждый выбор.",
      introNote: "от длинного списка к точному выбору", requestTitle: "Ваше событие", city: "Город", date: "Дата",
      eventFormat: "Формат события", category: "Кто вам нужен?", budget: "Максимальный бюджет", extraOptions: "Дополнительные условия",
      optional: "необязательно", language: "Язык услуги", duration: "Длительность, часов", preferences: "Особые пожелания",
      preferencesPlaceholder: "Например, командные игры, уютная атмосфера…", preferencesHint: "Учтём подходящие особенности из описания.",
      find: "Подобрать подрядчиков", formFootnote: "Не больше 3 вариантов. У каждого — своя причина.", formChanged: "Условия изменились. Обновите подборку.",
      resultsTitle: "Ваша короткая подборка", artCaption: "Совпадение — в деталях", welcomeTitle: "Длинный список не нужен.",
      welcomeText: "Укажите условия события — здесь появятся подрядчики, подходящие по городу, дате и бюджету.",
      trustDate: "Подходящая дата", trustBudget: "В рамках бюджета", trustEvidence: "Выбор с объяснением", demoTitle: "Начните с готового примера", demoHint: "всего одно нажатие",
      footer: "Подбор на основе данных каталога", footerPrice: "Цены «от». Итоговую стоимость уточните у подрядчика.",
      anyLanguage: "Неважно", loading: "Проверяем совпадения…", loadingDetail: "Сверяем дату, бюджет и особенности из описаний.",
      errorTitle: "Не удалось загрузить подборку", networkError: "Не удалось связаться с сервером. Проверьте, что приложение запущено, и попробуйте ещё раз.",
      metadataError: "Не удалось загрузить каталог. Попробуйте обновить страницу.", retry: "Попробовать снова", why: "Почему подходит", from: "от",
      bestMatch: "Выбор №1", evidence: "Посмотреть основания в каталоге", synthetic: "Синтетический профиль", priceImputed: "Цена дополнена",
      cityImputed: "Город дополнен", sourceId: "ID в каталоге", maxHours: "часов максимум", audit: "Как прошёл отбор?",
      auditDescription: "Каждый профиль учитывается один раз — по первому неподходящему условию.",
      candidates: "Профилей в городе и категории", eligible: "Соответствуют всем условиям", busy_date: "Заняты в выбранную дату", event_format: "Не подходит формат",
      budgetExcluded: "Выше бюджета", languageExcluded: "Не подходит язык", durationExcluded: "Не подходит длительность",
      noCategory: "В этом городе пока нет такой категории", noEligible: "По этим условиям вариантов не нашлось",
      noCategoryText: "В каталоге нет профилей для выбранного города и категории. Попробуйте другой город или категорию.",
      noEligibleText: "Категория есть в каталоге, но никто не подошёл по дате, бюджету или дополнительным условиям.",
      suggestionTitle: "Небольшое изменение — новая возможность", suggestionHint: "При выборе предложения изменится только указанное условие.",
      dateChanged: "Дата изменилась: подборка обновлена.", busyOnNewDate: "заняты в новую дату", availableOnNewDate: "доступны в новую дату",
      categoryCount: "категорий", resultWord: "варианта", foundPrefix: "Подходящих профилей", shownPrefix: "Показано", noResults: "Нет подходящих вариантов",
      loadingCatalog: "Загружаем каталог…", resetFilters: "Измените условия и запустите подбор снова.", availableDate: "В каталоге эта дата не отмечена как занятая."
    }
  };
  const kkEnums = {
    "Алматы": "Алматы", "Астана": "Астана", "Зарубежье": "Шетел",
    "Ведущий": "Жүргізуші", "Флорист": "Флорист", "Декоратор": "Декоратор", "Фотограф": "Фотограф", "Видеограф": "Видеограф",
    "Видеосъёмка": "Бейнетүсірілім", "Видеосъемка": "Бейнетүсірілім", "Кавер-группа": "Кавер-топ", "Кейтеринг": "Кейтеринг",
    "Диджей": "Диджей", "DJ": "DJ", "Певец": "Әнші", "Музыканты": "Музыканттар", "Музыкальная группа": "Музыкалық топ",
    "Шоу-программа": "Шоу-бағдарлама", "Шоу и артисты": "Шоу және әртістер", "Звук и свет": "Дыбыс пен жарық",
    "Звук и освещение": "Дыбыс пен жарық", "Площадка": "Алаң", "Площадки": "Алаңдар", "Организатор": "Ұйымдастырушы",
    "Танцевальный коллектив": "Би ұжымы", "Танцевальная группа": "Би тобы", "Аниматор": "Аниматор", "Анимация": "Анимация",
    "Фотобудка": "Фотобудка", "Техническое обеспечение": "Техникалық жабдықтау", "Прокат оборудования": "Жабдық жалдау",
    "Аренда оборудования": "Жабдық жалдау", "Бармен-шоу": "Бармен-шоу", "Бар-шоу": "Бар-шоу", "Свадебный салон": "Үйлену салоны",
    "Банкетный зал": "Банкет залы", "Ведущий церемонии": "Рәсім жүргізушісі", "Загородная площадка": "Қала сыртындағы алаң",
    "Инструменталист": "Аспапшы", "Лайв-бэнд": "Жанды музыка тобы", "Национальный ансамбль": "Ұлттық ансамбль",
    "Отель": "Қонақүй", "Подарки и сувениры": "Сыйлықтар мен кәдесыйлар", "Ресторан": "Мейрамхана", "Фото и видеобудки": "Фото және видеобудкалар",
    "корпоратив": "Корпоратив", "свадьба": "Үйлену тойы", "конференция": "Конференция", "юбилей": "Мерейтой", "день рождения": "Туған күн", "той": "Той",
    "русский": "Орыс тілі", "казахский": "Қазақ тілі", "английский": "Ағылшын тілі"
  };
  Object.assign(text.kk, {
    agentTitle: "Іс-шараңызды өз сөзіңізбен сипаттаңыз", agentDemo: "Дайын мысал ↗", agentSubmit: "AI арқылы таңдау",
    agentPlaceholder: "Алматыда 2026 жылғы 9 қазанда корпоративке 1 млн теңгеге дейін орысша сөйлейтін жүргізуші керек, 4 сағат. Жайлы атмосфера маңызды.",
    agentHint: "AI шарттарды анықтап, каталогты іздеу құралын шақырады. Қолданылған шарттар төмендегі формада көрсетіледі.",
    agentWorking: "AI сұранысты өңдеп жатыр…", agentSuccess: "AI каталог құралын қолданып, іріктеуді аяқтады.",
    agentFallback: "AI тапсырманы толық аяқтай алмады. Каталог ережелерімен іріктеу көрсетілді.",
    agentUsedForm: "Формадағы бастапқы шарттар қолданылды; еркін мәтін талданды деп есептелмейді.",
    agentUsedParsed: "AI анықтаған және іздеу құралы тексерген шарттар сақталды. Олар төмендегі формада көрсетілген.",
    agentTools: "Құрал шақырулары", agentProvider: "Провайдер", agentModel: "Модель", agentInterpret: "Сұранысты түсіну", agentSearch: "Каталогтан іздеу", agentExplain: "Дәлелді түсіндіру",
    agentOk: "Орындалды", agentFailed: "Орындалмады", agentSkipped: "Өткізілді", agentNoTrace: "Сервер орындау қадамдарын қайтармады.",
    agentRequestFailed: "AI сұранысының жауабы алынбады. Қолмен іріктеуді пайдаланыңыз немесе қайталап көріңіз.", agentCriteria: "Қолданылған шарттар", agentReason: "Себеп коды"
  });
  Object.assign(text.ru, {
    agentTitle: "Опишите событие своими словами", agentDemo: "Готовый пример ↗", agentSubmit: "Подобрать с AI",
    agentPlaceholder: "Нужен русскоязычный ведущий на корпоратив в Алматы 9 октября 2026 года, до 1 млн тенге, на 4 часа. Важна уютная атмосфера.",
    agentHint: "AI определяет условия и вызывает инструмент поиска по каталогу. Использованные условия появятся в форме ниже.",
    agentWorking: "AI обрабатывает запрос…", agentSuccess: "AI выполнил подбор с помощью инструмента каталога.",
    agentFallback: "AI не смог полностью завершить задачу. Показан подбор по правилам каталога.",
    agentUsedForm: "Использованы исходные условия формы; свободный текст не считается разобранным.",
    agentUsedParsed: "Сохранены условия, определённые AI и проверенные инструментом поиска. Они показаны в форме ниже.",
    agentTools: "Вызовов инструментов", agentProvider: "Провайдер", agentModel: "Модель", agentInterpret: "Понимание запроса", agentSearch: "Поиск в каталоге", agentExplain: "Объяснение по фактам",
    agentOk: "Выполнено", agentFailed: "Не выполнено", agentSkipped: "Пропущено", agentNoTrace: "Сервер не вернул сведения об этапах выполнения.",
    agentRequestFailed: "Не удалось получить ответ AI. Используйте обычный подбор или попробуйте ещё раз.", agentCriteria: "Использованные условия", agentReason: "Код причины"
  });
  const form = $("#request-form");
  const fields = ["city", "date", "event_format", "category", "budget_kzt", "language", "duration_hours", "preferences"];
  let uiLanguage = window.FirebirdStore?.getLanguage() || "kk";
  let metadata = null;
  let lastResult = null;
  let lastQuery = null;
  let activeDemo = null;
  let requestController = null;
  let requestVersion = 0;
  let busy = false;
  let agentBusy = false;
  const welcomeTemplate = $("#welcome-state").cloneNode(true);
  let toastTimer = null;

  function toast(message) {
    let node = $("#match-toast");
    if (!node) {
      node = element("div", "match-toast");
      node.id = "match-toast";
      node.setAttribute("role", "status");
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("visible"), 5000);
  }
  function syncStoreControls() {
    const favorites = window.FirebirdStore?.getFavorites() || [];
    const comparisons = window.FirebirdStore?.getCompare() || [];
    document.querySelectorAll('[data-store-count="favorites"]').forEach(node => { node.textContent = favorites.length; });
    document.querySelectorAll('[data-store-count="compare"]').forEach(node => { node.textContent = comparisons.length; });
    document.querySelectorAll('[data-favorite-id]').forEach(button => {
      const active = favorites.includes(button.dataset.favoriteId);
      button.textContent = t(active ? "savedProfile" : "saveProfile");
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("selected", active);
    });
    document.querySelectorAll('[data-compare-id]').forEach(button => {
      const active = comparisons.includes(button.dataset.compareId);
      button.textContent = t(active ? "comparedProfile" : "compareProfile");
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("selected", active);
    });
  }

  function t(key) { return text[uiLanguage][key] || key; }
  function translated(value) {
    if (uiLanguage === "kk") return kkEnums[value] || value;
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined && content !== null) node.textContent = String(content);
    return node;
  }
  function money(value) { return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value)) + " ₸"; }
  function dateLabel(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "";
    return new Intl.DateTimeFormat(uiLanguage === "kk" ? "kk-KZ" : "ru-RU", { day: "numeric", month: "long" }).format(new Date(value + "T12:00:00"));
  }
  function translateStatic(container = document) {
    container.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); });
    container.querySelectorAll("[data-placeholder]").forEach(node => { node.placeholder = t(node.dataset.placeholder); });
  }
  function setOptions(id, values, current, allowAny = false) {
    const select = $("#" + id);
    select.replaceChildren();
    if (allowAny) { const option = element("option", "", t("anyLanguage")); option.value = ""; select.append(option); }
    values.forEach(value => { const option = element("option", "", translated(value)); option.value = value; select.append(option); });
    if ([...select.options].some(option => option.value === current)) select.value = current;
    select.disabled = false;
  }
  function populateOptions(preserve = true) {
    if (!metadata) return;
    setOptions("city", metadata.cities || [], preserve ? $("#city").value : "Алматы");
    setOptions("event_format", metadata.event_formats || [], preserve ? $("#event_format").value : "корпоратив");
    setOptions("category", metadata.categories || [], preserve ? $("#category").value : "Ведущий");
    setOptions("language", metadata.languages || [], preserve ? $("#language").value : "русский", true);
  }
  function updateBudget() {
    const value = $("#budget_kzt").value;
    $("#budget-readable").textContent = value !== "" && Number(value) >= 0 ? money(value) : "\u00a0";
    updateExtraSummary();
  }
  function updateExtraSummary() {
    const parts = [];
    if ($("#language").value) parts.push(translated($("#language").value));
    if ($("#duration_hours").value) parts.push($("#duration_hours").value + (uiLanguage === "kk" ? " сағ" : " ч"));
    if ($("#preferences").value.trim()) parts.push(uiLanguage === "kk" ? "тілектер" : "пожелания");
    $(".optional-label").textContent = parts.length ? parts.join(" · ") : t("optional");
  }
  function getQuery() {
    const query = {};
    fields.forEach(key => { query[key] = $("#" + key).value; });
    query.budget_kzt = Number(query.budget_kzt);
    query.duration_hours = query.duration_hours === "" ? null : Number(query.duration_hours);
    query.preferences = query.preferences.trim();
    query.ui_language = uiLanguage;
    return query;
  }
  function fillQuery(query) {
    fields.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(query, key)) $("#" + key).value = query[key] == null ? "" : query[key];
    });
    updateBudget();
  }
  function queryComparable(query) {
    return JSON.stringify(fields.map(key => query[key] == null || query[key] === "" ? "" : String(query[key])));
  }
  function markChanged() {
    activeDemo = null;
    updateDemoActive();
    updateBudget();
    $("#form-notice").hidden = !lastQuery || queryComparable(lastQuery) === queryComparable(getQuery());
  }
  function updateDemoActive() {
    document.querySelectorAll(".demo-button").forEach(button => { button.classList.toggle("active", button.dataset.demo === activeDemo); });
  }
  function renderDemos() {
    const list = $("#demo-list");
    list.replaceChildren();
    (metadata?.demos || []).forEach((demo, index) => {
      const label = typeof demo.label === "string" ? demo.label : demo.label?.[uiLanguage] || demo.label?.kk || demo.id;
      const button = element("button", "demo-button");
      button.type = "button";
      button.dataset.demo = demo.id || String(index);
      button.append(element("span", "", "↗"), element("span", "", label));
      button.addEventListener("click", () => {
        fillQuery({ city: "Алматы", date: "2026-10-09", event_format: "корпоратив", category: "Ведущий", budget_kzt: 1000000, language: "", duration_hours: null, preferences: "", ...demo.query });
        activeDemo = button.dataset.demo;
        updateDemoActive();
        runSearch({ scroll: true });
      });
      list.append(button);
    });
    updateDemoActive();
  }
  function setLoading(value) {
    busy = value;
    const button = $("#submit-button");
    button.disabled = value || !metadata;
    button.classList.toggle("loading", value);
    button.querySelector(".button-text").textContent = t(value ? "loading" : "find");
    $(".results-section").setAttribute("aria-busy", String(value));
    document.querySelectorAll(".suggestion-button").forEach(node => { node.disabled = value; });
    $("#agent-submit").disabled = value || !metadata;
    $("#agent-submit span").textContent = t(value && agentBusy ? "agentWorking" : "agentSubmit");
    $("#agent-form").setAttribute("aria-busy", String(value && agentBusy));
  }
  function showAgentPending() {
    const box = $("#agent-trace"); box.hidden = false; box.className = "agent-trace is-pending";
    box.replaceChildren(element("p", "agent-trace-title", t("agentWorking")));
  }
  function showAgentResult(result) {
    const agent = result.agent || {};
    const ai = agent.mode === "ai";
    const trace = Array.isArray(agent.trace) ? agent.trace : [];
    const usedParsed = agent.input_source === "interpreted" || (agent.input_source !== "form" && trace.some(step => step.step === "search_contractors" && step.status === "ok"));
    const box = $("#agent-trace"); box.hidden = false; box.className = "agent-trace " + (ai ? "is-ai" : "is-fallback");
    box.replaceChildren(element("p", "agent-trace-title", t(ai ? "agentSuccess" : "agentFallback")));
    if (!ai) box.append(element("p", "agent-fallback-note", t(usedParsed ? "agentUsedParsed" : "agentUsedForm")));
    const steps = element("div", "agent-steps");
    const stepLabels = { interpret: "agentInterpret", search_contractors: "agentSearch", explain: "agentExplain" };
    const statusLabels = { ok: "agentOk", failed: "agentFailed", skipped: "agentSkipped" };
    trace.forEach(step => {
      if (!stepLabels[step.step] || !statusLabels[step.status]) return;
      const node = element("div", "agent-step is-" + step.status);
      node.append(element("span", "agent-step-icon", step.status === "ok" ? "✓" : step.status === "failed" ? "!" : "–"), element("span", "", t(stepLabels[step.step]) + (step.step === "search_contractors" ? " · search_contractors" : "")), element("small", "", t(statusLabels[step.status])));
      steps.append(node);
    });
    if (steps.childElementCount) box.append(steps); else box.append(element("p", "agent-fallback-note", t("agentNoTrace")));
    const facts = element("div", "agent-run-facts");
    if (Number.isInteger(agent.tool_calls) && agent.tool_calls >= 0) facts.append(element("span", "", t("agentTools") + ": " + agent.tool_calls));
    if (typeof agent.model === "string" && agent.model) facts.append(element("span", "", t("agentModel") + ": " + agent.model));
    if (["nvidia", "openai"].includes(agent.provider)) facts.append(element("span", "", t("agentProvider") + ": " + (agent.provider === "nvidia" ? "NVIDIA" : "OpenAI")));
    if (typeof agent.fallback_reason === "string" && /^[a-z0-9_:-]{1,80}$/i.test(agent.fallback_reason)) facts.append(element("span", "", t("agentReason") + ": " + agent.fallback_reason));
    if (facts.childElementCount) box.append(facts);
    const query = result.query;
    if (query) box.append(element("p", "agent-applied-query", t("agentCriteria") + ": " + [translated(query.city), dateLabel(query.date), translated(query.category), money(query.budget_kzt), translated(query.event_format), query.language ? translated(query.language) : "", query.duration_hours ? query.duration_hours + (uiLanguage === "kk" ? " сағ" : " ч") : ""].filter(Boolean).join(" · ")));
  }
  function renderLoading() {
    const container = element("div", "loading-state");
    container.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) {
      const card = element("div", "skeleton-card");
      const row = element("div", "skeleton-row");
      row.append(element("div", "skeleton-block skeleton-avatar"), element("div", "skeleton-block skeleton-name"));
      card.append(row);
      ["88%", "74%", "40%"].forEach(width => { const line = element("div", "skeleton-block skeleton-line"); line.style.width = width; card.append(line); });
      container.append(card);
    }
    container.append(element("p", "loading-message", t("loadingDetail")));
    $("#results-content").replaceChildren(container);
    $("#live-status").textContent = t("loadingDetail");
  }
  function renderFailure(message, retryAction) {
    const state = element("div", "feedback-state");
    state.append(element("h3", "", t("errorTitle")), element("p", "", message));
    const retry = element("button", "", t("retry"));
    retry.type = "button";
    retry.addEventListener("click", retryAction || (() => metadata ? runSearch() : initialize()));
    state.append(retry);
    $("#results-content").replaceChildren(state);
    $("#results-count").hidden = true;
    $("#live-status").textContent = message;
  }
  function initials(name) {
    return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  }
  function renderCard(card, index) {
    const article = element("article", "contractor-card" + (index === 0 ? " top-card" : ""));
    const header = element("div", "card-header");
    const avatar = element("div", "contractor-avatar", initials(card.name));
    avatar.setAttribute("aria-hidden", "true");
    const identity = element("div", "card-identity");
    const heading = element("h3", "card-name");
    const profileUrl = "/contractor/" + encodeURIComponent(card.id) + "?date=" + encodeURIComponent(lastResult?.query?.date || $("#date").value);
    const profileName = element("a", "", card.name);
    profileName.href = profileUrl;
    heading.append(profileName);
    identity.append(heading);
    const categories = Array.isArray(card.category) ? card.category.map(translated).join(", ") : translated(card.category);
    identity.append(element("p", "card-meta", [categories, translated(card.city)].filter(Boolean).join(" · ")));
    header.append(avatar, identity, element("span", "card-rank", index === 0 ? t("bestMatch") : "0" + (index + 1)));
    article.append(header);
    const why = element("div", "why-box");
    why.append(element("span", "why-label", t("why")), element("p", "", card.explanation));
    article.append(why);
    const footer = element("div", "card-footer");
    const price = element("div", "price");
    if (uiLanguage === "ru") price.append(element("span", "", t("from") + " "), document.createTextNode(money(card.price_from_kzt)));
    else price.append(document.createTextNode(money(card.price_from_kzt)), element("span", "", t("from")));
    const pills = element("div", "card-pills");
    const languages = Array.isArray(card.languages) ? card.languages : String(card.languages || "").split("|").filter(Boolean);
    languages.forEach(language => pills.append(element("span", "card-pill", translated(language))));
    if (card.max_hours !== null && card.max_hours !== undefined && card.max_hours !== "") pills.append(element("span", "card-pill", card.max_hours + " " + t("maxHours")));
    footer.append(price, pills);
    article.append(footer);
    const actions = element("div", "card-actions");
    const openProfile = element("a", "card-action card-profile-link", t("viewProfile"));
    openProfile.href = profileUrl;
    const save = element("button", "card-action", t("saveProfile"));
    save.type = "button";
    save.dataset.favoriteId = card.id;
    save.addEventListener("click", () => { window.FirebirdStore?.toggleFavorite(card.id); syncStoreControls(); });
    const compare = element("button", "card-action", t("compareProfile"));
    compare.type = "button";
    compare.dataset.compareId = card.id;
    compare.addEventListener("click", () => {
      const state = window.FirebirdStore?.toggleCompare(card.id);
      if (state?.full) toast(t("compareFull"));
      syncStoreControls();
    });
    actions.append(openProfile, save, compare);
    article.append(actions);
    const details = element("details", "evidence-details");
    details.append(element("summary", "", t("evidence")));
    const evidenceBody = element("div", "evidence-body");
    const dl = element("dl");
    (card.evidence || []).forEach(item => {
      const row = element("div", "evidence-item");
      row.append(element("dt", "", item.label), element("dd", "", item.text));
      dl.append(row);
    });
    const idRow = element("div", "evidence-item");
    idRow.append(element("dt", "", t("sourceId")), element("dd", "", card.id));
    dl.append(idRow);
    evidenceBody.append(dl);
    details.append(evidenceBody);
    article.append(details);
    if (card.synthetic || card.price_imputed || card.city_imputed) {
      const provenance = element("div", "provenance-labels");
      if (card.synthetic) provenance.append(element("span", "provenance-label", t("synthetic")));
      if (card.price_imputed) provenance.append(element("span", "provenance-label", t("priceImputed")));
      if (card.city_imputed) provenance.append(element("span", "provenance-label", t("cityImputed")));
      article.append(provenance);
    }
    return article;
  }
  function renderAudit(result) {
    const audit = element("details", "result-audit");
    if (result.outcome === "no_eligible_candidates") audit.open = true;
    audit.append(element("summary", "", t("audit")));
    const content = element("div", "audit-content");
    content.append(element("p", "audit-description", t("auditDescription")));
    const summary = result.summary || {};
    const appendRow = (label, count) => {
      if (count === undefined || count === null) return;
      const row = element("div", "audit-row");
      row.append(element("span", "", label), element("strong", "", count));
      content.append(row);
    };
    appendRow(t("candidates"), summary.total_candidates);
    const labels = { busy_date: "busy_date", event_format: "event_format", budget: "budgetExcluded", language: "languageExcluded", duration: "durationExcluded" };
    Object.entries(labels).forEach(([key, label]) => { const count = summary.excluded_counts?.[key]; if (count > 0) appendRow(t(label), count); });
    appendRow(t("eligible"), summary.eligible_count);
    if (result.ranking_method) content.append(element("p", "ranking-note", result.ranking_method));
    audit.append(content);
    return audit;
  }
  function renderSuggestions(result) {
    if (!result.suggestions?.length) return null;
    const box = element("div", "suggestion-box");
    box.append(element("h3", "", t("suggestionTitle")), element("p", "", t("suggestionHint")));
    const buttons = element("div", "suggestion-buttons");
    result.suggestions.forEach(suggestion => {
      const button = element("button", "suggestion-button", typeof suggestion.label === "object" ? suggestion.label[uiLanguage] : suggestion.label);
      button.type = "button";
      button.addEventListener("click", () => {
        fillQuery({ ...result.query, ...suggestion.query_patch });
        activeDemo = null;
        updateDemoActive();
        runSearch({ scroll: true });
      });
      buttons.append(button);
    });
    box.append(buttons);
    return box;
  }
  function dateOnlyChanged(previous, current) {
    if (!previous || !current || previous.date === current.date) return false;
    const withoutDate = query => JSON.stringify(fields.filter(key => key !== "date").map(key => query[key] == null || query[key] === "" ? "" : String(query[key])));
    return withoutDate(previous) === withoutDate(current);
  }
  function renderDateChange(result, previous) {
    const change = result.date_change;
    if (!change && !dateOnlyChanged(previous, result.query)) return null;
    const note = element("div", "date-change-note");
    note.append(element("div", "", t("dateChanged")));
    if (change?.unavailable?.length) note.append(element("div", "", change.unavailable.map(item => item.name).join(", ") + " — " + t("busyOnNewDate") + "."));
    if (change?.newly_available?.length) note.append(element("div", "", change.newly_available.map(item => item.name).join(", ") + " — " + t("availableOnNewDate") + "."));
    return note;
  }
  function renderResult(result, previous) {
    const container = $("#results-content");
    container.replaceChildren();
    const cards = (result.cards || []).slice(0, 3);
    const summary = result.summary || {};
    const query = result.query || getQuery();
    const count = $("#results-count");
    count.hidden = false;
    count.textContent = uiLanguage === "ru" ? "Показано: " + cards.length : cards.length + " нұсқа";
    const dateChange = renderDateChange(result, previous);
    if (dateChange) container.append(dateChange);
    if (result.outcome === "matches" && cards.length) {
      const banner = element("div", "result-summary");
      banner.append(element("span", "summary-icon", "✓"));
      const copy = element("div", "summary-copy");
      copy.append(element("div", "summary-main", summary.message || t("foundPrefix") + ": " + summary.eligible_count + " · " + t("shownPrefix") + ": " + cards.length));
      copy.append(element("span", "summary-detail", [translated(query.city), dateLabel(query.date), translated(query.event_format), money(query.budget_kzt)].filter(Boolean).join(" · ")));
      banner.append(copy);
      container.append(banner);
      const list = element("div", "cards-list");
      cards.forEach((card, index) => list.append(renderCard(card, index)));
      container.append(list);
      const comparePrompt = element("div", "comparison-prompt");
      const compareLink = element("a", "", t("compareOpen"));
      compareLink.href = "/compare?date=" + encodeURIComponent(query.date);
      comparePrompt.append(element("span", "", t("comparePrompt")), compareLink);
      container.append(comparePrompt);
      $("#live-status").textContent = t("foundPrefix") + ": " + summary.eligible_count + ". " + t("shownPrefix") + ": " + cards.length + ".";
    } else {
      const noCategory = result.outcome === "no_category_in_city";
      const empty = element("div", "empty-state");
      const icon = element("div", "empty-icon", noCategory ? "⌁" : "↗");
      icon.setAttribute("aria-hidden", "true");
      empty.append(icon, element("h3", "", t(noCategory ? "noCategory" : "noEligible")));
      empty.append(element("p", "", summary.message || t(noCategory ? "noCategoryText" : "noEligibleText")));
      const tags = element("div", "empty-query");
      [translated(query.city), translated(query.category), dateLabel(query.date), money(query.budget_kzt)].forEach(value => tags.append(element("span", "", value)));
      empty.append(tags);
      container.append(empty);
      $("#live-status").textContent = t(noCategory ? "noCategory" : "noEligible");
    }
    const suggestions = renderSuggestions(result);
    if (suggestions) container.append(suggestions);
    if (result.outcome !== "no_category_in_city") container.append(renderAudit(result));
    syncStoreControls();
  }

  async function runSearch(options = {}) {
    if (!metadata || !form.reportValidity()) return;
    const useAgent = typeof options.agentMessage === "string" && options.agentMessage.trim().length > 0;
    const query = getQuery();
    const previousQuery = lastResult?.query || null;
    const version = ++requestVersion;
    if (requestController) requestController.abort();
    requestController = new AbortController();
    const ownController = requestController;
    const timeout = setTimeout(() => ownController.abort(), 25000);
    $("#error-banner").hidden = true;
    $("#form-notice").hidden = true;
    agentBusy = useAgent;
    setLoading(true);
    renderLoading();
    if (useAgent) showAgentPending(); else $("#agent-trace").hidden = true;
    if (options.scroll && window.matchMedia("(max-width: 760px)").matches) $(".results-section").scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const body = useAgent ? { message: options.agentMessage.trim(), query, ui_language: uiLanguage } : { ...query };
      if (!useAgent && previousQuery) body.previous_query = previousQuery;
      const response = await fetch(useAgent ? "/api/agent" : "/api/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ownController.signal
      });
      let result;
      try { result = await response.json(); } catch { throw new Error(t("networkError")); }
      if (!response.ok) throw new Error(result.error || t("networkError"));
      if (version !== requestVersion) return;
      if (!Array.isArray(result.cards) || !result.outcome || (useAgent && !result.query)) throw new Error(t("networkError"));
      if (useAgent) {
        fillQuery(result.query);
        activeDemo = null;
        updateDemoActive();
        showAgentResult(result);
      }
      lastResult = result;
      lastQuery = useAgent ? result.query : query;
      window.FirebirdStore?.addHistory({query: result.query, card_ids: result.cards.map(card => card.id)});
      try { sessionStorage.setItem("firebird.lastQuery", JSON.stringify(result.query)); } catch {}
      renderResult(result, previousQuery);
      $("#form-notice").hidden = queryComparable(lastQuery) === queryComparable(getQuery());
    } catch (error) {
      if (version !== requestVersion) return;
      const message = error.name === "AbortError" || error instanceof TypeError ? t("networkError") : error.message;
      $("#error-banner").textContent = message;
      $("#error-banner").hidden = false;
      if (useAgent) {
        const trace = $("#agent-trace"); trace.hidden = false; trace.className = "agent-trace is-fallback";
        trace.replaceChildren(element("p", "agent-trace-title", t("agentRequestFailed")));
      }
      renderFailure(message, useAgent ? () => runSearch({ agentMessage: options.agentMessage, scroll: true }) : null);
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion) setLoading(false);
    }
  }
  async function initialize() {
    $("#error-banner").hidden = true;
    $("#live-status").textContent = t("loadingCatalog");
    try {
      const response = await fetch("/api/meta");
      if (!response.ok) throw new Error(t("metadataError"));
      metadata = await response.json();
      if (!metadata.cities?.length || !metadata.categories?.length || !metadata.event_formats?.length) throw new Error(t("metadataError"));
      populateOptions(false);
      if (metadata.calendar?.min) $("#date").min = metadata.calendar.min;
      if (metadata.calendar?.max) $("#date").max = metadata.calendar.max;
      $("#catalog-count").textContent = metadata.stats?.profiles ?? 66;
      $("#submit-button").disabled = false;
      $("#agent-submit").disabled = false;
      renderDemos();
      updateBudget();
      const welcome = welcomeTemplate.cloneNode(true);
      translateStatic(welcome);
      $("#results-content").replaceChildren(welcome);
      $("#live-status").textContent = "";
      syncStoreControls();
      let restored = null;
      try {
        const prefill = sessionStorage.getItem("firebird.prefill");
        const previous = sessionStorage.getItem("firebird.lastQuery");
        if (prefill || previous) restored = JSON.parse(prefill || previous);
        if (prefill) sessionStorage.removeItem("firebird.prefill");
      } catch {}
      try {
        const urlPrefill = new URLSearchParams(location.search).get("prefill");
        if (urlPrefill && urlPrefill.length <= 2000) {
          restored = JSON.parse(urlPrefill);
          history.replaceState(null, "", location.pathname);
        }
      } catch {}
      if (restored && typeof restored === "object") {
        fillQuery(restored);
        await runSearch();
      }
    } catch {
      metadata = null;
      $("#submit-button").disabled = true;
      $("#agent-submit").disabled = true;
      renderFailure(t("metadataError"));
    }
  }
  async function changeLanguage(language) {
    if (uiLanguage === language) return;
    uiLanguage = language;
    window.FirebirdStore?.setLanguage(language);
    document.documentElement.lang = language;
    document.title = language === "kk" ? "Firebird — Іс-шараңызға дәл таңдау" : "Firebird — Точный выбор для вашего события";
    document.querySelectorAll("[data-language]").forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    translateStatic();
    populateOptions(true);
    updateExtraSummary();
    renderDemos();
    syncStoreControls();
    if (lastResult || busy) await runSearch();
  }

  form.addEventListener("submit", event => { event.preventDefault(); runSearch({ scroll: true }); });
  $("#agent-form").addEventListener("submit", event => { event.preventDefault(); if ($("#agent-form").reportValidity()) runSearch({ agentMessage: $("#agent-message").value, scroll: true }); });
  $("#agent-demo").addEventListener("click", () => { $("#agent-message").value = t("agentPlaceholder"); $("#agent-message").focus(); });
  form.addEventListener("input", markChanged);
  form.addEventListener("change", markChanged);
  document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", () => changeLanguage(button.dataset.language)));
  window.addEventListener("firebird:storechange", syncStoreControls);
  document.documentElement.lang = uiLanguage;
  document.title = uiLanguage === "kk" ? "Firebird — Іс-шараңызға дәл таңдау" : "Firebird — Точный выбор для вашего события";
  document.querySelectorAll("[data-language]").forEach(button => {
    button.classList.toggle("active", button.dataset.language === uiLanguage);
    button.setAttribute("aria-pressed", String(button.dataset.language === uiLanguage));
  });
  translateStatic();
  syncStoreControls();
  initialize();
})();
