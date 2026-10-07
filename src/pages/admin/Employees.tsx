import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Eye, Edit, MoreVertical, UserPlus } from 'lucide-react';
import { employeeService } from '../../services/employeeService.ts';
import type { Employee, UserStatus } from '../../types/index.ts';
import Badge from '../../components/common/Badge.tsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import ErrorState from '../../components/common/ErrorState.tsx';
import EmptyState from '../../components/common/EmptyState.tsx';
import Pagination from '../../components/common/Pagination.tsx';
import Modal from '../../components/common/Modal.tsx';
import UserAvatar from '../../components/common/UserAvatar.tsx';
import { toast } from '../../components/common/Toast.tsx';

const PAGE_SIZE = 10;

export default function AdminEmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [actionEmployee, setActionEmployee] = useState<Employee | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<UserStatus>('ACTIVE');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
      setFiltered(data);
    } catch {
      setError('Unable to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.departmentName ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter);
    }
    setFiltered(result);
    setPage(0);
  }, [search, statusFilter, employees]);

  const handleChangeStatus = async () => {
    if (!actionEmployee) return;
    setStatusLoading(true);
    try {
      await employeeService.changeStatus(actionEmployee.id, newStatus);
      toast('success', `Status updated to ${newStatus}`);
      setStatusModalOpen(false);
      fetchEmployees();
    } catch {
      toast('error', 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchEmployees} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} total employees</p>
        </div>
        <button
          onClick={() => navigate('/admin/employees/create')}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select sm:w-40"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState message="No employees found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-header">Employee</th>
                  <th className="table-header">Employee ID</th>
                  <th className="table-header hidden md:table-cell">Department</th>
                  <th className="table-header hidden lg:table-cell">Job Title</th>
                  <th className="table-header hidden md:table-cell">Joined</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={emp.name} src={emp.profileImage} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm">{emp.employeeId}</td>
                    <td className="table-cell hidden md:table-cell">{emp.departmentName ?? '—'}</td>
                    <td className="table-cell hidden lg:table-cell">{emp.jobTitle ?? '—'}</td>
                    <td className="table-cell hidden md:table-cell">{emp.joiningDate ?? '—'}</td>
                    <td className="table-cell"><Badge value={emp.status} /></td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/employees/${emp.id}`)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setActionEmployee(emp);
                            setNewStatus(emp.status);
                            setStatusModalOpen(true);
                          }}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition"
                          title="Change Status"
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Change Status — ${actionEmployee?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as UserStatus)}
              className="form-select"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setStatusModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleChangeStatus} disabled={statusLoading} className="btn-primary">
              {statusLoading ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
