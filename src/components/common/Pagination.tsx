import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return start + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-md text-sm font-medium transition ${
            p === page
              ? 'bg-primary-600 text-white'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {p + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
