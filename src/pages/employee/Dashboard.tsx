import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock, TrendingUp, AlertTriangle,
  Plus, FileText, Calendar, LogIn, X, Loader2, Send,
  Upload, Link2, FileCheck, Paperclip, ChevronRight, AlertCircle, ShieldCheck, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardService } from '../../services/reportService';
import { dailyWorkService } from '../../services/dailyWorkService';
import { attendanceService } from '../../services/attendanceService';
import type { DailyWorkRequest, DailyAttendanceSummary } from '../../types';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import { toast } from '../../components/common/Toast';
import { CreateEmployeeTaskModal } from '../../components/tasks/CreateEmployeeTaskModal';
import { WfhWorkdayCard } from '../../components/wfh/WfhWorkdayCard';
import { WfhRequestModal } from '../../components/wfh/WfhRequestModal';
import { EndWorkDayModal } from '../../components/wfh/EndWorkDayModal';
import { wfhService } from '../../services/wfhService';
import type { AttendanceRecord } from '../../types';
import { formatTime } from '../../utils/formatters.ts';

interface StatCardProps { label: string; value: number | string; icon: React.ReactNode; color: string; }
function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<DailyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // WFH Modal States
  const [wfhModalOpen, setWfhModalOpen] = useState(false);
  const [endWorkDayModalOpen, setEndWorkDayModalOpen] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);

  // Submit Client Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState<DailyWorkRequest>({
    workDate: new Date().toISOString().slice(0, 10),
    description: '',
    notes: '',
    reportFileName: '',
    driveLink: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true); setError('');
    try {
      const [res, summary, wfhStatus] = await Promise.all([
        dashboardService.getEmployeeDashboard(),
        attendanceService.getTodayAttendance().catch(() => null),
        wfhService.checkWfhApprovalForToday().catch(() => ({ isApproved: false })),
      ]);
      setData(res);
      setAttendanceSummary(summary);
      if (summary) {
        setAttendanceRecord({
          ...summary,
          workMode: (summary as any).workMode || (wfhStatus?.isApproved ? 'WFH' : 'OFFICE'),
          isWfhApprovedToday: wfhStatus?.isApproved || (summary as any).isWfhApprovedToday || false,
        } as any);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setReportError('Please upload a PDF or DOCX file format.');
        setSelectedFile(null);
        return;
      }
      setReportError('');
      setSelectedFile(file);
      setReportForm((p) => ({ ...p, reportFileName: file.name }));
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description.trim()) {
      setReportError('Client report description is required.');
      return;
    }

    setReportSubmitting(true);
    setReportError('');
    try {
      await dailyWorkService.submitWork({
        ...reportForm,
        reportFileName: selectedFile ? selectedFile.name : reportForm.reportFileName,
      });
      toast('success', 'Client report submitted successfully!');
      setIsReportModalOpen(false);
      setSelectedFile(null);
      setReportForm({
        workDate: new Date().toISOString().slice(0, 10),
        description: '',
        notes: '',
        reportFileName: '',
        driveLink: '',
      });

      const updatedData = await dashboardService.getEmployeeDashboard();
      setData(updatedData);
    } catch (err: any) {
      setReportError(err?.response?.data?.message || err?.message || 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState message={error} onRetry={fetchDashboard} />;

  const employeeName = data.employee?.name || data.profile?.name || 'Employee';
  const loginTime = data.todayLoginTime || data.loginTimeToday || null;
  const hoursWorked = data.todayHoursWorked ?? data.hoursWorkedToday ?? 0;
  const recentSessions = data.recentSessions ?? [];

  const isCheckedIn = attendanceSummary?.status === 'CHECKED_IN' || attendanceSummary?.status === 'CHECKED_OUT';
  const isCheckedOut = attendanceSummary?.status === 'CHECKED_OUT';

  const sessionData = recentSessions.slice(0, 7).map((s: any) => ({
    date: s.loginDate?.slice(5) ?? '',
    Hours: s.sessionDuration
      ? Number(s.sessionDuration.split(':')[0]) + Number(s.sessionDuration.split(':')[1]) / 60
      : 0,
  })).reverse();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="card p-5 bg-gradient-to-r from-[#EF7D35] to-[#7C2D12] text-white border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <p className="text-orange-200 text-sm">{today}</p>
          <h1 className="text-xl font-bold mt-1">Welcome back, {employeeName.split(' ')[0]}! 👋</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <LogIn size={14} className="text-orange-200" />
              <span className="text-orange-100">Today's Login: </span>
              <span className="font-semibold">
                {loginTime ? formatTime(loginTime) : 'Not logged'}
              </span>
            </div>
            {data.currentSessionDuration && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-orange-200" />
                <span className="text-orange-100">Session: </span>
                <span className="font-semibold">{data.currentSessionDuration}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-200" />
              <span className="text-orange-100">Today: </span>
              <span className="font-semibold">{hoursWorked}h worked</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setWfhModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            <Calendar size={18} />
            <span>Request WFH</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            <FileText size={18} />
            <span>Submit Client Work Report</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-[#DC6422] hover:bg-[#FFF4EC] font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            <Plus size={18} />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* WFH Workday Card Widget */}
      <WfhWorkdayCard
        attendance={attendanceRecord}
        isWfhApprovedToday={attendanceRecord?.isWfhApprovedToday || false}
        onRefresh={fetchDashboard}
        onOpenEndWorkDay={() => setEndWorkDayModalOpen(true)}
      />

      {/* Attendance Gating Banner */}
      {!isCheckedIn && !isCheckedOut && (
        <div className="p-4.5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Attendance Check-In Required for Today's Shift</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                You have not checked in for today's shift. Check in on the Office Attendance page to create and update today's tasks.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/employee/office-attendance')}
            className="px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-2xl transition-all shrink-0 shadow-md flex items-center gap-1.5"
          >
            Check In Now <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isCheckedOut && (
        <div className="p-4.5 bg-indigo-500/10 border border-indigo-500/30 rounded-3xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Today's Shift Completed (Checked Out)</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                You checked out at {formatTime(attendanceSummary?.eveningCheckOut)}. Updating today's tasks is locked for this shift.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-indigo-100 text-indigo-800 font-extrabold text-2xs rounded-xl border border-indigo-200">
            Shift Ended
          </span>
        </div>
      )}

      {isCheckedIn && !isCheckedOut && (
        <div className="p-4.5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Active Shift (Checked-In)</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Checked in at {formatTime(attendanceSummary?.morningCheckIn)}. You are active to add, update, and complete shift tasks.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-extrabold text-2xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Active Duty
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Tasks" value={data.totalTasks ?? 0} icon={<CheckSquare size={18} className="text-[#EF7D35]" />} color="bg-[#FFF4EC]" />
        <StatCard label="Completed" value={data.completedTasks ?? 0} icon={<CheckSquare size={18} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard label="In Progress" value={data.inProgressTasks ?? 0} icon={<TrendingUp size={18} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Overdue" value={data.overdueTasks ?? 0} icon={<AlertTriangle size={18} className="text-red-600" />} color="bg-red-50" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#EF7D35] text-white hover:bg-[#DC6422] transition"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          <FileText size={16} />
          <span>Submit Client Report</span>
        </button>
        <button
          onClick={() => navigate('/employee/tasks')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <CheckSquare size={16} />
          <span>My Tasks</span>
        </button>
        <button
          onClick={() => navigate('/employee/leaves')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <Calendar size={16} />
          <span>Apply Leave</span>
        </button>
        <button
          onClick={() => navigate('/employee/daily-work')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <FileText size={16} />
          <span>Daily Work</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Today's Tasks ({data.todaysTasks?.length ?? 0})</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-[#EF7D35] hover:text-[#DC6422] font-medium flex items-center gap-1"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
          {data.todaysTasks?.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No tasks due today</p>
          ) : (
            <div className="space-y-3">
              {(data.todaysTasks ?? []).slice(0, 5).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition"
                  onClick={() => navigate(`/employee/tasks/${task.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge value={task.priority} />
                      <Badge value={task.status} />
                    </div>
                    <ProgressBar value={task.progressPercentage} className="mt-2" />
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{task.progressPercentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Session Duration (Last 7 Days)</h3>
          {sessionData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-slate-400 text-sm">No session data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Duration']} />
                <Bar dataKey="Hours" fill="#EF7D35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance-Gated Create Task Modal */}
      <CreateEmployeeTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isCheckedIn={isCheckedIn}
        isCheckedOut={isCheckedOut}
        onTaskCreated={async () => {
          const updatedData = await dashboardService.getEmployeeDashboard();
          setData(updatedData);
        }}
      />

      {/* Submit Client Work Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-emerald-600" />
                Submit Client Work Report
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              {reportError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {reportError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Work Date *
                </label>
                <input
                  type="date"
                  required
                  value={reportForm.workDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReportForm((p) => ({ ...p, workDate: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Client Work Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your work, deliverables, and updates for the client today..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                />
              </div>

              {/* PDF / DOCX Report Attachment (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Paperclip size={14} className="text-slate-500" />
                  Attach Report File (PDF / DOCX - Optional)
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition">
                    <span className="text-xs text-slate-600 font-medium truncate flex items-center gap-2">
                      {selectedFile ? (
                        <>
                          <FileCheck size={16} className="text-emerald-600 shrink-0" />
                          <span className="font-semibold text-emerald-700 truncate">{selectedFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="text-slate-400 shrink-0" />
                          <span>Choose PDF or DOCX file...</span>
                        </>
                      )}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium shrink-0 ml-2">Browse</span>
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setReportForm((p) => ({ ...p, reportFileName: '' })); }}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Google Drive Link (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Link2 size={14} className="text-slate-500" />
                  Google Drive / Document Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... or cloud link"
                  value={reportForm.driveLink ?? ''}
                  onChange={(e) => setReportForm((p) => ({ ...p, driveLink: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Additional Notes / Client Feedback
                </label>
                <textarea
                  rows={2}
                  placeholder="Any additional notes, client remarks, or blockers..."
                  value={reportForm.notes ?? ''}
                  onChange={(e) => setReportForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                >
                  {reportSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Client Report</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WFH Request Modal */}
      <WfhRequestModal
        isOpen={wfhModalOpen}
        onClose={() => setWfhModalOpen(false)}
        onSuccess={() => {
          toast('success', 'WFH request submitted for HR/Admin approval');
          fetchDashboard();
        }}
      />

      {/* End Work Day Modal */}
      <EndWorkDayModal
        isOpen={endWorkDayModalOpen}
        onClose={() => setEndWorkDayModalOpen(false)}
        onSuccess={() => {
          toast('success', 'Workday ended successfully today!');
          fetchDashboard();
        }}
      />
    </div>
  );
}
