// Halaman Laporan Bulanan untuk membuat draft dari data periode, menyunting isi, pratinjau, ekspor PDF/DOCX/XLSX, dan mengajukan review.

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  FileEdit,
  Save,
  Send,
  Wand2,
} from 'lucide-react';
import { INDONESIAN_MONTHS } from '../config';
import { generateMonthlyReportContent } from '../lib/aiAssistant';
import {
  exportReportToDOCX,
  exportReportToPDF,
  exportReportToXLSX,
} from '../lib/exportReport';
import {
  formatDateID,
  formatDateTimeWIB,
  formatMonthYearID,
} from '../lib/format';
import {
  Activity,
  MonthlyReport,
  MonthlyReportContent,
  PerformanceTarget,
  Profile,
  ReportReview,
  ReportTemplateConfig,
} from '../types';
import { StatusBadge } from './StatusBadge';

interface MonthlyReportPageProps {
  profile: Profile;
  unitName: string;
  activities: Activity[];
  targets: PerformanceTarget[];
  reports: MonthlyReport[];
  reviews: ReportReview[];
  allProfiles: Profile[];
  template: ReportTemplateConfig;
  onSaveDraft: (
    month: number,
    year: number,
    content: MonthlyReportContent,
    summary: string,
  ) => void;
  onSubmitReport: (
    month: number,
    year: number,
    content: MonthlyReportContent,
    summary: string,
  ) => void;
  onRequestConfirm: (opts: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }) => void;
  onNotifyToast: (text: string, type?: 'success' | 'error') => void;
}

