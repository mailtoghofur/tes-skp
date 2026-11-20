// Asisten penulisan dan pemecah aktivitas lokal berbasis aturan faktual tanpa mengarang data baru.

import {
  Activity,
  MonthlyReportContent,
  PerformanceTarget,
  ReportActivityRow,
  ReportChallengeRow,
  ReportTargetRow,
  ReportTemplateConfig,
  QuickAddItem,
} from '../types';
import { formatDateID, formatDecimalID, formatMonthYearID } from './format';
import { isTargetActiveForDate } from './validation';

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'Pengelolaan Database',
    keywords: ['database', 'basis data', 'postgresql', 'mysql', 'sql', 'backup', 'query', 'indeks'],
  },
  {
    category: 'Pemeliharaan Sistem',
    keywords: ['simoppa', 'pemeliharaan', 'maintenance', 'patch', 'update', 'server', 'sistem', 'cek'],
  },
  {
    category: 'Pengembangan Aplikasi',
    keywords: ['bug', 'login', 'aplikasi', 'fitur', 'dashboard', 'modul', 'kode', 'perbaikan', 'ui'],
  },
  {
    category: 'Pengelolaan Data',
    keywords: ['data', 'validasi', 'olah', 'pengolahan', 'dataset', 'survei', 'rekapitulasi'],
  },
  {
    category: 'Dukungan Teknis',
    keywords: ['jaringan', 'wifi', 'switch', 'troubleshooting', 'loket', 'kendala', 'printer', 'tiket'],
  },
  {
    category: 'Rapat & Koordinasi',
    keywords: ['rapat', 'koordinasi', 'diskusi', 'pertemuan', 'sinkronisasi', 'pembahasan'],
  },
  {
    category: 'Dokumentasi & Pelaporan',
    keywords: ['laporan', 'dokumentasi', 'sop', 'panduan', 'notulensi', 'monitoring'],
  },
];

export function suggestCategory(text: string, availableCategories: string[]): string {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (
      availableCategories.includes(entry.category) &&
      entry.keywords.some((kw) => lower.includes(kw))
    ) {
      return entry.category;
    }
  }
  return availableCategories[0] ?? 'Pemeliharaan Sistem';
}

export function suggestTargetId(
  text: string,
  targets: PerformanceTarget[],
  activityDate: string,
): string | null {
  const eligible = targets.filter((t) => isTargetActiveForDate(t, activityDate));
  if (eligible.length === 0) return null;

  const lower = text.toLowerCase();
  let bestTarget: PerformanceTarget | null = null;
  let bestScore = 0;

  for (const tgt of eligible) {
    const haystack = `${tgt.title} ${tgt.description} ${tgt.indicator}`.toLowerCase();
    const tokens = lower
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3);

    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }

    if (lower.includes('simoppa') || lower.includes('database') || lower.includes('backup')) {
      if (haystack.includes('layanan ti') || haystack.includes('pemeliharaan')) score += 2;
    }
    if (lower.includes('bug') || lower.includes('dashboard') || lower.includes('fitur')) {
      if (haystack.includes('pengembangan') || haystack.includes('aplikasi')) score += 2;
    }
    if (lower.includes('jaringan') || lower.includes('server') || lower.includes('troubleshooting')) {
      if (haystack.includes('dukungan teknis') || haystack.includes('layanan ti')) score += 1;
    }
    if (lower.includes('laporan') || lower.includes('dokumentasi')) {
      if (haystack.includes('dokumentasi') || haystack.includes('pelaporan')) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTarget = tgt;
    }
  }

  return bestScore > 0 && bestTarget ? bestTarget.id : null;
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim().replace(/^[,\s.;]+|[,\s.;]+$/g, '');
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function stripLeadingTimeWords(clause: string): string {
  return clause
    .replace(/^(hari ini|tadi pagi|tadi siang|tadi sore|kemarin|saya|kami)\s+/i, '')
    .replace(/^(melakukan|mengerjakan|menyelesaikan)\s+/i, (m) => m)
    .trim();
}

