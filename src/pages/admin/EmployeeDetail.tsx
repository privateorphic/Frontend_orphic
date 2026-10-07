import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, Building, Mail, Phone, Calendar, ShieldCheck, Briefcase } from 'lucide-react';
import { employeeService } from '../../services/employeeService.ts';
import { loginActivityService } from '../../services/loginActivityService.ts';
import type { Employee, LoginActivity } from '../../types/index.ts';
import Badge from '../../components/common/Badge.tsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import ErrorState from '../../components/common/ErrorState.tsx';
import EmptyState from '../../components/common/EmptyState.tsx';
import UserAvatar from '../../components/common/UserAvatar.tsx';
import { toast } from '../../components/common/Toast.tsx';
import { formatTime } from '../../utils/formatters.ts';

type Tab = 'overview' | 'loginActivity';

export default function AdminEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const emp = await employeeService.getEmployeeById(Number(id));
      setEmployee(emp);
      try {
        const la = await loginActivityService.getByEmployee(emp.employeeId);
        setLoginActivity(la);
      } catch {
        setLoginActivity([]);
      }
    } catch {
      setError('Unable to load employee details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileImageUpload = async (newBase64: string) => {
    if (!employee) return;
    try {
      const updated = await employeeService.updateEmployee(employee.id, {
        profileImage: newBase64,
      });
      setEmployee(updated);
      toast('success', 'Profile image updated successfully!');
    } catch {
      // Local state update
      setEmployee((prev) => (prev ? { ...prev, profileImage: newBase64 } : null));
      toast('success', 'Profile picture updated!');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !employee) return <ErrorState message={error} onRetry={fetchData} />;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <User size={15} /> },
    { key: 'loginActivity', label: 'Login History', icon: <Clock size={15} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-[#78655A] hover:text-[#1F1410] transition"
      >
        <ArrowLeft size={16} /> Back to Employees
      </button>

      {/* Employee Profile Header with Image */}
      <div className="card p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-[#F3DCCB]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* User Profile Avatar Image with Camera Upload */}
          <UserAvatar
            name={employee.name}
            src={employee.profileImage}
            size="xl"
            editable={true}
            onImageChange={handleProfileImageUpload}
          />

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-[#1F1410]">{employee.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EF7D35] text-white">
                    {employee.employeeId}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#78655A] mt-0.5">
                  {employee.jobTitle ?? 'Employee'} • {employee.departmentName ?? 'General Department'}
                </p>
              </div>
              <Badge value={employee.status} />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-medium text-slate-600 border-t border-[#F3DCCB] pt-3">
              <span className="flex items-center gap-1">
                <Mail size={14} className="text-[#EF7D35]" /> {employee.email}
              </span>
              {employee.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={14} className="text-emerald-600" /> {employee.phone}
                </span>
              )}
              {employee.departmentName && (
                <span className="flex items-center gap-1">
                  <Building size={14} className="text-amber-600" /> {employee.departmentName}
                </span>
              )}
              {employee.joiningDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-blue-600" /> Joined {employee.joiningDate}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (Tasks Tab Removed as Requested) */}
      <div className="flex gap-2 border-b border-[#F3DCCB]">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px ${
              tab === key
                ? 'border-[#EF7D35] text-[#EF7D35] bg-[#FFF4EC]/60 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-6 space-y-4 border border-[#F3DCCB]">
            <h3 className="font-bold text-[#1F1410] text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <User size={16} className="text-[#EF7D35]" />
              Personal Information
            </h3>
            {[
              ['Full Name', employee.name],
              ['Employee Code', employee.employeeId],
              ['Email Address', employee.email],
              ['Phone Number', employee.phone ?? '—'],
              ['Role & Permission', employee.role],
              ['Account Status', employee.status],
              ['Residential Address', employee.address ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-sm py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          <div className="card p-6 space-y-4 border border-[#F3DCCB]">
            <h3 className="font-bold text-[#1F1410] text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Briefcase size={16} className="text-[#EF7D35]" />
              Employment Details
            </h3>
            {[
              ['Department', employee.departmentName ?? '—'],
              ['Job Title', employee.jobTitle ?? '—'],
              ['Employment Type', employee.employmentType ?? 'Full Time'],
              ['Joining Date', employee.joiningDate ?? '—'],
              ['Total Login Sessions', loginActivity.length],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-sm py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Login History */}
      {tab === 'loginActivity' && (
        <div className="card overflow-hidden border border-[#F3DCCB]">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock size={16} className="text-[#EF7D35]" />
              Employee Login & Session History
            </h3>
          </div>
          {loginActivity.length === 0 ? (
            <EmptyState message="No login history recorded yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="table-header">Date</th>
                    <th className="table-header">Login Time</th>
                    <th className="table-header">Logout Time</th>
                    <th className="table-header">Session Duration</th>
                    <th className="table-header">IP Address</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loginActivity.map((la) => (
                    <tr key={la.id} className="hover:bg-slate-50 transition">
                      <td className="table-cell font-mono text-xs font-semibold text-slate-700">{la.loginDate}</td>
                      <td className="table-cell font-mono text-xs font-semibold text-emerald-700">{formatTime(la.loginTime)}</td>
                      <td className="table-cell font-mono text-xs text-red-600">{la.logoutTime ? formatTime(la.logoutTime) : '—'}</td>
                      <td className="table-cell font-mono text-xs font-semibold text-slate-800">
                        {la.sessionDuration ?? '—'}
                      </td>
                      <td className="table-cell font-mono text-xs text-slate-400">{la.ipAddress || '192.168.1.1'}</td>
                      <td className="table-cell">
                        <Badge value={la.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
