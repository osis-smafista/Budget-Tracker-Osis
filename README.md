# Sistem Keuangan OSIS

Website sederhana untuk mencatat pemasukan dan pengeluaran OSIS. Aplikasi ini menggunakan HTML, CSS, dan JavaScript serta terhubung ke Google Apps Script sebagai backend.

## Fitur

- Menambahkan transaksi pemasukan atau pengeluaran.
- Memilih bulan dan tanggal transaksi.
- Memformat nominal ke dalam Rupiah.
- Melihat riwayat transaksi berdasarkan bulan.
- Menghapus transaksi.
- Menampilkan total pemasukan, total pengeluaran, dan saldo.

## Struktur File

```text
.
├── index.html   # Halaman utama aplikasi
├── style.css    # Tampilan dan responsive layout
├── script.js    # Logika aplikasi dan koneksi API
├── .gitignore   # File yang tidak perlu diunggah ke Git
└── README.md    # Dokumentasi proyek
```

## Menjalankan Secara Lokal

Karena aplikasi ini adalah website statis, file dapat dijalankan dengan membuka `index.html` di browser. Untuk pengalaman yang lebih konsisten, gunakan extension seperti Live Server di VS Code.

Pastikan URL Google Apps Script pada `script.js` masih aktif dan dapat menerima request dari website.

## Konfigurasi Backend

Endpoint backend saat ini diatur pada konstanta `API_URL` di `script.js`. Backend Google Apps Script perlu menyediakan operasi berikut:

- `GET?action=months` untuk mengambil daftar bulan.
- `GET?action=riwayat&bulan=...` untuk mengambil riwayat transaksi.
- `POST` dengan `action: "tambah"` untuk menyimpan transaksi.
- `POST` dengan `action: "hapus"` untuk menghapus transaksi.

Jika endpoint diganti, ubah nilai `API_URL` sebelum melakukan deploy ulang.

> Jangan menyimpan API key, password, token, atau kredensial rahasia di file frontend. Semua kode di repository GitHub dapat dilihat publik jika repository dibuat public.

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub.
2. Unggah seluruh isi folder `real website` ke repository tersebut.
3. Buka **Settings** > **Pages**.
4. Pada bagian **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch utama, folder `/ (root)`, lalu klik **Save**.
6. Tunggu proses deployment selesai, kemudian buka URL GitHub Pages yang diberikan.

Pastikan `index.html` berada di root repository agar GitHub Pages dapat menemukannya.

## Catatan

- Website membutuhkan koneksi internet untuk berkomunikasi dengan Google Apps Script.
- Data transaksi tidak disimpan di browser, melainkan dikirim ke backend yang dikonfigurasi pada `API_URL`.
- Atur izin deployment Google Apps Script sesuai kebutuhan akses aplikasi.