export function polishFormalNarrative(
  title: string,
  description: string,
  outputDescription: string,
): { title: string; description: string } {
  const cleanTitle = capitalizeSentence(
    title
      .replace(/^hari ini\s+/i, '')
      .replace(/^saya\s+/i, '')
      .replace(/^mengecek\b/i, 'Pemeriksaan')
      .replace(/^cek\b/i, 'Pemeriksaan')
      .replace(/^memperbaiki\b/i, 'Perbaikan')
      .replace(/^melakukan\s+/i, ''),
  );

  const sourceDesc = description.trim() || title.trim();
  const baseDesc = capitalizeSentence(sourceDesc.replace(/^hari ini\s+/i, ''));
  const formalDesc = baseDesc.endsWith('.') ? baseDesc : `${baseDesc}.`;

  if (outputDescription.trim()) {
    const outClean = outputDescription.trim().replace(/\.$/, '');
    return {
      title: cleanTitle || capitalizeSentence(title),
      description: `${formalDesc} Hasil yang dicapai berupa ${outClean}.`,
    };
  }

  return {
    title: cleanTitle || capitalizeSentence(title),
    description: formalDesc,
  };
}

export function parseQuickAddText(
  rawText: string,
  activityDate: string,
  resultHint: string,
  targets: PerformanceTarget[],
  categories: string[],
): QuickAddItem[] {
  const normalized = rawText
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];

  const splitRegex = /(?:\s*;\s*|\s*\.\s+|\s*,\s*(?:dan|lalu|kemudian|serta)?\s*|\s+(?:dan|lalu|kemudian|serta)\s+)/i;
  const rawClauses = normalized
    .split(splitRegex)
    .map((part) => stripLeadingTimeWords(part))
    .filter((part) => part.length >= 4);

  const clauses = rawClauses.length > 0 ? rawClauses : [normalized];

  return clauses.map((clause, index) => {
    const formalTitle = capitalizeSentence(
      clause
        .replace(/^mengecek\b/i, 'Pemeriksaan')
        .replace(/^cek\b/i, 'Pemeriksaan')
        .replace(/^memperbaiki\b/i, 'Perbaikan')
        .replace(/^melakukan\s+/i, ''),
    );

    const qtyMatch = clause.match(/\b(\d+(?:[.,]\d+)?)\s+(dokumen|kegiatan|modul|kasus|dataset|laporan|berkas)\b/i);
    const parsedQty = qtyMatch ? Number(qtyMatch[1].replace(',', '.')) : null;
    const parsedUnit = qtyMatch ? qtyMatch[2].toLowerCase() : '';

    const category = suggestCategory(clause, categories);
    const targetId = suggestTargetId(clause, targets, activityDate);
    const outputDesc = clauses.length === 1 && resultHint.trim() ? resultHint.trim() : '';

    return {
      id: `qa-${Date.now()}-${index}`,
      selected: true,
      activity_date: activityDate,
      title: formalTitle,
      description: `${capitalizeSentence(clause)}.`,
      category,
      target_id: targetId,
      output_description: outputDesc,
      output_quantity: parsedQty,
      output_unit: parsedUnit,
      status: 'Selesai',
    };
  });
}

export function generateWeeklySummaryText(
  activities: Activity[],
  weekStart: string,
  weekEnd: string,
): string {
  if (activities.length === 0) {
    return `Belum ada aktivitas tercatat pada rentang ${formatDateID(weekStart)} sampai ${formatDateID(weekEnd)}.`;
  }

  const selesaiCount = activities.filter((a) => a.status === 'Selesai').length;
  const berjalanCount = activities.length - selesaiCount;
  const categoriesUsed = Array.from(new Set(activities.map((a) => a.category)));
  const topTitles = activities.slice(0, 4).map((a) => a.title);

  const statusSentence =
    berjalanCount > 0
      ? `Sebanyak ${selesaiCount} aktivitas berstatus Selesai dan ${berjalanCount} aktivitas masih dalam pengerjaan.`
      : `Seluruh ${selesaiCount} aktivitas yang dicatat telah berstatus Selesai.`;

  return `Pada minggu ${formatDateID(weekStart)} sampai ${formatDateID(weekEnd)}, tercatat ${activities.length} aktivitas pada bidang ${categoriesUsed.join(', ')}. ${statusSentence} Kegiatan utama meliputi: ${topTitles.join('; ')}.`;
}

