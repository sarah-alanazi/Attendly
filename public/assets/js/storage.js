export const storage = {
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
    get(key, fallback=null) {
      const v = localStorage.getItem(key);
      if (!v) return fallback;
      try { return JSON.parse(v); } catch { return fallback; }
    },
    remove(key){ localStorage.removeItem(key); },
    clear(){ localStorage.clear(); }
  };
  