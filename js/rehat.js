'use strict';
/*
 * Masa Rehat: setiap N minit (lalai 10) permainan berhenti dan murid
 * menjawab soalan daripada SEMUA mata pelajaran Darjah 1, kemudian
 * buat aktiviti badan ringkas sebelum boleh sambung bermain.
 */
const Rehat = (() => {
  const $ = id => document.getElementById(id);
  let active = false, queue = [], idx = 0, tries = 0, earned = 0, firstTry = 0, locked = false;
  let actT = 0, actTimer = null, voluntary = false, overrideSec = null;
  const hooks = { onStart: null, onEnd: null };

  // ?rehat=30 dalam URL → rehat setiap 30 saat (untuk ujian)
  try {
    const q = new URLSearchParams(location.search).get('rehat');
    if (q && +q > 0) overrideSec = Math.max(5, +q);
  } catch (e) { /* abaikan */ }

  function intervalSec() { return overrideSec || Save.d.settings.intervalMin * 60; }
  function remaining() { return Math.max(0, intervalSec() - Save.d.rehat.elapsed); }
  let saveAcc = 0;
  function tick(dt) {
    if (active) return;
    Save.d.rehat.elapsed += dt;
    saveAcc += dt;
    if (saveAcc > 5) { saveAcc = 0; Save.save(); }
    if (Save.d.rehat.elapsed >= intervalSec()) start(false);
  }

  function enabledSubjects() {
    const en = Save.d.settings.subjects || {};
    const list = Subjek.SENARAI.filter(s => en[s.id] !== false);
    return list.length ? list : Subjek.SENARAI;
  }

  function buildQueue() {
    const per = Math.max(1, Math.min(3, Save.d.settings.perSubject | 0 || 1));
    const out = [];
    for (const s of enabledSubjects()) for (let i = 0; i < per; i++) out.push({ s, q: Subjek.pilih(s, Save.d.asked) });
    return out;
  }

  function show(panel) {
    for (const id of ['rh-intro', 'rh-quiz', 'rh-activity', 'rh-summary']) $(id).classList.toggle('hidden', id !== panel);
  }

  function start(isVoluntary) {
    if (active) return;
    active = true; voluntary = !!isVoluntary;
    Save.d.rehat.pending = !voluntary;
    Save.save();
    queue = buildQueue(); idx = 0; earned = 0; firstTry = 0;
    const mins = Math.round(intervalSec() / 60);
    $('rh-intro-title').textContent = voluntary ? 'MASA BELAJAR!' : 'MASA REHAT!';
    $('rh-intro-msg').innerHTML = voluntary
      ? 'Jom belajar! Jawab soalan daripada <b>semua mata pelajaran Darjah 1</b> untuk dapatkan syiling 🪙 dan naik taraf robot.'
      : `Kamu sudah bermain ${overrideSec ? overrideSec + ' saat' : mins + ' minit'}. Robot Perkasa perlu <b>dicas semula</b> 🔋<br>Jawab soalan daripada <b>semua mata pelajaran Darjah 1</b> untuk mengecas robot dan dapatkan syiling 🪙.`;
    const subs = [...new Set(queue.map(x => x.s))];
    $('rh-intro-subjects').innerHTML = subs.map(s => `<span class="chip" style="--c:${s.warna}">${s.ikon} ${s.nama}</span>`).join('');
    $('rh-dots').innerHTML = queue.map((x, i) => `<span class="dot" data-i="${i}" style="--c:${x.s.warna}" title="${x.s.nama}">${x.s.ikon}</span>`).join('');
    show('rh-intro');
    $('scr-rehat').classList.add('show');
    Sfx.play('alarm');
    if (hooks.onStart) hooks.onStart(voluntary);
  }

  function setBattery() {
    const pct = Math.round((idx / queue.length) * 100);
    $('rh-bat').style.width = pct + '%';
    $('rh-bat-txt').textContent = pct + '%';
  }

  function showQuestion() {
    const cur = queue[idx], q = cur.q, s = cur.s;
    tries = 0; locked = false;
    show('rh-quiz');
    setBattery();
    document.querySelectorAll('#rh-dots .dot').forEach((d, i) => {
      d.classList.toggle('now', i === idx);
      d.classList.toggle('done', i < idx);
    });
    const card = $('rh-card');
    card.style.setProperty('--c', s.warna);
    $('rh-subj').textContent = `${s.ikon} ${s.nama}`;
    const g = $('rh-gambar');
    g.textContent = q.g || '';
    g.classList.toggle('hidden', !q.g);
    const len = q.g ? [...q.g].length : 0;
    g.classList.toggle('many', len > 7);
    g.classList.toggle('lots', len > 14);
    g.setAttribute('dir', /[؀-ۿ]/.test(q.g || '') ? 'rtl' : 'ltr');
    g.classList.toggle('arab', /[؀-ۿ]/.test(q.g || ''));
    $('rh-sebutan').textContent = q.sb ? `(${q.sb})` : '';
    $('rh-sebutan').classList.toggle('hidden', !q.sb);
    $('rh-q').textContent = q.q;
    $('rh-q').setAttribute('lang', s.lang.slice(0, 2));
    $('rh-listen').classList.toggle('hidden', !q.au);
    const opts = $('rh-opts');
    opts.innerHTML = '';
    opts.className = 'opts n' + q.pilihan.length;
    q.pilihan.forEach(o => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = o;
      if (/[؀-ۿ]/.test(o)) b.classList.add('arab');
      b.addEventListener('click', () => answer(b, o));
      opts.appendChild(b);
    });
    $('rh-feedback').textContent = '';
    $('rh-feedback').className = 'feedback';
    $('rh-next').classList.add('hidden');
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    if (q.au) setTimeout(() => { if (active && queue[idx] === cur) Sfx.playNotes(q.au); }, 450);
  }

  function answer(btn, opt) {
    if (locked) return;
    const cur = queue[idx], q = cur.q;
    Save.d.stats.answered += tries === 0 ? 1 : 0;
    if (opt === q.b) {
      locked = true;
      btn.classList.add('betul');
      document.querySelectorAll('#rh-opts .opt').forEach(b => { if (b !== btn) b.classList.add('faded'); });
      const reward = tries === 0 ? 50 : tries === 1 ? 20 : 10;
      earned += reward;
      if (tries === 0) { firstTry++; Save.d.stats.correct++; }
      Sfx.play('correct');
      const fb = $('rh-feedback');
      fb.className = 'feedback good';
      fb.innerHTML = `✅ ${Subjek.pick(Subjek.PUJIAN)} <span class="plus">+${reward} 🪙</span>` + (q.i ? `<br><span class="info">💡 ${q.i}</span>` : '');
      const dot = document.querySelector(`#rh-dots .dot[data-i="${idx}"]`);
      if (dot) dot.classList.add('done');
      $('rh-next').classList.remove('hidden');
      $('rh-next').focus({ preventScroll: true });
    } else {
      tries++;
      btn.classList.add('salah');
      btn.disabled = true;
      Sfx.play('wrong');
      const fb = $('rh-feedback');
      fb.className = 'feedback bad';
      fb.textContent = '❌ ' + Subjek.pick(Subjek.CUBA);
      const card = $('rh-card');
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    }
    Save.save();
  }

  function next() {
    Sfx.play('click');
    idx++;
    if (idx < queue.length) showQuestion();
    else activity();
  }

  function activity() {
    show('rh-activity');
    $('rh-bat').style.width = '100%';
    const a = Subjek.pick(Subjek.AKTIVITI);
    $('rh-act-icon').textContent = a.ikon;
    $('rh-act-text').textContent = a.teks;
    actT = 20;
    const btn = $('rh-act-done');
    btn.disabled = true;
    $('rh-act-timer').textContent = actT;
    clearInterval(actTimer);
    actTimer = setInterval(() => {
      actT--;
      $('rh-act-timer').textContent = Math.max(0, actT);
      if (actT > 0) Sfx.play('tick');
      if (actT <= 0) { clearInterval(actTimer); btn.disabled = false; $('rh-act-timer').textContent = '✔'; Sfx.play('coin'); }
    }, 1000);
  }

  function summary() {
    show('rh-summary');
    const n = queue.length, bonus = 100;
    $('rh-sum-title').textContent = firstTry === n ? 'SEMPURNA! 🌟' : firstTry >= n * 0.6 ? 'HEBAT!' : 'BAGUS, TERUS BERUSAHA!';
    $('rh-sum-msg').innerHTML = `Kamu jawab <b>${firstTry}</b> daripada <b>${n}</b> soalan dengan betul pada cubaan pertama.`;
    $('rh-sum-coins').textContent = `+${earned + bonus} 🪙  (termasuk bonus rehat +${bonus})`;
    earned += bonus;
    Sfx.play('win');
  }

  function end() {
    if (!active) return;
    Sfx.play('coin');
    active = false;
    Save.d.coins += earned;
    Save.d.stats.breaks++;
    Save.d.rehat.elapsed = 0;
    Save.d.rehat.pending = false;
    Save.save();
    $('scr-rehat').classList.remove('show');
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { }
    if (hooks.onEnd) hooks.onEnd(earned);
  }

  function speakCurrent() {
    const cur = queue[idx];
    if (!cur) return;
    const q = cur.q;
    Sfx.speak(q.qs || q.q, cur.s.lang);
  }

  function bind() {
    $('rh-start').addEventListener('click', () => { Sfx.play('click'); showQuestion(); });
    $('rh-next').addEventListener('click', next);
    $('rh-speak').addEventListener('click', speakCurrent);
    $('rh-listen').addEventListener('click', () => { const c = queue[idx]; if (c && c.q.au) Sfx.playNotes(c.q.au); });
    $('rh-act-done').addEventListener('click', () => { clearInterval(actTimer); Sfx.play('click'); summary(); });
    $('rh-end').addEventListener('click', end);
  }

  return {
    tick, start, remaining, intervalSec, bind, hooks,
    get active() { return active; }
  };
})();
