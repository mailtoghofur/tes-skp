// Kumpulan halaman ruang kerja Atasan / Pejabat Penilai: Dashboard Tim, Pegawai, Aktivitas Bawahan, Review Laporan, dan Rekap Unit.

import { useState } from 'react';
import { Check, Eye, MessageSquare, RotateCcw } from 'lucide-react';
import { calculateTargetProgress, calculateTeamSummary } from '../lib/calculations';
import {
  formatDateID,
  formatDateTimeWIB,
  formatDecimalID,
  formatMonthYearID,
} from '../lib/format';
import { canReviewReport, getSupervisedProfiles } from '../lib/validation';
import {
  Activity,
  MonthlyReport,
  PerformanceTarget,
  Profile,
  ReportReview,
  ReportStatus,
  Unit,
} from '../types';
import { StatusBadge } from './StatusBadge';

interface SupervisorViewsProps {
  activePage: string;
  supervisor: Profile;
  profiles: Profile[];
  units: Unit[];
  activities: Activity[];
  targets: PerformanceTarget[];
  reports: MonthlyReport[];
  reviews: ReportReview[];
  onNavigate: (pageId: string) => void;
  onReviewReport: (
    report: MonthlyReport,
    newStatus: ReportStatus,
    comments: string,
  ) => void;
}

