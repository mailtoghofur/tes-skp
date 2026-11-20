// Kerangka tata letak responsif aplikasi (sidebar desktop, topbar, navigasi bawah mobile, notifikasi, dan dialog konfirmasi).

import { ReactNode, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Home,
  LayoutGrid,
  ListChecks,
  LogOut,
  Plus,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Target,
  User,
  Users,
  X,
} from 'lucide-react';
import { APP_IDENTITY, ROLE_NAVIGATION } from '../config';
import { formatDateTimeWIB } from '../lib/format';
import { NotificationItem, Profile } from '../types';

interface AppShellProps {
  currentUser: Profile;
  allProfiles: Profile[];
  activePage: string;
  notifications: NotificationItem[];
  toastMessage: { text: string; type: 'success' | 'error' } | null;
  confirmDialog: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;
  onNavigate: (pageId: string) => void;
  onOpenQuickAdd?: () => void;
  onMarkAllRead: () => void;
  onSwitchUser: (profile: Profile) => void;
  onLogout: () => void;
  onDismissToast: () => void;
  children: ReactNode;
}

function getNavIcon(id: string) {
  switch (id) {
    case 'dashboard':
    case 'team-dashboard':
    case 'admin-dashboard':
      return Home;
    case 'activities':
    case 'team-activities':
      return ListChecks;
    case 'targets':
      return Target;
    case 'weekly':
      return CalendarDays;
    case 'reports':
    case 'team-reviews':
      return FileText;
    case 'team-employees':
    case 'admin-users':
      return Users;
    case 'team-recap':
    case 'admin-units':
      return FolderKanban;
    case 'admin-categories':
      return LayoutGrid;
    case 'admin-templates':
      return SlidersHorizontal;
    case 'admin-audit':
      return ScrollText;
    case 'admin-settings':
      return Settings;
    case 'profile':
      return User;
    default:
      return ClipboardCheck;
  }
}

export function AppShell({
  currentUser,
  allProfiles,
  activePage,
  notifications,
  toastMessage,
  confirmDialog,
  onNavigate,
  onOpenQuickAdd,
  onMarkAllRead,
  onSwitchUser,
  onLogout,
  onDismissToast,
  children,
}: AppShellProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const navItems = ROLE_NAVIGATION[currentUser.role];
  const mobileItems = navItems.slice(0, 5);
  const userNotifs = notifications
    .filter((n) => n.user_id === currentUser.user_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const unreadCount = userNotifs.filter((n) => !n.read_at).length;

  const activeNav = navItems.find((item) => item.id === activePage);
  const roleTitle =
    currentUser.role === 'employee'
      ? 'ASN / Pegawai'
      : currentUser.role === 'supervisor'
        ? 'Atasan / Penilai'
        : 'Admin';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-neutral-200">
          <div className="h-9 w-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold text-neutral-900 whitespace-nowrap">
            {APP_IDENTITY.name}
          </span>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = getNavIcon(item.id);
            const active = item.id === activePage;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 space-y-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {currentUser.full_name}
            </p>
            <p className="text-sm text-neutral-600 truncate">{roleTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSwitchOpen((v) => !v)}
              className="flex-1 min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 whitespace-nowrap"
            >
              Ganti Peran
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar dari akun"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-12 lg:h-16 bg-white border-b border-neutral-200 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="lg:hidden h-8 w-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base lg:text-lg font-semibold text-neutral-900 truncate">
              {activeNav?.label ?? APP_IDENTITY.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser.role === 'employee' && onOpenQuickAdd && (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="min-h-[40px] lg:min-h-[44px] rounded-xl bg-blue-700 px-3 lg:px-4 py-1.5 lg:py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Tambah Cepat</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setSwitchOpen(false);
                }}
                aria-label="Buka notifikasi"
                className="min-h-[40px] min-w-[40px] lg:min-h-[44px] lg:min-w-[44px] rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-50 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-blue-700 px-1 text-xs font-medium text-white flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white border border-neutral-200 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] z-40">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                    <span className="text-sm font-semibold text-neutral-900">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                  {userNotifs.length === 0 ? (
                    <p className="py-4 text-sm text-neutral-600">Belum ada notifikasi.</p>
                  ) : (
                    <ul className="divide-y divide-neutral-200 max-h-64 overflow-y-auto">
                      {userNotifs.slice(0, 6).map((n) => (
                        <li key={n.id} className="py-2.5 text-sm">
                          <p className="font-medium text-neutral-900">{n.title}</p>
                          <p className="text-neutral-600 mt-0.5">{n.message}</p>
                          <p className="text-xs text-neutral-500 mt-1 tabular-nums">
                            {formatDateTimeWIB(n.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSwitchOpen((v) => !v);
                setNotifOpen(false);
              }}
              aria-label="Ganti akun demo"
              className="lg:hidden min-h-[40px] min-w-[40px] rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-20 lg:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navigasi seluler"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-neutral-200 grid grid-cols-5"
      >
        {mobileItems.map((item) => {
          const Icon = getNavIcon(item.id);
          const active = item.id === activePage;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                active ? 'text-blue-700' : 'text-neutral-600'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[64px]">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>

      {switchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pilih akun demo"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Ganti Akun Demo</h2>
              <button
                type="button"
                onClick={() => setSwitchOpen(false)}
                aria-label="Tutup pemilih akun"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="divide-y divide-neutral-200 mt-2">
              {allProfiles
                .filter((p) => p.active)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(p);
                      setSwitchOpen(false);
                    }}
                    className={`w-full py-3 px-2 text-left flex items-center justify-between gap-2 hover:bg-neutral-50 rounded-lg ${
                      p.user_id === currentUser.user_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {p.full_name}
                      </p>
                      <p className="text-sm text-neutral-600 truncate">
                        {p.role === 'employee'
                          ? 'ASN / Pegawai'
                          : p.role === 'supervisor'
                            ? 'Atasan / Penilai'
                            : 'Admin'}{' '}
                        / {p.job_title}
                      </p>
                    </div>
                    {p.user_id === currentUser.user_id && (
                      <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSwitchOpen(false);
                  onLogout();
                }}
                className="min-h-[44px] rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
              >
                Keluar ke Layar Login
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <h2 id="confirm-title" className="text-lg font-semibold text-neutral-900">
              {confirmDialog.title}
            </h2>
            <p className="mt-2 text-base text-neutral-600">{confirmDialog.message}</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-16 lg:bottom-6 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 ${
            toastMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={onDismissToast}
            aria-label="Tutup pesan"
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
