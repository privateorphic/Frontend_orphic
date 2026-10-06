import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Filter } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { employeeService } from '../../services/employeeService';
import type { Task, TaskRequest, TaskStatus, TaskPriority, Employee } from '../../types';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';

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
    priority: initial?.priority ?? 'MEDIUM',
    status: initial?.status ?? 'TODO',
    progressPercentage: initial?.progressPercentage ?? 0,
    startDate: initial?.startDate ?? '',
    deadline: initial?.deadline ?? '',
  });

  const set = (k: keyof TaskRequest, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="form-label">Title *</label>
        <input required value={form.title} onChange={(e) => set('title', e.target.value)} className="form-input" placeholder="Task title" />
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className="form-input" rows={3} placeholder="Task description..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Assign To</label>
          <select value={form.assignedToId ?? ''} onChange={(e) => set('assignedToId', e.target.value ? Number(e.target.value) : undefined)} className="form-select">
            <option value="">Unassigned</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="form-select">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="form-label">Start Date</label>
          <input type="date" value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="form-label">Deadline</label>
          <input type="date" value={form.deadline ?? ''} onChange={(e) => set('deadline', e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Task'}
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

  useEffect(() => { fetchData(); }, []);

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

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
      toast('success', 'Task updated');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} total tasks</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> Create Task
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="form-input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')} className="form-select sm:w-40">
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')} className="form-select sm:w-36">
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message="No tasks found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-header">Task</th>
                  <th className="table-header">Assigned To</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Progress</th>
                  <th className="table-header">Deadline</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{task.description}</p>}
                      </div>
                    </td>
                    <td className="table-cell">
                      {task.assignedToName ? (
                        <div>
                          <p className="text-sm font-medium">{task.assignedToName}</p>
                          <p className="text-xs text-slate-400 font-mono">{task.assignedToEmployeeId}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="table-cell"><Badge value={task.priority} /></td>
                    <td className="table-cell"><Badge value={task.status} /></td>
                    <td className="table-cell w-36">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={task.progressPercentage} className="flex-1" />
                        <span className="text-xs text-slate-500 shrink-0">{task.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {task.deadline ? (
                        <span className={task.overdue ? 'text-red-600 font-medium' : ''}>{task.deadline}</span>
                      ) : '—'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditTask(task)} className="p-1.5 rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(task)} className="p-1.5 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition">
                          <Trash2 size={14} />
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

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Task" size="lg">
        <TaskForm employees={employees} onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && (
          <TaskForm
            employees={employees}
            initial={{ title: editTask.title, description: editTask.description, assignedToId: editTask.assignedToId, priority: editTask.priority, status: editTask.status, progressPercentage: editTask.progressPercentage, startDate: editTask.startDate, deadline: editTask.deadline }}
            onSubmit={handleUpdate}
            loading={formLoading}
          />
        )}
      </Modal>
    </div>
  );
}
