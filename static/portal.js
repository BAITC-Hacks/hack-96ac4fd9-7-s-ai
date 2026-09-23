"use strict";

(() => {
  const store = window.FirebirdStore;
  const main = document.querySelector("#portal-main");
  const labels = {
    kk: {
      skip: "Мазмұнға өту", match: "Іріктеу", catalog: "Каталог", saved: "Таңдаулылар", compare: "Салыстыру", history: "Тарих", profiles: "профиль",
      footer: "Каталог деректеріне сүйенген таңдау", footerPrice: "«Бастап» бағасы. Соңғы құнды мердігермен нақтылаңыз.",
      catalogEyebrow: "АДАМДАРДЫ ТАНЫП, САНАЛЫ ТАҢДАҢЫЗ", catalogTitle: "Әр іс-шараға — өз маманы.", catalogSubtitle: "Каталогтағы профильдерді зерттеңіз, ұнағандарын сақтап, деректерін қатар салыстырыңыз.",
      browseNote: "Бұл — каталог көрінісі. Күн, формат пен бюджетке сәйкестігін «Іріктеу» бөлімінде тексеріңіз.", search: "Каталогтан іздеу", searchPlaceholder: "Аты, қызметі немесе сипаттамасы…", city: "Қала", category: "Санат", allCities: "Барлық қала", allCategories: "Барлық санат", sort: "Реті", priceAsc: "Баға: арзаннан қымбатқа", priceDesc: "Баға: қымбаттан арзанға", nameSort: "Аты бойынша", searchButton: "Іздеу", reset: "Сүзгілерді тазарту", source: "Каталогтағы профиль", from: "бастап", details: "Профильді көру", save: "Сақтау", unsave: "Сақталды", addCompare: "Салыстыру", inCompare: "Салыстыруда", compareFull: "Бір уақытта ең көбі 3 профильді салыстыруға болады.", savedToast: "Таңдаулыларға сақталды", removedToast: "Таңдаулылардан алынды", compareAdded: "Салыстыруға қосылды", compareRemoved: "Салыстырудан алынды", found: "Табылғаны", page: "Бет", previous: "Алдыңғы", next: "Келесі", noCatalog: "Бұл сүзгілерге сәйкес профиль жоқ", noCatalogText: "Іздеу сөзін өзгертіңіз немесе қала мен санат сүзгілерін тазалап көріңіз.", loading: "Деректер жүктеліп жатыр…", errorTitle: "Деректерді жүктеу мүмкін болмады", networkError: "Сервермен байланыс орнамады. Қайта көріңіз.", retry: "Қайта көру", backCatalog: "Каталогқа оралу", description: "Мердігер туралы", originalDescription: "Каталогтағы түпнұсқа сипаттама", formats: "Іс-шара форматтары", languages: "Қызмет көрсету тілдері", duration: "Ең ұзақ қызмет уақыты", hours: "сағат", notSpecified: "Көрсетілмеген", price: "Бастапқы баға", dataOrigin: "Деректің шығу тегі", synthetic: "Синтетикалық профиль", priceImputed: "Баға толықтырылған", cityImputed: "Қала толықтырылған", sourceProfile: "Бастапқы каталог профилі", calendarTitle: "Күнді тексеріңіз", calendarHint: "Каталогтағы бос емес күндер белгіленген.", busy: "Бос емес", available: "Бос емес деп белгіленбеген", availableShort: "Бос деп көрсетілген", selectedDate: "Таңдалған күн", availability: "Таңдалған күнге", selectConditions: "Осы шарттармен іріктеу", availabilityNote: "Күннің қолжетімділігін мердігермен нақтылаңыз.", prevMonth: "Алдыңғы ай", nextMonth: "Келесі ай", weekdays: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сн", "Жс"],
      savedEyebrow: "ӨЗІҢІЗГЕ ҰНАҒАНДАРДЫ ЖОҒАЛТПАҢЫЗ", savedTitle: "Таңдаулылар — өз тізіміңіз.", savedSubtitle: "Қайта оралып, профильдерді салыстыруға немесе іріктеуге ыңғайлы орын.", browserNote: "Таңдаулылар мен сұраныстар тарихы осы браузерде сақталады.", savedEmpty: "Алғашқы таңдауыңызды сақтаңыз", savedEmptyText: "Каталогтағы немесе іріктеу нәтижесіндегі жүрек белгісін бассаңыз, профиль осында сақталады.", openCatalog: "Каталогты ашу", compareEyebrow: "АЙЫРМАШЫЛЫҚТАРДЫ БІРДЕН КӨРІҢІЗ", compareTitle: "Үш нұсқа. Айқын таңдау.", compareSubtitle: "Баға, формат, тіл және таңдалған күн туралы деректерді қатар салыстырыңыз.", compareEmpty: "Салыстыруға профиль қосыңыз", compareEmptyText: "Каталогта «Салыстыру» батырмасын басыңыз. Бір уақытта ең көбі үш профильді салыстыра аласыз.", compareAddMore: "Тағы профиль қосу", removeCompare: "Алып тастау", compareDate: "Іс-шара күні", horizontalHint: "Барлық бағанды көру үшін көлденең жылжытыңыз.", categories: "Санаттар", profile: "Профиль", sourceNotes: "Деректер туралы", historyEyebrow: "ТАҢДАУЫҢЫЗҒА ҚАЙТА ОРАЛЫҢЫЗ", historyTitle: "Соңғы сұраныстарыңыз.", historySubtitle: "Соңғы 10 бірегей сұраныс. Шарттарын ашып, іріктеуді қайта іске қосыңыз.", historyEmpty: "Тарихыңыз осы жерден басталады", historyEmptyText: "Алғашқы іріктеуден кейін сұранысыңыз автоматты түрде осында сақталады.", startMatch: "Іріктеуді бастау", rerun: "Қайта іріктеу", resultCount: "карточка көрсетілді", budget: "Бюджет", date: "Күні", preferences: "Ерекше тілектер", queryDetails: "Сұраныс шарттары", back: "Артқа", unavailableSaved: "Кейбір сақталған профильдер каталогта қолжетімсіз.", sessionFallback: "Браузер сақтауға рұқсат бермеді. Іріктеу бетін ашып, шарттарды енгізіңіз.", openSelection: "Іріктеуге өту", noDate: "Күн таңдалмаған", actualSource: "Барлық мәлімет бастапқы каталогтан алынған."
    },
    ru: {
      skip: "Перейти к содержимому", match: "Подбор", catalog: "Каталог", saved: "Избранное", compare: "Сравнение", history: "История", profiles: "профилей",
      footer: "Подбор на основе данных каталога", footerPrice: "Цены «от». Итоговую стоимость уточните у подрядчика.",
      catalogEyebrow: "ЗНАКОМЬТЕСЬ И ВЫБИРАЙТЕ ОСОЗНАННО", catalogTitle: "Для каждого события — свои люди.", catalogSubtitle: "Изучайте профили, сохраняйте понравившиеся и сравнивайте факты рядом.",
      browseNote: "Это просмотр каталога. Соответствие дате, формату и бюджету проверьте в разделе «Подбор».", search: "Поиск по каталогу", searchPlaceholder: "Имя, услуга или описание…", city: "Город", category: "Категория", allCities: "Все города", allCategories: "Все категории", sort: "Порядок", priceAsc: "Цена: по возрастанию", priceDesc: "Цена: по убыванию", nameSort: "По имени", searchButton: "Найти", reset: "Сбросить фильтры", source: "Профиль из каталога", from: "от", details: "Открыть профиль", save: "Сохранить", unsave: "Сохранено", addCompare: "Сравнить", inCompare: "В сравнении", compareFull: "Можно сравнить не больше 3 профилей одновременно.", savedToast: "Сохранено в избранное", removedToast: "Удалено из избранного", compareAdded: "Добавлено к сравнению", compareRemoved: "Удалено из сравнения", found: "Найдено", page: "Страница", previous: "Назад", next: "Дальше", noCatalog: "По этим фильтрам профилей нет", noCatalogText: "Измените поисковую фразу или сбросьте фильтры города и категории.", loading: "Загружаем данные…", errorTitle: "Не удалось загрузить данные", networkError: "Не удалось связаться с сервером. Попробуйте ещё раз.", retry: "Попробовать снова", backCatalog: "Вернуться в каталог", description: "О подрядчике", originalDescription: "Исходное описание из каталога", formats: "Форматы событий", languages: "Языки услуги", duration: "Максимальная длительность", hours: "часов", notSpecified: "Не указано", price: "Начальная цена", dataOrigin: "Происхождение данных", synthetic: "Синтетический профиль", priceImputed: "Цена дополнена", cityImputed: "Город дополнен", sourceProfile: "Исходный профиль каталога", calendarTitle: "Проверьте дату", calendarHint: "Отмечены занятые даты из каталога.", busy: "Занят", available: "Не отмечен как занятый", availableShort: "Указан свободным", selectedDate: "Выбранная дата", availability: "На выбранную дату", selectConditions: "Подобрать по этим условиям", availabilityNote: "Подтвердите доступность даты у подрядчика.", prevMonth: "Предыдущий месяц", nextMonth: "Следующий месяц", weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      savedEyebrow: "СОХРАНЯЙТЕ ТО, ЧТО ПОНРАВИЛОСЬ", savedTitle: "Избранное — ваш короткий список.", savedSubtitle: "Место, куда удобно вернуться, чтобы сравнить профили или продолжить подбор.", browserNote: "Избранное и история запросов сохраняются в этом браузере.", savedEmpty: "Сохраните первый профиль", savedEmptyText: "Нажмите на сердце в каталоге или результатах подбора — профиль появится здесь.", openCatalog: "Открыть каталог", compareEyebrow: "ВСЕ РАЗЛИЧИЯ ПЕРЕД ГЛАЗАМИ", compareTitle: "Три варианта. Ясный выбор.", compareSubtitle: "Сравните цену, формат, языки и доступность на выбранную дату в одной таблице.", compareEmpty: "Добавьте профили для сравнения", compareEmptyText: "Нажмите «Сравнить» в каталоге. Можно сравнить до трёх профилей одновременно.", compareAddMore: "Добавить ещё профиль", removeCompare: "Убрать", compareDate: "Дата события", horizontalHint: "Прокрутите по горизонтали, чтобы увидеть все столбцы.", categories: "Категории", profile: "Профиль", sourceNotes: "О данных", historyEyebrow: "ВОЗВРАЩАЙТЕСЬ К СВОИМ ВАРИАНТАМ", historyTitle: "Ваши последние запросы.", historySubtitle: "Последние 10 уникальных запросов. Откройте условия и повторите подбор.", historyEmpty: "Здесь начнётся ваша история", historyEmptyText: "После первого подбора ваш запрос автоматически сохранится здесь.", startMatch: "Начать подбор", rerun: "Повторить подбор", resultCount: "карточек показано", budget: "Бюджет", date: "Дата", preferences: "Особые пожелания", queryDetails: "Условия запроса", back: "Назад", unavailableSaved: "Некоторые сохранённые профили недоступны в каталоге.", sessionFallback: "Браузер запретил сохранение. Откройте подбор и укажите условия вручную.", openSelection: "Перейти к подбору", noDate: "Дата не выбрана", actualSource: "Все сведения взяты из исходного каталога."
    }
  };
  const kkEnums = {
    "Алматы": "Алматы", "Астана": "Астана", "Зарубежье": "Шетел", "Банкетный зал": "Банкет залы", "Ведущий": "Жүргізуші", "Ведущий церемонии": "Рәсім жүргізушісі", "Видеограф": "Видеограф", "Декоратор": "Декоратор", "Загородная площадка": "Қала сыртындағы алаң", "Инструменталист": "Аспапшы", "Лайв-бэнд": "Жанды музыка тобы", "Национальный ансамбль": "Ұлттық ансамбль", "Отель": "Қонақүй", "Подарки и сувениры": "Сыйлықтар мен кәдесыйлар", "Ресторан": "Мейрамхана", "Танцевальный коллектив": "Би ұжымы", "Флорист": "Флорист", "Фото и видеобудки": "Фото және видеобудкалар", "Фотограф": "Фотограф", "Шоу-программа": "Шоу-бағдарлама", "корпоратив": "Корпоратив", "свадьба": "Үйлену тойы", "конференция": "Конференция", "юбилей": "Мерейтой", "день рождения": "Туған күн", "той": "Той", "русский": "Орыс тілі", "казахский": "Қазақ тілі", "английский": "Ағылшын тілі"
  };
  let language = store.getLanguage();
  let metadata = null;
  let pageVersion = 0;
  let catalogVersion = 0;
  let toastTimer;
  const route = location.pathname.startsWith("/contractor/") ? "detail" : location.pathname.split("/").filter(Boolean)[0] || "catalog";
  const t = key => labels[language][key] || key;
  const tr = value => language === "kk" ? kkEnums[value] || value : value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  function el(tag, className = "", value) { const node = document.createElement(tag); if (className) node.className = className; if (value !== undefined && value !== null) node.textContent = String(value); return node; }
  function link(value, href, className = "") { const node = el("a", className, value); node.href = href; return node; }
  function button(value, className, handler) { const node = el("button", className, value); node.type = "button"; if (handler) node.addEventListener("click", handler); return node; }
  function money(value) { return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value)) + " ₸"; }
  function dateText(value, options = { day: "numeric", month: "long", year: "numeric" }) { if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || t("noDate"); return new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", options).format(new Date(value + "T12:00:00")); }
  function initials(name) { return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase(); }
  function toast(message) { document.querySelector(".firebird-toast")?.remove(); clearTimeout(toastTimer); const node = el("div", "firebird-toast", message); node.setAttribute("role", "status"); document.body.append(node); toastTimer = setTimeout(() => node.remove(), 3500); }
  function announce(message) { document.querySelector("#portal-live").textContent = message; }
  function queryString(values) { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") params.set(key, String(value)); }); return params.toString(); }
  async function api(path) { let response; try { response = await fetch(path); } catch { throw new Error(t("networkError")); } let body; try { body = await response.json(); } catch { throw new Error(t("networkError")); } if (!response.ok) throw new Error(body.error || t("networkError")); return body; }
  function loading(container) { const node = el("div", "portal-loading"); node.setAttribute("role", "status"); node.append(el("span", "portal-spinner"), el("span", "", t("loading"))); container.replaceChildren(node); }
  function failure(container, error, retry) { const box = el("div", "portal-empty"); box.append(el("span", "portal-empty-icon", "↻"), el("h2", "", t("errorTitle")), el("p", "", error.message || t("networkError")), button(t("retry"), "portal-button", retry)); container.replaceChildren(box); announce(t("errorTitle")); }
  function empty(container, title, description, actionLabel, href, symbol = "♡") { const box = el("div", "portal-empty"); box.append(el("span", "portal-empty-icon", symbol), el("h2", "", title), el("p", "", description)); if (actionLabel) box.append(link(actionLabel, href, "portal-button")); container.append(box); }
  function titleBlock(eyebrow, title, subtitle, side) { const block = el("section", "portal-intro"); const copy = el("div"); copy.append(el("div", "eyebrow", "✳  " + eyebrow), el("h1", "", title), el("p", "", subtitle)); block.append(copy); if (side) block.append(side); return block; }
  function pillList(values) { const box = el("div", "portal-pills"); (values || []).forEach(value => box.append(el("span", "portal-pill", tr(value)))); if (!values?.length) box.append(el("span", "portal-subtle", t("notSpecified"))); return box; }
  function provenance(profile) { const box = el("div", "portal-provenance"); if (profile.synthetic) box.append(el("span", "provenance-label", t("synthetic"))); if (profile.price_imputed) box.append(el("span", "provenance-label", t("priceImputed"))); if (profile.city_imputed) box.append(el("span", "provenance-label", t("cityImputed"))); return box; }
  function storeActions(profile, compact = false) {
    const box = el("div", "store-actions");
    const favorite = button("", "store-action" + (compact ? " icon-only" : ""), () => { const active = store.toggleFavorite(profile.id); toast(t(active ? "savedToast" : "removedToast")); });
    favorite.dataset.favorite = profile.id;
    if (compact) favorite.dataset.compact = "true";
    const compare = button("", "store-action", () => { const result = store.toggleCompare(profile.id); toast(t(result.full ? "compareFull" : result.active ? "compareAdded" : "compareRemoved")); });
    compare.dataset.compare = profile.id;
    box.append(favorite, compare);
    return box;
  }
  function updateStoreUI() {
    const favorites = store.getFavorites(); const compared = store.getCompare();
    document.querySelectorAll("[data-count='favorites']").forEach(node => { node.textContent = favorites.length; });
    document.querySelectorAll("[data-count='compare']").forEach(node => { node.textContent = compared.length; });
    document.querySelectorAll("[data-favorite]").forEach(node => { const active = favorites.includes(node.dataset.favorite); node.classList.toggle("is-active", active); node.textContent = node.dataset.compact ? active ? "♥" : "♡" : (active ? "♥ " + t("unsave") : "♡ " + t("save")); node.setAttribute("aria-pressed", String(active)); node.setAttribute("aria-label", t(active ? "unsave" : "save")); node.title = t(active ? "unsave" : "save"); });
    document.querySelectorAll("[data-compare]").forEach(node => { const active = compared.includes(node.dataset.compare); node.classList.toggle("is-active", active); node.textContent = active ? "✓ " + t("inCompare") : "+ " + t("addCompare"); node.setAttribute("aria-pressed", String(active)); });
  }
  function translateChrome() { document.documentElement.lang = language; document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); }); document.querySelectorAll("[data-language]").forEach(node => { const active = node.dataset.language === language; node.classList.toggle("active", active); node.setAttribute("aria-pressed", String(active)); }); document.querySelectorAll("[data-route]").forEach(node => { const active = node.dataset.route === route || (route === "detail" && node.dataset.route === "catalog"); node.classList.toggle("active", active); if (active) node.setAttribute("aria-current", "page"); else node.removeAttribute("aria-current"); }); updateStoreUI(); }
  function profileCard(profile) {
    const card = el("article", "directory-card");
    const top = el("div", "directory-card-top");
    const avatar = el("div", "directory-avatar", initials(profile.name)); avatar.setAttribute("aria-hidden", "true");
    top.append(avatar, el("span", "directory-city", "⌖ " + tr(profile.city)));
    card.append(top);
    const heading = el("h2", "directory-name"); heading.append(link(profile.name, "/contractor/" + encodeURIComponent(profile.id), "profile-link"));
    card.append(heading, el("p", "directory-category", (profile.categories || []).map(tr).join(" · ")));
    card.append(el("p", "directory-summary", profile.summary || t("source")));
    const bottom = el("div", "directory-bottom");
    const price = el("div", "directory-price"); price.append(el("span", "", language === "ru" ? t("from") + " " : ""), document.createTextNode(money(profile.price_from_kzt)), el("span", "", language === "kk" ? " " + t("from") : ""));
    bottom.append(price, provenance(profile));
    card.append(bottom);
    const actions = el("div", "directory-actions"); actions.append(link(t("details") + " ↗", "/contractor/" + encodeURIComponent(profile.id), "directory-open"), storeActions(profile, true));
    card.append(actions);
    return card;
  }
  function createSelect(id, label, values, current, allLabel) {
    const field = el("div", "field"); const labelNode = el("label", "", label); labelNode.htmlFor = id;
    const wrap = el("div", "select-wrap"); const select = el("select"); select.id = id; select.name = id;
    if (allLabel) { const option = el("option", "", allLabel); option.value = ""; select.append(option); }
    values.forEach(value => { const raw = typeof value === "string" ? value : value[0]; const caption = typeof value === "string" ? tr(value) : value[1]; const option = el("option", "", caption); option.value = raw; select.append(option); });
    select.value = current || "";
    wrap.append(select); field.append(labelNode, wrap); return { field, select };
  }
  function sendToMatch(query) {
    const prefill = { ...query, ui_language: language }; delete prefill.previous_query;
    try { sessionStorage.setItem("firebird.prefill", JSON.stringify(prefill)); location.href = "/"; }
    catch { toast(t("sessionFallback")); }
  }

  async function catalogPage(version) {
    document.title = "Firebird — " + t("catalog");
    main.replaceChildren(titleBlock(t("catalogEyebrow"), t("catalogTitle"), t("catalogSubtitle"), link(t("openSelection") + " ↗", "/", "portal-button secondary")));
    const params = new URLSearchParams(location.search);
    const form = el("form", "catalog-toolbar");
    const searchField = el("div", "field catalog-search"); const searchLabel = el("label", "", t("search")); searchLabel.htmlFor = "catalog-q";
    const search = el("input"); search.id = "catalog-q"; search.type = "search"; search.placeholder = t("searchPlaceholder"); search.maxLength = 200; search.value = params.get("q") || ""; searchField.append(searchLabel, search);
    const city = createSelect("catalog-city", t("city"), metadata.cities, params.get("city"), t("allCities"));
    const category = createSelect("catalog-category", t("category"), metadata.categories, params.get("category"), t("allCategories"));
    const sort = createSelect("catalog-sort", t("sort"), [["name", t("nameSort")], ["price_asc", t("priceAsc")], ["price_desc", t("priceDesc")]], params.get("sort") || "name");
    const submit = el("button", "portal-button catalog-submit", t("searchButton")); submit.type = "submit";
    form.append(searchField, city.field, category.field, sort.field, submit);
    main.append(form, el("p", "catalog-browse-note", t("browseNote")));
    const result = el("section", "catalog-results"); result.setAttribute("aria-label", t("catalog")); main.append(result);
    let currentPage = Math.max(1, Number(params.get("page")) || 1);
    async function load(page = 1) {
      currentPage = page;
      const request = ++catalogVersion;
      const values = { q: search.value.trim(), city: city.select.value, category: category.select.value, sort: sort.select.value, page: currentPage };
      history.replaceState(null, "", "/catalog?" + queryString(values));
      loading(result);
      try {
        const data = await api("/api/catalog?" + queryString({ ...values, page_size: 12, ui_language: language }));
        if (request !== catalogVersion || version !== pageVersion) return;
        result.replaceChildren();
        const metaRow = el("div", "catalog-result-heading");
        metaRow.append(el("p", "", t("found") + ": " + data.total));
        if (values.city || values.category || values.q) metaRow.append(button(t("reset"), "text-button", () => { search.value = ""; city.select.value = ""; category.select.value = ""; load(1); }));
        result.append(metaRow);
        if (!data.items?.length) empty(result, t("noCatalog"), t("noCatalogText"), null, null, "⌕");
        else { const grid = el("div", "directory-grid"); data.items.forEach(item => grid.append(profileCard(item))); result.append(grid); }
        if (data.total_pages > 1) {
          const pagination = el("nav", "portal-pagination"); pagination.setAttribute("aria-label", t("page"));
          const previous = button("← " + t("previous"), "pagination-button", () => { load(data.page - 1); form.scrollIntoView({ behavior: "smooth", block: "start" }); }); previous.disabled = data.page <= 1;
          const next = button(t("next") + " →", "pagination-button", () => { load(data.page + 1); form.scrollIntoView({ behavior: "smooth", block: "start" }); }); next.disabled = data.page >= data.total_pages;
          pagination.append(previous, el("span", "", data.page + " / " + data.total_pages), next); result.append(pagination);
        }
        updateStoreUI(); announce(t("found") + ": " + data.total);
      } catch (error) { if (request === catalogVersion && version === pageVersion) failure(result, error, () => load(currentPage)); }
    }
    form.addEventListener("submit", event => { event.preventDefault(); load(1); });
    [city.select, category.select, sort.select].forEach(select => select.addEventListener("change", () => load(1)));
    await load(currentPage);
  }
  function sourceSection(profile) {
    const panel = el("section", "detail-source detail-panel"); panel.append(el("h2", "", t("sourceNotes")));
    panel.append(el("p", "source-id", profile.id));
    if (profile.data_notes?.length) { const list = el("ul", "source-note-list"); profile.data_notes.forEach(note => list.append(el("li", "", note))); panel.append(list); }
    else panel.append(el("p", "portal-subtle", t("actualSource")));
    panel.append(provenance(profile)); return panel;
  }
  function calendarPanel(profile, selectedDate) {
    const calendar = profile.calendar || metadata.calendar;
    const busy = new Set(profile.busy_dates || []);
    let selected = selectedDate >= calendar.min && selectedDate <= calendar.max ? selectedDate : "2026-10-09";
    if (selected < calendar.min || selected > calendar.max) selected = calendar.min;
    let month = new Date(selected.slice(0, 7) + "-01T12:00:00");
    const panel = el("aside", "calendar-panel"); panel.append(el("span", "section-index", "КҮН / ДАТА"), el("h2", "", t("calendarTitle")), el("p", "calendar-intro", t("calendarHint")));
    const calendarBody = el("div"); panel.append(calendarBody);
    const choice = el("div", "calendar-choice"); panel.append(choice);
    const match = button(t("selectConditions") + " ↗", "portal-button full-width", () => sendToMatch({ city: profile.city, category: profile.categories?.[0] || "", date: selected, event_format: profile.event_formats?.[0] || "", budget_kzt: profile.price_from_kzt, language: "", duration_hours: null, preferences: "" }));
    panel.append(match, el("p", "calendar-footnote", t("availabilityNote")));
    function draw() {
      calendarBody.replaceChildren();
      const monthLabel = new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", { month: "long", year: "numeric" }).format(month);
      const controls = el("div", "calendar-controls");
      const prev = button("←", "calendar-arrow", () => { month.setMonth(month.getMonth() - 1); draw(); }); prev.setAttribute("aria-label", t("prevMonth"));
      const next = button("→", "calendar-arrow", () => { month.setMonth(month.getMonth() + 1); draw(); }); next.setAttribute("aria-label", t("nextMonth"));
      const monthValue = month.getFullYear() + "-" + String(month.getMonth() + 1).padStart(2, "0"); prev.disabled = monthValue <= calendar.min.slice(0, 7); next.disabled = monthValue >= calendar.max.slice(0, 7);
      controls.append(prev, el("h3", "", monthLabel), next); calendarBody.append(controls);
      const weekdays = el("div", "calendar-weekdays"); t("weekdays").forEach(day => weekdays.append(el("span", "", day))); calendarBody.append(weekdays);
      const grid = el("div", "calendar-grid");
      const start = (month.getDay() + 6) % 7;
      for (let n = 0; n < start; n++) { const spacer = el("span", "calendar-spacer"); spacer.setAttribute("aria-hidden", "true"); grid.append(spacer); }
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= days; day++) {
        const value = monthValue + "-" + String(day).padStart(2, "0"); const isBusy = busy.has(value); const isSelected = value === selected;
        const cell = button(day, "calendar-day " + (isBusy ? "is-busy" : "is-free") + (isSelected ? " is-selected" : ""), () => { selected = value; const params = new URLSearchParams(location.search); params.set("date", selected); history.replaceState(null, "", location.pathname + "?" + params.toString()); draw(); });
        cell.disabled = value < calendar.min || value > calendar.max; cell.setAttribute("aria-pressed", String(isSelected)); cell.setAttribute("aria-label", dateText(value) + ", " + t(isBusy ? "busy" : "available")); grid.append(cell);
      }
      calendarBody.append(grid);
      const legend = el("div", "calendar-legend"); const busyLegend = el("span", ""); busyLegend.append(el("i", "busy-dot"), document.createTextNode(t("busy"))); const freeLegend = el("span", ""); freeLegend.append(el("i", "free-dot"), document.createTextNode(language === "kk" ? "Белгі жоқ" : "Нет занятости")); legend.append(busyLegend, freeLegend); calendarBody.append(legend);
      choice.replaceChildren(el("span", "calendar-choice-label", t("selectedDate")), el("strong", "", dateText(selected)), el("span", "availability-status " + (busy.has(selected) ? "status-busy" : "status-free"), t(busy.has(selected) ? "busy" : "available")));
    }
    draw(); return panel;
  }
  async function detailPage(version) {
    const id = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
    const profile = await api("/api/contractors/" + encodeURIComponent(id) + "?ui_language=" + language);
    if (version !== pageVersion) return;
    document.title = profile.name + " — Firebird";
    main.replaceChildren(link("← " + t("backCatalog"), "/catalog", "portal-back"));
    const hero = el("section", "profile-hero"); const avatar = el("div", "profile-avatar", initials(profile.name)); avatar.setAttribute("aria-hidden", "true");
    const copy = el("div", "profile-hero-copy"); copy.append(el("div", "eyebrow", t("source")), el("h1", "", profile.name), el("p", "profile-location", tr(profile.city) + " · " + (profile.categories || []).map(tr).join(" · ")));
    hero.append(avatar, copy, storeActions(profile)); main.append(hero);
    const layout = el("div", "detail-layout"); const content = el("div", "detail-content");
    const facts = el("div", "detail-facts");
    [[t("price"), money(profile.price_from_kzt)], [t("duration"), profile.max_hours ? profile.max_hours + " " + t("hours") : t("notSpecified")]].forEach(([label, value]) => { const fact = el("div", "detail-fact"); fact.append(el("span", "", label), el("strong", "", value)); facts.append(fact); });
    content.append(facts);
    const description = el("section", "detail-panel"); description.append(el("h2", "", t("description")), el("p", "original-label", t("originalDescription")), el("div", "original-description", profile.description || t("notSpecified"))); content.append(description);
    const service = el("section", "detail-panel services-panel"); service.append(el("h2", "", t("formats")), pillList(profile.event_formats), el("h2", "", t("languages")), pillList(profile.languages)); content.append(service, sourceSection(profile));
    layout.append(content, calendarPanel(profile, new URLSearchParams(location.search).get("date") || "2026-10-09")); main.append(layout); updateStoreUI(); announce(profile.name);
  }
  async function savedPage(version) {
    document.title = "Firebird — " + t("saved");
    main.replaceChildren(titleBlock(t("savedEyebrow"), t("savedTitle"), t("savedSubtitle"), link(t("compare") + " ↗", "/compare", "portal-button secondary")), el("p", "browser-note", t("browserNote")));
    const ids = store.getFavorites();
    if (!ids.length) { empty(main, t("savedEmpty"), t("savedEmptyText"), t("openCatalog"), "/catalog"); return; }
    const result = el("section"); main.append(result); loading(result);
    const profiles = await Promise.allSettled(ids.map(id => api("/api/contractors/" + encodeURIComponent(id) + "?ui_language=" + language)));
    if (version !== pageVersion) return;
    if (profiles.every(response => response.status === "rejected")) { failure(result, profiles[0].reason, renderPage); return; }
    result.replaceChildren(); const grid = el("div", "directory-grid"); let missing = 0;
    profiles.forEach(response => { if (response.status === "fulfilled") grid.append(profileCard(response.value)); else missing++; });
    if (missing) result.append(el("p", "portal-warning", t("unavailableSaved")));
    result.append(el("div", "catalog-result-heading", t("found") + ": " + (profiles.length - missing)), grid); updateStoreUI();
  }
  async function comparePage(version) {
    document.title = "Firebird — " + t("compare");
    main.replaceChildren(titleBlock(t("compareEyebrow"), t("compareTitle"), t("compareSubtitle"), link(t("compareAddMore") + " ↗", "/catalog", "portal-button secondary")));
    const ids = store.getCompare();
    if (!ids.length) { empty(main, t("compareEmpty"), t("compareEmptyText"), t("openCatalog"), "/catalog", "⇄"); return; }
    const selected = new URLSearchParams(location.search).get("date") || "2026-10-09";
    const toolbar = el("div", "compare-toolbar"); const field = el("div", "field"); const label = el("label", "", t("compareDate")); label.htmlFor = "compare-date"; const date = el("input"); date.id = "compare-date"; date.type = "date"; date.min = metadata.calendar.min; date.max = metadata.calendar.max; date.value = selected; date.required = true; field.append(label, date); toolbar.append(field, el("p", "", t("availabilityNote"))); main.append(toolbar);
    const result = el("div"); main.append(result);
    let request = 0;
    async function load() {
      if (!date.reportValidity()) return;
      const ownRequest = ++request;
      history.replaceState(null, "", "/compare?date=" + encodeURIComponent(date.value)); loading(result);
      try {
        const data = await api("/api/compare?" + queryString({ ids: ids.join(","), date: date.value, ui_language: language }));
        if (version !== pageVersion || ownRequest !== request) return;
        result.replaceChildren();
        result.append(el("p", "compare-mobile-hint", t("horizontalHint")));
        const overflow = el("div", "comparison-overflow"); const table = el("table", "comparison-table");
        const caption = el("caption", "sr-only", t("compare") + ": " + dateText(data.date)); table.append(caption);
        const head = el("thead"); const heading = el("tr"); const blank = el("th", "comparison-label", t("profile")); blank.scope = "col"; heading.append(blank);
        data.items.forEach(profile => {
          const th = el("th", "comparison-profile"); th.scope = "col"; const top = el("div", "comparison-profile-top"); top.append(el("span", "directory-avatar", initials(profile.name)), button(t("removeCompare") + " ×", "text-button", () => store.toggleCompare(profile.id)));
          th.append(top, link(profile.name, "/contractor/" + encodeURIComponent(profile.id) + "?date=" + encodeURIComponent(date.value), "comparison-name"), storeActions(profile, true)); heading.append(th);
        }); head.append(heading); table.append(head);
        const body = el("tbody");
        const rows = [
          [t("price"), profile => el("strong", "comparison-price", (language === "ru" ? "от " : "") + money(profile.price_from_kzt) + (language === "kk" ? " бастап" : ""))],
          [t("city"), profile => el("span", "", tr(profile.city))],
          [t("categories"), profile => pillList(profile.categories)],
          [t("availability"), profile => el("span", "availability-status " + (profile.available_on_date === false ? "status-busy" : "status-free"), profile.available_on_date === null ? t("noDate") : t(profile.available_on_date ? "available" : "busy"))],
          [t("formats"), profile => pillList(profile.event_formats)],
          [t("languages"), profile => pillList(profile.languages)],
          [t("duration"), profile => el("span", "", profile.max_hours ? profile.max_hours + " " + t("hours") : t("notSpecified"))],
          [t("dataOrigin"), profile => { const box = el("div"); const provenanceNode = provenance(profile); box.append(provenanceNode); if (!provenanceNode.childElementCount) box.append(el("span", "portal-subtle", t("sourceProfile"))); return box; }],
          [t("description"), profile => { const details = el("details", "comparison-description"); details.append(el("summary", "", t("description")), el("p", "", profile.description)); return details; }]
        ];
        rows.forEach(([label, render]) => { const row = el("tr"); const th = el("th", "comparison-label", label); th.scope = "row"; row.append(th); data.items.forEach(profile => { const cell = el("td"); cell.append(render(profile)); row.append(cell); }); body.append(row); }); table.append(body); overflow.append(table); result.append(overflow); updateStoreUI(); announce(t("compare") + ": " + data.items.length);
      } catch (error) { if (version === pageVersion && ownRequest === request) failure(result, error, load); }
    }
    date.addEventListener("change", load); await load();
  }
  function historyPage() {
    document.title = "Firebird — " + t("history");
    main.replaceChildren(titleBlock(t("historyEyebrow"), t("historyTitle"), t("historySubtitle"), link(t("startMatch") + " ↗", "/", "portal-button secondary")), el("p", "browser-note", t("browserNote")));
    const records = store.getHistory();
    if (!records.length) { empty(main, t("historyEmpty"), t("historyEmptyText"), t("startMatch"), "/", "↺"); return; }
    const list = el("div", "history-list");
    records.forEach(record => {
      const query = record.query; const card = el("article", "history-card"); const top = el("div", "history-card-top");
      const copy = el("div"); let created = ""; const instant = new Date(record.created_at); if (!Number.isNaN(instant.getTime())) created = new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(instant);
      copy.append(el("p", "history-created", created), el("h2", "", tr(query.category) + " · " + tr(query.city)), el("p", "history-summary", [dateText(query.date), tr(query.event_format), money(query.budget_kzt)].filter(Boolean).join(" · ")));
      top.append(copy, button(t("rerun") + " ↗", "portal-button secondary", () => sendToMatch(query))); card.append(top);
      const bottom = el("div", "history-bottom"); bottom.append(el("span", "", (record.card_ids?.length || 0) + " " + t("resultCount")));
      const details = el("details", "history-details"); details.append(el("summary", "", t("queryDetails")));
      const rows = el("dl"); [[t("date"), dateText(query.date)], [t("budget"), money(query.budget_kzt)], [t("languages"), query.language ? tr(query.language) : t("notSpecified")], [t("duration"), query.duration_hours ? query.duration_hours + " " + t("hours") : t("notSpecified")], [t("preferences"), query.preferences || t("notSpecified")]].forEach(([label, value]) => { const row = el("div"); row.append(el("dt", "", label), el("dd", "", value)); rows.append(row); });
      details.append(rows); bottom.append(details); card.append(bottom); list.append(card);
    }); main.append(list);
  }
  async function renderPage() {
    const version = ++pageVersion; loading(main); translateChrome();
    try {
      if (!metadata) metadata = await api("/api/meta");
      if (version !== pageVersion) return;
      document.querySelector("#portal-profile-count").textContent = metadata.stats?.profiles ?? 66;
      if (route === "detail") await detailPage(version);
      else if (route === "saved") await savedPage(version);
      else if (route === "compare") await comparePage(version);
      else if (route === "history") historyPage();
      else await catalogPage(version);
    } catch (error) { if (version === pageVersion) failure(main, error, renderPage); }
  }
  document.querySelectorAll("[data-language]").forEach(node => node.addEventListener("click", () => store.setLanguage(node.dataset.language)));
  window.addEventListener("firebird:storechange", event => {
    updateStoreUI();
    if (event.detail?.key === "language") { language = store.getLanguage(); renderPage(); }
    else if ((route === "saved" && event.detail?.key === "favorites") || (route === "compare" && event.detail?.key === "compare") || (route === "history" && event.detail?.key === "history")) renderPage();
  });
  renderPage();
})();
