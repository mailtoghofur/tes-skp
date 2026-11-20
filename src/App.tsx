// Komponen induk aplikasi SKPFlow yang mengelola state persisten, routing per peran, dan seluruh alur aksi pengguna.

import { useEffect, useState } from 'react';
import { ActivitiesPage } from './components/ActivitiesPage';
import { ActivityFormModal, ActivityFormValues } from './components/ActivityFormModal';
import { AdminViews } from './components/AdminViews';
import { AppShell } from './components/AppShell';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { LoginView } from './components/LoginView';
import { MonthlyReportPage } from './components/MonthlyReportPage';
import { ProfilePage } from './components/ProfilePage';
import { QuickAddModal } from './components/QuickAddModal';
import { SupervisorViews } from './components/SupervisorViews';
import { TargetsPage } from './components/TargetsPage';
import { WeeklyRecapPage } from './components/WeeklyRecapPage';
import { ROLE_NAVIGATION } from './config';
import { formatMonthYearID, getNowWIBTimestamp } from './lib/format';
import {
  createAuditEntry,
  loadAppState,
  resetDemoState,
  saveAppState,
} from './lib/storage';
import {
  Activity,
  ActivityAttachment,
  AppSettings,
  AppState,
  MonthlyReport,
  MonthlyReportContent,
  PerformanceTarget,
  Profile,
  QuickAddItem,
  ReportStatus,
  ReportTemplateConfig,
  UserRole,
} from './types';

