import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, PlusCircle, CheckCircle2, Clock, ListTodo, MessageSquare, ShieldCheck, RefreshCw, BarChart2, AlertCircle, Lock } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { attendanceService } from '../../services/attendanceService';
import type { Task, EmployeeTaskUpdateRequest, TaskStatus, DailyAttendanceSummary } from '../../types';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import { toast } from '../../components/common/Toast';
import { CreateEmployeeTaskModal } from '../../components/tasks/CreateEmployeeTaskModal';

export default function EmployeeTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [allMyTasks, setAllMyTasks] = useState<Task[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<DailyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EmployeeTaskUpdateRequest>({});
  const [workNoteInput, setWorkNoteInput] = useState('');
  const [notesHistory, setNotesHistory] = useState<Array<{ note: string; timestamp: string }>>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTaskAndSummary = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [t, myTasksList, att] = await Promise.all([
        taskService.getMyTaskById(Number(id)),
        taskService.getMyTasks(),
        attendanceService.getTodayAttendance().catch(() => null),
      ]);

      setTask(t);
      setAllMyTasks(myTasksList);
      setAttendanceSummary(att);
      setForm({
        status: t.status,
        progressPercentage: t.progressPercentage,
        workUpdate: t.workUpdate ?? '',
      });
      setWorkNoteInput('');

      // Seed work note history if existing workUpdate exists
      if (t.workUpdate) {
        setNotesHistory([
          { note: t.workUpdate, timestamp: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged Update' },
        ]);
      } else {
        setNotesHistory([]);
      }
    } catch {
      setError('Unable to load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndSummary();
  }, [id]);

  const isCheckedIn = attendanceSummary?.status === 'CHECKED_IN' || attendanceSummary?.status === 'REOPENED';
  const isCheckedOut = attendanceSummary?.status === 'CHECKED_OUT';

  // Task belongs to today if start date or completion date matches today
  const isTodayTask = task ? (task.startDate === todayStr || (!task.startDate && task.createdAt?.startsWith(todayStr))) : true;
  const isLockedForUpdate = isTodayTask && (isCheckedOut || !isCheckedIn);

  const handleSaveUpdate = async () => {
    if (!task) return;
    setSaving(true);

    try {
      const updatedNote = workNoteInput.trim()
        ? (form.workUpdate ? `${form.workUpdate}\n[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: ${workNoteInput.trim()}` : workNoteInput.trim())
        : form.workUpdate;

      const payload: EmployeeTaskUpdateRequest = {
        status: form.status,
        progressPercentage: form.status === 'COMPLETED' ? 100 : form.progressPercentage,
        workUpdate: updatedNote,
      };

      const updated = await taskService.updateMyTask(task.id, payload);
      setTask(updated);

      if (workNoteInput.trim()) {
        setNotesHistory((prev) => [
          ...prev,
          { note: workNoteInput.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
        setWorkNoteInput('');
      }

      // Refresh task list counts
      const updatedList = await taskService.getMyTasks();
      setAllMyTasks(updatedList);

      toast('success', form.status === 'COMPLETED' ? 'Task completed successfully! 🎉' : 'Work update saved!');
    } catch {
      toast('error', 'Failed to save task update.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !task) return <ErrorState message={error} onRetry={fetchTaskAndSummary} />;

  // Calculate Employee Total Task Stats
  const totalCount = allMyTasks.length;
  const completedCount = allMyTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = allMyTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoCount = allMyTasks.filter((t) => t.status === 'TODO').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const priorityColor: Record<string, string> = {
    LOW: 'bg-slate-50 border-slate-200',
    MEDIUM: 'bg-amber-50/60 border-amber-200/80',
    HIGH: 'bg-orange-50/60 border-orange-200/80',
    URGENT: 'bg-rose-50/70 border-rose-200/80',
  };

  return (
    <div className="space-y-7 pb-12 animate-fade-in max-w-6xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/employee/tasks')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs transition-colors self-start"
        >
          <ArrowLeft size={16} className="text-amber-500" /> Back to My Tasks
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <PlusCircle size={16} /> Add New Task
          </button>
        </div>
      </div>

      {/* Main Grid: Left Task Details (2 cols), Right Employee Summary Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Workstation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Title & Meta Card */}
          <div className={`rounded-3xl p-6 sm:p-7 border shadow-md relative overflow-hidden transition-all ${priorityColor[task.priority] ?? 'bg-white border-slate-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-2xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-950/80 text-white font-mono">
                    #TSK-{task.id}
                  </span>
                  <Badge value={task.priority} />
                  <Badge value={task.status} />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{task.title}</h1>
              </div>
            </div>

            {task.description && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-4 p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-slate-200/60 font-medium">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-200/60 text-xs text-slate-600 font-semibold">
              {task.createdByName && <span>👤 Assigned by: <strong className="text-slate-900">{task.createdByName}</strong></span>}
              {task.startDate && <span>📅 Start: {task.startDate}</span>}
              {task.deadline && (
                <span className={task.overdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-700'}>
                  🗓 Deadline: {task.deadline} {task.overdue && '(Overdue)'}
                </span>
              )}
            </div>
          </div>

          {/* Current Progress & Work Updates Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" /> Current Work Progress
              </h3>
              <span className="text-base font-black text-indigo-600 font-mono">
                {task.progressPercentage}% Completed
              </span>
            </div>

            <ProgressBar value={task.progressPercentage} className="h-3 rounded-full" />

            {/* Work Update History Log */}
            {notesHistory.length > 0 && (
              <div className="space-y-3 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> Logged Work Update Notes
                </h4>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {notesHistory.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-2xs font-bold text-amber-900">
                        <span>Work Log Entry #{idx + 1}</span>
                        <span className="font-mono text-amber-700">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Update & Status Control Panel */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  Work Progress & Note Entry
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Update task status, move percentage slider, or append work notes</p>
              </div>
            </div>

            {/* Attendance Check-in/Out Lock Alert */}
            {isLockedForUpdate && (
              <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 border border-amber-400/30 flex items-center justify-center shrink-0 font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs font-black uppercase tracking-wider text-slate-900">
                      {isCheckedOut ? "Shift Completed (Checked Out)" : "Attendance Check-In Required"}
                    </strong>
                    <span className="text-2xs text-slate-700 font-medium">
                      {isCheckedOut
                        ? "You have checked out for today's shift. Updates to today's tasks are locked."
                        : "You must check in for today's shift before logging work progress or updating task status."}
                    </span>
                  </div>
                </div>
                {!isCheckedIn && !isCheckedOut && (
                  <button
                    type="button"
                    onClick={() => navigate('/employee/office-attendance')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shrink-0 shadow-xs"
                  >
                    Check In Now
                  </button>
                )}
              </div>
            )}

            {/* Status Selection Buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                Task Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['TODO', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isLockedForUpdate}
                    onClick={() => {
                      setForm((p) => ({
                        ...p,
                        status: s,
                        progressPercentage: s === 'COMPLETED' ? 100 : p.progressPercentage,
                      }));
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                      form.status === s
                        ? s === 'COMPLETED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : s === 'IN_PROGRESS'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-800 text-white border-slate-800 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    } ${isLockedForUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {s === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
                    {s === 'IN_PROGRESS' && <Clock className="w-4 h-4" />}
                    {s === 'TODO' && <ListTodo className="w-4 h-4" />}
                    <span>{s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Percentage Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Completion Percentage
                </label>
                <span className="text-sm font-extrabold font-mono text-indigo-600">
                  {form.progressPercentage ?? task.progressPercentage}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progressPercentage ?? task.progressPercentage}
                onChange={(e) => setForm((p) => ({ ...p, progressPercentage: Number(e.target.value) }))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={form.status === 'COMPLETED' || isLockedForUpdate}
              />
              <div className="flex justify-between text-2xs font-bold text-slate-400 font-mono mt-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            {/* Work Update Note Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Append Work Update Note
              </label>
              <textarea
                value={workNoteInput}
                disabled={isLockedForUpdate}
                onChange={(e) => setWorkNoteInput(e.target.value)}
                placeholder={isLockedForUpdate ? "Task updates are locked until you check in for today's shift." : "Describe your progress today, obstacles faced, or deliverables finished..."}
                rows={3}
                className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs font-medium resize-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveUpdate}
              disabled={saving || isLockedForUpdate}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-900 hover:from-indigo-700 hover:to-black text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Saving Work Update...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Progress & Update Work Note</span>
                </>
              )}
            </button>

            {/* Task Completed Celebration Notification */}
            {task.status === 'COMPLETED' && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 rounded-2xl border border-emerald-200 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Task Completed Successfully!</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  {task.completedAt ? `Completed on ${new Date(task.completedAt).toLocaleDateString()}` : 'Great job completing this task!'}
                </p>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle size={14} /> Add Another Task
                  </button>
                  <button
                    onClick={() => navigate('/employee/tasks')}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors"
                  >
                    View All Tasks
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Employee Total Task Summary Counter */}
        <div className="space-y-6">
          {/* Employee Total Tasks Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xs font-bold text-amber-400 uppercase tracking-wider block">Employee Work Overview</span>
                <h3 className="text-lg font-black tracking-tight text-white mt-0.5">Total Tasks Metrics</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-xs">
                <ListTodo className="w-5 h-5" />
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
                <span className="text-2xs text-slate-300 font-medium block">Total Tasks</span>
                <span className="text-2xl font-black text-white font-mono">{totalCount}</span>
              </div>

              <div className="bg-emerald-500/20 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-400/30 text-center">
                <span className="text-2xs text-emerald-300 font-medium block">Completed</span>
                <span className="text-2xl font-black text-emerald-300 font-mono">{completedCount}</span>
              </div>

              <div className="bg-indigo-500/20 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-400/30 text-center">
                <span className="text-2xs text-indigo-300 font-medium block">In Progress</span>
                <span className="text-2xl font-black text-indigo-300 font-mono">{inProgressCount}</span>
              </div>

              <div className="bg-slate-500/20 backdrop-blur-md p-3.5 rounded-2xl border border-slate-400/30 text-center">
                <span className="text-2xs text-slate-300 font-medium block">To Do</span>
                <span className="text-2xl font-black text-slate-200 font-mono">{todoCount}</span>
              </div>
            </div>

            {/* Overall Completion Rate Gauge */}
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Overall Completion Rate</span>
                <span className="text-amber-400 font-mono">{completionRate}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Add Task Quick Trigger Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add More Task (Self-Assigned)</span>
            </button>
          </div>

          {/* Other Employee Tasks Navigation List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-indigo-600" /> Other Assigned Tasks ({allMyTasks.length})
            </h4>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {allMyTasks
                .filter((t) => t.id !== task.id)
                .map((otherTask) => (
                  <div
                    key={otherTask.id}
                    onClick={() => navigate(`/employee/tasks/${otherTask.id}`)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {otherTask.title}
                      </h5>
                      <span className="text-2xs text-slate-500 font-mono">#{otherTask.id} • {otherTask.progressPercentage}% done</span>
                    </div>
                    <Badge value={otherTask.status} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateEmployeeTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isCheckedIn={isCheckedIn}
        isCheckedOut={isCheckedOut}
        onTaskCreated={(newTask) => {
          setAllMyTasks((prev) => [newTask, ...prev]);
        }}
      />
    </div>
  );
}

