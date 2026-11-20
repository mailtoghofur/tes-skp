// Modal Tambah Cepat (Quick Add) untuk memecah kalimat bahasa alami menjadi daftar aktivitas terkonfirmasi.

import { FormEvent, useRef, useState } from 'react';
import { Check, Wand2, X } from 'lucide-react';
import { ACTIVITY_STATUS_OPTIONS } from '../config';
import { parseQuickAddText, polishFormalNarrative } from '../lib/aiAssistant';
import { getTodayWIB } from '../lib/format';
import { isTargetActiveForDate, validateQuickAddForm } from '../lib/validation';
import { PerformanceTarget, QuickAddItem } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  userId: string;
  targets: PerformanceTarget[];
  categories: string[];
  aiEnabled: boolean;
  onClose: () => void;
  onSaveItems: (items: QuickAddItem[]) => void;
}

const EXAMPLE_SENTENCE =
  'Hari ini melakukan backup database SIMOPPA, mengecek server, dan memperbaiki bug login aplikasi.';

export function QuickAddModal({
  isOpen,
  userId,
  targets,
  categories,
  aiEnabled,
  onClose,
  onSaveItems,
}: QuickAddModalProps) {
  const [rawText, setRawText] = useState('');
  const [activityDate, setActivityDate] = useState(getTodayWIB());
  const [resultHint, setResultHint] = useState('');
  const [previewItems, setPreviewItems] = useState<QuickAddItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const textRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const userActiveTargets = targets.filter(
    (t) => t.user_id === userId && isTargetActiveForDate(t, activityDate),
  );

  const handleParse = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateQuickAddForm({
      text: rawText,
      activity_date: activityDate,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      textRef.current?.focus();
      return;
    }
    setErrors({});
    const parsed = parseQuickAddText(
      rawText,
      activityDate,
      resultHint,
      userActiveTargets,
      categories,
    );
    setPreviewItems(parsed);
  };

  const handleSaveDirect = () => {
    const validation = validateQuickAddForm({
      text: rawText,
      activity_date: activityDate,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      textRef.current?.focus();
      return;
    }
    const items =
      previewItems.length > 0
        ? previewItems.filter((item) => item.selected && item.title.trim())
        : parseQuickAddText(
            rawText,
            activityDate,
            resultHint,
            userActiveTargets,
            categories,
          );
    if (items.length === 0) {
      setErrors({ preview: 'Pilih minimal satu aktivitas untuk disimpan.' });
      return;
    }
    onSaveItems(items);
    setRawText('');
    setResultHint('');
    setPreviewItems([]);
    setErrors({});
    onClose();
  };

  const updateItem = (id: string, patch: Partial<QuickAddItem>) => {
    setPreviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const polishItem = (item: QuickAddItem) => {
    const polished = polishFormalNarrative(
      item.title,
      item.description,
      item.output_description,
    );
    updateItem(item.id, {
      title: polished.title,
      description: polished.description,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h2 id="quick-add-title" className="text-lg font-semibold text-neutral-900">
              Tambah Cepat Aktivitas
            </h2>
            <p className="text-sm text-neutral-600">
              Tulis kegiatan Anda dalam kalimat ringkas lalu periksa sebelum disimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup tambah cepat"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleParse} noValidate className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="qa-text" className="block text-sm font-medium text-neutral-900">
                Apa yang Anda kerjakan?
              </label>
              <button
                type="button"
                onClick={() => {
                  setRawText(EXAMPLE_SENTENCE);
                  setErrors({});
                }}
                className="text-sm font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
              >
                Gunakan contoh kalimat
              </button>
            </div>
            <textarea
              ref={textRef}
              id="qa-text"
              name="quick_text"
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Contoh: Hari ini melakukan backup database SIMOPPA, mengecek server, dan memperbaiki bug login aplikasi."
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-800">{errors.text}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qa-date" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Tanggal Kegiatan
              </label>
              <input
                id="qa-date"
                name="activity_date"
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
              {errors.activity_date && (
                <p className="mt-1 text-sm text-red-800">{errors.activity_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="qa-result" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Hasil / Output (opsional)
              </label>
              <input
                id="qa-result"
                name="result_hint"
                type="text"
                value={resultHint}
                onChange={(e) => setResultHint(e.target.value)}
                placeholder="Misal: 1 laporan verifikasi"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {aiEnabled && (
              <button
                type="submit"
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 inline-flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                <span>Pecah & Pratinjau</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDirect}
              className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 inline-flex items-center gap-2"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{previewItems.length > 0 ? 'Simpan Aktivitas Terpilih' : 'Simpan Catatan'}</span>
            </button>
          </div>
        </form>

        {previewItems.length > 0 && (
          <div className="mt-6 pt-5 border-t border-neutral-200 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900">
                Pratinjau Usulan Aktivitas ({previewItems.filter((i) => i.selected).length} dipilih)
              </h3>
              <span className="text-sm text-neutral-600">Sunting sebelum menyimpan</span>
            </div>

            {errors.preview && (
              <p className="text-sm text-red-800">{errors.preview}</p>
            )}

            <div className="divide-y divide-neutral-200">
              {previewItems.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-center gap-2.5 text-sm font-medium text-neutral-900 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                        className="h-4 w-4 rounded border-neutral-300 text-blue-700 focus:ring-blue-700"
                      />
                      <span>Sertakan aktivitas ini</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => polishItem(item)}
                      className="min-h-[36px] rounded-lg px-2.5 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                    >
                      Rapikan Narasi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Judul Aktivitas
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(item.id, { category: e.target.value })}
                        className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Target Kinerja Terkait
                      </label>
                      <select
                        value={item.target_id ?? ''}
                        onChange={(e) =>
                          updateItem(item.id, { target_id: e.target.value || null })
                        }
                        className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                      >
                        <option value="">Belum dipetakan</option>
                        {userActiveTargets.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Output / Hasil
                      </label>
                      <input
                        type="text"
                        value={item.output_description}
                        onChange={(e) =>
                          updateItem(item.id, { output_description: e.target.value })
                        }
                        placeholder="Isi hasil jika tersedia"
                        className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateItem(item.id, {
                            status: e.target.value as QuickAddItem['status'],
                          })
                        }
                        className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                      >
                        {ACTIVITY_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
