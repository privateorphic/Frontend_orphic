import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, ListTodo, CheckCircle2, Clock, Calendar, Filter, ChevronRight, Layers, AlertCircle, ShieldCheck } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { attendanceService } from '../../services/attendanceService';
import type { Task, TaskStatus, DailyAttendanceSummary } from '../../types';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { CreateEmployeeTaskModal } from '../../components/tasks/CreateEmployeeTaskModal';

type DayFilterType = 'TODAY' | 'NEXT_DAY' | 'PAST_DAYS' | 'ALL';

export default function EmployeeTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<DailyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dayFilter, setDayFilter] = useState<DayFilterType>('TODAY');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTasksAndAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, att] = await Promise.all([
        taskService.getMyTasks(),
        attendanceService.getTodayAttendance().catch(() => null),
      ]);
      setTasks(data);
      setAttendanceSummary(att);
    } catch (err: any) {
      setError(err?.message || 'Unable to load your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndAttendance();
  }, []);

  const isCheckedIn = attendanceSummary?.status === 'CHECKED_IN' || attendanceSummary?.status === 'REOPENED';
  const isCheckedOut = attendanceSummary?.status === 'CHECKED_OUT';

  // Helpers to classify task dates
  const getTaskDate = (t: Task): string => {
    if (t.startDate) return t.startDate;
    if (t.createdAt) return t.createdAt.split('T')[0];
    return todayStr;
  };

  const isToday = (t: Task) => {
    const taskDate = getTaskDate(t);
    const completedDate = t.completedAt ? t.completedAt.split('T')[0] : null;
    return taskDate === todayStr || completedDate === todayStr;
  };

  const isNextDay = (t: Task) => {
    const taskDate = getTaskDate(t);
    return taskDate > todayStr;
  };

  const isPast = (t: Task) => {
    const taskDate = getTaskDate(t);
    const completedDate = t.completedAt ? t.completedAt.split('T')[0] : null;
    return (taskDate < todayStr && (!completedDate || completedDate < todayStr));
  };

  // Filter Tasks by Day Mode
  const dayFilteredTasks = tasks.filter((t) => {
    if (selectedDate) {
      const taskDate = getTaskDate(t);
      const completedDate = t.completedAt ? t.completedAt.split('T')[0] : null;
      return taskDate === selectedDate || completedDate === selectedDate;
    }
    if (dayFilter === 'TODAY') return isToday(t);
    if (dayFilter === 'NEXT_DAY') return isNextDay(t);
    if (dayFilter === 'PAST_DAYS') return isPast(t);
    return true; // ALL
  });

  // Apply Status & Search Filters
  const filteredTasks = dayFilteredTasks.filter((t) => {
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate day-by-day stats
  const todayTasks = tasks.filter(isToday);
  const nextDayTasks = tasks.filter(isNextDay);
  const pastTasks = tasks.filter(isPast);

  const todayCounts = {
    total: todayTasks.length,
    completed: todayTasks.filter((t) => t.status === 'COMPLETED').length,
    inProgress: todayTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    todo: todayTasks.filter((t) => t.status === 'TODO').length,
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchTasksAndAttendance} />;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner: Day-by-Day Workstation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-amber-400" /> Today's Shift Date: {todayStr}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Daily Task Tracker & Shift Records</h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Manage your check-in to check-out daily task lifecycle. Tasks are organized day-by-day to maintain high productivity visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Task for Today/Next Day</span>
          </button>
        </div>
      </div>

      {/* Real-time Shift Attendance Alert Banner */}
      {!isCheckedIn && !isCheckedOut && (
        <div className="p-4.5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Today's Shift Completed (Checked Out)</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                You checked out at {attendanceSummary?.eveningCheckOut || 'End of Shift'}. Updating today's tasks is locked for this shift.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-indigo-100 text-indigo-800 font-extrabold text-2xs rounded-xl border border-indigo-200">
            Shift Ended
          </span>
        </div>
      )}

      {isCheckedIn && (
        <div className="p-4.5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Active Shift (Checked-In)</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Checked in at {attendanceSummary?.morningCheckIn || 'Today'}. You are active to add, update, and complete shift tasks.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-extrabold text-2xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Active Duty
          </span>
        </div>
      )}


      {/* Day Navigation Tabs & Date Picker */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Day Filter Segmented Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'TODAY', label: `Today's Shift (${todayTasks.length})`, color: 'bg-amber-500 text-white border-amber-500' },
              { key: 'NEXT_DAY', label: `Next Day / Planned (${nextDayTasks.length})`, color: 'bg-indigo-600 text-white border-indigo-600' },
              { key: 'PAST_DAYS', label: `Past Shifts (${pastTasks.length})`, color: 'bg-slate-700 text-white border-slate-700' },
              { key: 'ALL', label: `All Tasks Archive (${tasks.length})`, color: 'bg-slate-900 text-white border-slate-900' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setDayFilter(tab.key as DayFilterType);
                  setSelectedDate('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                  dayFilter === tab.key && !selectedDate
                    ? `${tab.color} shadow-xs`
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Specific Date Picker Filter */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-amber-500" /> Filter by Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-2xs text-rose-600 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Secondary Status Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              ['', 'All Status'],
              ['TODO', 'To Do'],
              ['IN_PROGRESS', 'In Progress'],
              ['COMPLETED', 'Completed'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val as TaskStatus | '')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-bold border transition-colors ${
                  statusFilter === val
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task title..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          message={
            selectedDate
              ? `No tasks found for date ${selectedDate}`
              : dayFilter === 'TODAY'
              ? "No tasks assigned or created for today's shift"
              : dayFilter === 'NEXT_DAY'
              ? 'No tasks queued for the next day'
              : 'No tasks match your criteria'
          }
          description="Use '+ Add Task for Today/Next Day' button above to create a new task."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const taskDate = getTaskDate(task);
            return (
              <div
                key={task.id}
                onClick={() => navigate(`/employee/tasks/${task.id}`)}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-amber-400 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-2xs font-extrabold font-mono text-slate-400">#TSK-{task.id}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge value={task.priority} />
                      <Badge value={task.status} />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-amber-600 transition-colors mb-2">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 font-medium">{task.description}</p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={task.progressPercentage} className="flex-1 h-2 rounded-full" />
                    <span className="text-2xs font-bold text-slate-600 font-mono">{task.progressPercentage}%</span>
                  </div>

                  <div className="flex items-center justify-between text-2xs pt-1 text-slate-500">
                    <span className="font-mono font-bold flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      📅 Date: {taskDate}
                    </span>
                    {task.deadline && (
                      <span className={`font-mono font-bold ${task.overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                        🗓 Due: {task.deadline}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateEmployeeTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isCheckedIn={isCheckedIn}
        isCheckedOut={isCheckedOut}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />
    </div>
  );
}


