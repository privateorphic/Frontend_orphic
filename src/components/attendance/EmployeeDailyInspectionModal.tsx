import React, { useEffect, useState } from 'react';
import { X, Calendar, User, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { EmployeeDailyActivity } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { TaskSnapshotComparison } from './TaskSnapshotComparison';
import { TaskChangeTimeline } from './TaskChangeTimeline';
import { useToast } from '../common/Toast';

interface Props {
  isOpen: boolean;
  employeeId: number | string | null;
  date: string;
  onClose: () => void;
}

export const EmployeeDailyInspectionModal: React.FC<Props> = ({
  isOpen,
  employeeId,
  date,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<EmployeeDailyActivity | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && employeeId) {
      setLoading(true);
      attendanceService
        .getEmployeeDailyActivity(employeeId, date)
        .then((data) => setActivity(data))
        .catch((err) => {
          showToast(err.message || 'Failed to load daily activity details', 'error');
          setActivity(null);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, employeeId, date]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white font-bold text-lg flex items-center justify-center border border-white/20">
              {activity?.employeeName ? activity.employeeName.charAt(0) : <User className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold">{activity?.employeeName || 'Employee Daily Activity'}</h3>
              <p className="text-xs text-indigo-200 flex items-center gap-3 mt-1">
                <span>Code: #{activity?.employeeCode || employeeId}</span>
                <span>•</span>
                <span>Department: {activity?.departmentName || 'General'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {date}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Fetching employee task snapshots & timeline...</p>
            </div>
          ) : !activity ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm">No daily attendance record found for this employee on {date}.</p>
            </div>
          ) : (
            <>
              {/* Daily Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-xs text-slate-500 block">Morning Check-In</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {activity.summary?.morningCheckIn || activity.attendance?.morningCheckIn || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Evening Check-Out</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {activity.summary?.eveningCheckOut || activity.attendance?.eveningCheckOut || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Office Duration</span>
                  <span className="font-bold text-indigo-600 font-mono text-sm">
                    {activity.summary?.officeDuration || activity.attendance?.officeDuration || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Attendance Status</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {activity.summary?.status || activity.attendance?.status || 'CHECKED_IN'}
                  </span>
                </div>
              </div>

              {/* Task Snapshot Comparison */}
              <TaskSnapshotComparison
                morningTasks={activity.morningTasks || []}
                eveningTasks={activity.eveningTasks || []}
                taskChanges={activity.taskChanges || { addedTasks: [], updatedTasks: [], completedTasks: [] }}
              />

              {/* Real-time Activity Timeline */}
              <TaskChangeTimeline timeline={activity.timeline || []} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
