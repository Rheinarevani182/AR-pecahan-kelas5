# Petualangan Pecahan — Prototype Web + AR Kelas 5 SD

## Isi starter
- `index.html` = website responsif materi pecahan dan kuis interaktif (langsung jalan)
- `content.js` = daftar materi, gambar kartu, video, dan soal (mudah diedit)
- `assets/cards/card-01.png` sampai `card-04.png` = empat desain kartu gambar
- `assets/videos/pizza-setengah.mp4` = contoh video animasi pizza
- `ar.html` = halaman MindAR untuk 4 target (harus diaktifkan setelah kompilasi)
- `assets/targets/` = lokasi file `targets.mind` hasil kompilasi.

## Langkah 1 — buka website di VS Code
1. Ekstrak ZIP ini, buka folder `pecahan-ar-starter` dari File > Open Folder di VS Code.
2. Instal extension **Live Server** (Ritwick Dey).
3. Klik kanan `index.html` > **Open with Live Server**.
4. Materi, kartu, dan kuis bisa dicoba di laptop sekarang.

## Langkah 2 — siapkan file target AR
1. Buka https://hiukim.github.io/mind-ar-js-doc/tools/compile/
2. Unggah empat file kartu **berurutan** `card-01.png`, `card-02.png`, `card-03.png`, `card-04.png` (urutannya sangat penting).
3. Klik Start, tunggu proses selesai, unduh file `targets.mind`.
4. Simpan sebagai `assets/targets/targets.mind`.
5. Buka `ar.html` di VS Code, cari `const AR_READY=false` lalu ubah menjadi `const AR_READY=true`.
6. Halaman AR kini mengacu ke file target yang valid.

## Langkah 3 — akses kamera dari HP
- Kamera browser memerlukan HTTPS (atau `localhost`). Live Server yang diakses HP lewat alamat IP lokal biasa umumnya tidak memenuhi persyaratan secure context.
- Deploy folder ke layanan hosting statis HTTPS seperti **Vercel** atau **Netlify**, lalu buka `https://.../ar.html` dari HP.
- Beri izin kamera, arahkan ke **gambar kartu yang sama persis** (cetak atau tampilkan gambar pada layar perangkat kedua).
- Kartu 1 menampilkan video animasi pizza; kartu 2–4 menampilkan overlay teks placeholder, bukan video final.
- Tekan tombol **Putar video / suara** jika autoplay diblokir browser.
- Tes di Android Chrome maupun iPhone Safari.

## Mengganti konten / menambah kartu
- Edit materi dan soal: `content.js`.
- Ganti **video** dengan file yang namanya sama: tidak perlu compile ulang target.
- Ganti **gambar kartu**: lakukan kompilasi ulang **semua** gambar target; pertahankan urutannya agar `targetIndex` sesuai.
- Tambah kartu: buat gambar baru, daftarkan di `content.js`, compile semua target, lalu tambahkan elemen `mindar-image-target` baru di `ar.html` dengan indeks berikutnya.
- Konten `content.js` dan scene `ar.html` masih diatur terpisah dalam starter. Ini bukan dashboard otomatis.

## Batasan jujur
- Prototype ini belum diuji langsung di kamera HP dan *tidak* menyertakan `.mind` siap pakai; compiler membutuhkan tahap manual dari browser.
- Ilustrasi pizza adalah animasi video 2D, **bukan model 3D yang bisa dipotong dengan jari**.
- Belum ada video untuk kartu 2–4, narasi, atau fitur login/penilaian tersimpan.
- Materi ini merupakan contoh edukasi, perlu review guru/dosen sesuai capaian kurikulum dan tujuan tugas.
- Library A-Frame/MindAR diunduh lewat CDN, membutuhkan internet saat memuat halaman.

Dokumentasi: https://hiukim.github.io/mind-ar-js-doc/quick-start/overview
