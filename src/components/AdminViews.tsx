// Kumpulan halaman peran Admin: Dashboard Admin, Pengguna, Unit Kerja, Kategori Aktivitas, Template Laporan, Audit Log, dan Pengaturan.

import { FormEvent, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { formatDateTimeWIB } from '../lib/format';
import {
  AppSettings,
  AuditLog,
  Profile,
  ReportTemplateConfig,
  Unit,
  UserRole,
} from '../types';

interface AdminViewsProps {
  activePage: string;
  profiles: Profile[];
  units: Unit[];
  categories: string[];
  auditLogs: AuditLog[];
  reportTemplate: ReportTemplateConfig;
  appSettings: AppSettings;
  onAddUser: (input: {
    full_name: string;
    email: string;
    nip: string;
    job_title: string;
    unit_id: string;
    supervisor_id: string | null;
    role: UserRole;
  }) => void;
  onUpdateUserRole: (userId: string, role: UserRole, active: boolean) => void;
  onAddUnit: (name: string, parentId: string | null) => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
  onSaveTemplate: (tpl: ReportTemplateConfig) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onResetDemoData: () => void;
}

export function AdminViews({
  activePage,
  profiles,
  units,
  categories,
  auditLogs,
  reportTemplate,
  appSettings,
  onAddUser,
  onUpdateUserRole,
  onAddUnit,
  onAddCategory,
  onRemoveCategory,
  onSaveTemplate,
  onSaveSettings,
  onResetDemoData,
}: AdminViewsProps) {
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserNip, setNewUserNip] = useState('');
  const [newUserJob, setNewUserJob] = useState('');
  const [newUserUnit, setNewUserUnit] = useState(units[0]?.id ?? 'unit-1');
  const [newUserSup, setNewUserSup] = useState('user-atasan-1');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [userError, setUserError] = useState('');

  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitParent, setNewUnitParent] = useState('');
  const [newCatName, setNewCatName] = useState('');

  const [tplState, setTplState] = useState<ReportTemplateConfig>(reportTemplate);
  const [settingsState, setSettingsState] = useState<AppSettings>(appSettings);
  const [auditFilter, setAuditFilter] = useState('');

  const supervisors = profiles.filter((p) => p.role === 'supervisor');
  const getUnitName = (id: string) => units.find((u) => u.id === id)?.name ?? '-';
  const getUserName = (id: string) =>
    profiles.find((p) => p.user_id === id)?.full_name ?? id;

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserNip.trim()) {
      setUserError('Lengkapi nama, email, dan NIP pengguna baru.');
      return;
    }
    setUserError('');
    onAddUser({
      full_name: newUserName.trim(),
      email: newUserEmail.trim(),
      nip: newUserNip.trim(),
      job_title: newUserJob.trim() || 'Pelaksana',
      unit_id: newUserUnit,
      supervisor_id: newUserRole === 'employee' ? newUserSup || null : null,
      role: newUserRole,
    });
    setNewUserName('');
    setNewUserEmail('');
    setNewUserNip('');
    setNewUserJob('');
  };

  if (activePage === 'admin-dashboard') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard Admin</h1>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Total Pengguna</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{profiles.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Unit Kerja</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{units.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Kategori Aktivitas</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{categories.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-sm text-neutral-600">Catatan Audit</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{auditLogs.length}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            Aktivitas Sistem Terbaru
          </h2>
          <ul className="divide-y divide-neutral-200">
            {auditLogs.slice(0, 8).map((log) => (
              <li key={log.id} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span>
                  <span className="font-medium text-neutral-900">
                    {getUserName(log.user_id)}
                  </span>{' '}
                  / {log.action} ({log.entity_type})
                </span>
                <span className="text-neutral-600 tabular-nums">
                  {formatDateTimeWIB(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  if (activePage === 'admin-users') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Pengelolaan Pengguna</h1>

        <form onSubmit={handleCreateUser} className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Tambah Pengguna Demo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="adm-name" className="block text-sm font-medium text-neutral-900 mb-1">
                Nama Lengkap
              </label>
              <input
                id="adm-name"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Contoh: Andi Wijaya, S.T."
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-base"
              />
            </div>
            <div>
              <label htmlFor="adm-email" className="block text-sm font-medium text-neutral-900 mb-1">
                Email
              </label>
              <input
                id="adm-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="andi@instansi.contoh.go.id"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-base"
              />
            </div>
            <div>
              <label htmlFor="adm-nip" className="block text-sm font-medium text-neutral-900 mb-1">
                NIP
              </label>
              <input
                id="adm-nip"
                type="text"
                value={newUserNip}
                onChange={(e) => setNewUserNip(e.target.value)}
                placeholder="199501012022031001"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-base tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="adm-job" className="block text-sm font-medium text-neutral-900 mb-1">
                Jabatan
              </label>
              <input
                id="adm-job"
                type="text"
                value={newUserJob}
                onChange={(e) => setNewUserJob(e.target.value)}
                placeholder="Pranata Komputer"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-base"
              />
            </div>
            <div>
              <label htmlFor="adm-unit" className="block text-sm font-medium text-neutral-900 mb-1">
                Unit Kerja
              </label>
              <select
                id="adm-unit"
                value={newUserUnit}
                onChange={(e) => setNewUserUnit(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="adm-role" className="block text-sm font-medium text-neutral-900 mb-1">
                Peran
              </label>
              <select
                id="adm-role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base"
              >
                <option value="employee">ASN / Pegawai</option>
                <option value="supervisor">Atasan</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {newUserRole === 'employee' && (
              <div>
                <label htmlFor="adm-sup" className="block text-sm font-medium text-neutral-900 mb-1">
                  Atasan Langsung
                </label>
                <select
                  id="adm-sup"
                  value={newUserSup}
                  onChange={(e) => setNewUserSup(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base"
                >
                  {supervisors.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {userError && <p className="text-sm text-red-800">{userError}</p>}
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Pengguna</span>
          </button>
        </form>

        <div className="bg-white rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-700">
              <tr>
                <th className="py-2.5 pr-3 font-medium">Nama & Jabatan</th>
                <th className="py-2.5 px-3 font-medium">Unit Kerja</th>
                <th className="py-2.5 px-3 font-medium">Peran</th>
                <th className="py-2.5 pl-3 font-medium">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-neutral-900">{p.full_name}</p>
                    <p className="text-neutral-600 tabular-nums">
                      NIP {p.nip} / {p.job_title}
                    </p>
                  </td>
                  <td className="py-3 px-3">{getUnitName(p.unit_id)}</td>
                  <td className="py-3 px-3">
                    <select
                      aria-label={`Ubah peran ${p.full_name}`}
                      value={p.role}
                      onChange={(e) =>
                        onUpdateUserRole(p.user_id, e.target.value as UserRole, p.active)
                      }
                      className="min-h-[40px] rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-sm"
                    >
                      <option value="employee">ASN / Pegawai</option>
                      <option value="supervisor">Atasan</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 pl-3">
                    <button
                      type="button"
                      onClick={() => onUpdateUserRole(p.user_id, p.role, !p.active)}
                      className={`min-h-[40px] rounded-xl border px-3 py-1 text-sm font-medium ${
                        p.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {p.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activePage === 'admin-units') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Unit Kerja</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newUnitName.trim()) return;
            onAddUnit(newUnitName.trim(), newUnitParent || null);
            setNewUnitName('');
          }}
          className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="flex-1 w-full">
            <label htmlFor="unit-name" className="block text-sm font-medium text-neutral-900 mb-1">
              Nama Unit Kerja Baru
            </label>
            <input
              id="unit-name"
              type="text"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Contoh: Seksi Keamanan Informasi"
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
            />
          </div>
          <div className="w-full sm:w-64">
            <label htmlFor="unit-parent" className="block text-sm font-medium text-neutral-900 mb-1">
              Unit Induk
            </label>
            <select
              id="unit-parent"
              value={newUnitParent}
              onChange={(e) => setNewUnitParent(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base"
            >
              <option value="">Tidak ada induk</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 whitespace-nowrap"
          >
            Tambah Unit
          </button>
        </form>

        <div className="bg-white rounded-2xl p-6 divide-y divide-neutral-200">
          {units.map((u) => (
            <div key={u.id} className="py-3 first:pt-0 last:pb-0 flex justify-between text-sm">
              <span className="font-medium text-neutral-900">{u.name}</span>
              <span className="text-neutral-600">
                Induk: {u.parent_unit_id ? getUnitName(u.parent_unit_id) : 'Unit Utama'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activePage === 'admin-categories') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Kategori Aktivitas</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCatName.trim()) return;
            onAddCategory(newCatName.trim());
            setNewCatName('');
          }}
          className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="flex-1 w-full">
            <label htmlFor="cat-name" className="block text-sm font-medium text-neutral-900 mb-1">
              Nama Kategori Baru
            </label>
            <input
              id="cat-name"
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Contoh: Audit Keamanan Sistem"
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 whitespace-nowrap"
          >
            Tambah Kategori
          </button>
        </form>

        <div className="bg-white rounded-2xl p-6 divide-y divide-neutral-200">
          {categories.map((cat) => (
            <div
              key={cat}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-sm"
            >
              <span className="font-medium text-neutral-900">{cat}</span>
              <button
                type="button"
                onClick={() => onRemoveCategory(cat)}
                aria-label={`Hapus kategori ${cat}`}
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activePage === 'admin-templates') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Template Laporan</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSaveTemplate(tplState);
          }}
          className="bg-white rounded-2xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="tpl-header" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Judul Dokumen Laporan
            </label>
            <input
              id="tpl-header"
              type="text"
              value={tplState.header_title}
              onChange={(e) => setTplState({ ...tplState, header_title: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
            />
          </div>
          <div>
            <label htmlFor="tpl-org" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Nama Instansi / Unit Induk
            </label>
            <input
              id="tpl-org"
              type="text"
              value={tplState.organization_name}
              onChange={(e) =>
                setTplState({ ...tplState, organization_name: e.target.value })
              }
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
            />
          </div>
          <div>
            <label htmlFor="tpl-close" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Teks Penutup Standar
            </label>
            <textarea
              id="tpl-close"
              rows={3}
              value={tplState.default_closing}
              onChange={(e) =>
                setTplState({ ...tplState, default_closing: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Simpan Template</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activePage === 'admin-audit') {
    const visibleLogs = auditLogs.filter((log) => {
      if (!auditFilter.trim()) return true;
      const q = auditFilter.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        getUserName(log.user_id).toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">Audit Log</h1>
          <input
            type="search"
            aria-label="Filter audit log"
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            placeholder="Cari aksi atau pelaku..."
            className="min-h-[44px] sm:w-72 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-base"
          />
        </div>

        <div className="bg-white rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-700">
              <tr>
                <th className="py-2.5 pr-3 font-medium">Waktu</th>
                <th className="py-2.5 px-3 font-medium">Pelaku</th>
                <th className="py-2.5 px-3 font-medium">Aksi</th>
                <th className="py-2.5 px-3 font-medium">Objek</th>
                <th className="py-2.5 pl-3 font-medium">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {visibleLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-neutral-600">
                    {formatDateTimeWIB(log.created_at)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-neutral-900">
                    {getUserName(log.user_id)}
                  </td>
                  <td className="py-2.5 px-3">{log.action}</td>
                  <td className="py-2.5 px-3">{log.entity_type}</td>
                  <td className="py-2.5 pl-3 text-neutral-600">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Pengaturan Aplikasi</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSaveSettings(settingsState);
        }}
        className="bg-white rounded-2xl p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-hours" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Jam Kerja Standar
            </label>
            <input
              id="set-hours"
              type="text"
              value={settingsState.work_hours_label}
              onChange={(e) =>
                setSettingsState({ ...settingsState, work_hours_label: e.target.value })
              }
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
            />
          </div>
          <div>
            <label htmlFor="set-att-size" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Batas Ukuran Lampiran (MB)
            </label>
            <input
              id="set-att-size"
              type="number"
              min={1}
              max={10}
              value={settingsState.max_attachment_mb}
              onChange={(e) =>
                setSettingsState({
                  ...settingsState,
                  max_attachment_mb: Number(e.target.value) || 2,
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base tabular-nums"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-neutral-900 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={settingsState.ai_assistant_enabled}
            onChange={(e) =>
              setSettingsState({
                ...settingsState,
                ai_assistant_enabled: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-neutral-300 text-blue-700"
          />
          <span>Aktifkan asisten perapihan narasi dan pemecah Tambah Cepat</span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onResetDemoData}
            className="min-h-[44px] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Kembalikan Data Demo Awal</span>
          </button>

          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
