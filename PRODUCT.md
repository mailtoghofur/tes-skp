# PRODUCT.md - Daftar Fitur SKPFlow

Aplikasi: **SKPFlow** (Asisten Aktivitas Harian & Laporan Kinerja ASN)  
Mode Prototipe: Berjalan penuh di browser menggunakan penyimpanan lokal (`localStorage`) dan mesin asisten narasi kedinasan lokal tanpa server atau panggilan API eksternal.

## Daftar Fitur

| Kode | Nama Fitur | Prioritas | Ketergantungan | Status |
| :--- | :--- | :--- | :--- | :--- |
| FR-01 | Autentikasi Demo, Peran, dan Profil | P0 | - | Selesai |
| FR-02 | Dashboard ASN & Ringkasan Kinerja | P0 | FR-01, FR-03, FR-05 | Selesai |
| FR-03 | Catatan Aktivitas Harian (CRUD) | P0 | FR-01, FR-05 | Selesai |
| FR-04 | Tambah Cepat (Quick Add Bahasa Alami) | P0 | FR-03, FR-06 | Selesai |
| FR-05 | Pengelolaan Target Kinerja | P0 | FR-01 | Selesai |
| FR-06 | Asisten Narasi Kedinasan Lokal | P1 | FR-03, FR-05 | Selesai |
| FR-07 | Rekap Mingguan | P0 | FR-03, FR-05 | Selesai |
| FR-08 | Penyusun & Editor Laporan Bulanan | P0 | FR-03, FR-05, FR-06 | Selesai |
| FR-09 | Ekspor Laporan (PDF, DOCX, XLSX) | P0/P1 | FR-08 | Selesai |
| FR-10 | Lampiran Bukti Dukung | P1 | FR-03 | Selesai |
| FR-11 | Review & Persetujuan Atasan | P1 | FR-01, FR-08 | Selesai |
| FR-12 | Pencarian & Filter Aktivitas | P0 | FR-03 | Selesai |
| FR-13 | Pengelolaan Admin (Pengguna, Unit, Kategori, Template) | P1 | FR-01 | Selesai |
| FR-14 | Audit Log & Notifikasi | P1 | FR-01..FR-13 | Selesai |

## Catatan Penyesuaian Teknis

1. Sesuai batasan arsitektur statis browser-only, penyimpanan data persisten menggunakan satu kunci `localStorage` (`skpflow_app_state_v1`) dengan lapisan abstraksi data terpisah (`src/lib/storage.ts`).
2. Asisten penulisan AI (FR-06) dan pemecah teks Tambah Cepat (FR-04) menggunakan pemrosesan berbasis aturan lokal yang selalu faktual sesuai data sumber dan dapat diedit pengguna sebelum disimpan.
3. Lampiran bukti dukung (FR-10) memvalidasi tipe dan ukuran berkas di browser serta menyimpan pratinjau/metadata secara lokal sesuai batas kapasitas penyimpanan browser.
