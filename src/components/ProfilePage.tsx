// Halaman Profil pengguna untuk melihat informasi kepegawaian dan memperbarui data identitas dasar.

import { FormEvent, useState } from 'react';
import { Save } from 'lucide-react';
import { Profile, Unit } from '../types';

interface ProfilePageProps {
  profile: Profile;
  units: Unit[];
  allProfiles: Profile[];
  onSaveProfile: (patch: { full_name: string; nip: string; job_title: string }) => void;
}

export function ProfilePage({
  profile,
  units,
  allProfiles,
  onSaveProfile,
}: ProfilePageProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [nip, setNip] = useState(profile.nip);
  const [jobTitle, setJobTitle] = useState(profile.job_title);
  const [error, setError] = useState('');

  const unitName = units.find((u) => u.id === profile.unit_id)?.name ?? '-';
  const supervisorName =
    allProfiles.find((p) => p.user_id === profile.supervisor_id)?.full_name ??
    'Tidak ada atasan langsung';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !nip.trim() || !jobTitle.trim()) {
      setError('Nama lengkap, NIP, dan jabatan wajib diisi.');
      return;
    }
    setError('');
    onSaveProfile({
      full_name: fullName.trim(),
      nip: nip.trim(),
      job_title: jobTitle.trim(),
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Profil Pegawai</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4">
        <div>
          <label htmlFor="prof-name" className="block text-sm font-medium text-neutral-900 mb-1.5">
            Nama Lengkap
          </label>
          <input
            id="prof-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
          />
        </div>

        <div>
          <label htmlFor="prof-nip" className="block text-sm font-medium text-neutral-900 mb-1.5">
            NIP
          </label>
          <input
            id="prof-nip"
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base tabular-nums"
          />
        </div>

        <div>
          <label htmlFor="prof-job" className="block text-sm font-medium text-neutral-900 mb-1.5">
            Jabatan
          </label>
          <input
            id="prof-job"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-neutral-200 px-3.5 py-2 text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200 text-sm">
          <div>
            <p className="text-neutral-600">Unit Kerja</p>
            <p className="font-medium text-neutral-900 mt-0.5">{unitName}</p>
          </div>
          <div>
            <p className="text-neutral-600">Atasan / Pejabat Penilai</p>
            <p className="font-medium text-neutral-900 mt-0.5">{supervisorName}</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-800">{error}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Simpan Profil</span>
          </button>
        </div>
      </form>
    </div>
  );
}
