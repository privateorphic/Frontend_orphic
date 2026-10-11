import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit, FileSpreadsheet, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';
import { taskService } from '../../services/taskService.ts';
import { employeeService } from '../../services/employeeService.ts';
import type { Task, TaskRequest, TaskStatus, TaskPriority, Employee } from '../../types/index.ts';
import Badge from '../../components/common/Badge.tsx';
import ProgressBar from '../../components/common/ProgressBar.tsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import ErrorState from '../../components/common/ErrorState.tsx';
import EmptyState from '../../components/common/EmptyState.tsx';
import Modal from '../../components/common/Modal.tsx';
import { toast } from '../../components/common/Toast.tsx';
import { TaskExportModal } from '../../components/tasks/TaskExportModal.tsx';

function TaskForm({ employees, initial, onSubmit, loading }: {
  employees: Employee[];
  initial?: Partial<TaskRequest>;
  onSubmit: (data: TaskRequest) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<TaskRequest>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    assignedToId: initial?.assignedToId,
    departmentId: initial?.departmentId,
    priority: initial?.priority ?? 'MEDIUM',
    status: initial?.status ?? 'TODO',
    progressPercentage: initial?.progressPercentage ?? 0,
    startDate: initial?.startDate ?? '',
    deadline: initial?.deadline ?? '',
  });

  const set = (k: keyof TaskRequest, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleEmployeeChange = (eIdStr: string) => {
    if (!eIdStr) {
      setForm((p) => ({ ...p, assignedToId: undefined }));
      return;
    }
    const eId = Number(eIdStr);
    const emp = employees.find((e) => e.id === eId);
    setForm((p) => ({
      ...p,
      assignedToId: eId,
      departmentId: emp?.departmentId ?? p.departmentId,
    }));
  };

  const handleStatusChange = (status: TaskStatus) => {
    let progress = form.progressPercentage ?? 0;
    if (status === 'COMPLETED' && progress < 100) {
      progress = 100;
    } else if (status === 'TODO' && progress === 100) {
      progress = 0;
    }
    setForm((p) => ({ ...p, status, progressPercentage: progress }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="form-label">Task Title *</label>
        <input
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className="form-input"
          placeholder="e.g. Design responsive hero section"
        />
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          className="form-input"
          rows={3}
          placeholder="Detailed expectations, deliverables, or reference links..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Assign To</label>
          <select
            value={form.assignedToId ?? ''}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            className="form-select"
          >
            <option value="">Unassigned</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as TaskPriority)}
            className="form-select"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="form-label">Status</label>
          <select
            value={form.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className="form-select"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="form-label flex justify-between">
            <span>Progress</span>
            <span className="font-semibold text-orange-600">{form.progressPercentage}%</span>
          </label>
          <div className="flex items-center gap-2 pt-1.5">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.progressPercentage ?? 0}
              onChange={(e) => set('progressPercentage', Number(e.target.value))}
              className="w-full accent-[#EF7D35]"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Start Date</label>
          <input
            type="date"
            value={form.startDate ?? ''}
            onChange={(e) => set('startDate', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Deadline</label>
          <input
            type="date"
            value={form.deadline ?? ''}
            onChange={(e) => set('deadline', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial?.title ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, e] = await Promise.all([
        taskService.getAllTasks(),
        employeeService.getAllEmployees(),
      ]);
      setTasks(t);
      setEmployees(e.filter((emp) => emp.status === 'ACTIVE'));
    } catch {
      setError('Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter((t) => t.overdue || (t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < new Date())).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, overdue, rate };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(search.toLowerCase())) ||
        (t.assignedToEmployeeId && t.assignedToEmployeeId.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const handleCreate = async (data: TaskRequest) => {
    setFormLoading(true);
    try {
      await taskService.createTask(data);
      toast('success', 'Task created successfully');
      setCreateOpen(false);
      fetchData();
    } catch {
      toast('error', 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: TaskRequest) => {
    if (!editTask) return;
    setFormLoading(true);
    try {
      await taskService.updateTask(editTask.id, data);
      toast('success', 'Task updated successfully');
      setEditTask(null);
      fetchData();
    } catch {
      toast('error', 'Failed to update task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete task "${task.title}"? This task will be permanently removed for everyone.`)) return;
    try {
      await taskService.deleteTask(task.id);
      toast('success', 'Task deleted successfully');
      fetchData();
    } catch {
      toast('error', 'Failed to delete task');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Tasks Management</h1>
          <p className="page-subtitle">Track, assign, and review company deliverables</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`stat-card text-left transition-all ${statusFilter === '' ? 'ring-2 ring-orange-500 bg-orange-50/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tasks</span>
            <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Layers size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <p className="text-xs text-slate-400">All registered tasks</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')}
          className={`stat-card text-left transition-all ${statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Clock size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.inProgress}</p>
          <p className="text-xs text-amber-600 font-medium">Currently active</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? '' : 'COMPLETED')}
          className={`stat-card text-left transition-all ${statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.completed}</p>
          <p className="text-xs text-emerald-600 font-medium">{stats.rate}% completion rate</p>
        </button>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Due / Overdue</span>
            <span className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.overdue}</p>
          <p className="text-xs text-red-500 font-medium">Requires attention</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-3.5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, employee name, or code..."
            className="form-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="form-select sm:w-44"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          className="form-select sm:w-40"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message="No tasks found matching your filter criteria" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3DCCB] bg-orange-50/30">
                  <th className="table-header">Task</th>
                  <th className="table-header">Assigned To</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Progress</th>
                  <th className="table-header">Deadline</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100/60">
                {filtered.map((task) => (
                  <tr key={task.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      {task.assignedToName ? (
                        <div>
                          <p className="text-sm font-medium text-slate-800">{task.assignedToName}</p>
                          <span className="text-[11px] font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            {task.assignedToEmployeeId || `ID #${task.assignedToId}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <Badge value={task.priority} />
                    </td>
                    <td className="table-cell">
                      <Badge value={task.status} />
                    </td>
                    <td className="table-cell w-40">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={task.progressPercentage} className="flex-1" />
                        <span className="text-xs font-semibold text-slate-600 shrink-0">
                          {task.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {task.deadline ? (
                        <span
                          className={`text-xs ${
                            task.overdue || (task.status !== 'COMPLETED' && new Date(task.deadline) < new Date())
                              ? 'text-red-600 font-semibold flex items-center gap-1'
                              : 'text-slate-600'
                          }`}
                        >
                          {task.deadline}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditTask(task)}
                          title="Edit Task"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-orange-100 hover:text-orange-600 transition"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          title="Delete Task"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Task" size="lg">
        <TaskForm employees={employees} onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && (
          <TaskForm
            employees={employees}
            initial={{
              title: editTask.title,
              description: editTask.description,
              assignedToId: editTask.assignedToId,
              departmentId: editTask.departmentId,
              priority: editTask.priority,
              status: editTask.status,
              progressPercentage: editTask.progressPercentage,
              startDate: editTask.startDate,
              deadline: editTask.deadline,
            }}
            onSubmit={handleUpdate}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Excel Export Modal */}
      <TaskExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
