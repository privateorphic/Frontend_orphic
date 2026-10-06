import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, UserCheck } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import UserAvatar from '../../components/common/UserAvatar';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 10;

export default function HrEmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const fetchEmployees = async () => {
    setLoading(true); setError('');
    try {
      const data = await employeeService.hrGetAllEmployees();
      setEmployees(data); setFiltered(data);
    } catch { setError('Unable to load employees.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    let r = employees;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.departmentName ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) r = r.filter((e) => e.status === statusFilter);
    setFiltered(r); setPage(0);
  }, [search, statusFilter, employees]);

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
        <button onClick={() => navigate('/hr/employees/create')} className="btn-primary">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, email..." className="form-input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select sm:w-36">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {paged.length === 0 ? <EmptyState message="No employees found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-header">Employee</th>
                  <th className="table-header">ID</th>
                  <th className="table-header hidden md:table-cell">Department</th>
                  <th className="table-header hidden lg:table-cell">Job Title</th>
                  <th className="table-header hidden md:table-cell">Joined</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={emp.name} src={emp.profileImage} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{emp.name}</p>
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
                      <button
                        onClick={() => navigate(`/hr/employees/${emp.id}`)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
