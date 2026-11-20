// Komponen penanda status workflow menggunakan pasangan warna lembut dan ikon eksplisit.

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Send,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Selesai':
    case 'Disetujui':
    case 'Aktif':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 whitespace-nowrap">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Sedang dikerjakan':
    case 'Dalam Review':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 whitespace-nowrap">
          {status === 'Dalam Review' ? (
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{status}</span>
        </span>
      );
    case 'Diajukan':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 whitespace-nowrap">
          <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Perlu Revisi':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 whitespace-nowrap">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Diarsipkan':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 whitespace-nowrap">
          <Archive className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 whitespace-nowrap">
          <FileEdit className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
  }
}
