// Halaman Rekap Mingguan untuk memantau capaian per minggu, timeline, serta menyunting ringkasan mingguan.

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Wand2 } from 'lucide-react';
import { generateWeeklySummaryText } from '../lib/aiAssistant';
import { calculateWeeklyRecap } from '../lib/calculations';
import {
  formatDateID,
  getTodayWIB,
  getWeekBounds,
  shiftISODate,
} from '../lib/format';
import { Activity, PerformanceTarget, WeeklySummaryNote } from '../types';
import { StatusBadge } from './StatusBadge';

interface WeeklyRecapPageProps {
  userId: string;
  activities: Activity[];
  targets: PerformanceTarget[];
  weeklySummaries: WeeklySummaryNote[];
  aiEnabled: boolean;
  onSaveSummary: (weekStart: string, weekEnd: string, summary: string) => void;
}

export function WeeklyRecapPage({
  userId,
  activities,
  targets,
  weeklySummaries,
  aiEnabled,
  onSaveSummary,
}: WeeklyRecapPageProps) {
  const [anchorDate, setAnchorDate] = useState(getTodayWIB());
  const { start: weekStart, end: weekEnd } = getWeekBounds(anchorDate);

  const userActivities = activities.filter((a) => a.user_id === userId);
  const userTargets = targets.filter((t) => t.user_id === userId);
  const recap = calculateWeeklyRecap(userActivities, userTargets, weekStart, weekEnd);

  const savedNote = weeklySummaries.find(
    (w) => w.user_id === userId && w.week_start === weekStart,
  );

  const [summaryText, setSummaryText] = useState(
    savedNote?.summary ?? generateWeeklySummaryText(recap.activities, weekStart, weekEnd),
  );

  useEffect(() => {
    const existing = weeklySummaries.find(
      (w) => w.user_id === userId && w.week_start === weekStart,
    );
    if (existing) {
      setSummaryText(existing.summary);
    } else {
      const freshRecap = calculateWeeklyRecap(userActivities, userTargets, weekStart, weekEnd);
      setSummaryText(generateWeeklySummaryText(freshRecap.activities, weekStart, weekEnd));
    }
  }, [weekStart, userId, weeklySummaries, activities.length]);

  const handleGenerate = () => {
    setSummaryText(generateWeeklySummaryText(recap.activities, weekStart, weekEnd));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Rekap Mingguan</h1>
          <p className="text-sm text-neutral-600 mt-1 tabular-nums">
            {formatDateID(weekStart)} sampai {formatDateID(weekEnd)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchorDate(shiftISODate(anchorDate, -7))}
            aria-label="Minggu sebelumnya"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate(getTodayWIB())}
            className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 whitespace-nowrap"
          >
            Minggu Ini
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate(shiftISODate(anchorDate, 7))}
            aria-label="Minggu berikutnya"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 hover:bg-neutral-50"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Total Aktivitas</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900 tabular-nums">
            {recap.total}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Selesai</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800 tabular-nums">
            {recap.completed}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Belum Selesai</p>
          <p className="mt-2 text-3xl font-semibold text-amber-800 tabular-nums">
            {recap.pending}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            Aktivitas per Kategori
          </h2>
          {recap.byCategory.length === 0 ? (
            <p className="text-sm text-neutral-600">Belum ada aktivitas pada minggu ini.</p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {recap.byCategory.map((item) => (
                <li
                  key={item.category}
                  className="py-2.5 flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-900">{item.category}</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {item.count} aktivitas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            Aktivitas per Target Kinerja
          </h2>
          {recap.byTarget.length === 0 ? (
            <p className="text-sm text-neutral-600">Belum ada aktivitas pada minggu ini.</p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {recap.byTarget.map((item) => (
                <li
                  key={item.title}
                  className="py-2.5 flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-900">{item.title}</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {item.count} aktivitas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">Ringkasan Mingguan</h2>
          {aiEnabled && (
            <button
              type="button"
              onClick={handleGenerate}
              className="min-h-[40px] rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1.5"
            >
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              <span>Susun Ulang Ringkasan</span>
            </button>
          )}
        </div>

        <div>
          <label htmlFor="weekly-summary-input" className="block text-sm font-medium text-neutral-700 mb-1.5">
            Narasi Ringkasan (dapat Anda sunting)
          </label>
          <textarea
            id="weekly-summary-input"
            rows={4}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSaveSummary(weekStart, weekEnd, summaryText)}
            className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Simpan Ringkasan</span>
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Timeline Aktivitas Minggu Ini
        </h2>
        {recap.activities.length === 0 ? (
          <p className="text-base text-neutral-600">
            Belum ada aktivitas pada rentang tanggal ini.
          </p>
        ) : (
          <div className="divide-y divide-neutral-200">
            {recap.activities.map((act) => (
              <div
                key={act.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-base font-medium text-neutral-900">{act.title}</p>
                  <p className="text-sm text-neutral-600 tabular-nums">
                    {formatDateID(act.activity_date)} / {act.category}
                    {act.output_description ? ` / ${act.output_description}` : ''}
                  </p>
                </div>
                <StatusBadge status={act.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
