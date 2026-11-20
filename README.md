# SKPFlow - Asisten Aktivitas Harian & Kinerja ASN

**Tagline:** *Catat hari ini, susun kinerja tanpa repot.*

SKPFlow adalah aplikasi web responsif yang membantu Aparatur Sipil Negara (ASN) mencatat pekerjaan harian, menghubungkan aktivitas ke target kinerja, menyimpan bukti dukung, menyusun rekap mingguan, serta menghasilkan draft laporan bulanan yang dapat diedit, diekspor (PDF, DOCX, XLSX), dan ditinjau oleh atasan.

## Cara Menjalankan Aplikasi

1. Pasang seluruh dependensi proyek:
   ```bash
   npm install
   ```
2. Jalankan mode pengembangan pada port 3000:
   ```bash
   npm run dev
   ```
3. Untuk build produksi:
   ```bash
   npm run build
   ```

## Konfigurasi Environment

Pada mode prototipe statis ini, aplikasi berjalan penuh di browser menggunakan `localStorage` (`skpflow_app_state_v1`) tanpa memerlukan koneksi server atau kunci API eksternal. Salin `.env.example` ke `.env` hanya jika suatu saat diintegrasikan dengan backend.

## Akun Demo Siap Pakai

Seluruh akun demo menggunakan kata sandi **`demo`** atau dapat dipilih langsung lewat tombol **Masuk** pada panel *Akses Cepat Akun Demo*:

| Peran | Nama | Email |
| :--- | :--- | :--- |
| **ASN / Pegawai** | Rina Kusuma Dewi, S.Kom. | `rina.kusuma@instansi.contoh.go.id` |
| **ASN / Pegawai** | Bagus Pratama Putra, S.Si. | `bagus.pratama@instansi.contoh.go.id` |
| **Atasan / Pejabat Penilai** | Hendra Wijaya, M.T. | `hendra.wijaya@instansi.contoh.go.id` |
| **Admin Sistem** | Sari Wulandari, S.AP. | `admin.kepegawaian@instansi.contoh.go.id` |

## Keterbatasan Prototipe

- Seluruh data disimpan secara lokal di browser (`localStorage`), sehingga tidak tersinkronisasi antar perangkat berbeda.
- Asisten penulisan narasi kedinasan dan pemecah kalimat *Tambah Cepat* berjalan secara lokal berbasis aturan faktual sesuai data yang dicatat pengguna, tanpa mengirim data ke layanan AI eksternal.
- Lampiran bukti dukung dibatasi maksimal 2 MB per berkas demi menjaga kapasitas penyimpanan lokal browser.
- Bukan pengganti sistem penilaian kinerja resmi (e-Kinerja); laporan berfungsi sebagai bahan/draft kerja yang dapat disunting dan diekspor.
