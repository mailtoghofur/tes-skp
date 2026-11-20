// Halaman Target Kinerja untuk mengelola target SKP beserta realisasi terukur dari aktivitas.

import { FormEvent, useRef, useState } from 'react';
import { Archive, Edit3, Plus, X } from 'lucide-react';
import { TARGET_STATUS_OPTIONS } from '../config';
import { calculateTargetProgress } from '../lib/calculations';
import { formatDateID, formatDecimalID, parseDecimalInput } from '../lib/format';
import { validateTargetForm } from '../lib/validation';
import { Activity, PerformanceTarget, TargetStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface TargetsPageProps {
  userId: string;
  targets: PerformanceTarget[];
  activities: Activity[];
  onSaveTarget: (
    target: Omit<PerformanceTarget, 'id' | 'user_id' | 'created_at'>,
    editingId?: string,
  ) => void;
  onArchiveTarget: (target: PerformanceTarget) => void;
}

export function TargetsPage({
  userId,
  targets,
  activities,
  onSaveTarget,
  onArchiveTarget,
}: TargetsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceTarget | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [indicator, setIndicator] = useState('');
  const [targetValueRaw, setTargetValueRaw] = useState('12');
  const [unit, setUnit] = useState('kegiatan');
  const [periodStart, setPeriodStart] = useState('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-31');
  const [status, setStatus] = useState<TargetStatus>('Aktif');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const titleRef = useRef<HTMLInputElement>(null);
  const indicatorRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  const userTargets = targets.filter((t) => t.user_id === userId);
  const visibleTargets = showArchived
    ? userTargets
    : userTargets.filter((t) => t.status !== 'Diarsipkan');

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setIndicator('');
    setTargetValueRaw('12');
    setUnit('kegiatan');
    setPeriodStart('2026-01-01');
    setPeriodEnd('2026-12-31');
    setStatus('Aktif');
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (tgt: PerformanceTarget) => {
    setEditing(tgt);
    setTitle(tgt.title);
    setDescription(tgt.description);
    setIndicator(tgt.indicator);
    setTargetValueRaw(String(tgt.target_value).replace('.', ','));
    setUnit(tgt.unit);
    setPeriodStart(tgt.period_start);
    setPeriodEnd(tgt.period_end);
    setStatus(tgt.status);
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valErrors = validateTargetForm({
      title,
      indicator,
      target_value_raw: targetValueRaw,
      unit,
      period_start: periodStart,
      period_end: periodEnd,
    });
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      if (valErrors.title) titleRef.current?.focus();
      else if (valErrors.indicator) indicatorRef.current?.focus();
      else if (valErrors.target_value) valueRef.current?.focus();
      return;
    }

    const parsedVal = parseDecimalInput(targetValueRaw) ?? 1;
    onSaveTarget(
      {
        title: title.trim(),
        description: description.trim(),
        indicator: indicator.trim(),
        target_value: parsedVal,
        unit: unit.trim(),
        period_start: periodStart,
        period_end: periodEnd,
        status,
      },
      editing?.id,
    );
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Target Kinerja</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Realisasi dihitung langsung dari jumlah output aktivitas yang Anda petakan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-700 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-blue-700"
            />
            <span>Tampilkan arsip</span>
          </label>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Target</span>
          </button>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-6">
        {visibleTargets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-base text-neutral-600">Belum ada target kinerja aktif.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Buat Target Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {visibleTargets.map((tgt) => {
              const progress = calculateTargetProgress(tgt, activities);
              return (
                <div key={tgt.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-base font-semibold text-neutral-900">{tgt.title}</h2>
                        <StatusBadge status={tgt.status} />
                      </div>
                      <p className="text-sm text-neutral-600">{tgt.indicator}</p>
                      <p className="text-sm text-neutral-600 tabular-nums">
                        Periode: {formatDateID(tgt.period_start)} sampai {formatDateID(tgt.period_end)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(tgt)}
                        className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        <span>Ubah</span>
                      </button>
                      {tgt.status !== 'Diarsipkan' && (
                        <button
                          type="button"
                          onClick={() => onArchiveTarget(tgt)}
                          className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5"
                        >
                          <Archive className="h-4 w-4" aria-hidden="true" />
                          <span>Arsipkan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm tabular-nums">
                      <span className="text-neutral-700">
                        Realisasi tercatat: {formatDecimalID(progress.realization)} /{' '}
                        {formatDecimalID(tgt.target_value)} {tgt.unit} ({progress.supportingCount}{' '}
                        aktivitas terkait)
                      </span>
                      <span className="font-semibold text-neutral-900">{progress.percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-full"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tgt-modal-title"
        >
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h2 id="tgt-modal-title" className="text-lg font-semibold text-neutral-900">
                {editing ? 'Ubah Target Kinerja' : 'Tambah Target Kinerja'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup formulir target"
                className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label htmlFor="tgt-title" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  Nama Target Kinerja
                </label>
                <input
                  ref={titleRef}
                  id="tgt-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pengelolaan layanan TI"
                  className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                />
                {errors.title && <p className="mt-1 text-sm text-red-800">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="tgt-desc" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  id="tgt-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan ruang lingkup target"
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                />
              </div>

              <div>
                <label htmlFor="tgt-ind" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  Indikator Kinerja
                </label>
                <input
                  ref={indicatorRef}
                  id="tgt-ind"
                  type="text"
                  value={indicator}
                  onChange={(e) => setIndicator(e.target.value)}
                  placeholder="Contoh: Jumlah pemeliharaan sistem"
                  className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                />
                {errors.indicator && (
                  <p className="mt-1 text-sm text-red-800">{errors.indicator}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tgt-val" className="block text-sm font-medium text-neutral-900 mb-1.5">
                    Nilai Target
                  </label>
                  <input
                    ref={valueRef}
                    id="tgt-val"
                    type="text"
                    inputMode="decimal"
                    value={targetValueRaw}
                    onChange={(e) => setTargetValueRaw(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  />
                  {errors.target_value && (
                    <p className="mt-1 text-sm text-red-800">{errors.target_value}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tgt-unit" className="block text-sm font-medium text-neutral-900 mb-1.5">
                    Satuan
                  </label>
                  <input
                    id="tgt-unit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kegiatan, dokumen"
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  />
                  {errors.unit && <p className="mt-1 text-sm text-red-800">{errors.unit}</p>}
                </div>

                <div>
                  <label htmlFor="tgt-status" className="block text-sm font-medium text-neutral-900 mb-1.5">
                    Status
                  </label>
                  <select
                    id="tgt-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TargetStatus)}
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
                  >
                    {TARGET_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tgt-start" className="block text-sm font-medium text-neutral-900 mb-1.5">
                    Awal Periode
                  </label>
                  <input
                    id="tgt-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900"
                  />
                </div>
                <div>
                  <label htmlFor="tgt-end" className="block text-sm font-medium text-neutral-900 mb-1.5">
                    Akhir Periode
                  </label>
                  <input
                    id="tgt-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base text-neutral-900"
                  />
                </div>
              </div>
              {errors.period && <p className="text-sm text-red-800">{errors.period}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
