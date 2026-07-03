# IME Tambang - Crafting & Smelting Optimizer (FiveM Roleplay)

Kalkulator dan optimizer crafting untuk penambang di server FiveM IME Roleplay. Alat ini membantu menentukan jenis barang yang paling menguntungkan untuk diolah berdasarkan stok bahan di inventory Anda.

Aplikasi ini menggunakan algoritma greedy untuk mencocokkan stok bahan mentah dengan resep crafting yang tersedia guna mencari kombinasi produk dengan profit bersih tertinggi.

---

## Fitur Utama

### 1. Kalkulator Optimasi (Individual & Combo)
*   **Optimasi Combo**: Mencari kombinasi campuran beberapa jenis perhiasan atau ingot sekaligus untuk menghasilkan total keuntungan bersih paling optimal dari sisa bahan yang ada.
*   **Optimasi Individual**: Menampilkan peringkat perhiasan satu per satu jika Anda hanya ingin fokus memproduksi satu jenis barang dari awal hingga bahan habis.

### 2. Batasan Waktu Kerja (Time Limit)
*   Membatasi perhitungan berdasarkan durasi waktu luang yang Anda miliki. Kalkulator akan menyusun strategi pembuatan barang dengan profit per detik tertinggi agar waktu pengerjaan tidak melebihi batas waktu yang ditentukan.

### 3. Pemindai Gambar Otomatis (OCR Inventory Scanner)
*   Mengisi jumlah stok secara otomatis dengan mengunggah tangkapan layar (screenshot) tas/inventory dari dalam game. Berkas gambar cukup ditarik-lepas (drag-drop) atau ditempel (Ctrl+V) langsung ke area pemindaian. Skala canvas dioptimalkan ke 2.0x demi menghemat penggunaan memori.

### 4. Manajemen Multi-Profil
*   Menyimpan input stok inventory ke dalam beberapa profil berbeda di penyimpanan lokal browser. Mempermudah pelacakan stok pribadi, stok cadangan, atau milik rekan kerja tanpa risiko kehilangan data saat tab ditutup.

### 5. Ekspor Hasil Kalkulasi
*   Hasil optimasi dapat disalin dalam bentuk format teks ringkas atau diekspor langsung sebagai gambar PNG untuk dibagikan ke anggota kelompok atau grup koordinasi Discord.

### 6. Progressive Web App (PWA) & Offline Mode
*   Aplikasi dapat diinstal di PC/Desktop maupun HP dan dapat dimuat secara instan tanpa koneksi internet melalui caching Service Worker (`sw.js`).
*   **CORS Fallback**: Jika aplikasi dibuka langsung melalui klik ganda file `index.html` (protokol `file://`) dan browser memblokir request database karena kebijakan CORS, tombol uploader manual akan muncul untuk memuat berkas database JSON secara aman di sisi klien.

---

## Struktur Berkas

*   [index.html](file:///c:/Users/joguri/Documents/Ime%20Tambang/index.html): Berkas utama antarmuka (UI) dan registrasi Service Worker.
*   [ui.js](file:///c:/Users/joguri/Documents/Ime%20Tambang/ui.js): Logika manipulasi DOM, interaksi sub-tab responsif, profil stok, ekspor PNG, dan event listener halaman.
*   [calculator.js](file:///c:/Users/joguri/Documents/Ime%20Tambang/calculator.js): Algoritma optimasi greedy, memoization biaya rekursif, dan penyedia perhitungan optimasi.
*   [ocr.js](file:///c:/Users/joguri/Documents/Ime%20Tambang/ocr.js): Logika scanner Tesseract OCR, binarisasi canvas, penanganan drag/drop & paste gambar, serta status presensi Discord.
*   [manifest.json](file:///c:/Users/joguri/Documents/Ime%20Tambang/manifest.json): Konfigurasi PWA Manifest untuk penginstalan aplikasi.
*   [sw.js](file:///c:/Users/joguri/Documents/Ime%20Tambang/sw.js): Script Service Worker untuk penanganan caching aset statis secara offline.
*   [smelting_database.json](file:///c:/Users/joguri/Documents/Ime%20Tambang/smelting_database.json): Database harga bahan mentah, resep produk jadi, durasi crafting, dan pemetaan alias material.

---

## Konfigurasi Resep, Harga, dan Alias

Jika terjadi penyesuaian resep atau harga pasar di server IME Roleplay, Anda cukup mengubah nilai di dalam berkas [smelting_database.json](file:///c:/Users/joguri/Documents/Ime%20Tambang/smelting_database.json):

*   `raw_sell_prices`: Harga jual bahan mentah secara langsung.
*   `items`: Kategori, harga produk akhir, durasi pembuatan (`processing_time` / `processing_time_raw`), dan langkah pengerjaan (`processing_steps`).
*   `recipes`: Kebutuhan bahan mentah/perantara untuk setiap produk jadi.
*   `aliases`: Pemetaan alias nama material agar pengenalan OCR dapat dihubungkan secara dinamis ke material yang setara (misal: `Uncut Ruby` ke `Ruby`).

---

## Cara Menjalankan

Aplikasi ini berjalan sepenuhnya di sisi klien (client-side) tanpa memerlukan server backend terpisah.

### Metode 1: GitHub Pages (Online)
Aplikasi dapat diakses langsung secara online melalui tautan berikut:
[https://iru9o.github.io/Ime-Tambang/](https://iru9o.github.io/Ime-Tambang/)

### Metode 2: Menjalankan Secara Lokal (Offline)
Jika Anda ingin membukanya dari komputer lokal:

#### A. Membuka Berkas Langsung (CORS Fallback)
1. Ekstrak atau buka folder proyek.
2. Klik dua kali berkas [index.html](file:///c:/Users/joguri/Documents/Ime%20Tambang/index.html).
3. Saat muncul notifikasi kegagalan memuat database otomatis karena aturan CORS, klik tombol **"Pilih smelting_database.json"** dan pilih berkas `smelting_database.json` di dalam folder proyek.

#### B. Menggunakan Web Server Lokal (Direkomendasikan)
Guna menghindari batasan keamanan pembacaan berkas JSON lokal pada browser tertentu, disarankan menggunakan server statis:
*   Jika menggunakan VS Code, instal dan gunakan ekstensi **Live Server**.
*   Jika menggunakan Python, jalankan perintah ini di dalam folder proyek melalui terminal:
    ```bash
    python -m http.server 8000
    ```
    Kemudian akses via browser di alamat `http://localhost:8000`.

---

## Panduan Kontribusi

1. Lakukan **Fork** pada repositori ini (`https://github.com/iru9o/Ime-Tambang`).
2. Buat branch baru untuk perbaikan atau fitur baru:
   ```bash
   git checkout -b feature/nama-fitur
   ```
3. Lakukan perubahan kode. Pastikan format penulisan JSON di database tetap valid.
4. Lakukan commit dengan deskripsi perubahan yang jelas:
   ```bash
   git commit -m "update resep diamond ring"
   ```
5. Push branch tersebut ke repositori hasil fork Anda:
   ```bash
   git push origin feature/nama-fitur
   ```
6. Buka halaman repositori asli dan ajukan **Pull Request (PR)**.
