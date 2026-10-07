import { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { loginActivityService } from '../../services/loginActivityService.ts';
import type { LoginActivity } from '../../types/index.ts';
import Badge from '../../components/common/Badge.tsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import ErrorState from '../../components/common/ErrorState.tsx';
import EmptyState from '../../components/common/EmptyState.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatTime } from '../../utils/formatters.ts';

export default function EmployeeLoginHistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    setLoading(true); setError('');
    try {
      const data = await loginActivityService.getMyHistory();
      setSessions(data || []);
    } catch { setError('Unable to load login history.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [user]);

  const todaySession = sessions.find(
    (s) => s.loginDate === new Date().toISOString().slice(0, 10)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-[#F3DCCB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1410] flex items-center gap-2">
            <Activity size={24} className="text-[#EF7D35]" />
            My Session History
          </h1>
          <p className="text-xs text-[#78655A] mt-0.5">Track your daily login, logout, and session duration records</p>
        </div>
        <button onClick={fetchSessions} className="btn-secondary text-xs flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Today's Active / Latest Session Summary */}
      {todaySession && (
        <div className="card p-5 border-[#FBCBA8] bg-[#FFF4EC]/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-[#FBCBA8]/60 pb-2.5">
            <h3 className="text-sm font-bold text-[#7C2D12] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#EF7D35]" />
              Today's Session Summary ({todaySession.loginDate})
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900">
              {todaySession.status === 'ACTIVE' ? '🟢 Active Right Now' : 'Session Recorded'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[#DC6422] font-bold mb-1 flex items-center gap-1">
                <Clock size={13} /> Login Time
              </p>
              <p className="text-sm font-bold font-mono text-emerald-700">
                {formatTime(todaySession.loginTime)}
              </p>
            </div>

            <div>
              <p className="text-[#DC6422] font-bold mb-1 flex items-center gap-1">
                <Clock size={13} /> Logout Time
              </p>
              <p className={`text-sm font-bold font-mono ${todaySession.logoutTime ? 'text-red-600' : 'text-emerald-600'}`}>
                {todaySession.logoutTime ? formatTime(todaySession.logoutTime) : 'Active'}
              </p>
            </div>

            <div>
              <p className="text-[#DC6422] font-bold mb-1 flex items-center gap-1">
                <Clock size={13} /> Session Duration
              </p>
              <p className="text-sm font-bold font-mono text-slate-800">
                {todaySession.sessionDuration ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-[#DC6422] font-bold mb-1">Status</p>
              <Badge value={todaySession.status} />
            </div>
          </div>
        </div>
      )}

      {error ? <ErrorState message={error} onRetry={fetchSessions} /> : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F3DCCB] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F1410]">Full Session History ({sessions.length})</h3>
            <span className="text-xs text-slate-500">Recent session activities</span>
          </div>
          {sessions.length === 0 ? (
            <EmptyState message="No session history found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#F3DCCB] bg-[#FFF4EC]/50 text-xs text-slate-700 uppercase tracking-wider font-semibold">
                    <th className="table-header">Date</th>
                    <th className="table-header">Login Time</th>
                    <th className="table-header">Logout Time</th>
                    <th className="table-header">Duration</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3DCCB]">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FFF4EC]/60 transition-colors text-xs">
                      <td className="table-cell font-mono font-bold text-slate-900">{s.loginDate}</td>
                      <td className="table-cell font-mono font-semibold text-emerald-700">{formatTime(s.loginTime)}</td>
                      <td className="table-cell font-mono font-semibold text-red-600">{s.logoutTime ? formatTime(s.logoutTime) : '—'}</td>
                      <td className="table-cell font-mono text-slate-700">{s.sessionDuration ?? '—'}</td>
                      <td className="table-cell"><Badge value={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
