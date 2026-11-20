// Modal formulir lengkap untuk membuat atau mengubah aktivitas harian beserta lampiran bukti dukung.

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Paperclip, Trash2, Wand2, X } from 'lucide-react';
import { ACTIVITY_PRIORITY_OPTIONS, ACTIVITY_STATUS_OPTIONS } from '../config';
import {
  polishFormalNarrative,
  suggestCategory,
  suggestTargetId,
} from '../lib/aiAssistant';
import { formatFileSize, getNowWIBTimestamp, getTodayWIB, parseDecimalInput } from '../lib/format';
import {
  isTargetActiveForDate,
  validateActivityForm,
  validateAttachmentFile,
} from '../lib/validation';
import {
  Activity,
  ActivityAttachment,
  ActivityPriority,
  ActivityStatus,
  PerformanceTarget,
} from '../types';

export interface ActivityFormValues {
  activity_date: string;
  title: string;
  description: string;
  category: string;
  target_id: string | null;
  output_description: string;
  output_quantity: number | null;
  output_unit: string;
  duration_minutes: number | null;
  status: ActivityStatus;
  priority: ActivityPriority;
  tags: string[];
  challenges: string;
  follow_up: string;
}

interface ActivityFormModalProps {
  isOpen: boolean;
  editingActivity: Activity | null;
  existingAttachments: ActivityAttachment[];
  userId: string;
  targets: PerformanceTarget[];
  categories: string[];
  maxAttachmentMb: number;
  aiEnabled: boolean;
  onClose: () => void;
  onSave: (
    values: ActivityFormValues,
    newAttachments: ActivityAttachment[],
    removedAttachmentIds: string[],
  ) => void;
}

