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
├── config.example.js # Template konfigurasi API
├── config.js     # Konfigurasi lokal, tidak diunggah ke Git
├── .gitignore   # File yang tidak perlu diunggah ke Git
└── .github/workflows/deploy-pages.yml # Workflow deploy GitHub Pages
└── README.md    # Dokumentasi proyek
```

## Menjalankan Secara Lokal

Karena aplikasi ini adalah website statis, file dapat dijalankan dengan membuka `index.html` di browser. Untuk pengalaman yang lebih konsisten, gunakan extension seperti Live Server di VS Code.

Sebelum menjalankan aplikasi, salin `config.example.js` menjadi `config.js`, lalu isi URL Google Apps Script milikmu:

```js
window.APP_CONFIG = {
	API_URL: 'URL_GOOGLE_APPS_SCRIPT_MILIKMU'
};
```

File `config.js` sengaja masuk `.gitignore`, sehingga tidak ikut terunggah ke GitHub.

## Konfigurasi Backend

Endpoint backend dibaca dari `config.js`. Backend Google Apps Script perlu menyediakan operasi berikut:

- `GET?action=months` untuk mengambil daftar bulan.
- `GET?action=riwayat&bulan=...` untuk mengambil riwayat transaksi.
- `POST` dengan `action: "tambah"` untuk menyimpan transaksi.
- `POST` dengan `action: "hapus"` untuk menghapus transaksi.

Jika endpoint diganti, ubah nilai `API_URL` di `config.js` sebelum menjalankan aplikasi kembali.

> Jangan menyimpan API key, password, token, atau kredensial rahasia di file frontend. Semua kode di repository GitHub dapat dilihat publik jika repository dibuat public.

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub.
2. Unggah seluruh isi folder `osis-bt-app` ke repository tersebut.
3. Buka **Settings** > **Secrets and variables** > **Actions**.
4. Buat repository secret bernama `API_URL` dan isi dengan URL Google Apps Script.
5. Buka **Settings** > **Pages**, lalu pilih **GitHub Actions** sebagai source.
6. Push ke branch `main` atau jalankan workflow `Deploy website to GitHub Pages` dari tab **Actions**.
7. Tunggu proses deployment selesai, kemudian buka URL GitHub Pages yang diberikan.

Workflow akan membuat `config.js` saat proses deploy menggunakan secret `API_URL`. Jangan masukkan URL API asli ke `config.example.js` atau commit `config.js`.

## Catatan

- Website membutuhkan koneksi internet untuk berkomunikasi dengan Google Apps Script.
- Data transaksi tidak disimpan di browser, melainkan dikirim ke backend yang dikonfigurasi pada `config.js`.
- URL API tidak disimpan di source code yang diunggah ke GitHub, tetapi tetap dapat terlihat oleh pengguna melalui browser saat aplikasi mengirim request.
- Atur izin deployment Google Apps Script sesuai kebutuhan akses aplikasi.
