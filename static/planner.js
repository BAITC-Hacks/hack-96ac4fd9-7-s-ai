"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const store = window.FirebirdStore;
  const copy = {
    kk: {
      skip: "Жоспарға өту", home: "Басты бет", match: "Іріктеу", planner: "Жоспар", catalog: "Каталог", saved: "Таңдаулылар", compare: "Салыстыру", history: "Тарих", eyebrow: "✳ БӘРІ БІР ЖОСПАРДА", title: "Бір іс-шара. Бір дайын команда.", subtitle: "Ортақ бюджетке команда жинаңыз, қолайлы күнді табыңыз және келесі қадамдарды жоспарлаңыз.", localNote: "Жоба осы браузерде сақталады", eventConditions: "Іс-шара шарттары", projectName: "Жоба атауы", projectPlaceholder: "Менің іс-шарам", city: "Қала", date: "Күні", format: "Іс-шара форматы", totalBudget: "Команданың ортақ бюджеті", services: "Қажетті қызметтер", addService: "+ Қызмет қосу", serviceHint: "1–4 санат. Әр қызметке жеке мердігер.", extra: "Қосымша шарттар", optional: "міндетті емес", language: "Тілі", duration: "Ұзақтығы, сағат", preferences: "Ерекше тілектер", preferencesPlaceholder: "Командалық ойындар, жайлы атмосфера…", conditionsChanged: "Шарттар өзгерді. Команданы қайта жинаңыз.", buildTeam: "Команда жинау", matchingNote: "Күн, қала және формат тексеріледі. Бағалар ортақ бюджетпен салыстырылады.", checklist: "Келесі қадамдар", newTask: "Жаңа міндет", checklistNote: "Мәтінді өзгертуге болады. Белгілер осы браузерде сақталады.", teamOptions: "Іс-шара командасы", dateRadar: "Күндер радары", nextDays: "Алдағы 14 күн", radarHint: "Басқа күнге ауыстырсаңыз, толық команда мен бастапқы баға қалай өзгеретінін көріңіз.", yourPlan: "Дайын жоспар — өзіңізбен бірге.", exportHint: "Таңдалған команданы, шығындарды және міндеттерді сақтап алыңыз.", localOnly: "Сақтау тек осы браузерде орындалады.", saveProject: "Жобаны сақтау", print: "Басып шығару", footer: "Іс-шараңызға дәл келетін адамдар", pricingNote: "Бастапқы бағалар. Соңғы құн мен күнді мердігерлермен нақтылаңыз.", loading: "Командалар жиналып жатыр…", loadingDetail: "Әр қызметке жеке мердігерді таңдап, толық команданың құнын есептеп жатырмыз.", anyLanguage: "Маңызды емес", remove: "Алып тастау", selected: "Таңдалды", teamCount: "команда", from: "бастап", remaining: "Бюджет қалдығы", breakdown: "Таңдалған команданың шығындары", total: "Барлығы", noTeam: "Толық команда табылмады", noTeamHint: "Басқа күнді қараңыз немесе төмендегі санаттар бойынша шарттарды өзгертіңіз.", minimumBudget: "Осы күнге толық команданың ең төменгі бастапқы құны", useBudget: "Осы бюджетті қолдану", audit: "Әр қызмет бойынша іріктеу", eligible: "сәйкес профиль", busy_date: "күнге бос емес", event_format: "формат сәйкес емес", languageExcluded: "тіл сәйкес емес", durationExcluded: "ұзақтық сәйкес емес", budgetGood: "Бюджетке сыяды", budgetHigh: "Бюджеттен жоғары", incomplete: "Толық команда жоқ", servicesShort: "қызмет", radarLegend: "Жасыл — бюджетке сыяды. Сарғыш — бюджеттен жоғары. Сұр — толық команда жоқ. Күнді басып, қайта есептеңіз.", error: "Жоспарды есептеу мүмкін болмады", retry: "Қайта көру", networkError: "Сервермен байланыс орнамады. Қайта көріңіз.", categoryError: "1–4 қызмет санатын таңдаңыз.", saveSuccess: "Жоба осы браузерде сақталды", savedAt: "Сақталды", sessionOnly: "Браузер сақтауға рұқсат бермеді. Өзгерістер осы бетте ғана сақталады.", refreshedFirst: "Экспорт алдында команданы қайта жинаңыз.", noExport: "Экспорт үшін толық команда таңдаңыз.", projectRestored: "Сақталған жоба ашылды. Бағалар қайта тексеріледі.", noRadar: "Осы күннен кейін каталогта тексерілетін күн қалмаған.", checked: "Дайын", unchecked: "Орындалмаған", generatedAt: "Жасалған уақыт", selectedTeam: "Таңдалған команда", sourceId: "Каталог ID", queryConditions: "Іс-шара шарттары", noValue: "Көрсетілмеген", hours: "сағат", taskConfirm: "Іс-шара шарттарын бекіту", taskTeam: "Ұсынылған команданы таңдау", taskDate: "Мердігерлермен күнді нақтылау", taskPrice: "Соңғы бағаны келісу", taskProgram: "Іс-шара бағдарламасын бекіту", noCategories: "Қызмет таңдаңыз", edited: "Сақталмаған өзгерістер", clearLast: "Кемінде бір қызмет қажет.", taskLimit: "Тізімде ең көбі 30 міндет болуы мүмкін."
    },
    ru: {
      skip: "Перейти к плану", home: "Главная", match: "Подбор", planner: "План события", catalog: "Каталог", saved: "Избранное", compare: "Сравнение", history: "История", eyebrow: "✳ ВСЁ В ОДНОМ ПЛАНЕ", title: "Одно событие. Готовая команда.", subtitle: "Соберите команду в общий бюджет, найдите подходящую дату и спланируйте следующие шаги.", localNote: "Проект сохраняется в этом браузере", eventConditions: "Условия события", projectName: "Название проекта", projectPlaceholder: "Моё событие", city: "Город", date: "Дата", format: "Формат события", totalBudget: "Общий бюджет команды", services: "Нужные услуги", addService: "+ Добавить услугу", serviceHint: "1–4 категории. Отдельный подрядчик на каждую услугу.", extra: "Дополнительные условия", optional: "необязательно", language: "Язык", duration: "Длительность, часов", preferences: "Особые пожелания", preferencesPlaceholder: "Командные игры, уютная атмосфера…", conditionsChanged: "Условия изменились. Соберите команду заново.", buildTeam: "Собрать команду", matchingNote: "Проверяем дату, город и формат. Стоимость сравниваем с общим бюджетом.", checklist: "Следующие шаги", newTask: "Новая задача", checklistNote: "Текст можно изменить. Отметки сохраняются в этом браузере.", teamOptions: "Команда события", dateRadar: "Радар дат", nextDays: "Следующие 14 дней", radarHint: "Посмотрите, как изменятся полная команда и начальная стоимость, если выбрать другую дату.", yourPlan: "Готовый план — всегда с вами.", exportHint: "Сохраните выбранную команду, расходы и следующие задачи.", localOnly: "Сохранение выполняется только в этом браузере.", saveProject: "Сохранить проект", print: "Печать", footer: "Те самые люди для вашего события", pricingNote: "Начальные цены. Итоговую стоимость и доступность даты уточните у подрядчиков.", loading: "Собираем команды…", loadingDetail: "Подбираем отдельного подрядчика на каждую услугу и считаем стоимость полной команды.", anyLanguage: "Неважно", remove: "Убрать", selected: "Выбрано", teamCount: "команды", from: "от", remaining: "Остаток бюджета", breakdown: "Расходы выбранной команды", total: "Итого", noTeam: "Полная команда не нашлась", noTeamHint: "Посмотрите другие даты или измените условия для отдельных услуг ниже.", minimumBudget: "Минимальная начальная стоимость полной команды на эту дату", useBudget: "Применить этот бюджет", audit: "Как прошёл отбор по каждой услуге", eligible: "подходящих профилей", busy_date: "заняты в эту дату", event_format: "не подходит формат", languageExcluded: "не подходит язык", durationExcluded: "не подходит длительность", budgetGood: "В рамках бюджета", budgetHigh: "Выше бюджета", incomplete: "Нет полной команды", servicesShort: "услуг", radarLegend: "Зелёный — в бюджете. Жёлтый — выше бюджета. Серый — нет полной команды. Нажмите на дату для нового расчёта.", error: "Не удалось рассчитать план", retry: "Попробовать снова", networkError: "Не удалось связаться с сервером. Попробуйте ещё раз.", categoryError: "Выберите от 1 до 4 категорий услуг.", saveSuccess: "Проект сохранён в этом браузере", savedAt: "Сохранено", sessionOnly: "Браузер запретил сохранение. Изменения доступны только на этой странице.", refreshedFirst: "Перед экспортом соберите команду заново.", noExport: "Для экспорта выберите полную команду.", projectRestored: "Сохранённый проект открыт. Проверяем цены заново.", noRadar: "После этой даты в каталоге больше нет дней для проверки.", checked: "Готово", unchecked: "Не выполнено", generatedAt: "Время создания", selectedTeam: "Выбранная команда", sourceId: "ID каталога", queryConditions: "Условия события", noValue: "Не указано", hours: "часов", taskConfirm: "Зафиксировать условия события", taskTeam: "Выбрать предложенную команду", taskDate: "Подтвердить дату с подрядчиками", taskPrice: "Согласовать итоговую цену", taskProgram: "Утвердить программу события", noCategories: "Выберите услуги", edited: "Есть несохранённые изменения", clearLast: "Нужна хотя бы одна услуга.", taskLimit: "В списке может быть не больше 30 задач."
    }
  };
  const kk = { "Зарубежье": "Шетел", "Банкетный зал": "Банкет залы", "Ведущий": "Жүргізуші", "Ведущий церемонии": "Рәсім жүргізушісі", "Видеограф": "Видеограф", "Декоратор": "Декоратор", "Загородная площадка": "Қала сыртындағы алаң", "Инструменталист": "Аспапшы", "Лайв-бэнд": "Жанды музыка тобы", "Национальный ансамбль": "Ұлттық ансамбль", "Отель": "Қонақүй", "Подарки и сувениры": "Сыйлықтар мен кәдесыйлар", "Ресторан": "Мейрамхана", "Танцевальный коллектив": "Би ұжымы", "Флорист": "Флорист", "Фото и видеобудки": "Фото және видеобудкалар", "Фотограф": "Фотограф", "Шоу-программа": "Шоу-бағдарлама", "корпоратив": "Корпоратив", "свадьба": "Үйлену тойы", "конференция": "Конференция", "юбилей": "Мерейтой", "день рождения": "Туған күн", "той": "Той", "русский": "Орыс тілі", "казахский": "Қазақ тілі", "английский": "Ағылшын тілі" };
  let language = store.getLanguage();
  copy.kk.demo = "Дайын мысал: корпоративке 4 қызмет ↗";
  copy.ru.demo = "Готовый пример: 4 услуги для корпоратива ↗";
  copy.kk.synthetic = "Синтетикалық профиль"; copy.ru.synthetic = "Синтетический профиль";
  copy.kk.priceImputed = "Баға толықтырылған"; copy.ru.priceImputed = "Цена дополнена";
  copy.kk.cityImputed = "Қала толықтырылған"; copy.ru.cityImputed = "Город дополнен";
  let metadata;
  let categories = ["Ведущий", "Флорист"];
  let lastResult = null;
  let selectedBundleId = null;
  let savedSelection = [];
  let requestVersion = 0;
  let controller = null;
  let loading = false;
  let toastTimer;
  let savedAt = null;
  const localMemory = {};
  function readLocal(key, fallback) { if (Object.prototype.hasOwnProperty.call(localMemory, key)) return localMemory[key]; try { const raw = localStorage.getItem(key); if (raw !== null) return localMemory[key] = JSON.parse(raw); } catch { /* Keep a usable empty workspace. */ } return fallback; }
  function writeLocal(key, value) { localMemory[key] = value; try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  const defaultTasks = ["taskConfirm", "taskTeam", "taskDate", "taskPrice", "taskProgram"].map((key, index) => ({ id: "task-" + index, key, done: false }));
  let tasks = readLocal("firebird.plannerChecklist", defaultTasks);
  if (!Array.isArray(tasks)) tasks = defaultTasks;
  tasks = tasks.filter(task => task && typeof task.id === "string" && (typeof task.text === "string" || typeof task.key === "string")).slice(0, 30);
  const t = key => copy[language][key] || key;
  const tr = value => language === "kk" ? kk[value] || value : value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  function el(tag, className = "", content) { const node = document.createElement(tag); if (className) node.className = className; if (content !== null && content !== undefined) node.textContent = String(content); return node; }
  function button(content, className, handler) { const node = el("button", className, content); node.type = "button"; if (handler) node.addEventListener("click", handler); return node; }
  function money(value) { return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value)) + " ₸"; }
  function dateText(value, short = false) { return new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", { day: "numeric", month: short ? "short" : "long", ...(short ? {} : { year: "numeric" }) }).format(new Date(value + "T12:00:00")); }
  function initials(name) { return String(name).split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase(); }
  function toast(message) { $(".firebird-toast")?.remove(); clearTimeout(toastTimer); const node = el("div", "firebird-toast", message); node.setAttribute("role", "status"); document.body.append(node); toastTimer = setTimeout(() => node.remove(), 3500); }
  function announce(message) { $("#planner-live").textContent = message; }
  function taskText(task) { return task.text || t(task.key); }
  function getQuery() { return { city: $("#plan-city").value, date: $("#plan-date").value, event_format: $("#plan-format").value, budget_kzt: Number($("#plan-budget").value), categories: [...categories], language: $("#plan-language").value, duration_hours: $("#plan-duration").value === "" ? null : Number($("#plan-duration").value), preferences: $("#plan-preferences").value.trim(), ui_language: language }; }
  function signature(query) { return JSON.stringify([query.city, query.date, query.event_format, Number(query.budget_kzt), [...(query.categories || [])].sort(), query.language || "", query.duration_hours == null || query.duration_hours === "" ? null : Number(query.duration_hours), (query.preferences || "").trim()]); }
  function isFresh() { return !!lastResult && signature(lastResult.query) === signature(getQuery()); }
  function selectedBundle() { return lastResult?.bundles?.find(bundle => bundle.id === selectedBundleId) || null; }
  function updateExports() { const disabled = !selectedBundle() || !isFresh() || loading; ["#export-txt", "#export-json", "#print-plan"].forEach(id => { $(id).disabled = disabled; }); }
  function updateCounters() { document.querySelectorAll("[data-store-count='favorites']").forEach(node => { node.textContent = store.getFavorites().length; }); document.querySelectorAll("[data-store-count='compare']").forEach(node => { node.textContent = store.getCompare().length; }); }
  function markDirty() {
    $("#plan-dirty").hidden = !lastResult || isFresh();
    $("#project-status").textContent = t("edited");
    const value = $("#plan-budget").value;
    $("#plan-budget-label").textContent = value && Number(value) >= 0 ? money(value) : "\u00a0";
    const extras = [];
    if ($("#plan-language").value) extras.push(tr($("#plan-language").value));
    if ($("#plan-duration").value) extras.push($("#plan-duration").value + (language === "kk" ? " сағ" : " ч"));
    if ($("#plan-preferences").value.trim()) extras.push(t("preferences"));
    $("#plan-extra-summary").textContent = extras.length ? extras.join(" · ") : t("optional");
    updateExports();
  }
  function setOptions(id, values, selected, anyLabel) { const select = $(id); select.replaceChildren(); if (anyLabel) { const option = el("option", "", anyLabel); option.value = ""; select.append(option); } values.forEach(value => { const option = el("option", "", tr(value)); option.value = value; select.append(option); }); if ([...select.options].some(option => option.value === selected)) select.value = selected; select.disabled = false; }
  function renderCategories() {
    const chips = $("#plan-category-chips"); chips.replaceChildren();
    categories.forEach(category => { const chip = el("span", "plan-category-chip"); const remove = button("×", "", () => { if (categories.length <= 1) { toast(t("clearLast")); return; } categories = categories.filter(value => value !== category); renderCategories(); markDirty(); }); remove.setAttribute("aria-label", t("remove") + ": " + tr(category)); chip.append(el("span", "", tr(category)), remove); chips.append(chip); });
    const picker = $("#plan-category-picker"); picker.replaceChildren(); const prompt = el("option", "", t("addService")); prompt.value = ""; picker.append(prompt);
    (metadata?.categories || []).filter(value => !categories.includes(value)).forEach(value => { const option = el("option", "", tr(value)); option.value = value; picker.append(option); });
    picker.disabled = !metadata || categories.length >= 4; $("#plan-category-count").textContent = categories.length + " / 4";
  }
  function fillQuery(query) { const mapping = { city: "#plan-city", date: "#plan-date", event_format: "#plan-format", budget_kzt: "#plan-budget", language: "#plan-language", duration_hours: "#plan-duration", preferences: "#plan-preferences" }; Object.entries(mapping).forEach(([key, id]) => { if (Object.prototype.hasOwnProperty.call(query, key)) $(id).value = query[key] == null ? "" : query[key]; }); if (Array.isArray(query.categories)) categories = [...new Set(query.categories)].filter(value => metadata.categories.includes(value)).slice(0, 4); if (!categories.length) categories = [metadata.categories[0]]; renderCategories(); markDirty(); }
  function translateStatic() {
    document.documentElement.lang = language; document.title = "Firebird — " + t("planner");
    document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-placeholder]").forEach(node => { node.placeholder = t(node.dataset.placeholder); });
    document.querySelectorAll("[data-language]").forEach(node => { const active = node.dataset.language === language; node.classList.toggle("active", active); node.setAttribute("aria-pressed", String(active)); });
    $("#checklist-add-button").setAttribute("aria-label", t("newTask"));
    if (metadata) { const query = getQuery(); setOptions("#plan-city", metadata.cities, query.city); setOptions("#plan-format", metadata.event_formats, query.event_format); setOptions("#plan-language", metadata.languages, query.language, t("anyLanguage")); renderCategories(); }
    renderChecklist(); updateCounters();
  }
  function persistTasks() { if (!writeLocal("firebird.plannerChecklist", tasks)) toast(t("sessionOnly")); }
  function renderChecklist() {
    const list = $("#checklist-items"); list.replaceChildren();
    tasks.forEach(task => {
      const row = el("div", "checklist-item" + (task.done ? " is-done" : ""));
      const checkbox = el("input"); checkbox.type = "checkbox"; checkbox.checked = !!task.done; checkbox.setAttribute("aria-label", taskText(task));
      checkbox.addEventListener("change", () => { task.done = checkbox.checked; persistTasks(); renderChecklist(); });
      const input = el("input"); input.type = "text"; input.value = taskText(task); input.maxLength = 160; input.setAttribute("aria-label", t("newTask"));
      input.addEventListener("change", () => { const value = input.value.trim(); if (value) { task.text = value; delete task.key; persistTasks(); checkbox.setAttribute("aria-label", value); } else input.value = taskText(task); });
      const remove = button("×", "checklist-remove", () => { tasks = tasks.filter(value => value.id !== task.id); persistTasks(); renderChecklist(); }); remove.setAttribute("aria-label", t("remove") + ": " + taskText(task));
      row.append(checkbox, input, remove); list.append(row);
    });
    const complete = tasks.filter(task => task.done).length;
    $("#checklist-count").textContent = complete + " / " + tasks.length;
    $("#checklist-progress-bar").style.width = (tasks.length ? complete / tasks.length * 100 : 0) + "%";
  }
  function budgetBreakdown(bundle) {
    const box = el("div", "budget-breakdown"); const heading = el("div", "budget-breakdown-heading"); heading.append(el("h3", "", t("breakdown")), el("span", "", t("totalBudget") + ": " + money(lastResult.query.budget_kzt))); box.append(heading);
    const bar = el("div", "budget-bar"); bar.setAttribute("role", "img"); bar.setAttribute("aria-label", t("total") + ": " + money(bundle.total_price_from_kzt) + ". " + t("remaining") + ": " + money(bundle.budget_remaining_kzt));
    const legend = el("div", "budget-legend");
    bundle.items.forEach(item => { const segment = el("span", "budget-segment"); segment.style.width = Math.max(0, Math.min(100, item.price_from_kzt / Math.max(1, lastResult.query.budget_kzt) * 100)) + "%"; segment.title = tr(item.category) + ": " + money(item.price_from_kzt); bar.append(segment); const entry = el("span"); entry.append(el("i"), document.createTextNode(tr(item.category) + " · " + money(item.price_from_kzt))); legend.append(entry); });
    box.append(bar, legend); const remaining = el("div", "budget-remainder"); remaining.append(el("span", "", t("remaining")), el("strong", "", money(bundle.budget_remaining_kzt))); box.append(remaining); return box;
  }
  function teamCard(bundle) {
    const selected = bundle.id === selectedBundleId; const card = el("article", "team-card" + (selected ? " is-selected" : "")); card.dataset.bundleId = bundle.id;
    const heading = el("div", "team-card-heading"); const label = el("label", "team-select-label");
    const radio = el("input"); radio.type = "radio"; radio.name = "selected-team"; radio.value = bundle.id; radio.checked = selected; radio.addEventListener("change", () => { selectedBundleId = bundle.id; $("#project-status").textContent = t("edited"); renderResults(); updateExports(); });
    label.append(radio, el("span", "team-title", bundle.label)); if (selected) label.append(el("span", "team-chosen-badge", t("selected")));
    const total = el("div", "team-total"); total.append(el("strong", "", money(bundle.total_price_from_kzt)), el("small", "", t("remaining") + " " + money(bundle.budget_remaining_kzt))); heading.append(label, total); card.append(heading);
    const list = el("div", "team-provider-list");
    bundle.items.forEach(item => {
      const row = el("div", "team-provider"); const avatar = el("span", "team-provider-avatar", initials(item.name)); avatar.setAttribute("aria-hidden", "true");
      const identity = el("div", "team-provider-identity"); const profile = el("a", "team-provider-name", item.name); profile.href = "/contractor/" + encodeURIComponent(item.id) + "?date=" + encodeURIComponent(lastResult.query.date); identity.append(el("span", "team-provider-category", tr(item.category)), profile);
      const price = el("div", "team-provider-price", (language === "ru" ? "от " : "") + money(item.price_from_kzt)); if (language === "kk") price.append(el("span", "", t("from")));
      row.append(avatar, identity, price, el("p", "team-provider-why", item.explanation));
      if (item.synthetic || item.price_imputed || item.city_imputed) { const notes = el("div", "team-provider-provenance"); if (item.synthetic) notes.append(el("span", "provenance-label", t("synthetic"))); if (item.price_imputed) notes.append(el("span", "provenance-label", t("priceImputed"))); if (item.city_imputed) notes.append(el("span", "provenance-label", t("cityImputed"))); row.append(notes); }
      list.append(row);
    }); card.append(list); if (bundle.explanation) card.append(el("p", "team-explanation", bundle.explanation)); return card;
  }
  function auditPanel() {
    const panel = el("details", "plan-audit"); panel.open = !lastResult.bundles?.length; panel.append(el("summary", "", t("audit"))); const body = el("div", "plan-audit-body");
    (lastResult.summary?.category_results || []).forEach(result => { const row = el("div", "plan-audit-row"); row.append(el("h4", "", tr(result.category) + " · " + result.eligible_count + " " + t("eligible"))); const reasons = []; const keys = { busy_date: "busy_date", event_format: "event_format", language: "languageExcluded", duration: "durationExcluded" }; Object.entries(keys).forEach(([key, label]) => { if (result.excluded_counts?.[key]) reasons.push(result.excluded_counts[key] + " " + t(label)); }); if (result.message) row.append(el("p", "", result.message)); if (reasons.length) row.append(el("p", "", reasons.join(" · "))); body.append(row); });
    if (lastResult.ranking_method) body.append(el("p", "plan-pricing-note", lastResult.ranking_method)); panel.append(body); return panel;
  }
  function renderResults() {
    const container = $("#plan-results"); container.replaceChildren();
    const bundles = (lastResult.bundles || []).slice(0, 3); $("#plan-team-count").textContent = bundles.length + " " + t("teamCount");
    if (lastResult.summary?.message) container.append(el("p", "plan-summary", lastResult.summary.message));
    if (bundles.length) {
      const selected = selectedBundle(); if (selected) container.append(budgetBreakdown(selected));
      const list = el("div", "team-list"); bundles.forEach(bundle => list.append(teamCard(bundle))); container.append(list);
    } else {
      const empty = el("div", "plan-no-team"); empty.append(el("h3", "", t("noTeam")), el("p", "", t("noTeamHint")));
      const minimum = lastResult.summary?.minimum_feasible_total_kzt;
      if (minimum !== null && minimum !== undefined && minimum > lastResult.query.budget_kzt) { const suggestion = el("div", "plan-minimum"); suggestion.append(el("div", "", t("minimumBudget") + ": " + money(minimum))); suggestion.append(button(t("useBudget") + " ↗", "", () => { $("#plan-budget").value = minimum; markDirty(); runPlan(); })); empty.append(suggestion); }
      container.append(empty);
    }
    if (lastResult.pricing_note) container.append(el("p", "plan-pricing-note", lastResult.pricing_note));
    container.append(auditPanel());
  }
  function renderRadar() {
    const container = $("#plan-radar"); container.replaceChildren();
    const days = lastResult.date_radar || [];
    if (!days.length) { container.append(el("p", "radar-legend", t("noRadar"))); return; }
    days.forEach(day => {
      const complete = !!day.complete_bundle_possible; const available = complete && day.within_budget;
      const node = button("", "radar-day" + (!complete ? " is-unavailable" : !available ? " is-over-budget" : ""), () => { $("#plan-date").value = day.date; markDirty(); runPlan({ scroll: true }); });
      node.dataset.radarDate = day.date;
      node.title = Object.entries(day.candidate_counts || {}).map(([category, count]) => tr(category) + ": " + count).join(" · ");
      node.append(el("span", "radar-date", dateText(day.date, true)), el("span", "radar-coverage", day.covered_categories + " / " + day.total_categories + " " + t("servicesShort")));
      const price = el("span", "radar-price", day.min_total_price_from_kzt == null ? "—" : money(day.min_total_price_from_kzt)); price.append(el("span", "radar-status", t(!complete ? "incomplete" : available ? "budgetGood" : "budgetHigh"))); node.append(price); container.append(node);
    }); container.append(el("p", "radar-legend", t("radarLegend")));
  }
  function renderLoading() {
    const box = el("div", "portal-loading planner-pending"); box.setAttribute("role", "status"); box.append(el("span", "portal-spinner"), el("span", "", t("loading")), el("p", "", t("loadingDetail"))); $("#plan-results").replaceChildren(box); $("#plan-team-count").textContent = ""; $("#plan-radar").replaceChildren();
  }
  function renderFailure(message) { const box = el("div", "plan-no-team"); box.append(el("h3", "", t("error")), el("p", "", message), button(t("retry"), "portal-button secondary", () => metadata ? runPlan() : initialize())); $("#plan-results").replaceChildren(box); $("#plan-radar").replaceChildren(); announce(message); }
  function setLoading(value) { loading = value; $("#plan-submit").disabled = value || !metadata; $("#plan-submit-text").textContent = t(value ? "loading" : "buildTeam"); $("#plan-submit").classList.toggle("loading", value); $("#plan-results").setAttribute("aria-busy", String(value)); updateExports(); }
  async function runPlan(options = {}) {
    if (!metadata || !$("#planner-form").reportValidity()) return;
    if (categories.length < 1 || categories.length > 4) { toast(t("categoryError")); return; }
    const query = getQuery(); const version = ++requestVersion;
    if (controller) controller.abort(); controller = new AbortController(); const ownController = controller;
    const timeout = setTimeout(() => ownController.abort(), 25000);
    $("#plan-form-error").hidden = true; $("#plan-dirty").hidden = true; setLoading(true); renderLoading(); announce(t("loading"));
    if (options.scroll && window.matchMedia("(max-width: 760px)").matches) $(".planner-results-column").scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const response = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(query), signal: ownController.signal });
      let result; try { result = await response.json(); } catch { throw new Error(t("networkError")); }
      if (!response.ok) throw new Error(result.error || t("networkError"));
      if (version !== requestVersion) return;
      if (!Array.isArray(result.bundles) || !result.query) throw new Error(t("networkError"));
      const previousSelection = selectedBundle()?.items?.map(item => item.id) || savedSelection;
      const sameIds = bundle => JSON.stringify(bundle.items.map(item => item.id).sort()) === JSON.stringify([...previousSelection].sort());
      selectedBundleId = result.bundles.find(sameIds)?.id || result.bundles[0]?.id || null;
      lastResult = result; savedSelection = [];
      renderResults(); renderRadar(); $("#plan-dirty").hidden = isFresh();
      announce(result.summary?.message || (result.bundles.length + " " + t("teamCount")));
    } catch (error) {
      if (version !== requestVersion) return;
      lastResult = null; selectedBundleId = null;
      const message = error.name === "AbortError" || error instanceof TypeError ? t("networkError") : error.message;
      $("#plan-form-error").textContent = message; $("#plan-form-error").hidden = false; renderFailure(message);
    } finally { clearTimeout(timeout); if (version === requestVersion) setLoading(false); }
  }
  function saveProject() {
    if (!metadata || !$("#planner-form").reportValidity()) return;
    const record = { name: $("#project-name").value.trim(), query: getQuery(), selected_bundle_ids: isFresh() ? selectedBundle()?.items?.map(item => item.id) || [] : [], saved_at: new Date().toISOString() };
    const persisted = writeLocal("firebird.plannerProject", record); persistTasks(); savedAt = record.saved_at;
    $("#project-status").textContent = persisted ? t("savedAt") + " " + new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(savedAt)) : t("sessionOnly");
    toast(t(persisted ? "saveSuccess" : "sessionOnly"));
  }
  function exportObject() {
    if (!isFresh()) { toast(t("refreshedFirst")); return null; }
    const bundle = selectedBundle(); if (!bundle) { toast(t("noExport")); return null; }
    return { project_name: $("#project-name").value.trim() || t("projectPlaceholder"), generated_at: new Date().toISOString(), query: lastResult.query, selected_bundle: bundle, checklist: tasks.map(task => ({ text: taskText(task), done: !!task.done })), pricing_note: lastResult.pricing_note || t("pricingNote"), ranking_method: lastResult.ranking_method || "" };
  }
  function textExport(record) {
    const query = record.query; const team = record.selected_bundle;
    const lines = ["FIREBIRD — " + record.project_name, "", t("queryConditions"), t("city") + ": " + tr(query.city), t("date") + ": " + dateText(query.date), t("format") + ": " + tr(query.event_format), t("totalBudget") + ": " + money(query.budget_kzt), t("services") + ": " + query.categories.map(tr).join(", ")];
    if (query.language) lines.push(t("language") + ": " + tr(query.language));
    if (query.duration_hours) lines.push(t("duration") + ": " + query.duration_hours);
    if (query.preferences) lines.push(t("preferences") + ": " + query.preferences);
    lines.push("", t("selectedTeam") + ": " + team.label);
    team.items.forEach(item => lines.push("", tr(item.category) + " — " + item.name, t("sourceId") + ": " + item.id, money(item.price_from_kzt) + " (" + t("from") + ")", item.explanation));
    lines.push("", t("total") + ": " + money(team.total_price_from_kzt), t("remaining") + ": " + money(team.budget_remaining_kzt), "", t("checklist"));
    record.checklist.forEach(task => lines.push((task.done ? "[x] " : "[ ] ") + task.text));
    lines.push("", record.pricing_note, "", t("generatedAt") + ": " + record.generated_at);
    return lines.join("\n");
  }
  function download(format) { const record = exportObject(); if (!record) return; const content = format === "json" ? JSON.stringify(record, null, 2) : textExport(record); const blob = new Blob(format === "json" ? [content] : ["\uFEFF", content], { type: format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = el("a"); anchor.href = url; anchor.download = "firebird-plan-" + record.query.date + "." + format; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function printPlan() {
    const record = exportObject(); if (!record) return;
    const container = $("#print-content"); container.replaceChildren(el("p", "print-note", "FIREBIRD / " + t("planner")), el("h1", "", record.project_name));
    container.append(el("p", "", [tr(record.query.city), dateText(record.query.date), tr(record.query.event_format)].join(" · ")), el("p", "", t("totalBudget") + ": " + money(record.query.budget_kzt)), el("h2", "", t("selectedTeam") + ": " + record.selected_bundle.label));
    record.selected_bundle.items.forEach(item => { const block = el("div", "print-provider"); block.append(el("h3", "", tr(item.category) + " — " + item.name), el("p", "", money(item.price_from_kzt) + " · " + t("sourceId") + ": " + item.id), el("p", "", item.explanation)); container.append(block); });
    container.append(el("p", "print-total", t("total") + ": " + money(record.selected_bundle.total_price_from_kzt)), el("p", "", t("remaining") + ": " + money(record.selected_bundle.budget_remaining_kzt)), el("h2", "", t("checklist")));
    const list = el("ul"); record.checklist.forEach(task => list.append(el("li", "", (task.done ? "☑ " : "☐ ") + task.text))); container.append(list, el("p", "print-note", record.pricing_note)); window.print();
  }
  async function initialize() {
    translateStatic();
    try {
      const response = await fetch("/api/meta"); if (!response.ok) throw new Error(t("networkError")); metadata = await response.json();
      if (!metadata.categories?.length) throw new Error(t("networkError"));
      setOptions("#plan-city", metadata.cities, "Алматы"); setOptions("#plan-format", metadata.event_formats, "корпоратив"); setOptions("#plan-language", metadata.languages, "", t("anyLanguage"));
      if (metadata.calendar?.min) $("#plan-date").min = metadata.calendar.min; if (metadata.calendar?.max) $("#plan-date").max = metadata.calendar.max;
      const project = readLocal("firebird.plannerProject", null); if (project?.query) { fillQuery(project.query); $("#project-name").value = typeof project.name === "string" ? project.name : ""; savedSelection = Array.isArray(project.selected_bundle_ids) ? project.selected_bundle_ids : []; savedAt = project.saved_at; announce(t("projectRestored")); }
      try { const raw = sessionStorage.getItem("firebird.plannerPrefill"); if (raw) { sessionStorage.removeItem("firebird.plannerPrefill"); const query = JSON.parse(raw); if (query && typeof query === "object") { fillQuery(query); savedSelection = []; } } } catch { /* A malformed prefill does not block the workspace. */ }
      renderCategories(); markDirty(); $("#project-status").textContent = t("localNote"); $("#plan-submit").disabled = false; $("#plan-demo").disabled = false;
      await runPlan();
    } catch (error) { metadata = null; $("#plan-submit").disabled = true; renderFailure(error.message || t("networkError")); }
  }
  $("#planner-form").addEventListener("submit", event => { event.preventDefault(); runPlan({ scroll: true }); });
  $("#planner-form").addEventListener("input", markDirty);
  $("#planner-form").addEventListener("change", markDirty);
  $("#plan-category-picker").addEventListener("change", event => { const value = event.target.value; if (!value || categories.includes(value) || categories.length >= 4) return; categories.push(value); renderCategories(); markDirty(); });
  $("#checklist-add-form").addEventListener("submit", event => { event.preventDefault(); const input = $("#checklist-new"); const value = input.value.trim(); if (!value) return; if (tasks.length >= 30) { toast(t("taskLimit")); return; } tasks.push({ id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), text: value, done: false }); input.value = ""; persistTasks(); renderChecklist(); });
  $("#save-project").addEventListener("click", saveProject);
  $("#plan-demo").addEventListener("click", () => { fillQuery({ city: "Алматы", date: "2026-10-09", event_format: "корпоратив", categories: ["Ведущий", "Фотограф", "Банкетный зал", "Лайв-бэнд"], budget_kzt: 6000000, language: "", duration_hours: null, preferences: "" }); runPlan({ scroll: true }); });
  $("#export-txt").addEventListener("click", () => download("txt"));
  $("#export-json").addEventListener("click", () => download("json"));
  $("#print-plan").addEventListener("click", printPlan);
  document.querySelectorAll("[data-language]").forEach(node => node.addEventListener("click", () => store.setLanguage(node.dataset.language)));
  window.addEventListener("firebird:storechange", event => { updateCounters(); if (event.detail?.key === "language") { language = store.getLanguage(); translateStatic(); markDirty(); if (metadata) runPlan(); } });
  initialize();
})();
