# Resonator Helmholtz: Materi, Praktikum, Simulasi, dan Tangga Nada

Aplikasi web edukatif untuk mempelajari resonator Helmholtz menggunakan:

- React + Vite
- TypeScript
- React Three Fiber
- Web Audio API
- KaTeX untuk render persamaan LaTeX
- Lucide React untuk ikon antarmuka

## Menu aplikasi

### Section 1 — Materi

Berisi materi pembelajaran lengkap tentang resonator Helmholtz.

- Konsep dasar resonansi botol.
- Persamaan frekuensi resonansi Helmholtz.
- Turunan model massa–pegas akustik.
- Pengaruh geometri dan koreksi ujung.
- Praktikum mikrofon dan peak detection.
- Konsep tangga nada C4 sampai C6.
- Keterbatasan model.
- Referensi dengan body note dan daftar pustaka APA 7th edition.

Persamaan matematika dirender dengan KaTeX. Implementasi memakai paket `katex` langsung melalui komponen React kecil, sehingga lebih ringan daripada menambah wrapper tambahan.

### Section 2 — Praktikum Sederhana

Fitur praktikum membaca suara botol asli melalui mikrofon laptop.

- Spektrum suara ditampilkan besar di sisi kiri atas.
- Garis vertikal merah menandai puncak frekuensi dominan.
- Angka frekuensi puncak ditampilkan langsung pada grafik.
- Tombol mikrofon dan input ukuran botol berada di sisi kanan.
- Parameter botol nyata yang dapat diisi:
  - jari-jari leher,
  - panjang leher,
  - volume botol total,
  - tinggi air,
  - suhu udara.
- Hasil pengukuran berada di bawah spektrum:
  - frekuensi teoritis,
  - frekuensi aktual mikrofon,
  - selisih,
  - kepercayaan puncak,
  - level puncak relatif,
  - koreksi ujung hasil praktikum dalam bentuk faktor `a`.

Koreksi ujung hasil praktikum dihitung balik dari frekuensi aktual mikrofon:

```text
L_eff(praktikum) = A / (V × (2πf_aktual / c)²)
faktor_koreksi_praktikum = (L_eff(praktikum) - L) / a
```

Frekuensi teoritis tetap ditampilkan karena menjadi pembanding utama terhadap hasil mikrofon. Koreksi ujung hasil praktikum berguna untuk memperkirakan faktor koreksi ujung botol nyata.

### Section 3 — Simulasi Resonator Helmholtz

Fitur simulasi menampilkan botol 3D, air, partikel udara, tekanan rongga, dan suara resonansi.

- Partikel udara memakai `InstancedMesh`.
- Saat belum ditiup, partikel udara tersebar merata dan tetap bergerak bebas kecil di rongga, bahu/transisi, dan leher botol.
- Saat tombol tiup ditekan, gerak bebas tetap ada, lalu ditambah gerak massa–pegas: udara pada leher berosilasi sebagai massa dan udara dalam rongga mengalami kompresi-ekspansi sebagai pegas.
- Area antara rongga dan leher tetap terisi partikel udara.
- Posisi partikel tetap mengikuti perubahan volume botol, tinggi air, jari-jari leher, dan panjang leher.
- Panel hasil real-time berada di bawah animasi 3D.
- Tombol tiup berdurasi 5 detik.

### Section 4 — Menu Aplikasi Tangga Nada

Fitur aplikasi tangga nada membantu pengguna menargetkan nada musik dari botol.

- Tersedia tombol 15 nada dari C4 sampai C6:
  Do, Re, Mi, Fa, Sol, La, Si, Do tinggi, Re tinggi, Mi tinggi, Fa tinggi, Sol tinggi, La tinggi, Si tinggi, dan Do sangat tinggi.
- Setiap tombol menampilkan solmisasi, nada musik, dan frekuensi target.
- Secara default, menu ini memakai botol kosong dengan rongga udara awal 500 mL.
- Saat tombol nada diklik, aplikasi menghitung tinggi air yang diperlukan untuk mendekati frekuensi target, mengubah parameter tinggi air secara otomatis, lalu botol 3D mengaktifkan animasi partikel udara selama 2 detik.
- Parameter botol nyata tetap tersedia di sisi kanan:
  jari-jari leher, panjang leher, volume botol total, tinggi air, suhu udara, dan koreksi ujung.
- Panel hasil menampilkan frekuensi teoritis botol setelah tinggi air disetel, nada terdekat, selisih terhadap target nada, serta estimasi tinggi air agar mendekati nada target.

## Rumus utama

```text
f_H = (c / 2π) × √(A / (V × L_eff))
```

Dengan:

```text
A = πa²
L_eff = L + faktor_koreksi × a
Δp(t) = -ρc² × A × x(t) / V
```

Untuk target tangga nada:

```text
V_target = A / ((2πf_target / c)² × L_eff)
h_air = (1 - V_target / V_total) × 100%
```

## Cara menjalankan

```bash
npm install --registry=https://registry.npmjs.org/
npm run dev
```

Lalu buka alamat yang ditampilkan Vite, biasanya:

```text
http://localhost:5173
```

## Catatan

Folder ini sengaja tidak menyertakan `node_modules`, `dist`, dan `package-lock.json` agar instalasi tetap bersih di komputer lokal.

Mikrofon laptop tidak terkalibrasi untuk amplitudo atau tekanan bunyi presisi. Fitur praktikum ditujukan untuk estimasi frekuensi resonansi edukatif, bukan pengukuran laboratorium.

## Pustaka UI

- Persamaan matematika: `katex`.
- Ikon: `lucide-react`.

Lucide adalah pustaka ikon SVG open-source berlisensi ISC. Ikon digunakan untuk memperjelas menu materi, praktikum, simulasi, mikrofon, spektrum, parameter geometri, suhu, dan hasil pengukuran.
