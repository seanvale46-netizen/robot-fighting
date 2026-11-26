'use strict';
/*
 * Bank soalan Masa Rehat — semua mata pelajaran Darjah 1 (KSSR).
 * Format setiap soalan:
 *   q  : soalan (teks)
 *   b  : jawapan betul
 *   s  : senarai jawapan salah
 *   g  : gambar / emoji besar (pilihan)
 *   sb : sebutan (pilihan, contoh untuk Bahasa Arab)
 *   i  : info / fakta selepas jawab betul (pilihan)
 *   qs : teks untuk dibacakan (pilihan, jika lain daripada q)
 *   au : bunyi untuk soalan muzik (pilihan)
 * Soalan juga boleh ditulis sebagai fungsi yang menjana soalan rawak.
 */
const Subjek = (() => {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Nombor salah yang hampir dengan jawapan
  function near(ans, spread, min = 0, count = 3) {
    const out = new Set();
    let guard = 0;
    while (out.size < count && guard++ < 200) {
      const v = ans + R(-spread, spread);
      if (v !== ans && v >= min) out.add(v);
    }
    let k = 1;
    while (out.size < count) out.add(ans + spread + k++);
    return [...out].map(String);
  }

  const BENDA = ['🍎', '🍊', '⭐', '🎈', '🐟', '🌸', '⚽', '🍓', '🚗', '🐤'];
  const NAMA_BENDA = { '🍎': 'epal', '🍊': 'oren', '⭐': 'bintang', '🎈': 'belon', '🐟': 'ikan', '🌸': 'bunga', '⚽': 'bola', '🍓': 'strawberi', '🚗': 'kereta', '🐤': 'anak ayam' };
  const PERKATAAN = ['kosong', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan', 'sepuluh',
    'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'lapan belas', 'sembilan belas', 'dua puluh'];

  const SENARAI = [
    // ───────────────────────── BAHASA MELAYU ─────────────────────────
    {
      id: 'bm', nama: 'Bahasa Melayu', ikon: '📖', warna: '#e4572e', lang: 'ms-MY',
      bank: [
        { g: '🐱', q: 'Apakah nama haiwan ini?', b: 'kucing', s: ['kambing', 'kuda', 'katak'] },
        { g: '🐟', q: 'Apakah nama haiwan ini?', b: 'ikan', s: ['itik', 'ular', 'ayam'] },
        { g: '🐘', q: 'Apakah nama haiwan ini?', b: 'gajah', s: ['harimau', 'zirafah', 'arnab'] },
        { q: 'Yang manakah huruf vokal?', b: 'a', s: ['b', 'k', 'm'], i: 'Huruf vokal ialah a, e, i, o dan u.' },
        { q: 'Yang manakah huruf vokal?', b: 'o', s: ['t', 's', 'p'], i: 'Huruf vokal ialah a, e, i, o dan u.' },
        { q: 'Yang manakah huruf vokal?', b: 'i', s: ['r', 'g', 'n'], i: 'Huruf vokal ialah a, e, i, o dan u.' },
        { q: 'Gabungkan suku kata:  ba + ju', qs: 'Gabungkan suku kata ba dan ju', b: 'baju', s: ['buju', 'jaba', 'bajo'], i: 'ba + ju = baju 👕' },
        { q: 'Gabungkan suku kata:  bu + ku', qs: 'Gabungkan suku kata bu dan ku', b: 'buku', s: ['kubu', 'baku', 'bika'], i: 'bu + ku = buku 📘' },
        { q: 'Gabungkan suku kata:  ma + ta', qs: 'Gabungkan suku kata ma dan ta', b: 'mata', s: ['tama', 'mati', 'meta'], i: 'ma + ta = mata 👁️' },
        { q: 'Gabungkan suku kata:  bo + la', qs: 'Gabungkan suku kata bo dan la', b: 'bola', s: ['labo', 'bila', 'bulu'], i: 'bo + la = bola ⚽' },
        { g: '🏠', q: 'Lengkapkan perkataan:  ru _ ah', qs: 'Apakah huruf yang hilang dalam perkataan rumah?', b: 'm', s: ['p', 't', 'l'], i: 'r-u-m-a-h = rumah 🏠' },
        { g: '🦆', q: 'Lengkapkan perkataan:  i _ ik', qs: 'Apakah huruf yang hilang dalam perkataan itik?', b: 't', s: ['k', 'p', 's'], i: 'i-t-i-k = itik 🦆' },
        { q: 'Apakah huruf pertama bagi perkataan "ayam"?', b: 'a', s: ['y', 'm', 'e'] },
        { q: 'Apakah huruf pertama bagi perkataan "sekolah"?', b: 's', s: ['k', 'l', 'h'] },
        { q: 'Berapakah suku kata dalam perkataan "kereta"?', b: '3', s: ['2', '4', '1'], i: 'ke - re - ta ada 3 suku kata.' },
        { q: 'Berapakah suku kata dalam perkataan "bola"?', b: '2', s: ['1', '3', '4'], i: 'bo - la ada 2 suku kata.' },
        { q: 'Huruf selepas "b" ialah...', b: 'c', s: ['a', 'd', 'e'], i: 'a, b, c, d, e ...' },
        { g: '🚗', q: 'Ini ialah...', b: 'kereta', s: ['basikal', 'kapal', 'bas'] },
        { g: '🍌', q: 'Ini ialah buah...', b: 'pisang', s: ['epal', 'betik', 'tembikai'] },
        { q: 'Pilih ayat yang betul.', b: 'Ali makan nasi.', s: ['Ali nasi makan.', 'Makan Ali nasi.'] },
        { q: 'Pilih ayat yang betul.', b: 'Siti pergi ke sekolah.', s: ['Sekolah ke Siti pergi.', 'Pergi Siti sekolah ke.'] },
        { q: 'Apakah lawan kata "besar"?', b: 'kecil', s: ['tinggi', 'panjang', 'gemuk'] },
        { q: 'Apakah lawan kata "panas"?', b: 'sejuk', s: ['basah', 'terang', 'manis'] },
        { q: 'Apakah lawan kata "tinggi"?', b: 'rendah', s: ['besar', 'cantik', 'laju'] },
        { g: '☀️', q: 'Ini ialah...', b: 'matahari', s: ['bulan', 'bintang', 'awan'] },
        { q: 'Perkataan manakah bermula dengan huruf "g"?', b: 'gajah', s: ['kucing', 'arnab', 'zirafah'] },
        { g: '👟', q: 'Ini ialah...', b: 'kasut', s: ['baju', 'topi', 'beg'] },
        { q: 'Huruf besar bagi huruf "d" ialah...', b: 'D', s: ['B', 'P', 'Q'] },
        { g: '🐔', q: 'Pilih ejaan yang betul.', b: 'ayam', s: ['aiam', 'ayem', 'ajam'] },
      ]
    },

    // ───────────────────────── BAHASA INGGERIS ─────────────────────────
    {
      id: 'bi', nama: 'Bahasa Inggeris', ikon: '🔤', warna: '#3a86ff', lang: 'en-GB',
      bank: [
        { g: '🍎', q: 'What colour is this apple?', b: 'red', s: ['blue', 'purple', 'black'] },
        { g: '🐶', q: 'What animal is this?', b: 'dog', s: ['cat', 'cow', 'duck'] },
        { g: '🐘', q: 'What animal is this?', b: 'elephant', s: ['monkey', 'tiger', 'horse'] },
        { g: '🐄', q: 'What animal is this?', b: 'cow', s: ['goat', 'bird', 'fish'] },
        { q: 'Which letter comes after "A"?', b: 'B', s: ['C', 'D', 'Z'] },
        { q: 'Which letter comes after "D"?', b: 'E', s: ['C', 'F', 'B'] },
        { g: '🖐️', q: 'How many fingers are there?', b: 'five', s: ['four', 'six', 'three'] },
        { q: 'What do you say in the morning?', b: 'Good morning', s: ['Good night', 'Goodbye', 'Thank you'] },
        { g: '🍌', q: 'What colour is the banana?', b: 'yellow', s: ['red', 'blue', 'pink'] },
        { g: '🐟', q: '"Fish" begins with the letter...', b: 'f', s: ['s', 'h', 'p'] },
        { q: 'Which word rhymes with "cat"?', b: 'hat', s: ['dog', 'cup', 'sun'], i: 'c-at, h-at — cat and hat rhyme!' },
        { q: 'Which word rhymes with "pen"?', b: 'ten', s: ['pig', 'box', 'bus'], i: 'p-en, t-en — pen and ten rhyme!' },
        { g: '☀️', q: 'This is the...', b: 'sun', s: ['moon', 'star', 'tree'] },
        { q: '"Satu" in English is...', b: 'one', s: ['two', 'ten', 'three'] },
        { q: '"Merah" in English is...', b: 'red', s: ['green', 'blue', 'white'] },
        { g: '👁️', q: 'This is my...', b: 'eye', s: ['ear', 'nose', 'mouth'] },
        { g: '👃', q: 'This is my...', b: 'nose', s: ['eye', 'hand', 'leg'] },
        { q: 'Which one is a fruit?', b: 'mango 🥭', s: ['car 🚗', 'book 📘', 'chair 🪑'] },
        { g: '🔵', q: 'What colour is this?', b: 'blue', s: ['red', 'yellow', 'green'] },
        { q: '"What is your name?"  You answer...', b: 'My name is Ali.', s: ['I am seven.', 'I like cats.', 'Thank you.'] },
        { q: '"How old are you?"  You answer...', b: 'I am seven years old.', s: ['My name is Mei.', 'I like red.', 'Goodbye.'] },
        { q: 'What is the small letter of "G"?', b: 'g', s: ['q', 'p', 'j'] },
        { g: '🐤🐤🐤', q: 'How many chicks?', b: 'three', s: ['two', 'four', 'five'] },
        { q: 'Teacher says "Sit down". You...', b: 'sit down 🪑', s: ['stand up 🧍', 'jump 🦘', 'run 🏃'] },
        { g: '🌳', q: 'This is a...', b: 'tree', s: ['flower', 'house', 'car'] },
        { q: 'Which one is an animal?', b: 'cat 🐱', s: ['pen ✏️', 'ball ⚽', 'bag 🎒'] },
      ]
    },

    // ───────────────────────── MATEMATIK ─────────────────────────
    {
      id: 'mt', nama: 'Matematik', ikon: '🔢', warna: '#2a9d8f', lang: 'ms-MY',
      bank: [
        () => { // tambah
          const a = R(1, 9), b = R(1, 9), e = pick(BENDA);
          return { q: `${a} + ${b} = ?`, qs: `${a} tambah ${b} sama dengan berapa?`, g: a + b <= 12 ? `${e.repeat(a)} ➕ ${e.repeat(b)}` : null, b: String(a + b), s: near(a + b, 3, 0), i: `${a} tambah ${b} sama dengan ${a + b}.` };
        },
        () => { // tolak
          const a = R(4, 15), b = R(1, a - 1);
          return { q: `${a} − ${b} = ?`, qs: `${a} tolak ${b} sama dengan berapa?`, b: String(a - b), s: near(a - b, 3, 0), i: `${a} tolak ${b} tinggal ${a - b}.` };
        },
        () => { // membilang
          const n = R(3, 12), e = pick(BENDA);
          return { q: `Berapakah bilangan ${NAMA_BENDA[e]}?`, g: e.repeat(n), b: String(n), s: near(n, 2, 1), i: `Ada ${n} ${NAMA_BENDA[e]}.` };
        },
        () => { // puluh
          const a = R(1, 5) * 10, b = R(1, 4) * 10;
          return { q: `${a} + ${b} = ?`, qs: `${a} tambah ${b} sama dengan berapa?`, b: String(a + b), s: [a + b - 10, a + b + 10, a + b + 20].map(String), i: `${a / 10} puluh tambah ${b / 10} puluh = ${(a + b) / 10} puluh.` };
        },
        () => { // nombor selepas
          const n = R(9, 98);
          return { q: `Nombor selepas ${n} ialah...`, b: String(n + 1), s: [n - 1, n + 2, n + 10].map(String), i: `${n}, ${n + 1}, ${n + 2} ...` };
        },
        () => { // nombor sebelum
          const n = R(10, 99);
          return { q: `Nombor sebelum ${n} ialah...`, b: String(n - 1), s: [n + 1, n - 2, n - 10].map(String), i: `${n - 1} datang sebelum ${n}.` };
        },
        () => { // paling besar
          const s = new Set(); while (s.size < 4) s.add(R(1, 100));
          const arr = [...s], mx = Math.max(...arr);
          return { q: 'Nombor manakah paling BESAR?', b: String(mx), s: arr.filter(v => v !== mx).map(String) };
        },
        () => { // paling kecil
          const s = new Set(); while (s.size < 4) s.add(R(1, 100));
          const arr = [...s], mn = Math.min(...arr);
          return { q: 'Nombor manakah paling KECIL?', b: String(mn), s: arr.filter(v => v !== mn).map(String) };
        },
        () => { // perkataan nombor
          const n = R(1, 20), opts = new Set();
          while (opts.size < 3) { const v = R(1, 20); if (v !== n) opts.add(PERKATAAN[v]); }
          return { q: `Nombor ${n} dalam perkataan ialah...`, b: PERKATAAN[n], s: [...opts] };
        },
        () => { // nilai tempat
          const p = R(1, 9), sa = R(0, 9), n = p * 10 + sa;
          return { q: `${n} = ? puluh dan ${sa} sa`, qs: `${n} sama dengan berapa puluh dan ${sa} sa?`, b: String(p), s: near(p, 3, 0), i: `${n} = ${p} puluh dan ${sa} sa.` };
        },
        () => { // wang ringgit
          const notes = [pick([1, 5]), pick([1, 1, 5, 10])];
          if (Math.random() < .5) notes.push(1);
          const tot = notes.reduce((a, b) => a + b, 0);
          return { q: 'Berapakah jumlah wang ini?', g: notes.map(v => `💵RM${v}`).join(' + '), b: `RM${tot}`, s: near(tot, 3, 1).map(v => 'RM' + v), i: `Jumlahnya RM${tot}.` };
        },
        () => { // wang sen
          const c = [pick([10, 20, 50]), pick([10, 20])];
          const tot = c[0] + c[1];
          return { q: 'Berapakah jumlah duit syiling ini?', g: c.map(v => `🪙${v} sen`).join(' + '), b: `${tot} sen`, s: [tot - 10, tot + 10, tot + 20].filter(v => v > 0).concat([tot + 30]).slice(0, 3).map(v => v + ' sen'), i: `${c[0]} sen + ${c[1]} sen = ${tot} sen.` };
        },
        () => { // pola nombor
          const st = R(1, 10), step = pick([1, 2, 5, 10]);
          const seq = [0, 1, 2, 3].map(i => st + i * step), ans = st + 4 * step;
          return { q: `Apakah nombor seterusnya?  ${seq.join(', ')}, ?`, qs: `Apakah nombor seterusnya? ${seq.join(', ')}`, b: String(ans), s: [ans + step, ans - 1, ans + 1].filter(v => v !== ans).map(String), i: `Tambah ${step} setiap kali.` };
        },
        { g: '🔺', q: 'Apakah nama bentuk ini?', b: 'segi tiga', s: ['bulatan', 'segi empat sama', 'segi empat tepat'], i: 'Segi tiga ada 3 sisi.' },
        { g: '🟦', q: 'Apakah nama bentuk ini?', b: 'segi empat sama', s: ['segi tiga', 'bulatan', 'bintang'], i: 'Segi empat sama ada 4 sisi yang sama panjang.' },
        { g: '🔵', q: 'Apakah nama bentuk ini?', b: 'bulatan', s: ['segi tiga', 'segi empat sama', 'segi empat tepat'] },
        { g: '⚽', q: 'Bola berbentuk...', b: 'sfera', s: ['kubus', 'kon', 'silinder'] },
        { g: '🎲', q: 'Dadu berbentuk...', b: 'kubus', s: ['sfera', 'kon', 'silinder'] },
        { g: '🥫', q: 'Tin ini berbentuk...', b: 'silinder', s: ['kubus', 'sfera', 'piramid'] },
        { q: 'Hari selepas Isnin ialah...', b: 'Selasa', s: ['Ahad', 'Rabu', 'Jumaat'], i: 'Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad.' },
        { q: 'Hari sebelum Sabtu ialah...', b: 'Jumaat', s: ['Ahad', 'Khamis', 'Isnin'], i: 'Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad.' },
        { q: 'Seminggu ada berapa hari?', b: '7', s: ['5', '6', '10'] },
        { q: 'Matahari terbit pada waktu...', b: 'pagi', s: ['malam', 'tengah malam', 'petang'] },
        { g: '✏️  🚌', q: 'Yang manakah lebih panjang?', b: 'bas 🚌', s: ['pensel ✏️'] },
        { g: '🐘  🐭', q: 'Yang manakah lebih berat?', b: 'gajah 🐘', s: ['tikus 🐭'] },
      ]
    },

    // ───────────────────────── SAINS ─────────────────────────
    {
      id: 'sn', nama: 'Sains', ikon: '🔬', warna: '#8ac926', lang: 'ms-MY',
      bank: [
        { g: '👁️', q: 'Kita melihat menggunakan...', b: 'mata', s: ['telinga', 'hidung', 'lidah'] },
        { g: '👂', q: 'Kita mendengar menggunakan...', b: 'telinga', s: ['mata', 'kulit', 'lidah'] },
        { g: '👅', q: 'Kita merasa makanan menggunakan...', b: 'lidah', s: ['hidung', 'mata', 'telinga'] },
        { g: '🌸', q: 'Kita menghidu bau bunga menggunakan...', b: 'hidung', s: ['lidah', 'telinga', 'mata'] },
        { q: 'Deria untuk merasa sentuhan (sejuk atau panas) ialah...', b: 'kulit', s: ['mata', 'hidung', 'telinga'] },
        { q: 'Manusia ada berapa deria?', b: '5', s: ['3', '4', '6'], i: 'Mata, telinga, hidung, lidah dan kulit.' },
        { q: 'Haiwan manakah mempunyai sayap?', b: 'burung 🐦', s: ['kucing 🐱', 'ikan 🐟', 'lembu 🐄'] },
        { g: '🐟', q: 'Ikan bernafas menggunakan...', b: 'insang', s: ['paru-paru', 'kulit', 'hidung'] },
        { g: '🐟', q: 'Ikan berenang menggunakan...', b: 'sirip', s: ['sayap', 'kaki', 'paruh'] },
        { g: '🐌', q: 'Siput mempunyai ... untuk melindungi badannya.', b: 'cangkerang', s: ['bulu', 'sirip', 'sayap'] },
        { g: '🐦', q: 'Burung makan menggunakan...', b: 'paruh', s: ['gigi', 'sirip', 'tanduk'] },
        { q: 'Haiwan manakah mempunyai sisik?', b: 'ikan 🐟', s: ['kucing 🐱', 'arnab 🐰', 'kambing 🐐'] },
        { g: '🌱', q: 'Bahagian tumbuhan yang menyerap air daripada tanah ialah...', b: 'akar', s: ['daun', 'bunga', 'buah'] },
        { g: '🌻', q: 'Tumbuhan memerlukan ... untuk hidup.', b: 'air dan cahaya matahari', s: ['gula-gula', 'televisyen', 'kasut'] },
        { g: '🧲', q: 'Magnet boleh menarik...', b: 'paku besi', s: ['kertas', 'kayu', 'getah pemadam'], i: 'Magnet menarik benda yang diperbuat daripada besi dan keluli.' },
        { g: '🧲', q: 'Magnet ini dipanggil magnet...', b: 'ladam', s: ['bar', 'butang', 'gelang'], i: 'Magnet ladam berbentuk seperti huruf U.' },
        { q: 'Kutub magnet ialah...', b: 'utara dan selatan', s: ['atas dan bawah', 'kiri dan kanan', 'depan dan belakang'] },
        { q: 'Benda manakah boleh menyerap air?', b: 'span 🧽', s: ['batu 🪨', 'sudu besi 🥄', 'pinggan kaca'], i: 'Span, tisu dan kain boleh menyerap air.' },
        { q: 'Di dalam bilik sains, kita mesti...', b: 'ikut arahan guru', s: ['berlari-lari', 'makan dan minum', 'bermain bahan kimia'] },
        { q: 'Tumbuhan paling subur ditanam dalam...', b: 'tanah kebun (humus)', s: ['pasir pantai', 'batu', 'simen'] },
        { q: 'Benda hidup memerlukan...', b: 'makanan, air dan udara', s: ['mainan', 'telefon', 'wang'] },
      ]
    },

    // ───────────────────────── PENDIDIKAN ISLAM ─────────────────────────
    {
      id: 'pi', nama: 'Pendidikan Islam', ikon: '🕌', warna: '#1b998b', lang: 'ms-MY',
      bank: [
        { q: 'Rukun Islam ada berapa perkara?', b: '5', s: ['6', '4', '3'] },
        { q: 'Rukun Iman ada berapa perkara?', b: '6', s: ['5', '4', '7'] },
        { q: 'Rukun Islam yang pertama ialah...', b: 'mengucap dua kalimah syahadah', s: ['berpuasa', 'menunaikan haji', 'mengeluarkan zakat'] },
        { q: 'Rukun Iman yang pertama ialah beriman kepada...', b: 'Allah', s: ['malaikat', 'kitab', 'rasul'] },
        { q: 'Sebelum makan, kita membaca...', b: 'Bismillah', s: ['Alhamdulillah', 'Subhanallah', 'Allahu Akbar'] },
        { q: 'Selepas makan, kita mengucapkan...', b: 'Alhamdulillah', s: ['Bismillah', 'Astaghfirullah', 'Insya-Allah'] },
        { q: 'Kita makan menggunakan tangan...', b: 'kanan', s: ['kiri', 'kedua-dua tangan'] },
        { q: 'Nabi Muhammad SAW dilahirkan di...', b: 'Mekah', s: ['Madinah', 'Mesir', 'Malaysia'] },
        { q: 'Ibu Nabi Muhammad SAW bernama...', b: 'Aminah', s: ['Khadijah', 'Fatimah', 'Halimah'] },
        { q: 'Bapa Nabi Muhammad SAW bernama...', b: 'Abdullah', s: ['Abu Talib', 'Abu Bakar', 'Umar'] },
        { q: 'Solat fardu sehari semalam ada berapa waktu?', b: '5', s: ['3', '4', '6'], i: 'Subuh, Zohor, Asar, Maghrib dan Isyak.' },
        { q: 'Huruf hijaiyah yang pertama ialah...', b: 'Alif ( ا )', s: ['Ba ( ب )', 'Ta ( ت )', 'Jim ( ج )'] },
        { g: 'ب', q: 'Apakah nama huruf hijaiyah ini?', b: 'Ba', s: ['Alif', 'Ta', 'Jim'] },
        { g: 'ت', q: 'Apakah nama huruf hijaiyah ini?', b: 'Ta', s: ['Ba', 'Alif', 'Jim'] },
        { q: 'Umat Islam berpuasa pada bulan...', b: 'Ramadan', s: ['Syawal', 'Muharam', 'Rejab'] },
        { q: 'Sebelum solat, kita perlu mengambil...', b: 'wuduk', s: ['makanan', 'mainan', 'gambar'] },
        { q: 'Ucapan apabila berjumpa sesama Islam ialah...', b: 'Assalamualaikum', s: ['Selamat tinggal', 'Alhamdulillah', 'Bismillah'] },
        { q: 'Kitab suci umat Islam ialah...', b: 'Al-Quran', s: ['buku cerita', 'kamus', 'majalah'] },
        { q: 'Malaikat yang menyampaikan wahyu ialah Malaikat...', b: 'Jibril', s: ['Mikail', 'Israfil', 'Izrail'] },
      ]
    },

    // ───────────────────────── PENDIDIKAN MORAL ─────────────────────────
    {
      id: 'pm', nama: 'Pendidikan Moral', ikon: '🤝', warna: '#ff8c42', lang: 'ms-MY',
      bank: [
        { q: 'Kawan kamu terjatuh. Apakah yang patut kamu lakukan?', b: 'Tolong dia bangun', s: ['Ketawakan dia', 'Biarkan sahaja', 'Lari dari situ'], i: 'Nilai baik hati dan tolong-menolong.' },
        { q: 'Kamu terjumpa dompet di sekolah. Apakah yang kamu buat?', b: 'Serahkan kepada guru', s: ['Ambil wangnya', 'Buang dompet itu', 'Sorokkan'], i: 'Nilai jujur.' },
        { q: 'Ibu memanggil kamu. Kamu patut...', b: 'Menyahut dengan sopan', s: ['Buat tidak dengar', 'Marah ibu', 'Menjerit'], i: 'Hormati ibu bapa.' },
        { q: 'Apabila kita melakukan kesilapan, kita perlu...', b: 'Meminta maaf', s: ['Menyalahkan orang lain', 'Menangis', 'Berdiam diri'] },
        { q: 'Selepas bermain, mainan perlu...', b: 'Disimpan dengan kemas', s: ['Dibiarkan bersepah', 'Dibuang', 'Dipijak'], i: 'Nilai bertanggungjawab.' },
        { q: 'Bercakap benar menunjukkan nilai...', b: 'jujur', s: ['malas', 'sombong', 'kedekut'] },
        { q: 'Sampah perlu dibuang ke dalam...', b: 'tong sampah 🗑️', s: ['longkang', 'sungai', 'bawah meja'], i: 'Jaga kebersihan alam sekitar.' },
        { q: 'Bagaimanakah kita menghormati guru?', b: 'Ucap "Selamat pagi, cikgu"', s: ['Bising dalam kelas', 'Tidak hiraukan cikgu', 'Lari dari kelas'] },
        { q: 'Kawan kamu tiada pensel. Kamu boleh...', b: 'Meminjamkan pensel kamu', s: ['Ketawakan dia', 'Sembunyikan pensel', 'Beritahu semua orang'], i: 'Nilai bertimbang rasa.' },
        { q: 'Nenek membawa beg yang berat. Kamu...', b: 'Tolong bawakan beg nenek', s: ['Lari', 'Ketawa', 'Buat tidak nampak'] },
        { q: 'Sebelum meminjam barang orang lain, kita perlu...', b: 'Meminta izin', s: ['Ambil terus', 'Sorokkan dulu', 'Pecahkan'] },
        { q: 'Ada murid baharu di dalam kelas. Kamu...', b: 'Ajak dia berkawan', s: ['Jauhkan diri', 'Ejek dia', 'Marah dia'] },
        { q: 'Abang memberi kamu hadiah. Kamu berkata...', b: 'Terima kasih', s: ['Tak mahu', 'Itu sahaja?', 'Pergi!'], i: 'Nilai berterima kasih.' },
        { q: 'Kelas kita kotor. Apakah yang patut kita lakukan?', b: 'Bergotong-royong membersihkan kelas', s: ['Biarkan kotor', 'Tunggu orang lain', 'Tambah sampah'] },
        { q: 'Bagaimanakah kita menyayangi haiwan peliharaan?', b: 'Beri makan dan minum', s: ['Pukul haiwan', 'Biarkan lapar', 'Tarik ekornya'], i: 'Nilai kasih sayang.' },
      ]
    },

    // ───────────────────────── PENDIDIKAN JASMANI & KESIHATAN ─────────────────────────
    {
      id: 'pjk', nama: 'Pendidikan Jasmani & Kesihatan', ikon: '⚽', warna: '#06aed5', lang: 'ms-MY',
      bank: [
        { g: '🪥', q: 'Kita perlu memberus gigi sekurang-kurangnya...', b: '2 kali sehari', s: ['sekali seminggu', 'tidak perlu', 'sekali sebulan'] },
        { q: 'Makanan manakah lebih sihat?', b: 'buah-buahan 🍎', s: ['gula-gula 🍬', 'kerepek 🍟', 'air bergas 🥤'] },
        { q: 'Sebelum makan, kita perlu...', b: 'mencuci tangan 🧼', s: ['bermain tanah', 'tidur', 'berlari'] },
        { q: 'Pergerakan dari satu tempat ke tempat lain (lokomotor) contohnya...', b: 'berlari 🏃', s: ['duduk', 'tidur', 'berdiri tegak'] },
        { q: 'Pergerakan di tempat yang sama (bukan lokomotor) contohnya...', b: 'meregang badan 🙆', s: ['berlari', 'melompat jauh', 'berjalan'] },
        { q: 'Sebelum bersenam, kita perlu...', b: 'memanaskan badan', s: ['makan banyak', 'tidur', 'minum air bergas'] },
        { q: 'Pakaian yang sesuai untuk bersenam ialah...', b: 'baju sukan dan kasut sukan', s: ['baju tidur', 'baju raya', 'selipar dan baju tebal'] },
        { q: 'Kita melintas jalan di...', b: 'lintasan zebra 🦓', s: ['selekoh', 'tengah jalan raya', 'belakang bas'] },
        { g: '🚦', q: 'Lampu isyarat warna apakah tanda BERHENTI?', b: 'merah 🔴', s: ['hijau 🟢', 'kuning 🟡'] },
        { q: 'Kita perlu tidur yang cukup supaya...', b: 'badan sihat dan cergas', s: ['mata merah', 'lapar', 'penat'] },
        { q: 'Selepas bersenam, minuman yang terbaik ialah...', b: 'air kosong 💧', s: ['air bergas', 'kopi', 'air sirap manis'] },
        { q: 'Orang asing mengajak kamu ikut dia. Kamu patut...', b: 'Kata TIDAK dan beritahu ibu bapa', s: ['Ikut sahaja', 'Ambil gula-gulanya', 'Rahsiakan'], i: 'Keselamatan diri sangat penting!' },
        { q: 'Ubat hanya boleh diambil...', b: 'dengan izin ibu bapa atau doktor', s: ['bila-bila masa', 'sesuka hati', 'daripada orang asing'] },
        { q: 'Berapa kali kita mandi sehari?', b: '2 kali', s: ['sekali seminggu', 'tidak perlu', 'sekali sebulan'] },
      ]
    },

    // ───────────────────────── PENDIDIKAN SENI VISUAL ─────────────────────────
    {
      id: 'psv', nama: 'Pendidikan Seni Visual', ikon: '🎨', warna: '#c77dff', lang: 'ms-MY',
      bank: [
        { g: '🔴 + 🟡', q: 'Merah + Kuning = ?', qs: 'Merah campur kuning menjadi warna apa?', b: 'jingga 🟠', s: ['hijau 🟢', 'ungu 🟣', 'biru 🔵'] },
        { g: '🔵 + 🟡', q: 'Biru + Kuning = ?', qs: 'Biru campur kuning menjadi warna apa?', b: 'hijau 🟢', s: ['jingga 🟠', 'ungu 🟣', 'merah 🔴'] },
        { g: '🔴 + 🔵', q: 'Merah + Biru = ?', qs: 'Merah campur biru menjadi warna apa?', b: 'ungu 🟣', s: ['hijau 🟢', 'jingga 🟠', 'kuning 🟡'] },
        { g: '⚫ + ⚪', q: 'Hitam + Putih = ?', qs: 'Hitam campur putih menjadi warna apa?', b: 'kelabu', s: ['coklat', 'merah jambu', 'hijau'] },
        { g: '🔴 + ⚪', q: 'Merah + Putih = ?', qs: 'Merah campur putih menjadi warna apa?', b: 'merah jambu', s: ['ungu', 'jingga', 'coklat'] },
        { q: 'Yang manakah warna asas?', b: 'merah', s: ['hijau', 'ungu', 'jingga'], i: 'Warna asas ialah merah, kuning dan biru.' },
        { q: 'Yang manakah warna asas?', b: 'biru', s: ['jingga', 'kelabu', 'coklat'], i: 'Warna asas ialah merah, kuning dan biru.' },
        { q: 'Alat untuk mewarna ialah...', b: 'krayon 🖍️', s: ['gunting ✂️', 'pembaris 📏', 'kunci 🔑'] },
        { g: '〰️〰️〰️', q: 'Garisan ini dipanggil garisan...', b: 'beralun', s: ['lurus', 'putus-putus', 'zig-zag'] },
        { g: '/\\/\\/\\/\\', q: 'Garisan ini dipanggil garisan...', b: 'zig-zag', s: ['beralun', 'lurus', 'bulat'] },
        { q: 'Menampal cebisan kertas untuk membentuk gambar dipanggil...', b: 'kolaj', s: ['catan', 'arca', 'origami'] },
        { g: '🪁', q: 'Contoh kraf tradisional Malaysia ialah...', b: 'wau', s: ['robot', 'telefon', 'kereta'] },
        { q: 'Gasing ialah permainan tradisional yang...', b: 'berpusing', s: ['terbang', 'berenang', 'menyanyi'] },
        { g: '🔴🟡🔴🟡🔴 ?', q: 'Apakah warna seterusnya dalam corak ini?', b: 'kuning 🟡', s: ['merah 🔴', 'biru 🔵', 'hijau 🟢'] },
      ]
    },

    // ───────────────────────── PENDIDIKAN MUZIK ─────────────────────────
    {
      id: 'mz', nama: 'Pendidikan Muzik', ikon: '🎵', warna: '#ffbe0b', lang: 'ms-MY',
      bank: [
        () => {
          const low = pick([196, 220, 247, 262]), up = Math.random() < .5;
          const n = up ? [low, low * 2] : [low * 2, low];
          return { q: 'Dengar dua bunyi ini. Bunyi KEDUA lebih tinggi atau lebih rendah?', au: n.map((f, i) => ({ f, t: i * .85, d: .65, v: .32 })), b: up ? 'lebih tinggi ⬆️' : 'lebih rendah ⬇️', s: [up ? 'lebih rendah ⬇️' : 'lebih tinggi ⬆️'], i: 'Bunyi tinggi seperti burung bersiul. Bunyi rendah seperti lembu menguak.' };
        },
        () => {
          const louder = Math.random() < .5, v = louder ? [.05, .45] : [.45, .05];
          return { q: 'Dengar dua bunyi ini. Bunyi KEDUA lebih kuat atau lebih perlahan?', au: v.map((vv, i) => ({ f: 392, t: i * .85, d: .6, v: vv })), b: louder ? 'lebih kuat 🔊' : 'lebih perlahan 🔈', s: [louder ? 'lebih perlahan 🔈' : 'lebih kuat 🔊'] };
        },
        () => {
          const fast = Math.random() < .5, n = fast ? 9 : 4, gap = fast ? .2 : .6;
          const au = []; for (let i = 0; i < n; i++) au.push({ f: 160, t: i * gap, d: .14, v: .5, drum: true });
          return { q: 'Dengar rentak ini. Rentak ini laju atau perlahan?', au, b: fast ? 'laju 🐇' : 'perlahan 🐢', s: [fast ? 'perlahan 🐢' : 'laju 🐇'] };
        },
        { g: '🥁', q: 'Gendang dimainkan dengan cara...', b: 'dipukul', s: ['ditiup', 'dipetik', 'digesek'] },
        { q: 'Seruling dimainkan dengan cara...', b: 'ditiup', s: ['dipukul', 'dipetik', 'digesek'] },
        { g: '🎸', q: 'Gitar dimainkan dengan cara...', b: 'dipetik', s: ['ditiup', 'dipukul', 'digesek'] },
        { g: '🎻', q: 'Biola dimainkan dengan cara...', b: 'digesek', s: ['ditiup', 'dipukul', 'dipetik'] },
        { q: 'Lagu kebangsaan Malaysia ialah...', b: 'Negaraku', s: ['Rasa Sayang', 'Bangau oh Bangau', 'Burung Kakak Tua'] },
        { q: 'Semasa lagu Negaraku dimainkan, kita perlu...', b: 'berdiri tegak', s: ['duduk', 'berlari', 'bercakap'] },
        { q: 'Bunyi manakah paling kuat?', b: 'guruh ⛈️', s: ['bisikan 🤫', 'daun jatuh 🍃', 'kucing tidur 😺'] },
        { q: 'Bunyi manakah lebih tinggi (nyaring)?', b: 'burung berkicau 🐦', s: ['lembu menguak 🐄'] },
        { q: 'Alat muzik tradisional Malaysia ialah...', b: 'kompang', s: ['piano', 'gitar elektrik', 'trompet'] },
        { q: 'Kompang dimainkan dengan cara...', b: 'dipalu dengan tapak tangan', s: ['ditiup', 'dipetik', 'digesek'] },
      ]
    },

    // ───────────────────────── BAHASA ARAB ─────────────────────────
    {
      id: 'ba', nama: 'Bahasa Arab', ikon: '🌙', warna: '#6a4c93', lang: 'ms-MY',
      bank: [
        { g: 'وَاحِد', sb: 'wahid', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud wahid?', b: 'satu', s: ['dua', 'tiga', 'sepuluh'] },
        { g: 'اِثْنَان', sb: 'ithnan', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud ithnan?', b: 'dua', s: ['satu', 'lima', 'empat'] },
        { g: 'ثَلَاثَة', sb: 'thalathah', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud thalathah?', b: 'tiga', s: ['dua', 'enam', 'satu'] },
        { g: 'خَمْسَة', sb: 'khamsah', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud khamsah?', b: 'lima', s: ['tiga', 'sepuluh', 'empat'] },
        { g: 'عَشَرَة', sb: "'asyarah", q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud asyarah?', b: 'sepuluh', s: ['satu', 'lima', 'dua'] },
        { g: 'كِتَاب', sb: 'kitab', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud kitab?', b: 'buku 📘', s: ['pen ✏️', 'meja', 'beg 🎒'] },
        { g: 'قَلَم', sb: 'qalam', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud qalam?', b: 'pen ✏️', s: ['buku 📘', 'pintu 🚪', 'kerusi 🪑'] },
        { g: 'بَيْت', sb: 'bait', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud bait?', b: 'rumah 🏠', s: ['sekolah 🏫', 'kereta 🚗', 'pokok 🌳'] },
        { g: 'بَاب', sb: 'bab', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud bab?', b: 'pintu 🚪', s: ['tingkap', 'lantai', 'dinding'] },
        { g: 'كُرْسِيّ', sb: 'kursi', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud kursi?', b: 'kerusi 🪑', s: ['meja', 'buku 📘', 'beg 🎒'] },
        { g: 'أُمِّي', sb: 'ummi', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud ummi?', b: 'ibu saya', s: ['ayah saya', 'abang saya', 'nenek saya'] },
        { g: 'أَبِي', sb: 'abi', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud abi?', b: 'ayah saya', s: ['ibu saya', 'kakak saya', 'datuk saya'] },
        { g: 'شُكْرًا', sb: 'syukran', q: 'Apakah maksud perkataan ini?', qs: 'Apakah maksud syukran?', b: 'terima kasih', s: ['selamat tinggal', 'maaf', 'apa khabar'] },
        { g: 'صَبَاحُ الْخَيْر', sb: 'sabahul khair', q: 'Apakah maksud ucapan ini?', qs: 'Apakah maksud sabahul khair?', b: 'selamat pagi', s: ['selamat malam', 'terima kasih', 'selamat jalan'] },
        { q: 'Jawapan bagi "Assalamualaikum" ialah...', b: 'Waalaikumussalam', s: ['Selamat pagi', 'Terima kasih', 'Syukran'] },
        { q: 'Apakah bahasa Arab bagi "sekolah"?', b: 'مَدْرَسَة (madrasah)', s: ['بَيْت (bait)', 'كِتَاب (kitab)', 'بَاب (bab)'] },
      ]
    },
  ];

  const PUJIAN = ['Hebat!', 'Bagus!', 'Pandai!', 'Syabas!', 'Tahniah!', 'Cemerlang!', 'Betul sekali!'];
  const CUBA = ['Cuba lagi!', 'Hampir betul, cuba lagi!', 'Jangan putus asa, cuba lagi!'];

  const AKTIVITI = [
    { ikon: '🤸', teks: 'Bangun! Buat lompat bintang 10 kali.' },
    { ikon: '🙆', teks: 'Regangkan tangan ke atas tinggi-tinggi dan kira hingga 10.' },
    { ikon: '🏃', teks: 'Lari setempat sambil kira 1 hingga 15.' },
    { ikon: '🧘', teks: 'Tarik nafas dalam-dalam... hembus perlahan-lahan. Buat 5 kali.' },
    { ikon: '💧', teks: 'Pergi minum segelas air kosong.' },
    { ikon: '👀', teks: 'Rehatkan mata. Pandang jauh ke luar tingkap dan kira hingga 20.' },
    { ikon: '🦵', teks: 'Sentuh jari kaki kamu, kemudian berdiri tegak. Buat 8 kali.' },
  ];

  // Pilih satu soalan untuk subjek, elak ulangan sehingga semua soalan sudah ditanya.
  function pilih(subj, asked) {
    const list = asked[subj.id] || (asked[subj.id] = []);
    let avail = subj.bank.map((_, i) => i).filter(i => !list.includes(i));
    if (!avail.length) { list.length = 0; avail = subj.bank.map((_, i) => i); }
    const idx = pick(avail);
    list.push(idx);
    const raw = subj.bank[idx];
    const q = typeof raw === 'function' ? raw() : Object.assign({}, raw);
    q.pilihan = shuffle([...new Set([q.b, ...q.s])]);
    return q;
  }

  return { SENARAI, PUJIAN, CUBA, AKTIVITI, pilih, pick, shuffle };
})();
