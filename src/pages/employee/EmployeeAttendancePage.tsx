import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, ShieldCheck, Clock, CheckCircle2, MapPin } from 'lucide-react';
import type { DailyAttendanceSummary, EmployeeDailyActivity } from '../../types/index.ts';
import { attendanceService } from '../../services/attendanceService.ts';
import { MorningCheckInCard } from '../../components/attendance/MorningCheckInCard.tsx';
import { EveningCheckoutCard } from '../../components/attendance/EveningCheckoutCard.tsx';
import { TaskSnapshotComparison } from '../../components/attendance/TaskSnapshotComparison.tsx';
import { TaskChangeTimeline } from '../../components/attendance/TaskChangeTimeline.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../components/common/Toast.tsx';

export const EmployeeAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailyAttendanceSummary | null>(null);
  const [activity, setActivity] = useState<EmployeeDailyActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const summaryData = await attendanceService.getTodayAttendance();
      setSummary(summaryData);

      if (user?.id) {
        try {
          const actData = await attendanceService.getEmployeeDailyActivity(user.id);
          setActivity(actData);
        } catch {
          // If no activity yet today
        }
      }
    } catch {
      showToast('Failed to load today\'s attendance status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [user]);

  const isCheckedIn = summary?.status === 'CHECKED_IN' || summary?.status === 'REOPENED';
  const isCheckedOut = summary?.status === 'CHECKED_OUT';

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Orphic Attendance Engine
              </span>
              <span className="text-2xs text-slate-400 font-mono">v2.4 Smart Sync</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Office Attendance & Work Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Streamline daily check-in, automatically freeze morning task snapshots, log real-time progress updates, and confirm evening departure.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-xs font-bold text-white shadow-inner">
              <Calendar className="w-4 h-4 text-amber-400" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button
              onClick={loadAttendanceData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 rounded-2xl text-white transition-all hover:scale-105 active:scale-95"
              title="Refresh Attendance Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Workday Metrics Strip */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
              isCheckedOut ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
              isCheckedIn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isCheckedOut ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-2xs text-slate-400 font-medium block">Shift Status</span>
              <span className="text-xs font-bold text-white">
                {isCheckedOut ? 'Checked Out' : isCheckedIn ? 'Active On-Duty' : 'Not Checked In'}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xs text-slate-400 font-medium block">Office Duration</span>
              <span className="text-xs font-bold text-white font-mono">
                {summary?.officeDuration || (isCheckedIn ? 'In Session...' : '0h 00m')}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xs text-slate-400 font-medium block">Morning Tasks</span>
              <span className="text-xs font-bold text-white">
                {summary?.morningTaskCount ?? 0} Captured
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xs text-slate-400 font-medium block">GPS Geofence</span>
              <span className="text-xs font-bold text-emerald-300">
                Verified Zone
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Check-In / Check-Out Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningCheckInCard summary={summary} onAttendanceUpdated={loadAttendanceData} />
        <EveningCheckoutCard summary={summary} onAttendanceUpdated={loadAttendanceData} />
      </div>

      {/* Task Snapshot Comparison */}
      <TaskSnapshotComparison
        morningTasks={activity?.morningTasks || []}
        eveningTasks={activity?.eveningTasks || []}
        taskChanges={activity?.taskChanges || { addedTasks: [], updatedTasks: [], completedTasks: [] }}
      />

      {/* Real-time Activity Timeline */}
      <TaskChangeTimeline timeline={activity?.timeline || []} />
    </div>
  );
};
