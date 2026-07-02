# IME Tambang - Crafting & Smelting Optimizer (FiveM Roleplay)

Aplikasi kalkulator dan optimasi berbasis web yang dirancang khusus untuk para pemain di server **FiveM IME Roleplay**. Alat ini memecahkan masalah klasik para penambang: **"Dengan stok bahan mentah yang saya miliki saat ini, barang apa saja yang harus saya buat (craft/smelt) untuk mendapatkan keuntungan (profit) bersih yang paling maksimal?"**

Aplikasi ini menggunakan algoritma pintar (*Greedy Algorithm*) yang secara otomatis memadukan berbagai resep crafting untuk menghasilkan rencana kerja paling cuan dan efisien.

---

## 🚀 Fitur Utama & Penjelasan untuk Orang Awam

### 1. 📊 Kalkulator Optimasi (Individual & Combo)
*   **Optimasi Combo (Rekomendasi)**: Fitur ini secara cerdas mencampurkan beberapa jenis perhiasan/ingot untuk dibuat sekaligus. Algoritma akan menghabiskan stok Anda dengan memilih kombinasi produk yang menghasilkan total profit bersih tertinggi.
*   **Optimasi Individual**: Menampilkan peringkat barang satu per satu jika Anda hanya ingin fokus membuat 1 jenis barang saja dari awal sampai habis (misal: hanya ingin membuat *Ruby Necklace (Gold)*).

### 2. ⏱️ Batasan Waktu Kerja (Time Limit Constraint)
*   Anda bisa mengatur berapa lama waktu kerja yang Anda miliki (dalam jam, menit, atau detik). 
*   Kalkulator akan menghitung strategi pembuatan barang yang paling efisien agar waktu kerja Anda tidak terbuang sia-sia dan tetap menghasilkan profit per detik tertinggi (*Profit-per-second Rate*).

### 3. 📷 Pemindai Gambar Otomatis (OCR Inventory Scanner)
*   Malas memasukkan angka stok satu per satu? Cukup ambil tangkapan layar (*screenshot*) tas/inventory Anda di dalam game FiveM IME Roleplay, lalu **tarik-lepas (drag-drop)** atau **tempel (Ctrl+V)** gambar tersebut ke area scanner.
*   Menggunakan teknologi kecerdasan buatan **Tesseract.js**, sistem akan mendeteksi nama barang serta jumlahnya secara otomatis dan langsung mengisinya ke kolom input stok.

### 4. 📂 Sistem Multi-Profil (Simpan Data Stok)
*   Anda dapat menyimpan data inventory Anda ke dalam beberapa profil penyimpanan lokal (misal: "Stok Tambang Utama", "Stok Cadangan", atau "Stok Milik Teman").
*   Berguna untuk memantau perkembangan tambang Anda dari hari ke hari tanpa takut kehilangan data inputan saat browser ditutup.

### 5. 🎨 Antarmuka Modern & Responsif
*   Desain antarmuka gelap (*dark mode*) premium dengan efek *glassmorphic* yang nyaman di mata.
*   Tampilan responsif yang ramah diakses melalui Handphone (mobile) maupun PC/Desktop.
*   Dilengkapi tombol **Salin Ringkasan Teks** dan **Ekspor Gambar PNG** untuk membagikan rencana kerja hasil kalkulasi ke teman atau grup Discord Anda.

---

## 📁 Struktur Berkas Proyek

*   [index.html](file:///c:/Users/joguri/Documents/Ime%20Tambang/index.html): Berisi seluruh struktur antarmuka (UI), gaya visual (CSS), dan logika pemrograman algoritma optimasi (JavaScript).
*   [smelting_database.json](file:///c:/Users/joguri/Documents/Ime%20Tambang/smelting_database.json): Berisi database resep, harga bahan mentah (raw), harga jual produk akhir, durasi kerja, dan jumlah langkah pemrosesan crafting.

---

## ⚙️ Menyesuaikan Resep & Harga Jual

Jika di server FiveM IME Roleplay terjadi perubahan harga pasar atau resep crafting, Anda tidak perlu mengubah kode pemrograman. Cukup edit berkas database [smelting_database.json](file:///c:/Users/joguri/Documents/Ime%20Tambang/smelting_database.json):

*   `raw_sell_prices`: Mengubah harga jual mentah utama (jika dijual langsung tanpa diolah).
*   `items`: Mengubah kategori, harga jual produk jadi, durasi crafting (`processing_time`), durasi total (`processing_time_raw`), dan langkah proses (`processing_steps`).
*   `recipes`: Mengubah bahan-bahan yang dibutuhkan untuk membuat suatu item.

---

## 💻 Cara Membuka & Menjalankan Aplikasi

Aplikasi ini bersifat *client-side* (tidak memerlukan database server eksternal), sehingga sangat mudah dijalankan.

### Cara 1: Akses Langsung Online (GitHub Pages)
Anda bisa langsung membuka aplikasi ini di browser internet tanpa mengunduh berkas apa pun lewat tautan resmi berikut:
🔗 **[https://iru9o.github.io/Ime-Tambang/](https://iru9o.github.io/Ime-Tambang/)**

---

### Cara 2: Menjalankan Secara Lokal (Offline)
Jika Anda mengunduh source code proyek ini di komputer Anda, gunakan salah satu metode berikut:

#### A. Membuka File Langsung (Double-Click)
1.  Buka folder proyek hasil unduhan.
2.  Klik dua kali pada file [index.html](file:///c:/Users/joguri/Documents/Ime%20Tambang/index.html).
3.  Aplikasi akan langsung terbuka di browser Anda (Chrome, Edge, Firefox, dll).

#### B. Menggunakan Local Server (Direkomendasikan untuk pengembangan)
Untuk menghindari kendala pembatasan keamanan beberapa fitur browser saat membaca database JSON lokal, disarankan menggunakan web server statis sederhana:

*   **VS Code**: Gunakan ekstensi **Live Server**, lalu klik tombol *Go Live* di kanan bawah editor.
*   **Python**: Jalankan perintah berikut di terminal/PowerShell di dalam direktori proyek:
    ```bash
    python -m http.server 8000
    ```
    Setelah itu, akses aplikasinya di alamat **`http://localhost:8000`**.

---

## 🤝 Panduan Kontribusi

Kontribusi untuk perbaikan bug, pembaruan resep, atau peningkatan visual sangat kami hargai.

1.  Lakukan **Fork** pada repository GitHub proyek ini (`https://github.com/iru9o/Ime-Tambang`).
2.  Buat branch fitur baru Anda di lokal komputer:
    ```bash
    git checkout -b feature/fitur-keren-baru
    ```
3.  Lakukan perubahan kode Anda. (Pastikan database JSON tetap memiliki format sintaks yang valid).
4.  Lakukan commit perubahan Anda dengan pesan yang jelas:
    ```bash
    git commit -m "Menambahkan resep baru perhiasan Diamond Gold"
    ```
5.  Push branch Anda ke repository fork di GitHub:
    ```bash
    git push origin feature/fitur-keren-baru
    ```
6.  Buka repository asli kami di GitHub dan buat **Pull Request (PR)**.
