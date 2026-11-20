# DESIGN.md - Keputusan Desain SKPFlow

Dokumen ini mencatat seluruh keputusan desain yang disetujui pengguna serta token visual baku aplikasi.

## Keputusan Pengguna

- **Kesan Visual**: Ramah dan hangat dengan jenis huruf **Plus Jakarta Sans** (ketebalan 400, 500, dan 600 melalui `@fontsource/plus-jakarta-sans`).
- **Warna Aksen**: Biru (`blue-700`, hover `blue-800`, penanda terpilih `blue-50`).
- **Sapaan**: Anda (formal untuk lingkungan ASN).
- **Cakupan**: Lengkap untuk peran ASN, Atasan, dan Admin.
- **Tata Letak**:
  - Desktop: Sidebar navigasi tetap di kiri, topbar ringkas di atas, dan area kerja utama yang lega.
  - Mobile (mulai 360px): Topbar ringkas, navigasi bawah (bottom navigation), dan tombol aksi utama yang langsung terlihat tanpa menggulir di layar 360 x 740 px.

## Token & Aturan Visual

- **Latar Halaman**: `bg-neutral-50`
- **Panel & Kartu**: `bg-white` (tanpa menaruh kartu di dalam kartu, garis tepi `border-neutral-200` khusus untuk input, tabel, dan pemisah)
- **Sudut**: Panel `rounded-2xl`, tombol dan input `rounded-xl`, penanda status `rounded-full`
- **Bayangan**: Hanya untuk elemen melayang (modal, drawer, toast) memakai `shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]`
- **Teks**:
  - Utama: `text-neutral-900`
  - Pendukung: `text-neutral-600`
  - Placeholder: `text-neutral-500`
  - Angka & tabel: `tabular-nums`
- **Status Workflow**: Pasangan warna lembut `-50` dan teks `-800` disertai ikon dan label teks eksplisit (Draft, Diajukan, Dalam Review, Perlu Revisi, Disetujui).
- **Aksesibilitas**: Area sentuh minimal 44 x 44 px, ukuran teks input minimal 16 px (`text-base`), label selalu terlihat, cincin fokus `focus-visible` biru 2 px.
