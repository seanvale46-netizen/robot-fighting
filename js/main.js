'use strict';
/* Gam UI: skrin menu, garaj, keputusan, tetapan ibu bapa dan gelung utama. */
(() => {
  const $ = id => document.getElementById(id);
  const app = $('app'), cv = $('cv');
  const isTouch = () => window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  Save.load();
  Sfx.setEnabled(Save.d.settings.sound);
  Game.init(cv);
  Rehat.bind();

  // ───────────── Saiz skrin ─────────────
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    let w = vw, h = vw * 9 / 16;
    if (h > vh) { h = vh; w = vh * 16 / 9; }
    w = Math.floor(w); h = Math.floor(h);
    app.style.width = w + 'px'; app.style.height = h + 'px';
    app.style.fontSize = (w / 960 * 16) + 'px';
    Game.resize(w, h, Math.min(2, window.devicePixelRatio || 1));
    document.body.classList.toggle('portrait', vh > vw && isTouch());
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 200));
  layout();

  // ───────────── Skrin ─────────────
  const SCREENS = ['scr-menu', 'scr-result', 'scr-garage', 'scr-pause', 'scr-gate', 'scr-settings'];
  let current = 'scr-menu';
  function show(id) {
    current = id;
    for (const s of SCREENS) $(s).classList.toggle('show', s === id);
    const fighting = id === null && Game.scene === 'fight';
    $('btn-pause').classList.toggle('hidden', !fighting);
    $('touch').classList.toggle('hidden', !(fighting && isTouch()));
    $('keys-hint').classList.add('hidden');
    refreshInfo();
  }
  function refreshInfo() {
    document.querySelectorAll('.coin-val').forEach(e => e.textContent = Save.d.coins);
    $('play-level').textContent = 'Peringkat ' + Save.d.level;
    $('gar-level').textContent = 'Peringkat ' + Save.d.level;
    $('btn-sound').textContent = Save.d.settings.sound ? '🔊' : '🔇';
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

  function goMenu() { Game.setPaused(false); Game.showMenu(); show('scr-menu'); }
  function goGarage() { Game.setPaused(false); Game.showGarage(); buildGarage(); show('scr-garage'); }
  function fight(level) {
    Sfx.unlock();
    Game.startLevel(level || Save.d.level);
    show(null);
    if (!isTouch()) { $('keys-hint').classList.remove('hidden'); clearTimeout(fight._t); fight._t = setTimeout(() => $('keys-hint').classList.add('hidden'), 7000); }
  }

  // ───────────── Keputusan ─────────────
  let lastResult = null;
  Game.cb.onResult = r => {
    lastResult = r;
    let coins;
    if (r.win) {
      coins = 80 + r.level * 20;
      const perfect = r.hpPct >= 0.7;
      if (perfect) coins += 50;
      Save.d.stats.wins++;
      if (r.level >= Save.d.level) Save.d.level = r.level + 1;
      Save.d.maxLevel = Math.max(Save.d.maxLevel, Save.d.level);
      $('res-title').textContent = '🏆 MENANG!';
      $('res-title').className = 'win';
      $('res-msg').innerHTML = `Kamu kalahkan <b>${r.enemy}</b>!` + (perfect ? '<br>⭐ Bonus hebat: nyawa masih banyak! (+50)' : '') +
        (r.level === Game.MUSUH.length ? '<br>👑 Tahniah! Kamu kalahkan Raja Gerhana! Musuh seterusnya lebih kuat!' : '');
      $('res-next').textContent = '▶ Peringkat ' + (r.level + 1);
    } else {
      coins = 25;
      Save.d.stats.losses++;
      $('res-title').textContent = '💥 ALAMAK, KALAH!';
      $('res-title').className = 'lose';
      $('res-msg').innerHTML = `<b>${r.enemy}</b> terlalu kuat kali ini.<br>Jangan putus asa! Naik taraf robot di 🔧 Garaj, atau belajar 📚 untuk dapat lebih syiling.`;
      $('res-next').textContent = '🔁 Cuba Lagi';
    }
    Save.d.coins += coins;
    Save.save();
    $('res-coins').textContent = `+${coins} 🪙`;
    show('scr-result');
    Sfx.play('coin');
  };

  // ───────────── Garaj ─────────────
  const UPG = [
    { id: 'kuasa', ikon: '💪', nama: 'Kuasa Tumbukan', desc: 'Serangan lebih kuat' },
    { id: 'perisai', ikon: '🛡️', nama: 'Perisai Besi', desc: 'Nyawa lebih banyak & lebih tahan' },
    { id: 'laju', ikon: '🚀', nama: 'Enjin Pendorong', desc: 'Bergerak lebih laju' },
    { id: 'tenaga', ikon: '⚡', nama: 'Teras Tenaga', desc: 'Kuasa khas cepat penuh' },
  ];
  const MAXL = 10;
  const cost = l => Math.round((120 + l * 80 + l * l * 40) / 10) * 10;

  function buildGarage() {
    const ul = $('upg-list');
    ul.innerHTML = '';
    for (const u of UPG) {
      const lv = Save.d.upg[u.id];
      const c = cost(lv), maxed = lv >= MAXL;
      const row = document.createElement('div');
      row.className = 'upg';
      row.innerHTML = `<div class="upg-ico">${u.ikon}</div>
        <div class="upg-info"><b>${u.nama}</b><span>${u.desc}</span>
        <div class="lv">${Array.from({ length: MAXL }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>`;
      const b = document.createElement('button');
      b.className = 'btn buy ' + (maxed ? 'gray' : Save.d.coins >= c ? 'primary' : 'locked');
      b.innerHTML = maxed ? 'MAKS ⭐' : `⬆ 🪙 ${c}`;
      b.disabled = maxed;
      b.addEventListener('click', () => {
        if (Save.d.coins < c) { Sfx.play('wrong'); toast('Syiling tidak cukup! Main atau belajar 📚 untuk dapat lebih 🪙'); return; }
        Save.d.coins -= c; Save.d.upg[u.id]++; Save.save();
        Sfx.play('buy');
        Game.showGarage();
        buildGarage(); refreshInfo();
      });
      row.appendChild(b);
      ul.appendChild(row);
    }
    const sl = $('skin-list');
    sl.innerHTML = '';
    Game.SKINS.forEach((s, i) => {
      const own = Save.d.skins.includes(i), on = Save.d.skin === i;
      const b = document.createElement('button');
      b.className = 'skin' + (on ? ' on' : '') + (own ? '' : ' lock');
      b.style.setProperty('--m', s.main); b.style.setProperty('--a', s.accent);
      b.title = s.nama;
      b.innerHTML = `<span class="sw"></span><small>${own ? s.nama : '🪙 ' + s.harga}</small>`;
      b.addEventListener('click', () => {
        if (!own) {
          if (Save.d.coins < s.harga) { Sfx.play('wrong'); toast('Syiling tidak cukup untuk cat ini!'); return; }
          Save.d.coins -= s.harga; Save.d.skins.push(i); Sfx.play('buy');
        } else Sfx.play('click');
        Save.d.skin = i; Save.save();
        Game.refreshLook();
        buildGarage(); refreshInfo();
      });
      sl.appendChild(b);
    });
  }

  let toastT = null;
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; app.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ───────────── Pintu ibu bapa & tetapan ─────────────
  let gateAns = 0, gateIn = '', gateReturn = 'scr-menu';
  function openGate() {
    gateReturn = current || 'scr-menu';
    const a = 6 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 4);
    gateAns = a * b; gateIn = '';
    $('gate-q').textContent = `${a} × ${b}`;
    $('gate-a').textContent = '?';
    show('scr-gate');
  }
  function buildPad() {
    const pad = $('gate-pad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].forEach(k => {
      const b = document.createElement('button');
      b.className = 'btn ' + (k === 'OK' ? 'primary' : 'gray');
      b.textContent = k;
      b.addEventListener('click', () => {
        Sfx.play('click');
        if (k === '⌫') gateIn = gateIn.slice(0, -1);
        else if (k === 'OK') {
          if (+gateIn === gateAns) { openSettings(); return; }
          gateIn = ''; Sfx.play('wrong');
          const g = $('gate-a'); g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
        } else if (gateIn.length < 3) gateIn += k;
        $('gate-a').textContent = gateIn || '?';
      });
      pad.appendChild(b);
    });
  }
  function seg(el, values, cur, label, onPick) {
    el.innerHTML = '';
    for (const v of values) {
      const b = document.createElement('button');
      b.className = 'btn small ' + (v === cur ? 'primary' : 'gray');
      b.textContent = label(v);
      b.addEventListener('click', () => { Sfx.play('click'); onPick(v); });
      el.appendChild(b);
    }
  }
  function openSettings() {
    const S = Save.d.settings;
    seg($('set-interval'), [5, 10, 15, 20], S.intervalMin, v => v + ' minit', v => { S.intervalMin = v; Save.save(); openSettings(); });
    seg($('set-per'), [1, 2, 3], S.perSubject, v => v + ' soalan', v => { S.perSubject = v; Save.save(); openSettings(); });
    const box = $('set-subjects');
    box.innerHTML = '';
    for (const s of Subjek.SENARAI) {
      const on = S.subjects[s.id] !== false;
      const b = document.createElement('button');
      b.className = 'chip toggle' + (on ? ' on' : '');
      b.style.setProperty('--c', s.warna);
      b.textContent = (on ? '✔ ' : '✖ ') + s.ikon + ' ' + s.nama;
      b.addEventListener('click', () => {
        const count = Subjek.SENARAI.filter(x => S.subjects[x.id] !== false).length;
        if (on && count <= 1) { toast('Sekurang-kurangnya satu subjek mesti dipilih.'); return; }
        S.subjects[s.id] = !on; Save.save(); Sfx.play('click'); openSettings();
      });
      box.appendChild(b);
    }
    const st = Save.d.stats;
    $('set-stats').innerHTML = `📊 Rehat selesai: <b>${st.breaks}</b> &nbsp;•&nbsp; Jawapan betul (cubaan pertama): <b>${st.correct}</b>/<b>${st.answered}</b> &nbsp;•&nbsp; Menang: <b>${st.wins}</b> &nbsp;•&nbsp; Kalah: <b>${st.losses}</b>`;
    show('scr-settings');
  }

  // ───────────── Butang ─────────────
  const on = (id, fn) => $(id).addEventListener('click', e => { Sfx.unlock(); fn(e); });
  on('btn-play', () => { Sfx.play('click'); fight(Save.d.level); });
  on('btn-garage', () => { Sfx.play('click'); goGarage(); });
  on('btn-learn', () => { Sfx.play('click'); Rehat.start(true); });
  on('btn-parent', () => { Sfx.play('click'); openGate(); });
  on('btn-sound', () => {
    Save.d.settings.sound = !Save.d.settings.sound; Save.save();
    Sfx.setEnabled(Save.d.settings.sound); refreshInfo(); Sfx.play('click');
  });
  on('res-next', () => { Sfx.play('click'); fight(lastResult && lastResult.win ? lastResult.level + 1 : (lastResult ? lastResult.level : Save.d.level)); });
  on('res-garage', () => { Sfx.play('click'); goGarage(); });
  on('res-menu', () => { Sfx.play('click'); goMenu(); });
  on('gar-fight', () => { Sfx.play('click'); fight(Save.d.level); });
  on('gar-menu', () => { Sfx.play('click'); goMenu(); });
  on('btn-pause', () => pause(true));
  on('pause-resume', () => pause(false));
  on('pause-menu', () => { Sfx.play('click'); goMenu(); });
  on('gate-cancel', () => { Sfx.play('click'); returnFromParent(); });
  on('set-back', () => { Sfx.play('click'); returnFromParent(); });
  on('set-break', () => { Sfx.play('click'); returnFromParent(); Rehat.start(false); });
  on('set-reset', () => {
    if (confirm('Set semula semua kemajuan (syiling, peringkat, naik taraf)? Tetapan akan kekal.')) {
      Save.reset(); Game.refreshLook(); toast('Kemajuan telah diset semula.'); openSettings();
    }
  });
  function returnFromParent() {
    if (gateReturn === 'scr-garage') goGarage();
    else if (gateReturn === 'scr-result') show('scr-result');
    else goMenu();
  }
  buildPad();

  function pause(v) {
    if (Game.scene !== 'fight' || Rehat.active) return;
    if (v && (Game.phase === 'done')) return;
    Sfx.play('click');
    Game.setPaused(v);
    show(v ? 'scr-pause' : null);
  }

  // ───────────── Rehat ─────────────
  Rehat.hooks.onStart = () => {
    Game.setFrozen(true);
    $('touch').classList.add('hidden');
    $('btn-pause').classList.add('hidden');
  };
  Rehat.hooks.onEnd = earned => {
    Game.setFrozen(false);
    toast(`+${earned} 🪙 dari Masa Rehat! Robot dicas penuh 🔋`);
    if (current === null) show(null);
    else if (current === 'scr-garage') { buildGarage(); show('scr-garage'); }
    else show(current);
  };

  // ───────────── Papan kekunci ─────────────
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'punch', KeyJ: 'punch', KeyX: 'kick', KeyK: 'kick',
    KeyC: 'block', KeyL: 'block', ArrowDown: 'block', KeyS: 'block',
    KeyV: 'dodge', KeyI: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge',
    Space: 'special', KeyU: 'special', ArrowUp: 'special', KeyW: 'special'
  };
  window.addEventListener('keydown', e => {
    Sfx.unlock();
    if (Rehat.active) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { pause(!Game.paused); e.preventDefault(); return; }
    const k = KEYMAP[e.code];
    if (k && Game.scene === 'fight' && !Game.paused) {
      e.preventDefault();
      if (!e.repeat) Game.key(k, true);
    }
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (k) Game.key(k, false);
  });
  window.addEventListener('blur', () => Game.clearInput());

  // ───────────── Kawalan sentuh ─────────────
  document.querySelectorAll('#touch .tc').forEach(b => {
    const k = b.dataset.k;
    const down = e => { e.preventDefault(); Sfx.unlock(); b.classList.add('on'); Game.key(k, true); if (b.setPointerCapture && e.pointerId != null) try { b.setPointerCapture(e.pointerId); } catch (_) { } };
    const up = e => { e.preventDefault(); b.classList.remove('on'); Game.key(k, false); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  document.addEventListener('pointerdown', () => Sfx.unlock(), { passive: true });
  document.addEventListener('gesturestart', e => e.preventDefault());

  // Jeda automatik bila tab disembunyikan
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Save.save(); if (Game.scene === 'fight' && !Game.paused && !Rehat.active && Game.phase === 'fight') pause(true); }
  });
  window.addEventListener('pagehide', () => Save.save());

  // ───────────── Gelung utama ─────────────
  let last = performance.now(), infoT = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!Rehat.active && !Game.paused && !document.hidden && current !== 'scr-gate' && current !== 'scr-settings') Rehat.tick(dt);
    Game.update(dt);
    Game.render();
    infoT -= dt;
    if (infoT <= 0) {
      infoT = 0.5;
      const t = fmt(Rehat.remaining());
      document.querySelectorAll('.rehat-left').forEach(e => e.textContent = t);
    }
    requestAnimationFrame(frame);
  }

  show('scr-menu');
  requestAnimationFrame(frame);
  // Jika rehat belum selesai sebelum muat semula, sambung rehat
  if (Save.d.rehat.pending) setTimeout(() => Rehat.start(false), 300);
})();
