'use strict';
/* Simpanan kemajuan dalam localStorage. */
const Save = (() => {
  const KEY = 'roboPerkasa.simpanan.v1';

  function defaults() {
    return {
      coins: 0,
      level: 1,          // peringkat seterusnya untuk dilawan
      maxLevel: 1,       // peringkat tertinggi yang dibuka
      upg: { kuasa: 0, perisai: 0, laju: 0, tenaga: 0 },
      skin: 0,
      skins: [0],
      rehat: { elapsed: 0, pending: false },
      settings: { intervalMin: 10, perSubject: 1, sound: true, subjects: {} },
      asked: {},
      stats: { breaks: 0, correct: 0, answered: 0, wins: 0, losses: 0 }
    };
  }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(base, src) {
    for (const k in src) {
      if (isObj(src[k]) && isObj(base[k])) merge(base[k], src[k]);
      else base[k] = src[k];
    }
    return base;
  }

  let data = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = merge(defaults(), JSON.parse(raw));
    } catch (e) { data = defaults(); }
    return data;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storan penuh / disekat */ }
  }
  function reset() {
    const s = data.settings;
    data = defaults();
    data.settings = s;
    save();
  }

  return { load, save, reset, get d() { return data; } };
})();
