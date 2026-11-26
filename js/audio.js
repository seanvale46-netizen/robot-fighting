'use strict';
/* Bunyi disintesis dengan Web Audio (tiada fail audio diperlukan) + suara (Text-to-Speech). */
const Sfx = (() => {
  let ac = null, master = null, noiseBuf = null, enabled = true;

  function ensure() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.5), ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
    return ac;
  }
  function unlock() {
    const a = ensure();
    if (a && a.state === 'suspended') a.resume();
  }

  function env(g, t0, v, a, d) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  }
  function tone(o, force) {
    if ((!enabled && !force) || !ensure()) return;
    const t0 = ac.currentTime + (o.delay || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.d);
    env(g, t0, (o.v ?? 0.3) * (o.vol ?? 1), o.a || 0.005, o.d);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + o.d + 0.05);
  }
  function noise(o) {
    if (!enabled || !ensure()) return;
    const t0 = ac.currentTime + (o.delay || 0);
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = o.ft || 'lowpass';
    f.frequency.setValueAtTime(o.fq || 1000, t0);
    if (o.fqTo) f.frequency.exponentialRampToValueAtTime(o.fqTo, t0 + o.d);
    const g = ac.createGain();
    env(g, t0, (o.v ?? 0.3) * (o.vol ?? 1), o.a || 0.004, o.d);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + o.d + 0.05);
  }
  function seq(notes, type, v, gap, d) {
    notes.forEach((f, i) => tone({ f, type, v, d: d || 0.16, delay: i * gap }));
  }

  const S = {
    punch: (vol) => { noise({ fq: 900, d: 0.12, v: 0.5, vol }); tone({ f: 150, to: 55, d: 0.16, v: 0.6, vol }); },
    kick: (vol) => { noise({ fq: 650, d: 0.2, v: 0.6, vol }); tone({ f: 110, to: 38, d: 0.26, v: 0.75, vol }); },
    boom: (vol) => { noise({ fq: 1400, fqTo: 120, d: 0.7, v: 0.7, vol }); tone({ f: 90, to: 30, d: 0.6, v: 0.7, vol }); },
    block: () => { tone({ f: 1250, type: 'square', d: 0.07, v: 0.1 }); tone({ f: 820, type: 'triangle', d: 0.18, v: 0.22 }); noise({ ft: 'highpass', fq: 3000, d: 0.08, v: 0.2 }); },
    whoosh: (vol) => { noise({ ft: 'bandpass', fq: 400, fqTo: 1800, d: 0.15, v: 0.16, vol }); },
    step: (vol) => { tone({ f: 62, to: 34, d: 0.2, v: 0.42, vol }); noise({ fq: 220, d: 0.16, v: 0.25, vol }); },
    charge: () => { tone({ f: 110, to: 700, type: 'sawtooth', d: 0.55, v: 0.1 }); tone({ f: 220, to: 1400, type: 'sine', d: 0.55, v: 0.08 }); },
    beam: () => { tone({ f: 620, to: 260, type: 'sawtooth', d: 0.7, v: 0.15 }); tone({ f: 90, type: 'square', d: 0.6, v: 0.08 }); noise({ ft: 'highpass', fq: 1800, d: 0.6, v: 0.12 }); },
    explode: () => { noise({ fq: 1500, fqTo: 90, d: 1.1, v: 0.75 }); tone({ f: 80, to: 28, d: 1.0, v: 0.65 }); },
    thunder: () => { noise({ fq: 500, fqTo: 60, d: 1.8, v: 0.5, a: 0.05 }); },
    dodge: () => { noise({ ft: 'highpass', fq: 900, fqTo: 4000, d: 0.22, v: 0.18 }); tone({ f: 300, to: 900, type: 'triangle', d: 0.18, v: 0.08 }); },
    click: () => { tone({ f: 660, type: 'square', d: 0.06, v: 0.07 }); },
    coin: () => { tone({ f: 988, type: 'square', d: 0.08, v: 0.08 }); tone({ f: 1319, type: 'square', d: 0.22, v: 0.08, delay: 0.08 }); },
    buy: () => { seq([523, 659, 784, 1047, 1319], 'triangle', 0.2, 0.06, 0.14); },
    correct: () => { seq([523, 659, 784, 1047], 'triangle', 0.25, 0.09, 0.16); },
    wrong: () => { tone({ f: 220, to: 180, type: 'square', d: 0.25, v: 0.1 }); tone({ f: 180, to: 140, type: 'square', d: 0.3, v: 0.1, delay: 0.16 }); },
    win: () => { seq([523, 659, 784, 1047, 784, 1047, 1319], 'square', 0.1, 0.12, 0.2); seq([262, 330, 392, 523], 'triangle', 0.2, 0.24, 0.3); },
    lose: () => { seq([392, 349, 330, 262, 196], 'triangle', 0.25, 0.22, 0.3); },
    beep: () => { tone({ f: 520, type: 'square', d: 0.14, v: 0.1 }); },
    go: () => { tone({ f: 880, type: 'square', d: 0.4, v: 0.12 }); tone({ f: 1320, type: 'triangle', d: 0.5, v: 0.12 }); },
    alarm: () => { [0, 0.3, 0.6].forEach(t => { tone({ f: 988, type: 'square', d: 0.14, v: 0.1, delay: t }); tone({ f: 784, type: 'square', d: 0.14, v: 0.1, delay: t + 0.15 }); }); seq([523, 659, 784, 1047], 'triangle', 0.2, 0.1, 0.25); },
    tick: () => { tone({ f: 1500, type: 'sine', d: 0.04, v: 0.06 }); },
    swoosh: (vol) => { noise({ ft: 'bandpass', fq: 300, fqTo: 2600, d: 0.25, v: 0.26, vol }); tone({ f: 200, to: 600, type: 'triangle', d: 0.2, v: 0.06, vol }); },
    upper: (vol) => { noise({ fq: 1200, d: 0.16, v: 0.55, vol }); tone({ f: 120, to: 420, d: 0.22, v: 0.5, vol }); tone({ f: 70, to: 40, d: 0.3, v: 0.5, vol }); },
    slash: () => { noise({ ft: 'highpass', fq: 1500, fqTo: 6000, d: 0.14, v: 0.3 }); tone({ f: 1800, to: 600, type: 'sawtooth', d: 0.12, v: 0.05 }); },
    saber: () => { tone({ f: 90, to: 140, type: 'sawtooth', d: 0.4, v: 0.1 }); tone({ f: 180, to: 280, type: 'square', d: 0.4, v: 0.04 }); noise({ ft: 'bandpass', fq: 2000, d: 0.3, v: 0.06 }); },
    missile: () => { noise({ ft: 'bandpass', fq: 800, fqTo: 3000, d: 0.3, v: 0.16 }); tone({ f: 300, to: 900, type: 'square', d: 0.15, v: 0.03 }); },
    freeze: () => { [1568, 2093, 2637, 3136].forEach((f, i) => tone({ f, type: 'sine', d: 0.3, v: 0.07, delay: i * 0.04 })); noise({ ft: 'highpass', fq: 5000, d: 0.4, v: 0.08 }); },
    shatter: () => { noise({ ft: 'highpass', fq: 2500, d: 0.45, v: 0.3 }); [2349, 3136, 2794, 3520].forEach((f, i) => tone({ f, type: 'triangle', d: 0.15, v: 0.06, delay: i * 0.03 })); },
    jump: () => { tone({ f: 180, to: 520, type: 'triangle', d: 0.18, v: 0.12 }); noise({ fq: 400, d: 0.15, v: 0.2 }); },
    superCharge: () => {
      tone({ f: 110, to: 880, type: 'sawtooth', d: 0.9, v: 0.09 }); tone({ f: 220, to: 1760, type: 'sine', d: 0.9, v: 0.07 });
      noise({ ft: 'bandpass', fq: 300, fqTo: 4000, d: 0.9, v: 0.12, a: 0.3 });
      seq([523, 659, 784, 1047], 'triangle', 0.14, 0.18, 0.4);
    },
    superDive: () => { noise({ ft: 'bandpass', fq: 3000, fqTo: 300, d: 0.4, v: 0.3 }); tone({ f: 900, to: 120, type: 'sawtooth', d: 0.4, v: 0.08 }); },
    superHit: () => {
      noise({ fq: 2000, fqTo: 60, d: 1.6, v: 0.85 }); tone({ f: 70, to: 25, d: 1.4, v: 0.8 });
      seq([1047, 1319, 1568, 2093], 'square', 0.07, 0.07, 0.35);
    },
    zap: () => { tone({ f: 60, to: 1200, type: 'sawtooth', d: 0.45, v: 0.08 }); noise({ ft: 'highpass', fq: 3000, d: 0.45, v: 0.1 }); },
  };

  function play(name, vol) { const f = S[name]; if (f) try { f(vol); } catch (e) { /* abaikan */ } }

  // Mainkan bunyi untuk soalan muzik (sentiasa berbunyi walaupun bunyi game dimatikan)
  function playNotes(notes) {
    if (!ensure()) return;
    unlock();
    notes.forEach(n => {
      if (n.drum) tone({ f: n.f, to: n.f * 0.4, d: n.d, v: n.v, delay: n.t }, true);
      else tone({ f: n.f, type: 'triangle', d: n.d, v: n.v, delay: n.t, a: 0.02 }, true);
    });
  }

  // Suara: baca soalan untuk murid Darjah 1
  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return false;
    const s = window.speechSynthesis;
    try {
      s.cancel();
      const clean = String(text).replace(/\p{Extended_Pictographic}/gu, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
      const u = new SpeechSynthesisUtterance(clean);
      const voices = s.getVoices() || [];
      const want = (lang || 'ms-MY').toLowerCase();
      const pre = want.slice(0, 2);
      const norm = v => (v.lang || '').replace('_', '-').toLowerCase();
      let v = voices.find(x => norm(x) === want) || voices.find(x => norm(x).startsWith(pre));
      if (!v && pre === 'ms') v = voices.find(x => norm(x).startsWith('id'));
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang || 'ms-MY';
      u.rate = 0.9; u.pitch = 1.05;
      s.speak(u);
      return true;
    } catch (e) { return false; }
  }
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { } }

  return {
    unlock, play, playNotes, speak,
    setEnabled(v) { enabled = !!v; },
    get enabled() { return enabled; }
  };
})();
