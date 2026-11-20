// Halaman masuk dan pemilih akun demo untuk peran ASN, Atasan, dan Admin.

import { FormEvent, useRef, useState } from 'react';
import { ClipboardCheck, Lock, UserCheck } from 'lucide-react';
import { APP_IDENTITY } from '../config';
import { Profile } from '../types';

interface LoginViewProps {
  profiles: Profile[];
  onLogin: (profile: Profile) => void;
}

export function LoginView({ profiles, onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('rina.kusuma@instansi.contoh.go.id');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Masukkan alamat email akun demo. Contoh: rina.kusuma@instansi.contoh.go.id.');
      emailRef.current?.focus();
      return;
    }
    const found = profiles.find(
      (p) => p.email.toLowerCase() === cleanEmail && p.active,
    );
    if (!found) {
      setError('Akun tidak ditemukan atau sedang nonaktif. Gunakan salah satu akun demo di bawah.');
      emailRef.current?.focus();
      return;
    }
    if (password.trim() !== found.demo_password) {
      setError('Kata sandi demo tidak sesuai. Gunakan kata sandi: demo.');
      return;
    }
    setError('');
    onLogin(found);
  };

  const roleLabel = (role: Profile['role']) => {
    if (role === 'employee') return 'ASN / Pegawai';
    if (role === 'supervisor') return 'Atasan / Penilai';
    return 'Admin Sistem';
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">{APP_IDENTITY.name}</h1>
              <p className="text-sm text-neutral-600">{APP_IDENTITY.tagline}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Masuk ke Akun Anda</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Email Kedinasan
              </label>
              <input
                ref={emailRef}
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@instansi.contoh.go.id"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Kata Sandi
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi demo"
                className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
              <p className="mt-1 text-sm text-neutral-600">Kata sandi seluruh akun demo adalah: demo</p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-blue-700 px-4 py-2.5 text-base font-medium text-white hover:bg-blue-800 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>Masuk Sekarang</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">Akses Cepat Akun Demo</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Pilih peran di bawah ini untuk mencoba alur ASN, Atasan, atau Admin secara langsung.
          </p>

          <div className="divide-y divide-neutral-200">
            {profiles
              .filter((p) => p.active)
              .map((prof) => (
                <div key={prof.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-neutral-900 truncate">{prof.full_name}</p>
                    <p className="text-sm text-neutral-600 truncate">
                      {roleLabel(prof.role)} / {prof.job_title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLogin(prof)}
                    className="min-h-[44px] shrink-0 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 inline-flex items-center gap-1.5"
                  >
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Masuk</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
