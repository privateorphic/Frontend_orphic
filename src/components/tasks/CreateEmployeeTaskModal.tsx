import React, { useState } from 'react';
import { X, PlusCircle, Calendar, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { taskService } from '../../services/taskService';
import type { Task, TaskPriority } from '../../types';
import { toast } from '../common/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (newTask: Task) => void;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
}

export const CreateEmployeeTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTaskCreated,
  isCheckedIn = true,
  isCheckedOut = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => todayStr);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTodayTask = startDate === todayStr;
  const isBlockedByAttendance = isTodayTask && !isCheckedIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (isBlockedByAttendance) {
      setError("Cannot add tasks for today's shift before checking in. Please check in on Office Attendance page first.");
      toast('error', "Check-in required before adding today's tasks!");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newTask = await taskService.createMyTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        status: 'TODO',
        progressPercentage: 0,
      });

      toast('success', 'New task created successfully!');
      onTaskCreated(newTask);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDeadline('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create task.';
      setError(msg);
      toast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/20 text-white border border-white/30 flex items-center justify-center shadow-inner">
              <PlusCircle className="w-6.5 h-6.5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Create New Task</h3>
              <p className="text-xs text-amber-100 font-medium mt-0.5">Add a new task to your personal work schedule</p>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {isBlockedByAttendance && (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="block font-bold">Attendance Check-In Required</strong>
                  <span className="text-2xs text-amber-800">You must check in for today's shift before adding tasks for today.</span>
                </div>
              </div>
              <a
                href="/employee/office-attendance"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-2xs rounded-xl shrink-0 transition-colors shadow-2xs"
              >
                Check In Now
              </a>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement User Profile Settings Module"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description & Work Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the requirements, notes, or expected deliverables..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Work Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold bg-white"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4.5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating Task...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Save & Add Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
