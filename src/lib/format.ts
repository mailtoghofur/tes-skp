// Fungsi pemformatan tanggal, jam WIB, angka desimal, ukuran berkas, dan nama dokumen ekspor berbahasa Indonesia.

import { INDONESIAN_MONTHS } from '../config';

export function getTodayWIB(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function getNowWIBTimestamp(): string {
  return new Date().toISOString();
}

export function formatDateID(isoDate: string): string {
  if (!isoDate) return '-';
  const datePart = isoDate.slice(0, 10);
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const monthName = INDONESIAN_MONTHS[month - 1] ?? '';
  return `${day} ${monthName} ${year}`;
}

export function formatShortDateID(isoDate: string): string {
  if (!isoDate) return '-';
  const datePart = isoDate.slice(0, 10);
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const shortMonth = (INDONESIAN_MONTHS[month - 1] ?? '').slice(0, 3);
  return `${day} ${shortMonth} ${year}`;
}

export function formatMonthYearID(month: number, year: number): string {
  const monthName = INDONESIAN_MONTHS[month - 1] ?? 'Bulan';
  return `${monthName} ${year}`;
}

export function formatTimeWIB(isoTimestamp: string): string {
  if (!isoTimestamp) return '-';
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return '-';
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${formatted.replace(':', '.')} WIB`;
}

export function formatDateTimeWIB(isoTimestamp: string): string {
  if (!isoTimestamp) return '-';
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return '-';
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return `${formatDateID(dateStr)}, ${formatTimeWIB(isoTimestamp)}`;
}

export function formatDecimalID(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace('.', ',');
}

export function parseDecimalInput(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (Number.isNaN(num)) return null;
  return num;
}

export function formatDurationID(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours} jam ${mins} menit`;
  if (hours > 0) return `${hours} jam`;
  return `${mins} menit`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${formatDecimalID(bytes / 1024)} KB`;
  return `${formatDecimalID(bytes / (1024 * 1024))} MB`;
}

export function buildExportFileName(
  fullName: string,
  month: number,
  year: number,
  extension: 'pdf' | 'docx' | 'xlsx',
): string {
  const safeName = fullName
    .split(',')[0]
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_') || 'ASN';
  const mm = String(month).padStart(2, '0');
  return `Laporan_Kinerja_Bulanan_${safeName}_${year}-${mm}.${extension}`;
}

export function getWeekBounds(isoDate: string): { start: string; end: string } {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const toISO = (dt: Date) => dt.toISOString().slice(0, 10);
  return { start: toISO(monday), end: toISO(sunday) };
}

export function shiftISODate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return date.toISOString().slice(0, 10);
}
