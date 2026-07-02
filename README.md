# IME Tambang - Crafting Optimizer

Aplikasi berbasis web untuk menghitung dan mengoptimalkan hasil crafting serta smelting dalam game IME Tambang. Alat ini membantu menentukan kombinasi produk yang paling menguntungkan untuk dibuat berdasarkan stok bahan mentah yang dimiliki di inventory.

## Fitur Utama

- **Kalkulator Optimasi**: Menghitung kombinasi crafting terbaik (combo) serta estimasi profit dari masing-masing item secara individual berdasarkan stok bahan mentah.
- **Database Item & Resep**: Menampilkan daftar harga jual bahan mentah, harga produk jadi, dan detail resep untuk setiap item.
- **Metrik Real-time**: Menampilkan total penjualan, estimasi profit bersih, nilai modal bahan mentah, persentase efisiensi penggunaan bahan, dan jumlah barang yang diproduksi.
- **Responsif**: Desain antarmuka gelap (dark mode) menggunakan Tailwind CSS yang responsif untuk perangkat mobile maupun desktop.

## Struktur File

- `index.html`: Berisi struktur UI, styling, dan logika algoritma perhitungan optimasi.
- `smelting_database.json`: Menyimpan data harga jual mentah, daftar item, kategori, dan resep crafting.

## Cara Menjalankan

Aplikasi ini tidak memerlukan proses build atau instalasi dependency tambahan. Anda dapat menjalankannya langsung di browser.

### Cara 1: Buka Langsung (Double-Click)
Cukup buka file `index.html` menggunakan browser pilihan Anda (Chrome, Edge, Firefox, dll).

### Cara 2: Menggunakan Local Server (Direkomendasikan)
Jika Anda menggunakan VS Code, Anda bisa menggunakan ekstensi **Live Server**. Atau, jalankan server statis sederhana via terminal:

Menggunakan Python:
```bash
python -m http.server 8000
```
Setelah itu, buka `http://localhost:8000` di browser Anda.

## Konfigurasi Resep & Harga

Untuk mengubah atau menambah resep baru serta menyesuaikan harga jual item, Anda dapat mengedit file `smelting_database.json` secara langsung. Format data di dalam JSON adalah sebagai berikut:

- `raw_sell_prices`: Harga jual jika bahan mentah langsung dijual tanpa di-craft.
- `items`: Daftar item beserta kategori dan harga jualnya.
- `recipes`: Detail bahan yang dibutuhkan untuk membuat suatu item.

## Kontribusi

Kontribusi untuk perbaikan bug, penambahan resep baru, atau peningkatan performa algoritma optimasi sangat diapresiasi. Silakan ikuti langkah-langkah di bawah ini untuk mulai berkontribusi:

1. Fork repository ini.
2. Buat branch baru untuk fitur atau perbaikan Anda (`git checkout -b feature/fitur-baru` atau `git checkout -b fix/perbaikan-bug`).
3. Lakukan perubahan kode. Jika Anda mengubah database, pastikan struktur JSON tetap valid.
4. Lakukan commit dengan pesan yang jelas (`git commit -m "Menambahkan resep baru"`).
5. Push perubahan Anda ke branch di repository hasil fork (`git push origin feature/fitur-baru`).
6. Buka halaman repository asli dan buat Pull Request.
