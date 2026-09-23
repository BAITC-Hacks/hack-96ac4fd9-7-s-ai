"use strict";

(() => {
  const prefix = "firebird.";
  const memory = Object.create(null);
  function read(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(memory, key)) return memory[key] ?? fallback;
    try {
      const value = localStorage.getItem(prefix + key);
      if (value !== null) {
        try { memory[key] = JSON.parse(value); }
        catch { if (key === "language" && (value === "kk" || value === "ru")) memory[key] = value; }
      }
    } catch { /* The in-memory store remains usable when storage is unavailable. */ }
    return memory[key] ?? fallback;
  }
  function notify(key) { window.dispatchEvent(new CustomEvent("firebird:storechange", { detail: { key } })); }
  function write(key, value) {
    memory[key] = value;
    try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* Session-only fallback. */ }
    notify(key);
  }
  function ids(key) {
    const value = read(key, []);
    return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === "string" && id.length < 100))] : [];
  }
  function getFavorites() { return ids("favorites"); }
  function getCompare() { return ids("compare").slice(0, 3); }
  function getHistory() {
    const value = read("history", []);
    return Array.isArray(value) ? value.filter(item => item && typeof item.query === "object" && item.query !== null).slice(0, 10) : [];
  }
  function getLanguage() {
    const value = read("language", "kk");
    return value === "ru" ? "ru" : "kk";
  }
  const store = {
    getFavorites,
    toggleFavorite(id) {
      if (typeof id !== "string" || !id) return false;
      const current = getFavorites();
      const active = !current.includes(id);
      write("favorites", active ? [...current, id] : current.filter(value => value !== id));
      return active;
    },
    getCompare,
    toggleCompare(id) {
      const current = getCompare();
      if (current.includes(id)) {
        const next = current.filter(value => value !== id);
        write("compare", next);
        return { active: false, added: false, full: false, ids: next };
      }
      if (current.length >= 3 || typeof id !== "string" || !id) return { active: false, added: false, full: true, ids: current };
      const next = [...current, id];
      write("compare", next);
      return { active: true, added: true, full: false, ids: next };
    },
    getHistory,
    addHistory(entry) {
      if (!entry || !entry.query || typeof entry.query !== "object") return;
      const record = {
        id: entry.id || String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7),
        created_at: entry.created_at || new Date().toISOString(),
        query: { ...entry.query },
        card_ids: Array.isArray(entry.card_ids) ? entry.card_ids.filter(id => typeof id === "string") : []
      };
      delete record.query.previous_query;
      const comparable = query => JSON.stringify(Object.keys(query).filter(key => key !== "ui_language" && key !== "previous_query").sort().map(key => [key, query[key]]));
      const signature = comparable(record.query);
      const history = getHistory().filter(item => item.id !== record.id && comparable(item.query) !== signature);
      write("history", [record, ...history].slice(0, 10));
      return record;
    },
    getLanguage,
    setLanguage(language) {
      if (language !== "kk" && language !== "ru") return;
      write("language", language);
    }
  };
  window.FirebirdStore = store;
  window.addEventListener("storage", event => {
    if (!event.key || !event.key.startsWith(prefix)) return;
    const key = event.key.slice(prefix.length);
    try { memory[key] = event.newValue === null ? undefined : JSON.parse(event.newValue); } catch { memory[key] = event.newValue; }
    notify(key);
  });
})();
