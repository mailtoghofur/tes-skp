// Berisi aturan validasi formulir, validasi berkas bukti dukung, dan pemeriksaan kewenangan peran (RBAC).

import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
} from '../config';
import { Activity, MonthlyReport, PerformanceTarget, Profile } from '../types';
import { parseDecimalInput } from './format';

export type ValidationErrors = Record<string, string>;

export function validateActivityForm(input: {
  activity_date: string;
  title: string;
  category: string;
  output_quantity_raw: string;
  duration_raw: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.activity_date.trim()) {
    errors.activity_date = 'Pilih tanggal aktivitas. Contoh: 19 November 2026.';
  }

  const title = input.title.trim();
  if (!title) {
    errors.title = 'Isi judul aktivitas. Contoh: Backup database aplikasi SIMOPPA.';
  } else if (title.length < 4) {
    errors.title = 'Judul minimal 4 karakter. Contoh: Rapat koordinasi tim.';
  }

  if (!input.category.trim()) {
    errors.category = 'Pilih kategori aktivitas yang sesuai.';
  }

  if (input.output_quantity_raw.trim()) {
    const qty = parseDecimalInput(input.output_quantity_raw);
    if (qty === null || qty < 0) {
      errors.output_quantity = 'Masukkan angka jumlah output yang benar. Contoh: 1 atau 2,5.';
    }
  }

  if (input.duration_raw.trim()) {
    const dur = Number(input.duration_raw.trim());
    if (Number.isNaN(dur) || dur < 0 || !Number.isInteger(dur)) {
      errors.duration_minutes = 'Isi durasi dengan bilangan bulat menit. Contoh: 60.';
    }
  }

  return errors;
}

export function validateQuickAddForm(input: {
  text: string;
  activity_date: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.text.trim() || input.text.trim().length < 5) {
    errors.text =
      'Tulis minimal satu kegiatan singkat. Contoh: Hari ini melakukan backup database SIMOPPA.';
  }
  if (!input.activity_date.trim()) {
    errors.activity_date = 'Pilih tanggal kegiatan. Contoh: 19 November 2026.';
  }
  return errors;
}

export function validateTargetForm(input: {
  title: string;
  indicator: string;
  target_value_raw: string;
  unit: string;
  period_start: string;
  period_end: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.title.trim()) {
    errors.title = 'Isi nama target kinerja. Contoh: Pengelolaan layanan TI.';
  }
  if (!input.indicator.trim()) {
    errors.indicator = 'Isi indikator capaian. Contoh: Jumlah pemeliharaan rutin.';
  }

  const targetVal = parseDecimalInput(input.target_value_raw);
  if (targetVal === null || targetVal <= 0) {
    errors.target_value = 'Isi nilai target lebih dari nol. Contoh: 12.';
  }

  if (!input.unit.trim()) {
    errors.unit = 'Isi satuan target. Contoh: kegiatan atau dokumen.';
  }

  if (!input.period_start || !input.period_end) {
    errors.period = 'Tentukan tanggal awal dan akhir periode target.';
  } else if (input.period_start > input.period_end) {
    errors.period = 'Tanggal akhir harus sama atau setelah tanggal awal. Contoh: 31 Des 2026.';
  }

  return errors;
}

export function validateAttachmentFile(
  file: File,
  maxBytes: number = MAX_ATTACHMENT_BYTES,
): string | null {
  const lowerName = file.name.toLowerCase();
  const extAllowed = ALLOWED_ATTACHMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const mimeAllowed = !file.type || ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type);

  if (!extAllowed && !mimeAllowed) {
    return 'Format berkas tidak didukung. Gunakan PDF, JPG, PNG, DOC/DOCX, atau XLS/XLSX.';
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return `Ukuran berkas melebihi batas ${maxMb} MB. Contoh: unggah berkas di bawah ${maxMb} MB.`;
  }

  return null;
}

export function isTargetActiveForDate(target: PerformanceTarget, isoDate: string): boolean {
  if (target.status !== 'Aktif') return false;
  return isoDate >= target.period_start && isoDate <= target.period_end;
}

export function canAccessActivity(
  viewer: Profile,
  activity: Activity,
  allProfiles: Profile[],
): boolean {
  if (viewer.role === 'admin') return true;
  if (activity.user_id === viewer.user_id) return true;
  if (viewer.role === 'supervisor') {
    const owner = allProfiles.find((p) => p.user_id === activity.user_id);
    return owner?.supervisor_id === viewer.user_id;
  }
  return false;
}

export function canReviewReport(
  reviewer: Profile,
  report: MonthlyReport,
  allProfiles: Profile[],
): boolean {
  if (reviewer.role !== 'supervisor') return false;
  const owner = allProfiles.find((p) => p.user_id === report.user_id);
  return owner?.supervisor_id === reviewer.user_id;
}

export function getSupervisedProfiles(
  supervisor: Profile,
  allProfiles: Profile[],
): Profile[] {
  return allProfiles.filter(
    (p) => p.supervisor_id === supervisor.user_id && p.role === 'employee',
  );
}
