# 🤖⚡ Robo Perkasa — Pertarungan Robot Gergasi

Game pertarungan robot gergasi di tengah bandar, untuk kanak-kanak, dengan **Masa Rehat belajar setiap 10 minit**.
Semasa rehat, murid menjawab soalan daripada **semua mata pelajaran Darjah 1 (KSSR)** sebelum boleh sambung bermain.

Tiada pemasangan diperlukan: game ini hanya HTML + JavaScript (tiada pelayan, tiada fail gambar/audio luaran).

## ▶ Cara main

1. Buka `index.html` dalam pelayar (Chrome, Edge, Safari, Firefox): klik dua kali fail itu sahaja sudah cukup.
2. Tekan **▶ MAIN** dan kalahkan robot musuh.
3. Kumpul syiling 🪙 untuk naik taraf robot di **🔧 Garaj**.

### Kawalan

| Tindakan | Papan kekunci | Skrin sentuh |
|---|---|---|
| Gerak kiri / kanan | `←` `→` (atau `A` `D`) | ◀ ▶ |
| Tumbuk | `Z` (atau `J`) | 👊 |
| Tendang | `X` (atau `K`) | 🦶 |
| Perisai (tahan) | `C` (atau `L` / `↓`) | 🛡️ |
| Elak (undur laju) | `V` (atau `Shift`) | 💨 |
| Kuasa khas ⚡ (bila tenaga penuh) | `Spasi` | ⚡ |
| Jeda | `P` / `Esc` | ⏸ |

Di telefon, pusingkan peranti ke kedudukan **melintang**.

## ⏰ Masa Rehat (setiap 10 minit)

- Selepas 10 minit bermain, permainan **berhenti automatik** dan Masa Rehat bermula.
- Murid menjawab soalan untuk **setiap** mata pelajaran Darjah 1:
  📖 Bahasa Melayu • 🔤 Bahasa Inggeris • 🔢 Matematik • 🔬 Sains • 🕌 Pendidikan Islam • 🤝 Pendidikan Moral •
  ⚽ Pendidikan Jasmani & Kesihatan • 🎨 Pendidikan Seni Visual • 🎵 Pendidikan Muzik • 🌙 Bahasa Arab
- Jawapan salah? Murid boleh cuba lagi dan diberi fakta ringkas 💡 selepas jawapan betul.
- Butang 🔊 membacakan soalan (berguna untuk murid yang baru belajar membaca). Soalan muzik ada bunyi 🎵 untuk didengar.
- Rehat diakhiri dengan **aktiviti badan 20 saat** (regangan, lompat bintang, rehatkan mata, minum air).
- Jawapan betul memberi syiling 🪙 (lebih banyak jika betul pada cubaan pertama) + bonus rehat.
- Rehat **tidak boleh dilangkau**, dan muat semula halaman tidak akan membatalkannya.
- Butang **📚 Belajar & Dapat 🪙** di menu membolehkan murid belajar bila-bila masa (ini juga dikira sebagai rehat).

Bank soalan: lebih 170 soalan tetap, ditambah soalan Matematik dan Muzik yang dijana secara rawak.
Soalan tidak berulang sehingga semua soalan dalam subjek itu sudah ditanya.

## 👨‍👩‍👧 Tetapan ibu bapa

Tekan **Ibu Bapa** di menu dan jawab soalan sifir (untuk menghalang kanak-kanak mengubahnya). Di sini boleh:

- tukar masa bermain sebelum rehat (5 / **10** / 15 / 20 minit),
- pilih bilangan soalan bagi setiap subjek (1–3),
- pilih mata pelajaran (contohnya Pendidikan Islam **atau** Pendidikan Moral sahaja),
- lihat statistik dan mulakan rehat serta-merta.

> Untuk menguji dengan cepat: buka `index.html?rehat=30` supaya rehat berlaku setiap 30 saat.

## 🎮 Ciri-ciri game

- 10 musuh asli (robot & raksasa), setiap satu dengan rupa, kelajuan dan kekuatan berbeza; selepas peringkat 10 musuh terus menjadi lebih kuat.
- Kombo, perisai, elakan dengan kesan bayang, dan tembakan kuasa ⚡.
- Latar bandar siang, petang, malam dan ribut.
- Naik taraf: Kuasa Tumbukan, Perisai Besi, Enjin Pendorong, Teras Tenaga, serta 6 warna cat robot.
- Kemajuan disimpan secara automatik dalam pelayar (`localStorage`).

## 📁 Struktur fail

```
index.html        Halaman utama & skrin
css/style.css     Reka bentuk
js/audio.js       Bunyi (Web Audio) & suara membaca soalan
js/save.js        Simpanan kemajuan
js/questions.js   Bank soalan semua mata pelajaran Darjah 1
js/robot.js       Lukisan robot
js/game.js        Enjin pertarungan, AI musuh, kesan visual
js/rehat.js       Pemasa & kuiz Masa Rehat
js/main.js        Menu, garaj, tetapan & gelung utama
```

## 🌐 Kongsi secara dalam talian (pilihan)

Aktifkan **GitHub Pages** (Settings → Pages → pilih cawangan) dan game boleh dimainkan terus dari pautan web.