export function MonthlyReportPage({
  profile,
  unitName,
  activities,
  targets,
  reports,
  reviews,
  allProfiles,
  template,
  onSaveDraft,
  onSubmitReport,
  onRequestConfirm,
  onNotifyToast,
}: MonthlyReportPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(11);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isExporting, setIsExporting] = useState(false);

  const existingReport = reports.find(
    (r) =>
      r.user_id === profile.user_id &&
      r.month === selectedMonth &&
      r.year === selectedYear,
  );

  const periodPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const periodActivities = activities.filter(
    (a) => a.user_id === profile.user_id && a.activity_date.startsWith(periodPrefix),
  );
  const userTargets = targets.filter((t) => t.user_id === profile.user_id);

  const [draftContent, setDraftContent] = useState<MonthlyReportContent>(() => {
    if (existingReport) return existingReport.report_content;
    return generateMonthlyReportContent({
      month: selectedMonth,
      year: selectedYear,
      activities: periodActivities,
      targets: userTargets,
      template,
    }).content;
  });

  useEffect(() => {
    const found = reports.find(
      (r) =>
        r.user_id === profile.user_id &&
        r.month === selectedMonth &&
        r.year === selectedYear,
    );
    if (found) {
      setDraftContent(found.report_content);
    } else {
      const fresh = generateMonthlyReportContent({
        month: selectedMonth,
        year: selectedYear,
        activities: periodActivities,
        targets: userTargets,
        template,
      });
      setDraftContent(fresh.content);
    }
  }, [selectedMonth, selectedYear, profile.user_id, existingReport?.id]);

  const status = existingReport?.status ?? 'Draft';
  const isLocked = status === 'Disetujui';
  const reportReviews = existingReport
    ? reviews
        .filter((rv) => rv.report_id === existingReport.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    : [];

  const regenerateDraft = () => {
    const applyRegen = () => {
      const fresh = generateMonthlyReportContent({
        month: selectedMonth,
        year: selectedYear,
        activities: periodActivities,
        targets: userTargets,
        template,
      });
      setDraftContent(fresh.content);
      onNotifyToast('Draft laporan berhasil disusun ulang dari catatan aktivitas.');
    };

    if (draftContent.has_manual_edits) {
      onRequestConfirm({
        title: 'Susun Ulang Draft Laporan?',
        message:
          'Anda sudah menyunting isi laporan secara manual. Menyusun ulang akan mengganti teks editan Anda.',
        confirmLabel: 'Susun Ulang',
        onConfirm: applyRegen,
      });
    } else {
      applyRegen();
    }
  };

  const updateField = <K extends keyof MonthlyReportContent>(
    key: K,
    value: MonthlyReportContent[K],
  ) => {
    setDraftContent((prev) => ({
      ...prev,
      [key]: value,
      has_manual_edits: true,
    }));
  };

  const buildReportSnapshot = (): MonthlyReport => ({
    id: existingReport?.id ?? `preview-${selectedYear}-${selectedMonth}`,
    user_id: profile.user_id,
    month: selectedMonth,
    year: selectedYear,
    summary: draftContent.executive_summary,
    report_content: draftContent,
    status,
    submitted_at: existingReport?.submitted_at ?? null,
    approved_at: existingReport?.approved_at ?? null,
    created_at: existingReport?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const handleExport = async (type: 'pdf' | 'docx' | 'xlsx') => {
    setIsExporting(true);
    try {
      const snapshot = buildReportSnapshot();
      let fileName = '';
      if (type === 'pdf') {
        fileName = exportReportToPDF(snapshot, profile, unitName);
      } else if (type === 'docx') {
        fileName = await exportReportToDOCX(snapshot, profile, unitName);
      } else {
        fileName = exportReportToXLSX(snapshot, profile, unitName);
      }
      onNotifyToast(`Berkas ${fileName} berhasil diunduh.`);
    } catch {
      onNotifyToast('Gagal mengekspor dokumen. Silakan coba kembali.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const reviewerName = (id: string) =>
    allProfiles.find((p) => p.user_id === id)?.full_name ?? 'Atasan';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">Laporan Bulanan</h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Periode {formatMonthYearID(selectedMonth, selectedYear)} ({periodActivities.length}{' '}
            aktivitas tercatat)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="rep-month" className="sr-only">
              Pilih Bulan
            </label>
            <select
              id="rep-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              {INDONESIAN_MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <label htmlFor="rep-year" className="sr-only">
              Pilih Tahun
            </label>
            <select
              id="rep-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 tabular-nums"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 ${
                mode === 'edit' ? 'bg-white text-neutral-900' : 'text-neutral-600'
              }`}
            >
              <FileEdit className="h-4 w-4" aria-hidden="true" />
              <span>Sunting</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 ${
                mode === 'preview' ? 'bg-white text-neutral-900' : 'text-neutral-600'
              }`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>Pratinjau</span>
            </button>
          </div>
        </div>
      </div>

      {reportReviews.length > 0 && (
        <section
          aria-label="Catatan review atasan"
          className={`rounded-2xl p-5 ${
            status === 'Perlu Revisi'
              ? 'bg-red-50 text-red-900'
              : status === 'Disetujui'
                ? 'bg-emerald-50 text-emerald-900'
                : 'bg-blue-50 text-blue-900'
          }`}
        >
          <h2 className="text-base font-semibold">Riwayat Review Atasan</h2>
          <div className="mt-2 space-y-2 text-sm">
            {reportReviews.map((rv) => (
              <div key={rv.id}>
                <p className="font-medium">
                  {reviewerName(rv.reviewer_id)} ({rv.status}) /{' '}
                  <span className="tabular-nums">{formatDateTimeWIB(rv.created_at)}</span>
                </p>
                <p className="mt-0.5">{rv.comments}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {mode === 'edit' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">
                Penyusunan Isi Laporan
              </h2>
              {!isLocked && (
                <button
                  type="button"
                  onClick={regenerateDraft}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 inline-flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                  <span>Generate dari Data Periode</span>
                </button>
              )}
            </div>

            <div>
              <label htmlFor="rep-summary" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Ringkasan Pelaksanaan Tugas
              </label>
              <textarea
                id="rep-summary"
                rows={4}
                disabled={isLocked}
                value={draftContent.executive_summary}
                onChange={(e) => updateField('executive_summary', e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 disabled:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>

            <div>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Rekap Aktivitas Periode ({draftContent.activities_table.length})
              </h3>
              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">No</th>
                      <th className="px-3 py-2.5 font-medium">Tanggal</th>
                      <th className="px-3 py-2.5 font-medium">Kegiatan</th>
                      <th className="px-3 py-2.5 font-medium">Output / Hasil</th>
                      <th className="px-3 py-2.5 font-medium">Target Kinerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {draftContent.activities_table.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-neutral-600">
                          Belum ada aktivitas tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      draftContent.activities_table.map((row, idx) => (
                        <tr key={row.activity_id}>
                          <td className="px-3 py-2.5 tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                            {formatDateID(row.activity_date)}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-neutral-900">
                            {row.title}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.has_output ? (
                              <span>{row.output_text}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{row.output_text}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-neutral-700">{row.target_title}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label htmlFor="rep-output-recap" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Rekap Output
              </label>
              <textarea
                id="rep-output-recap"
                rows={2}
                disabled={isLocked}
                value={draftContent.output_recap}
                onChange={(e) => updateField('output_recap', e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 disabled:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>

            <div>
              <label htmlFor="rep-closing" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Penutup / Catatan
              </label>
              <textarea
                id="rep-closing"
                rows={3}
                disabled={isLocked}
                value={draftContent.closing_note}
                onChange={(e) => updateField('closing_note', e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 disabled:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>

            {!isLocked && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() =>
                    onSaveDraft(
                      selectedMonth,
                      selectedYear,
                      draftContent,
                      draftContent.executive_summary,
                    )
                  }
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>Simpan Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSubmitReport(
                      selectedMonth,
                      selectedYear,
                      draftContent,
                      draftContent.executive_summary,
                    )
                  }
                  className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {status === 'Perlu Revisi' ? 'Ajukan Ulang' : 'Ajukan ke Atasan'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-neutral-700">
              Ekspor dokumen laporan dari pratinjau:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('pdf')}
                className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>{isExporting ? 'Menyiapkan…' : 'Unduh PDF'}</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('docx')}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Unduh DOCX</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('xlsx')}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Unduh XLSX</span>
              </button>
            </div>
          </div>

          <article className="bg-white rounded-2xl p-6 sm:p-8 space-y-6">
            <header className="text-center border-b border-neutral-200 pb-5">
              <h2 className="text-xl font-semibold text-neutral-900">
                {draftContent.header_title}
              </h2>
              <p className="text-sm text-neutral-700 mt-1">
                Periode: {formatMonthYearID(selectedMonth, selectedYear)}
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-neutral-600">Nama:</span>{' '}
                <span className="font-medium text-neutral-900">{profile.full_name}</span>
              </p>
              <p className="tabular-nums">
                <span className="text-neutral-600">NIP:</span>{' '}
                <span className="font-medium text-neutral-900">{profile.nip}</span>
              </p>
              <p>
                <span className="text-neutral-600">Jabatan:</span>{' '}
                <span className="font-medium text-neutral-900">{profile.job_title}</span>
              </p>
              <p>
                <span className="text-neutral-600">Unit Kerja:</span>{' '}
                <span className="font-medium text-neutral-900">{unitName}</span>
              </p>
            </div>

            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Ringkasan Pelaksanaan Tugas
              </h3>
              <p className="text-base text-neutral-800 leading-relaxed">
                {draftContent.executive_summary}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Tabel Aktivitas
              </h3>
              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-3 py-2 font-medium">No</th>
                      <th className="px-3 py-2 font-medium">Tanggal</th>
                      <th className="px-3 py-2 font-medium">Kegiatan</th>
                      <th className="px-3 py-2 font-medium">Output / Hasil</th>
                      <th className="px-3 py-2 font-medium">Target Kinerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {draftContent.activities_table.map((row, idx) => (
                      <tr key={row.activity_id}>
                        <td className="px-3 py-2 tabular-nums">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                          {formatDateID(row.activity_date)}
                        </td>
                        <td className="px-3 py-2">{row.title}</td>
                        <td className="px-3 py-2">{row.output_text}</td>
                        <td className="px-3 py-2">{row.target_title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Capaian Target
              </h3>
              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-3 py-2 font-medium">Target Kinerja</th>
                      <th className="px-3 py-2 font-medium">Indikator</th>
                      <th className="px-3 py-2 font-medium">Target</th>
                      <th className="px-3 py-2 font-medium">Realisasi Tercatat</th>
                      <th className="px-3 py-2 font-medium">Aktivitas Pendukung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {draftContent.targets_table.map((t) => (
                      <tr key={t.target_id}>
                        <td className="px-3 py-2 font-medium">{t.target_title}</td>
                        <td className="px-3 py-2">{t.indicator}</td>
                        <td className="px-3 py-2 tabular-nums">{t.target_display}</td>
                        <td className="px-3 py-2 tabular-nums">{t.realization_display}</td>
                        <td className="px-3 py-2 tabular-nums">{t.supporting_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Kendala dan Tindak Lanjut
              </h3>
              {draftContent.challenges_list.length === 0 ? (
                <p className="text-base text-neutral-700">
                  Belum ada kendala yang dicatat pada periode ini.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-neutral-800">
                  {draftContent.challenges_list.map((c, idx) => (
                    <li key={`${c.activity_date}-${idx}`}>
                      <span className="font-medium">
                        {formatDateID(c.activity_date)} ({c.activity_title}):
                      </span>{' '}
                      {c.challenge} Tindak lanjut: {c.follow_up}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Penutup</h3>
              <p className="text-base text-neutral-800">{draftContent.closing_note}</p>
            </section>
          </article>
        </div>
      )}
    </div>
  );
}