export function generateMonthlyReportContent(params: {
  month: number;
  year: number;
  activities: Activity[];
  targets: PerformanceTarget[];
  template: ReportTemplateConfig;
}): { content: MonthlyReportContent; summary: string } {
  const { month, year, activities, targets, template } = params;
  const periodLabel = formatMonthYearID(month, year);

  const sorted = [...activities].sort((a, b) =>
    a.activity_date.localeCompare(b.activity_date),
  );

  const activities_table: ReportActivityRow[] = sorted.map((act) => {
    const tgt = targets.find((t) => t.id === act.target_id);
    const hasOutput = Boolean(act.output_description.trim() || act.output_quantity !== null);
    let outputText = 'Belum ada output tercatat';
    if (hasOutput) {
      const qtyPart =
        act.output_quantity !== null
          ? ` (${formatDecimalID(act.output_quantity)}${act.output_unit ? ` ${act.output_unit}` : ''})`
          : '';
      outputText = `${act.output_description.trim() || 'Keluaran tercatat'}${qtyPart}`;
    }

    return {
      activity_id: act.id,
      activity_date: act.activity_date,
      title: act.title,
      output_text: outputText,
      has_output: hasOutput,
      target_title: tgt ? tgt.title : 'Belum dipetakan ke target',
    };
  });

  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const periodEnd = `${year}-${String(month).padStart(2, '0')}-31`;
  const relevantTargets = targets.filter(
    (t) =>
      t.status !== 'Diarsipkan' &&
      !(t.period_end < periodStart || t.period_start > periodEnd),
  );

  const targets_table: ReportTargetRow[] = relevantTargets.map((tgt) => {
    const linked = sorted.filter((a) => a.target_id === tgt.id);
    const totalRealization = linked.reduce(
      (sum, act) => sum + (act.output_quantity !== null ? act.output_quantity : 0),
      0,
    );
    return {
      target_id: tgt.id,
      target_title: tgt.title,
      indicator: tgt.indicator,
      target_display: `${formatDecimalID(tgt.target_value)} ${tgt.unit}`,
      realization_display: `${formatDecimalID(totalRealization)} ${tgt.unit}`,
      supporting_count: linked.length,
    };
  });

  const challenges_list: ReportChallengeRow[] = sorted
    .filter((a) => a.challenges.trim().length > 0)
    .map((a) => ({
      activity_date: a.activity_date,
      activity_title: a.title,
      challenge: a.challenges.trim(),
      follow_up: a.follow_up.trim() || 'Belum ada tindak lanjut tercatat.',
    }));

  const completedCount = sorted.filter((a) => a.status === 'Selesai').length;
  const missingOutputCount = activities_table.filter((r) => !r.has_output).length;
  const categoriesList = Array.from(new Set(sorted.map((a) => a.category)));

  const executive_summary =
    sorted.length === 0
      ? `Belum ada aktivitas kerja yang tercatat pada periode ${periodLabel}.`
      : `Selama periode ${periodLabel}, tercatat sebanyak ${sorted.length} aktivitas kerja dengan ${completedCount} aktivitas berstatus Selesai pada kategori ${categoriesList.join(', ')}. Seluruh data pada laporan ini disusun berdasarkan catatan harian yang terverifikasi pada periode berjalan.`;

  const output_recap =
    sorted.length === 0
      ? 'Belum ada output yang tercatat pada periode ini.'
      : missingOutputCount > 0
        ? `Dari ${sorted.length} aktivitas tercatat, ${sorted.length - missingOutputCount} aktivitas memiliki output terukur dan ${missingOutputCount} aktivitas ditandai belum memiliki output.`
        : `Seluruh ${sorted.length} aktivitas pada periode ${periodLabel} telah dilengkapi keterangan output.`;

  const content: MonthlyReportContent = {
    header_title: template.header_title,
    executive_summary,
    activities_table,
    targets_table,
    output_recap,
    challenges_list,
    closing_note: template.default_closing,
    has_manual_edits: false,
  };

  return {
    content,
    summary: executive_summary,
  };
}