function defaultPageForRole(role: UserRole): string {
  return ROLE_NAVIGATION[role][0].id;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const currentUser = state.currentUserId
    ? state.profiles.find((p) => p.user_id === state.currentUserId && p.active) ?? null
    : null;

  useEffect(() => {
    if (currentUser) {
      const allowed = ROLE_NAVIGATION[currentUser.role].map((n) => n.id);
      if (!allowed.includes(activePage)) {
        setActivePage(defaultPageForRole(currentUser.role));
      }
    }
  }, [currentUser, activePage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
  };

  const handleLogin = (profile: Profile) => {
    setState((prev) => ({
      ...prev,
      currentUserId: profile.user_id,
      auditLogs: [
        createAuditEntry(profile.user_id, 'LOGIN', 'profile', profile.id, {
          role: profile.role,
        }),
        ...prev.auditLogs,
      ],
    }));
    setActivePage(defaultPageForRole(profile.role));
    showToast(`Selamat datang, ${profile.full_name}.`);
  };

  const handleLogout = () => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      currentUserId: null,
      auditLogs: [
        createAuditEntry(currentUser.user_id, 'LOGOUT', 'profile', currentUser.id),
        ...prev.auditLogs,
      ],
    }));
  };

  const handleSaveQuickAdd = (items: QuickAddItem[]) => {
    if (!currentUser) return;
    const now = getNowWIBTimestamp();
    const newActivities: Activity[] = items.map((item, idx) => ({
      id: `act-${Date.now()}-${idx}`,
      user_id: currentUser.user_id,
      target_id: item.target_id,
      activity_date: item.activity_date,
      title: item.title.trim(),
      description: item.description.trim(),
      category: item.category,
      output_description: item.output_description.trim(),
      output_quantity: item.output_quantity,
      output_unit: item.output_unit.trim(),
      duration_minutes: null,
      status: item.status,
      priority: 'Sedang',
      tags: [],
      challenges: '',
      follow_up: '',
      created_at: now,
      updated_at: now,
    }));

    const logs = newActivities.map((a) =>
      createAuditEntry(currentUser.user_id, 'CREATE_ACTIVITY', 'activity', a.id, {
        title: a.title,
        source: 'quick_add',
      }),
    );

    setState((prev) => ({
      ...prev,
      activities: [...newActivities, ...prev.activities],
      auditLogs: [...logs, ...prev.auditLogs],
    }));
    showToast(`${newActivities.length} aktivitas berhasil disimpan.`);
  };

  const handleSaveActivity = (
    values: ActivityFormValues,
    newAttachments: ActivityAttachment[],
    removedAttachmentIds: string[],
  ) => {
    if (!currentUser) return;
    const now = getNowWIBTimestamp();

    if (editingActivity) {
      if (editingActivity.user_id !== currentUser.user_id) {
        showToast('Anda tidak memiliki kewenangan mengubah aktivitas ini.', 'error');
        return;
      }
      const updatedId = editingActivity.id;
      const attachedWithActId = newAttachments.map((att) => ({
        ...att,
        activity_id: updatedId,
      }));
      setState((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === updatedId ? { ...a, ...values, updated_at: now } : a,
        ),
        attachments: [
          ...prev.attachments.filter((att) => !removedAttachmentIds.includes(att.id)),
          ...attachedWithActId,
        ],
        auditLogs: [
          createAuditEntry(currentUser.user_id, 'UPDATE_ACTIVITY', 'activity', updatedId, {
            title: values.title,
          }),
          ...prev.auditLogs,
        ],
      }));
      showToast('Perubahan aktivitas berhasil disimpan.');
    } else {
      const newId = `act-${Date.now()}`;
      const created: Activity = {
        id: newId,
        user_id: currentUser.user_id,
        ...values,
        created_at: now,
        updated_at: now,
      };
      const attachedWithActId = newAttachments.map((att) => ({
        ...att,
        activity_id: newId,
      }));
      setState((prev) => ({
        ...prev,
        activities: [created, ...prev.activities],
        attachments: [...prev.attachments, ...attachedWithActId],
        auditLogs: [
          createAuditEntry(currentUser.user_id, 'CREATE_ACTIVITY', 'activity', newId, {
            title: values.title,
          }),
          ...prev.auditLogs,
        ],
      }));
      showToast('Aktivitas baru berhasil dicatat.');
    }
    setEditingActivity(null);
  };

  const handleDeleteActivity = (act: Activity) => {
    if (!currentUser || act.user_id !== currentUser.user_id) return;
    setConfirmDialog({
      title: 'Hapus Aktivitas?',
      message: `Aktivitas "${act.title}" beserta lampirannya akan dihapus permanen.`,
      confirmLabel: 'Hapus',
      onCancel: () => setConfirmDialog(null),
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          activities: prev.activities.filter((a) => a.id !== act.id),
          attachments: prev.attachments.filter((att) => att.activity_id !== act.id),
          auditLogs: [
            createAuditEntry(currentUser.user_id, 'DELETE_ACTIVITY', 'activity', act.id, {
              title: act.title,
            }),
            ...prev.auditLogs,
          ],
        }));
        setConfirmDialog(null);
        showToast('Aktivitas berhasil dihapus.');
      },
    });
  };

  const handleSaveTarget = (
    data: Omit<PerformanceTarget, 'id' | 'user_id' | 'created_at'>,
    editingId?: string,
  ) => {
    if (!currentUser) return;
    const now = getNowWIBTimestamp();
    if (editingId) {
      setState((prev) => ({
        ...prev,
        targets: prev.targets.map((t) =>
          t.id === editingId && t.user_id === currentUser.user_id ? { ...t, ...data } : t,
        ),
        auditLogs: [
          createAuditEntry(currentUser.user_id, 'UPDATE_TARGET', 'performance_target', editingId, {
            title: data.title,
          }),
          ...prev.auditLogs,
        ],
      }));
      showToast('Target kinerja berhasil diperbarui.');
    } else {
      const newTgt: PerformanceTarget = {
        id: `tgt-${Date.now()}`,
        user_id: currentUser.user_id,
        ...data,
        created_at: now,
      };
      setState((prev) => ({
        ...prev,
        targets: [newTgt, ...prev.targets],
        auditLogs: [
          createAuditEntry(currentUser.user_id, 'CREATE_TARGET', 'performance_target', newTgt.id, {
            title: data.title,
          }),
          ...prev.auditLogs,
        ],
      }));
      showToast('Target kinerja baru berhasil ditambahkan.');
    }
  };

  const handleArchiveTarget = (tgt: PerformanceTarget) => {
    if (!currentUser || tgt.user_id !== currentUser.user_id) return;
    setState((prev) => ({
      ...prev,
      targets: prev.targets.map((t) =>
        t.id === tgt.id ? { ...t, status: 'Diarsipkan' } : t,
      ),
      auditLogs: [
        createAuditEntry(currentUser.user_id, 'ARCHIVE_TARGET', 'performance_target', tgt.id, {
          title: tgt.title,
        }),
        ...prev.auditLogs,
      ],
    }));
    showToast('Target kinerja diarsipkan.');
  };

  const handleSaveWeeklySummary = (
    weekStart: string,
    weekEnd: string,
    summary: string,
  ) => {
    if (!currentUser) return;
    const now = getNowWIBTimestamp();
    setState((prev) => {
      const existing = prev.weeklySummaries.find(
        (w) => w.user_id === currentUser.user_id && w.week_start === weekStart,
      );
      const updated = existing
        ? prev.weeklySummaries.map((w) =>
            w.id === existing.id ? { ...w, summary, updated_at: now } : w,
          )
        : [
            {
              id: `wk-${Date.now()}`,
              user_id: currentUser.user_id,
              week_start: weekStart,
              week_end: weekEnd,
              summary,
              updated_at: now,
            },
            ...prev.weeklySummaries,
          ];
      return { ...prev, weeklySummaries: updated };
    });
    showToast('Ringkasan mingguan berhasil disimpan.');
  };

  const upsertMonthlyReport = (
    month: number,
    year: number,
    content: MonthlyReportContent,
    summary: string,
    nextStatus: ReportStatus,
  ) => {
    if (!currentUser) return;
    const now = getNowWIBTimestamp();
    setState((prev) => {
      const existing = prev.reports.find(
        (r) => r.user_id === currentUser.user_id && r.month === month && r.year === year,
      );
      const reportId = existing?.id ?? `rep-${Date.now()}`;
      const newReport: MonthlyReport = {
        id: reportId,
        user_id: currentUser.user_id,
        month,
        year,
        summary,
        report_content: content,
        status: nextStatus,
        submitted_at: nextStatus === 'Diajukan' ? now : existing?.submitted_at ?? null,
        approved_at: existing?.approved_at ?? null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      const nextReports = existing
        ? prev.reports.map((r) => (r.id === reportId ? newReport : r))
        : [newReport, ...prev.reports];

      const nextNotifications =
        nextStatus === 'Diajukan' && currentUser.supervisor_id
          ? [
              {
                id: `notif-${Date.now()}`,
                user_id: currentUser.supervisor_id,
                title: 'Pengajuan Laporan Bulanan',
                message: `${currentUser.full_name} mengajukan laporan periode ${formatMonthYearID(
                  month,
                  year,
                )}.`,
                read_at: null,
                created_at: now,
              },
              ...prev.notifications,
            ]
          : prev.notifications;

      return {
        ...prev,
        reports: nextReports,
        notifications: nextNotifications,
        auditLogs: [
          createAuditEntry(
            currentUser.user_id,
            nextStatus === 'Diajukan' ? 'SUBMIT_REPORT' : 'SAVE_REPORT_DRAFT',
            'monthly_report',
            reportId,
            { periode: formatMonthYearID(month, year) },
          ),
          ...prev.auditLogs,
        ],
      };
    });
    showToast(
      nextStatus === 'Diajukan'
        ? 'Laporan berhasil diajukan kepada atasan.'
        : 'Draft laporan bulanan berhasil disimpan.',
    );
  };

  const handleSupervisorReview = (
    report: MonthlyReport,
    newStatus: ReportStatus,
    comments: string,
  ) => {
    if (!currentUser) return;
    const now = getNowWIBTimestamp();
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: newStatus,
              approved_at: newStatus === 'Disetujui' ? now : null,
              updated_at: now,
            }
          : r,
      ),
      reviews: [
        {
          id: `rev-${Date.now()}`,
          report_id: report.id,
          reviewer_id: currentUser.user_id,
          comments,
          status: newStatus,
          created_at: now,
        },
        ...prev.reviews,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          user_id: report.user_id,
          title: `Status Laporan: ${newStatus}`,
          message: `${currentUser.full_name} memperbarui status laporan ${formatMonthYearID(
            report.month,
            report.year,
          )} menjadi ${newStatus}.`,
          read_at: null,
          created_at: now,
        },
        ...prev.notifications,
      ],
      auditLogs: [
        createAuditEntry(currentUser.user_id, 'REVIEW_REPORT', 'monthly_report', report.id, {
          status: newStatus,
        }),
        ...prev.auditLogs,
      ],
    }));
    showToast(`Status laporan diperbarui menjadi ${newStatus}.`);
  };

  if (!currentUser) {
    return <LoginView profiles={state.profiles} onLogin={handleLogin} />;
  }

  const currentUnitName =
    state.units.find((u) => u.id === currentUser.unit_id)?.name ?? '-';

  return (
    <>
      <AppShell
        currentUser={currentUser}
        allProfiles={state.profiles}
        activePage={activePage}
        notifications={state.notifications}
        toastMessage={toast}
        confirmDialog={confirmDialog}
        onNavigate={setActivePage}
        onOpenQuickAdd={
          currentUser.role === 'employee' ? () => setQuickAddOpen(true) : undefined
        }
        onMarkAllRead={() =>
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.user_id === currentUser.user_id && !n.read_at
                ? { ...n, read_at: getNowWIBTimestamp() }
                : n,
            ),
          }))
        }
        onSwitchUser={handleLogin}
        onLogout={handleLogout}
        onDismissToast={() => setToast(null)}
      >
        {currentUser.role === 'employee' && activePage === 'dashboard' && (
          <EmployeeDashboard
            profile={currentUser}
            activities={state.activities}
            targets={state.targets}
            reports={state.reports}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
            onOpenNewActivity={() => {
              setEditingActivity(null);
              setActivityModalOpen(true);
            }}
            onOpenActivities={() => setActivePage('activities')}
            onEditActivity={(act) => {
              setEditingActivity(act);
              setActivityModalOpen(true);
            }}
          />
        )}

        {currentUser.role === 'employee' && activePage === 'activities' && (
          <ActivitiesPage
            userId={currentUser.user_id}
            activities={state.activities}
            targets={state.targets}
            attachments={state.attachments}
            categories={state.categories}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
            onOpenNewActivity={() => {
              setEditingActivity(null);
              setActivityModalOpen(true);
            }}
            onEditActivity={(act) => {
              setEditingActivity(act);
              setActivityModalOpen(true);
            }}
            onDeleteActivity={handleDeleteActivity}
          />
        )}

        {currentUser.role === 'employee' && activePage === 'targets' && (
          <TargetsPage
            userId={currentUser.user_id}
            targets={state.targets}
            activities={state.activities}
            onSaveTarget={handleSaveTarget}
            onArchiveTarget={handleArchiveTarget}
          />
        )}

        {currentUser.role === 'employee' && activePage === 'weekly' && (
          <WeeklyRecapPage
            userId={currentUser.user_id}
            activities={state.activities}
            targets={state.targets}
            weeklySummaries={state.weeklySummaries}
            aiEnabled={state.appSettings.ai_assistant_enabled}
            onSaveSummary={handleSaveWeeklySummary}
          />
        )}

        {currentUser.role === 'employee' && activePage === 'reports' && (
          <MonthlyReportPage
            profile={currentUser}
            unitName={currentUnitName}
            activities={state.activities}
            targets={state.targets}
            reports={state.reports}
            reviews={state.reviews}
            allProfiles={state.profiles}
            template={state.reportTemplate}
            onSaveDraft={(m, y, content, sum) =>
              upsertMonthlyReport(m, y, content, sum, 'Draft')
            }
            onSubmitReport={(m, y, content, sum) =>
              upsertMonthlyReport(m, y, content, sum, 'Diajukan')
            }
            onRequestConfirm={(opts) =>
              setConfirmDialog({
                ...opts,
                onCancel: () => setConfirmDialog(null),
                onConfirm: () => {
                  opts.onConfirm();
                  setConfirmDialog(null);
                },
              })
            }
            onNotifyToast={showToast}
          />
        )}

        {currentUser.role === 'supervisor' && activePage !== 'profile' && (
          <SupervisorViews
            activePage={activePage}
            supervisor={currentUser}
            profiles={state.profiles}
            units={state.units}
            activities={state.activities}
            targets={state.targets}
            reports={state.reports}
            reviews={state.reviews}
            onNavigate={setActivePage}
            onReviewReport={handleSupervisorReview}
          />
        )}

        {currentUser.role === 'admin' && (
          <AdminViews
            activePage={activePage}
            profiles={state.profiles}
            units={state.units}
            categories={state.categories}
            auditLogs={state.auditLogs}
            reportTemplate={state.reportTemplate}
            appSettings={state.appSettings}
            onAddUser={(input) => {
              const now = getNowWIBTimestamp();
              const newUserId = `user-${Date.now()}`;
              const newProf: Profile = {
                id: `prof-${Date.now()}`,
                user_id: newUserId,
                demo_password: 'demo',
                active: true,
                created_at: now,
                ...input,
              };
              setState((prev) => ({
                ...prev,
                profiles: [...prev.profiles, newProf],
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_ADD_USER', 'profile', newProf.id, {
                    name: newProf.full_name,
                  }),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Pengguna baru berhasil ditambahkan.');
            }}
            onUpdateUserRole={(userId, role, active) => {
              setState((prev) => ({
                ...prev,
                profiles: prev.profiles.map((p) =>
                  p.user_id === userId ? { ...p, role, active } : p,
                ),
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_UPDATE_USER', 'profile', userId, {
                    role,
                    active,
                  }),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Perubahan pengguna berhasil disimpan.');
            }}
            onAddUnit={(name, parentId) => {
              const newUnit = {
                id: `unit-${Date.now()}`,
                name,
                parent_unit_id: parentId,
              };
              setState((prev) => ({
                ...prev,
                units: [...prev.units, newUnit],
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_ADD_UNIT', 'unit', newUnit.id, {
                    name,
                  }),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Unit kerja berhasil ditambahkan.');
            }}
            onAddCategory={(name) => {
              if (state.categories.includes(name)) return;
              setState((prev) => ({
                ...prev,
                categories: [...prev.categories, name],
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_ADD_CATEGORY', 'category', name),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Kategori berhasil ditambahkan.');
            }}
            onRemoveCategory={(name) => {
              setState((prev) => ({
                ...prev,
                categories: prev.categories.filter((c) => c !== name),
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_DELETE_CATEGORY', 'category', name),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Kategori berhasil dihapus.');
            }}
            onSaveTemplate={(tpl: ReportTemplateConfig) => {
              setState((prev) => ({
                ...prev,
                reportTemplate: tpl,
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_UPDATE_TEMPLATE', 'template', 'default'),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Template laporan berhasil diperbarui.');
            }}
            onSaveSettings={(settings: AppSettings) => {
              setState((prev) => ({
                ...prev,
                appSettings: settings,
                auditLogs: [
                  createAuditEntry(currentUser.user_id, 'ADMIN_UPDATE_SETTINGS', 'settings', 'app'),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Pengaturan aplikasi berhasil disimpan.');
            }}
            onResetDemoData={() => {
              setConfirmDialog({
                title: 'Kembalikan Data Demo Awal?',
                message: 'Seluruh perubahan lokal Anda akan diganti ulang dengan data contoh awal.',
                confirmLabel: 'Kembalikan',
                onCancel: () => setConfirmDialog(null),
                onConfirm: () => {
                  const fresh = resetDemoState();
                  fresh.currentUserId = currentUser.user_id;
                  setState(fresh);
                  setConfirmDialog(null);
                  showToast('Data demo awal berhasil dipulihkan.');
                },
              });
            }}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage
            profile={currentUser}
            units={state.units}
            allProfiles={state.profiles}
            onSaveProfile={(patch) => {
              setState((prev) => ({
                ...prev,
                profiles: prev.profiles.map((p) =>
                  p.user_id === currentUser.user_id ? { ...p, ...patch } : p,
                ),
                auditLogs: [
                  createAuditEntry(
                    currentUser.user_id,
                    'UPDATE_PROFILE',
                    'profile',
                    currentUser.id,
                  ),
                  ...prev.auditLogs,
                ],
              }));
              showToast('Profil Anda berhasil diperbarui.');
            }}
          />
        )}
      </AppShell>

      <QuickAddModal
        isOpen={quickAddOpen}
        userId={currentUser.user_id}
        targets={state.targets}
        categories={state.categories}
        aiEnabled={state.appSettings.ai_assistant_enabled}
        onClose={() => setQuickAddOpen(false)}
        onSaveItems={handleSaveQuickAdd}
      />

      <ActivityFormModal
        isOpen={activityModalOpen}
        editingActivity={editingActivity}
        existingAttachments={
          editingActivity
            ? state.attachments.filter((att) => att.activity_id === editingActivity.id)
            : []
        }
        userId={currentUser.user_id}
        targets={state.targets}
        categories={state.categories}
        maxAttachmentMb={state.appSettings.max_attachment_mb}
        aiEnabled={state.appSettings.ai_assistant_enabled}
        onClose={() => {
          setActivityModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
      />
    </>
  );
}
