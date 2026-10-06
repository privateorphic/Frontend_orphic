import { useEffect, useState } from 'react';
import { Search, Paperclip, ExternalLink, FileText } from 'lucide-react';
import { dailyWorkService } from '../../services/dailyWorkService';
import type { DailyWork } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export default function EmployeeWorkHistoryPage() {
  const [work, setWork] = useState<DailyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');

  const fetchWork = async () => {
    setLoading(true); setError('');
    try { setWork(await dailyWorkService.getWorkHistory(startDate, endDate)); }
    catch { setError('Unable to load work history.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWork(); }, [startDate, endDate]);

  const filtered = work.filter((w) =>
    !search ||
    w.description.toLowerCase().includes(search.toLowerCase()) ||
    (w.reportFileName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Client Work Reports History</h1>
        <p className="page-subtitle">{filtered.length} client report records found</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search report description or file..." className="form-input pl-9" />
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input sm:w-40" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input sm:w-40" />
      </div>

      {error ? <ErrorState message={error} onRetry={fetchWork} /> : (
        filtered.length === 0 ? (
          <EmptyState message="No client reports found" description="Submit your client work reports to see history here" />
        ) : (
          <div className="space-y-3">
            {filtered.map((w) => (
              <div key={w.id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{w.workDate}</span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <FileText size={12} /> Client Report
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line">{w.description}</p>
                    
                    {w.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <strong className="text-slate-600">Notes:</strong> {w.notes}
                      </p>
                    )}

                    {/* Report File & Drive Link Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {w.reportFileName && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                          <Paperclip size={13} className="text-emerald-600" />
                          <span>{w.reportFileName}</span>
                        </span>
                      )}

                      {w.driveLink && (
                        <a
                          href={w.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium transition"
                        >
                          <ExternalLink size={13} />
                          <span>Google Drive Link</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