export function ActivityFormModal({
  isOpen,
  editingActivity,
  existingAttachments,
  userId,
  targets,
  categories,
  maxAttachmentMb,
  aiEnabled,
  onClose,
  onSave,
}: ActivityFormModalProps) {
  const [activityDate, setActivityDate] = useState(getTodayWIB());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Pemeliharaan Sistem');
  const [targetId, setTargetId] = useState<string>('');
  const [outputDesc, setOutputDesc] = useState('');
  const [outputQtyRaw, setOutputQtyRaw] = useState('');
  const [outputUnit, setOutputUnit] = useState('');
  const [durationRaw, setDurationRaw] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('Selesai');
  const [priority, setPriority] = useState<ActivityPriority>('Sedang');
  const [tagsRaw, setTagsRaw] = useState('');
  const [challenges, setChallenges] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ActivityAttachment[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dateRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const durRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingActivity) {
      setActivityDate(editingActivity.activity_date);
      setTitle(editingActivity.title);
      setDescription(editingActivity.description);
      setCategory(editingActivity.category);
      setTargetId(editingActivity.target_id ?? '');
      setOutputDesc(editingActivity.output_description);
      setOutputQtyRaw(
        editingActivity.output_quantity !== null
          ? String(editingActivity.output_quantity).replace('.', ',')
          : '',
      );
      setOutputUnit(editingActivity.output_unit);
      setDurationRaw(
        editingActivity.duration_minutes !== null
          ? String(editingActivity.duration_minutes)
          : '',
      );
      setStatus(editingActivity.status);
      setPriority(editingActivity.priority);
      setTagsRaw(editingActivity.tags.join(', '));
      setChallenges(editingActivity.challenges);
      setFollowUp(editingActivity.follow_up);
    } else {
      setActivityDate(getTodayWIB());
      setTitle('');
      setDescription('');
      setCategory(categories[0] ?? 'Pemeliharaan Sistem');
      setTargetId('');
      setOutputDesc('');
      setOutputQtyRaw('');
      setOutputUnit('');
      setDurationRaw('');
      setStatus('Selesai');
      setPriority('Sedang');
      setTagsRaw('');
      setChallenges('');
      setFollowUp('');
    }
    setPendingAttachments([]);
    setRemovedIds([]);
    setAttachmentError('');
    setErrors({});
  }, [isOpen, editingActivity, categories]);

  if (!isOpen) return null;

  const userTargets = targets.filter((t) => t.user_id === userId);
  const eligibleTargets = userTargets.filter((t) =>
    isTargetActiveForDate(t, activityDate),
  );
  const currentLinkedNonEligible =
    targetId && !eligibleTargets.some((t) => t.id === targetId)
      ? userTargets.find((t) => t.id === targetId)
      : null;

  const visibleExisting = existingAttachments.filter(
    (att) => !removedIds.includes(att.id),
  );

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachmentError('');

    const maxBytes = maxAttachmentMb * 1024 * 1024;
    const file = files[0];
    const err = validateAttachmentFile(file, maxBytes);
    if (err) {
      setAttachmentError(err);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const newAtt: ActivityAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        activity_id: editingActivity?.id ?? 'pending',
        file_name: file.name,
        file_path: `local/bukti/${file.name}`,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        uploaded_by: userId,
        data_url: dataUrl.length <= 500000 ? dataUrl : '',
        created_at: getNowWIBTimestamp(),
      };
      setPendingAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePolish = () => {
    if (!title.trim() && !description.trim()) return;
    const polished = polishFormalNarrative(title, description, outputDesc);
    setTitle(polished.title);
    setDescription(polished.description);
    const recCat = suggestCategory(`${title} ${description}`, categories);
    setCategory(recCat);
    const recTgt = suggestTargetId(`${title} ${description}`, eligibleTargets, activityDate);
    if (recTgt && !targetId) {
      setTargetId(recTgt);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valErrors = validateActivityForm({
      activity_date: activityDate,
      title,
      category,
      output_quantity_raw: outputQtyRaw,
      duration_raw: durationRaw,
    });

    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      if (valErrors.activity_date) dateRef.current?.focus();
      else if (valErrors.title) titleRef.current?.focus();
      else if (valErrors.category) categoryRef.current?.focus();
      else if (valErrors.output_quantity) qtyRef.current?.focus();
      else if (valErrors.duration_minutes) durRef.current?.focus();
      return;
    }

    const parsedQty = outputQtyRaw.trim() ? parseDecimalInput(outputQtyRaw) : null;
    const parsedDur = durationRaw.trim() ? Number(durationRaw.trim()) : null;
    const tags = tagsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave(
      {
        activity_date: activityDate,
        title: title.trim(),
        description: description.trim(),
        category,
        target_id: targetId || null,
        output_description: outputDesc.trim(),
        output_quantity: parsedQty,
        output_unit: outputUnit.trim(),
        duration_minutes: parsedDur,
        status,
        priority,
        tags,
        challenges: challenges.trim(),
        follow_up: followUp.trim(),
      },
      pendingAttachments,
      removedIds,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="act-form-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <h2 id="act-form-title" className="text-lg font-semibold text-neutral-900">
            {editingActivity ? 'Ubah Aktivitas Harian' : 'Catat Aktivitas Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir aktivitas"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="act-date" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Tanggal Aktivitas
              </label>
              <input
                ref={dateRef}
                id="act-date"
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
              <label htmlFor="act-category" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Kategori
              </label>
              <select
                ref={categoryRef}
                id="act-category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-800">{errors.category}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="act-title" className="block text-sm font-medium text-neutral-900">
                Judul Aktivitas
              </label>
              {aiEnabled && (
                <button
                  type="button"
                  onClick={handlePolish}
                  className="text-sm font-medium text-blue-700 hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                >
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Rapikan Bahasa Kedinasan</span>
                </button>
              )}
            </div>
            <input
              ref={titleRef}
              id="act-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pemeliharaan aplikasi SIMOPPA"
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-800">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="act-desc" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Deskripsi Pekerjaan
            </label>
            <textarea
              id="act-desc"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uraikan langkah atau pekerjaan yang Anda laksanakan"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            />
          </div>

          <div>
            <label htmlFor="act-target" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Target Kinerja Terkait (opsional)
            </label>
            <select
              id="act-target"
              name="target_id"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <option value="">Belum dipetakan ke target</option>
              {eligibleTargets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.unit})
                </option>
              ))}
              {currentLinkedNonEligible && (
                <option value={currentLinkedNonEligible.id}>
                  {currentLinkedNonEligible.title} ({currentLinkedNonEligible.status})
                </option>
              )}
            </select>
            <p className="mt-1 text-sm text-neutral-600">
              Hanya menampilkan target aktif sesuai tanggal kegiatan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label htmlFor="act-output" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Output / Hasil (opsional)
              </label>
              <input
                id="act-output"
                name="output_description"
                type="text"
                value={outputDesc}
                onChange={(e) => setOutputDesc(e.target.value)}
                placeholder="Contoh: Arsip backup database terverifikasi"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>

            <div>
              <label htmlFor="act-qty" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Jumlah Output
              </label>
              <input
                ref={qtyRef}
                id="act-qty"
                name="output_quantity"
                type="text"
                inputMode="decimal"
                value={outputQtyRaw}
                onChange={(e) => setOutputQtyRaw(e.target.value)}
                placeholder="Contoh: 1"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
              {errors.output_quantity && (
                <p className="mt-1 text-sm text-red-800">{errors.output_quantity}</p>
              )}
            </div>

            <div>
              <label htmlFor="act-unit" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Satuan Output
              </label>
              <input
                id="act-unit"
                name="output_unit"
                type="text"
                value={outputUnit}
                onChange={(e) => setOutputUnit(e.target.value)}
                placeholder="kegiatan, dokumen"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>

            <div>
              <label htmlFor="act-dur" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Durasi (menit)
              </label>
              <input
                ref={durRef}
                id="act-dur"
                name="duration_minutes"
                type="text"
                inputMode="numeric"
                value={durationRaw}
                onChange={(e) => setDurationRaw(e.target.value)}
                placeholder="Contoh: 60"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-800">{errors.duration_minutes}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="act-status" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Status
              </label>
              <select
                id="act-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                {ACTIVITY_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="act-priority" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Prioritas
              </label>
              <select
                id="act-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActivityPriority)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                {ACTIVITY_PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="act-tags" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Tag (pisah koma)
              </label>
              <input
                id="act-tags"
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="SIMOPPA, Server"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="act-challenges" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Kendala (opsional)
              </label>
              <input
                id="act-challenges"
                type="text"
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Catat hambatan bila ada"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>

            <div>
              <label htmlFor="act-followup" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Tindak Lanjut (opsional)
              </label>
              <input
                id="act-followup"
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Langkah lanjutan bila ada"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <label htmlFor="act-attachment" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Bukti Dukung (PDF, JPG, PNG, DOC/DOCX, XLS/XLSX, maks. {maxAttachmentMb} MB)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="act-attachment"
                className="min-h-[44px] cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 inline-flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-700"
              >
                <Paperclip className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                <span>Unggah Berkas</span>
                <input
                  id="act-attachment"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>
            {attachmentError && (
              <p className="mt-1.5 text-sm text-red-800">{attachmentError}</p>
            )}

            {(visibleExisting.length > 0 || pendingAttachments.length > 0) && (
              <ul className="mt-3 divide-y divide-neutral-200 border border-neutral-200 rounded-xl">
                {visibleExisting.map((att) => (
                  <li key={att.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{att.file_name}</p>
                      <p className="text-neutral-600 tabular-nums">{formatFileSize(att.file_size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemovedIds((prev) => [...prev, att.id])}
                      aria-label={`Hapus lampiran ${att.file_name}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {pendingAttachments.map((att) => (
                  <li key={att.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{att.file_name}</p>
                      <p className="text-neutral-600 tabular-nums">
                        {formatFileSize(att.file_size)} (Baru)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAttachments((prev) => prev.filter((p) => p.id !== att.id))
                      }
                      aria-label={`Batalkan lampiran ${att.file_name}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Simpan Aktivitas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
