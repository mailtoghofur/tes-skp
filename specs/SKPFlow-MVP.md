# Spesifikasi Fitur MVP SKPFlow (FR-01 hingga FR-14)

Sumber PRD: Bagian 5, 6, 7, 8, 9, dan 14 PRD SKPFlow v1.0.

## Tujuan
Memberikan ruang kerja harian untuk ASN, Atasan, dan Admin guna mencatat aktivitas kerja, memetakan target kinerja, menyusun laporan bulanan (PDF/DOCX/XLSX), serta melakukan review berjenjang secara lokal di browser.

## Alur
1. Pengguna masuk melalui akun demo sesuai peran (ASN, Atasan, atau Admin).
2. ASN mencatat aktivitas via Tambah Cepat atau formulir lengkap, memetakan target aktif, mengunggah bukti dukung, meninjau rekap mingguan, menyusun/mengedit/mengekspor laporan bulanan, lalu mengajukan ke atasan.
3. Atasan memantau tim, meninjau laporan bawahan, memberi catatan, meminta revisi, atau menyetujui laporan.
4. Admin mengelola pengguna, unit kerja, kategori, template laporan, pengaturan, dan memantau audit log.

## Data
Seluruh data awal, peran, unit, kategori, dan token visual bersumber dari `src/config.ts` dan disimpan pada kunci tunggal `localStorage` (`skpflow_app_state_v1`) melalui `src/lib/storage.ts`.

## Aturan dan Rumus
- Realisasi target kinerja = jumlah `output_quantity` dari aktivitas yang terhubung ke target terkait (tidak pernah diestimasi oleh asisten narasi).
- Target yang berstatus `Diarsipkan`, `Selesai`, atau di luar tanggal periode tidak disarankan saat membuat aktivitas baru.
- Laporan bulanan hanya mengambil aktivitas pada bulan dan tahun terpilih; aktivitas tanpa output ditandai `"Belum ada output tercatat"`.
- Format tanggal Indonesia (`19 November 2026`), jam WIB (`08.00–16.30 WIB`), dan angka desimal koma (`4,5`).

## Input dan Validasi
- Aktivitas wajib memiliki tanggal valid (`YYYY-MM-DD`), judul minimal 4 karakter, dan kategori.
- Jumlah output menerima koma atau titik dan harus bernilai non-negatif.
- Lampiran bukti dukung dibatasi pada format `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx` dengan batas ukuran default 2 MB.
- Permintaan revisi oleh atasan wajib disertai komentar catatan perbaikan.

## Kasus Uji
| ID | Input | Hasil yang diharapkan | Sumber |
| :--- | :--- | :--- | :--- |
| TC-01 | Kalimat Tambah Cepat: "Hari ini melakukan backup database SIMOPPA, mengecek server, dan memperbaiki bug login aplikasi." | Dipecah menjadi 3 item terpisah dengan saran kategori dan target aktif tanpa menyimpan otomatis | PRD FR-04 |
| TC-02 | Aktivitas tanpa `output_description` dan `output_quantity` pada laporan bulanan | Ditandai "Belum ada output tercatat" dan tidak diisi otomatis | PRD FR-08 |
| TC-03 | Mengubah jumlah output aktivitas terkait target sebesar `2` dan `1` | Realisasi target tercatat menjadi `3` dan persentase diperbarui | PRD FR-05 |
| TC-04 | Unggah lampiran `.exe` atau ukuran > 2 MB | Ditolak dengan pesan kesalahan format/ukuran yang jelas | PRD FR-10 |
| TC-05 | Nilai desimal input `2,5` pada jumlah output | Tersimpan sebagai `2.5` dan tampil sebagai `2,5` | Tambahan |

## Di luar lingkup
Integrasi e-Kinerja nasional, tanda tangan elektronik tersertifikasi, server/database eksternal, dan pemanggilan API AI eksternal saat runtime.

## Pertanyaan terbuka
Tidak ada (seluruh keputusan desain dan cakupan telah dikonfirmasi pengguna).
