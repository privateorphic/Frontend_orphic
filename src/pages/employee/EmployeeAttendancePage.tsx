import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Clock, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import type { DailyAttendanceSummary, AttendanceRecord } from '../../types/index.ts';
import { attendanceService } from '../../services/attendanceService.ts';
import { MorningCheckInCard } from '../../components/attendance/MorningCheckInCard.tsx';
import { EveningCheckoutCard } from '../../components/attendance/EveningCheckoutCard.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import { formatTime } from '../../utils/formatters.ts';

export const EmployeeAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailyAttendanceSummary | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { showToast } = useToast();

  // Keep a live clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const summaryData = await attendanceService.getTodayAttendance();
      setSummary(summaryData);

      if (user?.id) {
        try {
          const records = await attendanceService.getEmployeeAttendance(String(user.id));
          setHistory(records.slice(0, 10)); // Show last 10 records
        } catch {
          // Fallback if no history yet
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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Office Attendance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record your daily office check-in and check-out
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#EF7D35]" />
            <span>{todayFormatted}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>{formatTime(currentTime)}</span>
          </div>

          <button
            onClick={loadAttendanceData}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl text-slate-600 transition-colors border border-slate-200"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Status Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
            isCheckedOut
              ? 'bg-indigo-50 text-indigo-600'
              : isCheckedIn
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {isCheckedOut ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Today's Status</span>
            <span className="text-sm font-bold text-slate-900 truncate block">
              {isCheckedOut ? 'Checked Out' : isCheckedIn ? 'Active On-Duty' : 'Not Checked In'}
            </span>
          </div>
        </div>

        {/* Morning Arrival */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Morning Arrival</span>
            <span className="text-sm font-bold text-slate-900 font-mono truncate block">
              {summary?.morningCheckIn ? formatTime(summary.morningCheckIn, false) : 'Pending'}
            </span>
          </div>
        </div>

        {/* Evening Departure */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Evening Departure</span>
            <span className="text-sm font-bold text-slate-900 font-mono truncate block">
              {summary?.eveningCheckOut ? formatTime(summary.eveningCheckOut, false) : 'Pending'}
            </span>
          </div>
        </div>

        {/* Shift Duration */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Office Duration</span>
            <span className="text-sm font-bold text-slate-900 font-mono truncate block">
              {summary?.officeDuration || (isCheckedIn ? 'In Session...' : '0h 00m')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Check-In / Check-Out Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MorningCheckInCard summary={summary} onAttendanceUpdated={loadAttendanceData} />
        <EveningCheckoutCard summary={summary} onAttendanceUpdated={loadAttendanceData} />
      </div>

      {/* Recent Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EF7D35] flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Attendance History</h3>
              <p className="text-xs text-slate-500">Your recent daily check-in and check-out logs</p>
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No past attendance records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Check In</th>
                  <th className="py-3 px-3">Check Out</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((rec) => {
                  const checkIn = rec.morningCheckIn || rec.checkInTime || '—';
                  const checkOut = rec.eveningCheckOut || rec.checkOutTime || '—';
                  const dateStr = rec.date || rec.attendanceDate || '';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-slate-800 font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {checkIn !== '—' ? formatTime(checkIn, false) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {checkOut !== '—' ? formatTime(checkOut, false) : '—'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {rec.officeDuration || (rec.workingHours ? `${rec.workingHours}h` : '—')}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase ${
                          rec.status === 'PRESENT' || rec.status === 'COMPLETED' || rec.status === 'CHECKED_OUT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'CHECKED_IN' || rec.status === 'WORKING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