export function SupervisorViews({
  activePage,
  supervisor,
  profiles,
  units,
  activities,
  targets,
  reports,
  reviews,
  onNavigate,
  onReviewReport,
}: SupervisorViewsProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [commentError, setCommentError] = useState('');

  const subordinates = getSupervisedProfiles(supervisor, profiles);
  const subordinateIds = new Set(subordinates.map((s) => s.user_id));

  const teamActivities = activities
    .filter((a) => subordinateIds.has(a.user_id))
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date));

  const teamReports = reports
    .filter((r) => subordinateIds.has(r.user_id))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const teamSummary = calculateTeamSummary(
    subordinates,
    activities,
    reports,
    targets,
    11,
    2026,
  );

  const getUnitName = (unitId: string) =>
    units.find((u) => u.id === unitId)?.name ?? '-';
  const getProfileName = (userId: string) =>
    profiles.find((p) => p.user_id === userId)?.full_name ?? '-';

  const pendingReports = teamReports.filter(
    (r) => r.status === 'Diajukan' || r.status === 'Dalam Review',
  );

  const selectedReport =
    teamReports.find((r) => r.id === activeReportId) ?? pendingReports[0] ?? teamReports[0] ?? null;

  const handleDecision = (report: MonthlyReport, nextStatus: ReportStatus) => {
    if (!canReviewReport(supervisor, report, profiles)) return;
    if (nextStatus === 'Perlu Revisi' && !reviewComment.trim()) {
      setCommentError('Tuliskan catatan perbaikan agar pegawai mengetahui bagian yang perlu direvisi.');
      return;
    }
    setCommentError('');
    const finalComment =
      reviewComment.trim() ||
      (nextStatus === 'Disetujui'
        ? 'Laporan disetujui oleh pejabat penilai.'
        : 'Laporan sedang dalam proses peninjauan.');
    onReviewReport(report, nextStatus, finalComment);
    setReviewComment('');
  };

  if (activePage === 'team-dashboard') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard Tim</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Ringkasan progres aktivitas dan laporan bawahan pada November 2026.
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Pegawai dalam Supervisi</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900 tabular-nums">
              {subordinates.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Menunggu Review</p>
            <p className="mt-2 text-3xl font-semibold text-amber-800 tabular-nums">
              {pendingReports.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Aktivitas Tim Bulan Ini</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900 tabular-nums">
              {teamSummary.reduce((acc, s) => acc + s.activityCount, 0)}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Antrean Review Laporan
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('team-reviews')}
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              Buka Semua Review
            </button>
          </div>
          {pendingReports.length === 0 ? (
            <p className="py-8 text-center text-base text-neutral-600">
              Tidak ada laporan yang menunggu peninjauan saat ini.
            </p>
          ) : (
            <div className="divide-y divide-neutral-200">
              {pendingReports.map((rep) => (
                <div
                  key={rep.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-base font-medium text-neutral-900">
                      {getProfileName(rep.user_id)}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Periode {formatMonthYearID(rep.month, rep.year)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={rep.status} />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReportId(rep.id);
                        onNavigate('team-reviews');
                      }}
                      className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      Tinjau
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Ringkasan Kinerja Pegawai
          </h2>
          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Nama Pegawai</th>
                  <th className="px-3 py-2.5 font-medium">Unit Kerja</th>
                  <th className="px-3 py-2.5 font-medium">Aktivitas Nov</th>
                  <th className="px-3 py-2.5 font-medium">Target Aktif</th>
                  <th className="px-3 py-2.5 font-medium">Status Laporan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {teamSummary.map((row) => (
                  <tr key={row.profile.id}>
                    <td className="px-3 py-2.5 font-medium text-neutral-900">
                      {row.profile.full_name}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-700">
                      {getUnitName(row.profile.unit_id)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{row.activityCount}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.activeTargets}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={row.reportStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  if (activePage === 'team-employees') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Daftar Pegawai Supervisi</h1>
        <div className="bg-white rounded-2xl p-6 divide-y divide-neutral-200">
          {subordinates.map((emp) => {
            const empTargets = targets.filter(
              (t) => t.user_id === emp.user_id && t.status === 'Aktif',
            );
            return (
              <div key={emp.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">
                      {emp.full_name}
                    </h2>
                    <p className="text-sm text-neutral-600 tabular-nums">
                      NIP {emp.nip} / {emp.job_title} / {getUnitName(emp.unit_id)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployeeId(emp.user_id);
                      onNavigate('team-activities');
                    }}
                    className="min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 self-start"
                  >
                    Lihat Aktivitas
                  </button>
                </div>

                {empTargets.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {empTargets.map((tgt) => {
                      const prog = calculateTargetProgress(tgt, activities);
                      return (
                        <div key={tgt.id} className="text-sm">
                          <div className="flex justify-between tabular-nums mb-1">
                            <span className="text-neutral-700">{tgt.title}</span>
                            <span className="font-medium text-neutral-900">
                              {formatDecimalID(prog.realization)} /{' '}
                              {formatDecimalID(tgt.target_value)} {tgt.unit} ({prog.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-700 rounded-full"
                              style={{ width: `${prog.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activePage === 'team-activities') {
    const visibleActs =
      selectedEmployeeId === 'all'
        ? teamActivities
        : teamActivities.filter((a) => a.user_id === selectedEmployeeId);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900">Aktivitas Pegawai</h1>
          <div>
            <label htmlFor="sup-emp-filter" className="sr-only">
              Filter pegawai
            </label>
            <select
              id="sup-emp-filter"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900"
            >
              <option value="all">Semua Pegawai Supervisi</option>
              {subordinates.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 divide-y divide-neutral-200">
          {visibleActs.length === 0 ? (
            <p className="py-8 text-center text-base text-neutral-600">
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            visibleActs.map((act) => (
              <div
                key={act.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-base font-medium text-neutral-900">{act.title}</p>
                  <p className="text-sm text-neutral-600 tabular-nums">
                    {getProfileName(act.user_id)} / {formatDateID(act.activity_date)} /{' '}
                    {act.category}
                  </p>
                  {act.output_description && (
                    <p className="text-sm text-neutral-700 mt-1">
                      Output: {act.output_description}
                    </p>
                  )}
                </div>
                <StatusBadge status={act.status} />
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activePage === 'team-recap') {
    const unitCategories = new Map<string, number>();
    for (const act of teamActivities) {
      unitCategories.set(act.category, (unitCategories.get(act.category) ?? 0) + 1);
    }

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Rekap Unit Kerja</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">
              Distribusi Aktivitas per Kategori
            </h2>
            <ul className="divide-y divide-neutral-200">
              {Array.from(unitCategories.entries()).map(([cat, count]) => (
                <li key={cat} className="py-2.5 flex justify-between text-sm">
                  <span className="text-neutral-900">{cat}</span>
                  <span className="font-semibold tabular-nums">{count} aktivitas</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">
              Status Laporan Pegawai (November 2026)
            </h2>
            <ul className="divide-y divide-neutral-200">
              {teamSummary.map((row) => (
                <li
                  key={row.profile.id}
                  className="py-2.5 flex items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium text-neutral-900">
                    {row.profile.full_name}
                  </span>
                  <StatusBadge status={row.reportStatus} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Halaman team-reviews
  const currentReviews = selectedReport
    ? reviews
        .filter((rv) => rv.report_id === selectedReport.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Review Laporan Bulanan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-2xl p-5">
          <h2 className="text-base font-semibold text-neutral-900 mb-3">
            Daftar Laporan Bawahan
          </h2>
          {teamReports.length === 0 ? (
            <p className="text-sm text-neutral-600">Belum ada laporan pegawai.</p>
          ) : (
            <div className="divide-y divide-neutral-200">
              {teamReports.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setActiveReportId(rep.id)}
                  className={`w-full py-3 px-2.5 text-left rounded-xl transition-colors ${
                    selectedReport?.id === rep.id ? 'bg-blue-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <p className="text-sm font-medium text-neutral-900">
                    {getProfileName(rep.user_id)}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-600">
                      {formatMonthYearID(rep.month, rep.year)}
                    </span>
                    <StatusBadge status={rep.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selectedReport ? (
            <div className="bg-white rounded-2xl p-8 text-center text-neutral-600">
              Pilih laporan di sebelah kiri untuk mulai meninjau.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {getProfileName(selectedReport.user_id)}
                    </h2>
                    <p className="text-sm text-neutral-600">
                      Periode {formatMonthYearID(selectedReport.month, selectedReport.year)}
                    </p>
                  </div>
                  <StatusBadge status={selectedReport.status} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    Ringkasan Pelaksanaan Tugas
                  </h3>
                  <p className="text-sm text-neutral-800 leading-relaxed">
                    {selectedReport.report_content.executive_summary}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                    Tabel Aktivitas ({selectedReport.report_content.activities_table.length})
                  </h3>
                  <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-3 py-2 font-medium">Tanggal</th>
                          <th className="px-3 py-2 font-medium">Kegiatan</th>
                          <th className="px-3 py-2 font-medium">Output / Hasil</th>
                          <th className="px-3 py-2 font-medium">Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {selectedReport.report_content.activities_table.map((row) => (
                          <tr key={row.activity_id}>
                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                              {formatDateID(row.activity_date)}
                            </td>
                            <td className="px-3 py-2 font-medium">{row.title}</td>
                            <td className="px-3 py-2">{row.output_text}</td>
                            <td className="px-3 py-2">{row.target_title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <label htmlFor="sup-comment" className="block text-sm font-medium text-neutral-900">
                    Catatan & Arahan Pejabat Penilai
                  </label>
                  <textarea
                    id="sup-comment"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tulis catatan evaluasi atau instruksi revisi..."
                    className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  />
                  {commentError && <p className="text-sm text-red-800">{commentError}</p>}

                  <div className="flex flex-wrap items-center gap-3">
                    {selectedReport.status === 'Diajukan' && (
                      <button
                        type="button"
                        onClick={() => handleDecision(selectedReport, 'Dalam Review')}
                        className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Tandai Dalam Review</span>
                      </button>
                    )}
                    {selectedReport.status !== 'Disetujui' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision(selectedReport, 'Perlu Revisi')}
                          className="min-h-[44px] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 inline-flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          <span>Minta Revisi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(selectedReport, 'Disetujui')}
                          className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>Setujui Laporan</span>
                        </button>
                      </>
                    )}
                    {selectedReport.status === 'Disetujui' && (
                      <button
                        type="button"
                        onClick={() => handleDecision(selectedReport, 'Perlu Revisi')}
                        className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        <span>Buka Revisi Terjadwal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6">
                <h3 className="text-base font-semibold text-neutral-900 mb-3">
                  Riwayat Review
                </h3>
                {currentReviews.length === 0 ? (
                  <p className="text-sm text-neutral-600">Belum ada catatan review.</p>
                ) : (
                  <ul className="divide-y divide-neutral-200">
                    {currentReviews.map((rv) => (
                      <li key={rv.id} className="py-3 first:pt-0 last:pb-0 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-neutral-900">
                            {getProfileName(rv.reviewer_id)}
                          </span>
                          <StatusBadge status={rv.status} />
                        </div>
                        <p className="text-neutral-700 mt-1">{rv.comments}</p>
                        <p className="text-xs text-neutral-500 mt-1 tabular-nums">
                          {formatDateTimeWIB(rv.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
