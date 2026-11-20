// Halaman Aktivitas Harian dengan pencarian, filter multi-kriteria, tampilan daftar/timeline, detail, dan kelola lampiran.

import { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Eye,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  ACTIVITY_PRIORITY_OPTIONS,
  ACTIVITY_STATUS_OPTIONS,
  INDONESIAN_MONTHS,
} from '../config';
import {
  formatDateID,
  formatDecimalID,
  formatDurationID,
  formatFileSize,
} from '../lib/format';
import { Activity, ActivityAttachment, PerformanceTarget } from '../types';
import { StatusBadge } from './StatusBadge';

interface ActivitiesPageProps {
  userId: string;
  activities: Activity[];
  targets: PerformanceTarget[];
  attachments: ActivityAttachment[];
  categories: string[];
  onOpenQuickAdd: () => void;
  onOpenNewActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
}

export function ActivitiesPage({
  userId,
  activities,
  targets,
  attachments,
  categories,
  onOpenQuickAdd,
  onOpenNewActivity,
  onEditActivity,
  onDeleteActivity,
}: ActivitiesPageProps) {
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);

  const userActivities = useMemo(
    () =>
      activities
        .filter((a) => a.user_id === userId)
        .sort(
          (a, b) =>
            b.activity_date.localeCompare(a.activity_date) ||
            b.updated_at.localeCompare(a.updated_at),
        ),
    [activities, userId],
  );

  const userTargets = useMemo(
    () => targets.filter((t) => t.user_id === userId),
    [targets, userId],
  );

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return userActivities.filter((act) => {
      if (q) {
        const hay = `${act.title} ${act.description} ${act.output_description} ${act.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFrom && act.activity_date < dateFrom) return false;
      if (dateTo && act.activity_date > dateTo) return false;
      if (monthFilter) {
        const prefix = `2026-${monthFilter}`;
        if (!act.activity_date.startsWith(prefix)) return false;
      }
      if (categoryFilter && act.category !== categoryFilter) return false;
      if (targetFilter === 'unmapped' && act.target_id !== null) return false;
      if (targetFilter && targetFilter !== 'unmapped' && act.target_id !== targetFilter) {
        return false;
      }
      if (statusFilter && act.status !== statusFilter) return false;
      if (priorityFilter && act.priority !== priorityFilter) return false;

      const hasAtt = attachments.some((att) => att.activity_id === act.id);
      if (evidenceFilter === 'yes' && !hasAtt) return false;
      if (evidenceFilter === 'no' && hasAtt) return false;

      return true;
    });
  }, [
    userActivities,
    keyword,
    dateFrom,
    dateTo,
    monthFilter,
    categoryFilter,
    targetFilter,
    statusFilter,
    priorityFilter,
    evidenceFilter,
    attachments,
  ]);

  const resetFilters = () => {
    setKeyword('');
    setDateFrom('');
    setDateTo('');
    setMonthFilter('');
    setCategoryFilter('');
    setTargetFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setEvidenceFilter('all');
  };

  const getTargetName = (targetId: string | null) => {
    if (!targetId) return 'Belum dipetakan';
    return targets.find((t) => t.id === targetId)?.title ?? 'Target tidak ditemukan';
  };

  const handleDownloadAttachment = (att: ActivityAttachment) => {
    if (att.data_url) {
      const a = document.createElement('a');
      a.href = att.data_url;
      a.download = att.file_name;
      a.click();
      return;
    }
    const demoContent = `Berkas Bukti Dukung SKPFlow\nNama Berkas: ${att.file_name}\nUkuran: ${formatFileSize(att.file_size)}\nDiunggah: ${att.created_at}`;
    const blob = new Blob([demoContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${att.file_name}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Aktivitas Harian</h1>
          <p className="text-sm text-neutral-600 mt-1 tabular-nums">
            Menampilkan {filtered.length} dari {userActivities.length} aktivitas Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Cepat</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewActivity}
            className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Catat Aktivitas</span>
          </button>
        </div>
      </div>

      <section aria-label="Pencarian dan filter" className="bg-white rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="h-4 w-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Cari aktivitas berdasarkan kata kunci"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari judul, deskripsi, output, atau tag..."
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium ${
                viewMode === 'list' ? 'bg-white text-neutral-900' : 'text-neutral-600'
              }`}
            >
              Daftar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium ${
                viewMode === 'timeline' ? 'bg-white text-neutral-900' : 'text-neutral-600'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="flt-from" className="block text-sm font-medium text-neutral-700 mb-1">
              Dari Tanggal
            </label>
            <input
              id="flt-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            />
          </div>
          <div>
            <label htmlFor="flt-to" className="block text-sm font-medium text-neutral-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              id="flt-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            />
          </div>
          <div>
            <label htmlFor="flt-month" className="block text-sm font-medium text-neutral-700 mb-1">
              Bulan (2026)
            </label>
            <select
              id="flt-month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              <option value="">Semua Bulan</option>
              {INDONESIAN_MONTHS.map((m, idx) => (
                <option key={m} value={String(idx + 1).padStart(2, '0')}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flt-cat" className="block text-sm font-medium text-neutral-700 mb-1">
              Kategori
            </label>
            <select
              id="flt-cat"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flt-target" className="block text-sm font-medium text-neutral-700 mb-1">
              Target Kinerja
            </label>
            <select
              id="flt-target"
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              <option value="">Semua Target</option>
              <option value="unmapped">Belum dipetakan</option>
              {userTargets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flt-status" className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              id="flt-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              <option value="">Semua Status</option>
              {ACTIVITY_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flt-prio" className="block text-sm font-medium text-neutral-700 mb-1">
              Prioritas
            </label>
            <select
              id="flt-prio"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              <option value="">Semua Prioritas</option>
              {ACTIVITY_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flt-att" className="block text-sm font-medium text-neutral-700 mb-1">
              Bukti Dukung
            </label>
            <select
              id="flt-att"
              value={evidenceFilter}
              onChange={(e) =>
                setEvidenceFilter(e.target.value as 'all' | 'yes' | 'no')
              }
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
            >
              <option value="all">Semua</option>
              <option value="yes">Ada bukti dukung</option>
              <option value="no">Belum ada bukti</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Atur Ulang Filter
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-base text-neutral-600">
              Tidak ada aktivitas yang sesuai dengan pencarian Anda.
            </p>
            <button
              type="button"
              onClick={userActivities.length === 0 ? onOpenNewActivity : resetFilters}
              className="mt-4 min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              {userActivities.length === 0 ? 'Catat Aktivitas Pertama' : 'Tampilkan Semua'}
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-neutral-200">
            {filtered.map((act) => {
              const actAtts = attachments.filter((a) => a.activity_id === act.id);
              return (
                <div
                  key={act.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-semibold text-neutral-900">{act.title}</h3>
                      <StatusBadge status={act.status} />
                    </div>
                    <p className="text-sm text-neutral-600 tabular-nums">
                      {formatDateID(act.activity_date)} / {act.category} / Prioritas {act.priority} /{' '}
                      {formatDurationID(act.duration_minutes)}
                    </p>
                    <p className="text-sm text-neutral-700">
                      Target: {getTargetName(act.target_id)}
                      {act.output_description
                        ? ` / Output: ${act.output_description}${
                            act.output_quantity !== null
                              ? ` (${formatDecimalID(act.output_quantity)} ${act.output_unit})`
                              : ''
                          }`
                        : ''}
                    </p>
                    {actAtts.length > 0 && (
                      <p className="text-sm text-blue-700 inline-flex items-center gap-1.5 tabular-nums">
                        <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{actAtts.length} bukti dukung terlampir</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailActivity(act)}
                      aria-label={`Lihat detail ${act.title}`}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      <span>Detail</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditActivity(act)}
                      aria-label={`Ubah ${act.title}`}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                      <span>Ubah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteActivity(act)}
                      aria-label={`Hapus ${act.title}`}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(new Set(filtered.map((a) => a.activity_date))).map((dateKey) => {
              const items = filtered.filter((a) => a.activity_date === dateKey);
              return (
                <div key={dateKey} className="border-b border-neutral-200 pb-5 last:border-b-0 last:pb-0">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3 tabular-nums">
                    {formatDateID(dateKey)}
                  </h3>
                  <div className="divide-y divide-neutral-200 pl-4 border-l border-neutral-200">
                    {items.map((act) => (
                      <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-medium text-neutral-900">{act.title}</p>
                          <p className="text-sm text-neutral-600 mt-0.5">
                            {act.category} / {act.output_description || 'Belum ada output tercatat'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={act.status} />
                          <button
                            type="button"
                            onClick={() => setDetailActivity(act)}
                            className="min-h-[40px] px-3 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {detailActivity && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-act-title"
        >
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-neutral-200">
              <div>
                <h2 id="detail-act-title" className="text-lg font-semibold text-neutral-900">
                  {detailActivity.title}
                </h2>
                <p className="text-sm text-neutral-600 mt-1 tabular-nums">
                  {formatDateID(detailActivity.activity_date)} / {detailActivity.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailActivity(null)}
                aria-label="Tutup detail aktivitas"
                className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detailActivity.status} />
                <span className="text-neutral-600">
                  Prioritas: {detailActivity.priority} / Durasi: {formatDurationID(detailActivity.duration_minutes)}
                </span>
              </div>

              <div>
                <p className="font-medium text-neutral-900">Deskripsi</p>
                <p className="text-neutral-700 mt-1">
                  {detailActivity.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>

              <div>
                <p className="font-medium text-neutral-900">Target Kinerja Terkait</p>
                <p className="text-neutral-700 mt-1">{getTargetName(detailActivity.target_id)}</p>
              </div>

              <div>
                <p className="font-medium text-neutral-900">Output / Hasil</p>
                <p className="text-neutral-700 mt-1 tabular-nums">
                  {detailActivity.output_description || 'Belum ada output tercatat'}
                  {detailActivity.output_quantity !== null
                    ? ` (${formatDecimalID(detailActivity.output_quantity)} ${detailActivity.output_unit})`
                    : ''}
                </p>
              </div>

              {detailActivity.challenges && (
                <div>
                  <p className="font-medium text-neutral-900">Kendala</p>
                  <p className="text-neutral-700 mt-1">{detailActivity.challenges}</p>
                </div>
              )}

              {detailActivity.follow_up && (
                <div>
                  <p className="font-medium text-neutral-900">Tindak Lanjut</p>
                  <p className="text-neutral-700 mt-1">{detailActivity.follow_up}</p>
                </div>
              )}

              {detailActivity.tags.length > 0 && (
                <div>
                  <p className="font-medium text-neutral-900">Tag</p>
                  <p className="text-neutral-600 mt-1">{detailActivity.tags.join(', ')}</p>
                </div>
              )}

              <div>
                <p className="font-medium text-neutral-900 mb-2">Bukti Dukung</p>
                {attachments.filter((a) => a.activity_id === detailActivity.id).length === 0 ? (
                  <p className="text-neutral-600">Belum ada bukti dukung terlampir.</p>
                ) : (
                  <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl">
                    {attachments
                      .filter((a) => a.activity_id === detailActivity.id)
                      .map((att) => (
                        <li
                          key={att.id}
                          className="px-3 py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-900 truncate">{att.file_name}</p>
                            <p className="text-neutral-600 tabular-nums">
                              {formatFileSize(att.file_size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att)}
                            className="min-h-[40px] rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            <span>Unduh</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const act = detailActivity;
                  setDetailActivity(null);
                  onEditActivity(act);
                }}
                className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Ubah Aktivitas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
