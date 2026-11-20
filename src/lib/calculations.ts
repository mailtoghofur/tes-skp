// Berisi fungsi perhitungan statistik dashboard, realisasi target, rekap mingguan, dan rekap tim atasan.

import {
  Activity,
  MonthlyReport,
  PerformanceTarget,
  Profile,
} from '../types';
import { formatShortDateID, shiftISODate } from './format';

export interface DailyChartPoint {
  date: string;
  label: string;
  jumlah: number;
}

export interface CategoryChartPoint {
  category: string;
  jumlah: number;
}

export function calculateTargetProgress(
  target: PerformanceTarget,
  activities: Activity[],
): {
  supportingCount: number;
  realization: number;
  percentage: number;
} {
  const linked = activities.filter((a) => a.target_id === target.id);
  const realization = linked.reduce(
    (sum, a) => sum + (a.output_quantity !== null ? a.output_quantity : 0),
    0,
  );
  const percentage =
    target.target_value > 0
      ? Math.min(100, Math.round((realization / target.target_value) * 100))
      : 0;
  return {
    supportingCount: linked.length,
    realization: Math.round(realization * 100) / 100,
    percentage,
  };
}

export function calculateEmployeeDashboardStats(params: {
  userId: string;
  todayISO: string;
  activities: Activity[];
  targets: PerformanceTarget[];
  reports: MonthlyReport[];
}) {
  const { userId, todayISO, activities, targets, reports } = params;
  const userActivities = activities.filter((a) => a.user_id === userId);
  const currentMonthPrefix = todayISO.slice(0, 7);
  const [yearNum, monthNum] = currentMonthPrefix.split('-').map(Number);

  const todayCount = userActivities.filter((a) => a.activity_date === todayISO).length;
  const monthCount = userActivities.filter((a) =>
    a.activity_date.startsWith(currentMonthPrefix),
  ).length;
  const activeTargetsCount = targets.filter(
    (t) => t.user_id === userId && t.status === 'Aktif',
  ).length;

  const currentReport = reports.find(
    (r) => r.user_id === userId && r.month === monthNum && r.year === yearNum,
  );

  const last7Days: DailyChartPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = shiftISODate(todayISO, -i);
    const count = userActivities.filter((a) => a.activity_date === dt).length;
    last7Days.push({
      date: dt,
      label: formatShortDateID(dt).slice(0, 6),
      jumlah: count,
    });
  }

  const categoryMap = new Map<string, number>();
  for (const act of userActivities.filter((a) =>
    a.activity_date.startsWith(currentMonthPrefix),
  )) {
    categoryMap.set(act.category, (categoryMap.get(act.category) ?? 0) + 1);
  }
  const byCategory: CategoryChartPoint[] = Array.from(categoryMap.entries())
    .map(([category, jumlah]) => ({ category, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);

  const recentActivities = [...userActivities]
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date) || b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  return {
    todayCount,
    monthCount,
    activeTargetsCount,
    reportStatus: currentReport ? currentReport.status : 'Belum dibuat',
    last7Days,
    byCategory,
    recentActivities,
  };
}

export function calculateWeeklyRecap(
  activities: Activity[],
  targets: PerformanceTarget[],
  weekStart: string,
  weekEnd: string,
) {
  const inWeek = activities
    .filter((a) => a.activity_date >= weekStart && a.activity_date <= weekEnd)
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date));

  const completed = inWeek.filter((a) => a.status === 'Selesai').length;
  const pending = inWeek.length - completed;

  const categoryCounts = new Map<string, number>();
  const targetCounts = new Map<string, { title: string; count: number }>();

  for (const act of inWeek) {
    categoryCounts.set(act.category, (categoryCounts.get(act.category) ?? 0) + 1);
    const tgt = targets.find((t) => t.id === act.target_id);
    const tgtKey = tgt ? tgt.id : 'unmapped';
    const tgtTitle = tgt ? tgt.title : 'Belum dipetakan';
    const prev = targetCounts.get(tgtKey);
    targetCounts.set(tgtKey, {
      title: tgtTitle,
      count: (prev?.count ?? 0) + 1,
    });
  }

  return {
    activities: inWeek,
    total: inWeek.length,
    completed,
    pending,
    byCategory: Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    byTarget: Array.from(targetCounts.values()),
  };
}

export function calculateTeamSummary(
  subordinates: Profile[],
  activities: Activity[],
  reports: MonthlyReport[],
  targets: PerformanceTarget[],
  month: number,
  year: number,
) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return subordinates.map((emp) => {
    const empActs = activities.filter(
      (a) => a.user_id === emp.user_id && a.activity_date.startsWith(prefix),
    );
    const empTargets = targets.filter(
      (t) => t.user_id === emp.user_id && t.status === 'Aktif',
    );
    const report = reports.find(
      (r) => r.user_id === emp.user_id && r.month === month && r.year === year,
    );
    return {
      profile: emp,
      activityCount: empActs.length,
      completedCount: empActs.filter((a) => a.status === 'Selesai').length,
      activeTargets: empTargets.length,
      reportStatus: report ? report.status : 'Belum dibuat',
      reportId: report?.id ?? null,
    };
  });
}
