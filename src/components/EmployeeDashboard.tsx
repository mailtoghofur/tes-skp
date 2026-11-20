// Halaman Dashboard ASN menampilkan statistik utama, grafik 7 hari, grafik kategori, dan aktivitas terbaru.

import { Plus, Wand2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { calculateEmployeeDashboardStats } from '../lib/calculations';
import { formatDateID, formatDurationID, getTodayWIB } from '../lib/format';
import { Activity, MonthlyReport, PerformanceTarget, Profile } from '../types';
import { StatusBadge } from './StatusBadge';

interface EmployeeDashboardProps {
  profile: Profile;
  activities: Activity[];
  targets: PerformanceTarget[];
  reports: MonthlyReport[];
  onOpenQuickAdd: () => void;
  onOpenNewActivity: () => void;
  onOpenActivities: () => void;
  onEditActivity: (activity: Activity) => void;
}

export function EmployeeDashboard({
  profile,
  activities,
  targets,
  reports,
  onOpenQuickAdd,
  onOpenNewActivity,
  onOpenActivities,
  onEditActivity,
}: EmployeeDashboardProps) {
  const todayISO = getTodayWIB();
  const stats = calculateEmployeeDashboardStats({
    userId: profile.user_id,
    todayISO,
    activities,
    targets,
    reports,
  });

  const firstName = profile.full_name.split(',')[0].split(' ').slice(0, 2).join(' ');

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Halo, {firstName}
          </h1>
          <p className="text-sm text-neutral-600 mt-1 tabular-nums">
            {formatDateID(todayISO)} / {profile.job_title}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Cepat</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewActivity}
            className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Catat Aktivitas</span>
          </button>
        </div>
      </section>

      <section aria-label="Ringkasan kinerja" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Aktivitas Hari Ini</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900 tabular-nums">
            {stats.todayCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Aktivitas Bulan Ini</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900 tabular-nums">
            {stats.monthCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Target Kinerja Aktif</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900 tabular-nums">
            {stats.activeTargetsCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-neutral-600">Laporan Bulan Ini</p>
          <div className="mt-3">
            <StatusBadge status={stats.reportStatus} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Aktivitas 7 Hari Terakhir
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#525252' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#525252' }} />
                <Tooltip
                  formatter={(value) => [`${String(value ?? 0)} aktivitas`, 'Jumlah']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e5e5',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="jumlah" fill="#1d4ed8" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Aktivitas per Kategori Bulan Ini
          </h2>
          {stats.byCategory.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base text-neutral-600">Belum ada aktivitas pada bulan berjalan.</p>
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="mt-4 min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Catat Aktivitas Pertama
              </button>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.byCategory}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#525252' }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={145}
                    tick={{ fontSize: 12, fill: '#171717' }}
                  />
                  <Tooltip
                    formatter={(value) => [`${String(value ?? 0)} aktivitas`, 'Jumlah']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e5e5',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="jumlah" fill="#1d4ed8" radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Aktivitas Terbaru</h2>
          <button
            type="button"
            onClick={onOpenActivities}
            className="text-sm font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
          >
            Lihat Semua
          </button>
        </div>

        {stats.recentActivities.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-base text-neutral-600">Belum ada aktivitas yang Anda catat.</p>
            <button
              type="button"
              onClick={onOpenNewActivity}
              className="mt-4 min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Catat Aktivitas
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {stats.recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onEditActivity(act)}
                    className="text-left text-base font-medium text-neutral-900 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
                  >
                    {act.title}
                  </button>
                  <p className="text-sm text-neutral-600 mt-1 tabular-nums">
                    {formatDateID(act.activity_date)} / {act.category} / {formatDurationID(act.duration_minutes)}
                  </p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={act.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
