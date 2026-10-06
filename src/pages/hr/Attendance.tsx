import { useEffect, useState, useMemo } from 'react';
import {
  Calendar, Search, UserCheck, Clock, User, Edit3,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Save, X, PlusCircle
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import type { AttendanceRecord, AttendanceStatus, Employee } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { toast } from '../../components/common/Toast';
import { DailyAttendanceTable } from '../../components/attendance/DailyAttendanceTable';
import { EmployeeDailyInspectionModal } from '../../components/attendance/EmployeeDailyInspectionModal';

const DEFAULT_STATUS_CFG = { label: 'Present', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  PRESENT:  { label: 'Present',  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  ABSENT:   { label: 'Absent',   bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: XCircle },
  HALF_DAY: { label: 'Half Day', bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   icon: AlertCircle },
  ON_LEAVE: { label: 'On Leave', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: Calendar },
  LATE:     { label: 'Late',     bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: Clock },
};

export default function HrAttendancePage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'profile'>('daily');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const [dailyRecords, setDailyRecords] = useState<AttendanceRecord[]>([]);
  const [profileRecords, setProfileRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State for HR Maintain Attendance
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmpId, setModalEmpId] = useState('');
  const [modalEmpName, setModalEmpName] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('PRESENT');
  const [modalCheckIn, setModalCheckIn] = useState('09:00 AM');
  const [modalCheckOut, setModalCheckOut] = useState('05:30 PM');
  const [modalRemarks, setModalRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // State for Employee Task Log Inspection Modal
  const [inspectingEmpId, setInspectingEmpId] = useState<number | string | null>(null);
  const [inspectingDate, setInspectingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const handleInspectEmployee = (employeeId: number | string, date: string) => {
    setInspectingEmpId(employeeId);
    setInspectingDate(date);
    setIsInspectionModalOpen(true);
  };

  // Load Real Employees and Attendance Data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      let empList: Employee[] = [];
      try {
        empList = await employeeService.hrGetAllEmployees();
      } catch {
        empList = [];
      }
      setEmployees(empList);

      if (empList.length > 0 && !selectedEmpId) {
        setSelectedEmpId(empList[0].employeeId);
      }

      const records = await attendanceService.getDailyAttendance(selectedDate);
      setDailyRecords(records);
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  // Load employee profile attendance when selected employee or month changes
  const loadEmployeeProfileData = async () => {
    if (!selectedEmpId) return;
    try {
      const records = await attendanceService.getEmployeeAttendance(selectedEmpId, selectedMonth);
      setProfileRecords(records);
    } catch {
      setProfileRecords([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'profile' && selectedEmpId) {
      loadEmployeeProfileData();
    }
  }, [activeTab, selectedEmpId, selectedMonth]);

  // Selected Employee Object
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.employeeId === selectedEmpId) || null;
  }, [employees, selectedEmpId]);

  // Calculate Monthly Stats for Selected Employee Profile
  const profileStats = useMemo(() => {
    const present = profileRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = profileRecords.filter((r) => r.status === 'ABSENT').length;
    const halfDay = profileRecords.filter((r) => r.status === 'HALF_DAY').length;
    const leave = profileRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const late = profileRecords.filter((r) => r.status === 'LATE').length;
    const totalHours = profileRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0);

    return { present, absent, halfDay, leave, late, totalHours };
  }, [profileRecords]);

  // Filtered Daily Records
  const filteredDailyRecords = useMemo(() => {
    return dailyRecords.filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (r.employeeName ?? '').toLowerCase().includes(q) ||
        (r.employeeId ? String(r.employeeId) : '').toLowerCase().includes(q) ||
        (r.departmentName ?? '').toLowerCase().includes(q)
      );
    });
  }, [dailyRecords, search]);

  // Open Modal to Edit/Maintain Attendance
  const handleOpenMaintainModal = (empId?: string, empName?: string, date?: string, status?: AttendanceStatus) => {
    const targetEmpId = empId || selectedEmpId || (employees[0]?.employeeId ?? '');
    const emp = employees.find((e) => e.employeeId === targetEmpId);
    setModalEmpId(targetEmpId);
    setModalEmpName(empName || emp?.name || targetEmpId);
    setModalDate(date || selectedDate);
    setModalStatus(status || 'PRESENT');
    setModalCheckIn('09:00 AM');
    setModalCheckOut('05:30 PM');
    setModalRemarks('');
    setIsModalOpen(true);
  };

  // Save Attendance Record
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const emp = employees.find((e) => e.employeeId === modalEmpId);
      const hours = modalStatus === 'PRESENT' || modalStatus === 'LATE' ? 8.5 : modalStatus === 'HALF_DAY' ? 4.5 : 0;

      await attendanceService.saveAttendanceRecord({
        employeeId: modalEmpId,
        employeeName: emp?.name || modalEmpName || modalEmpId,
        departmentName: emp?.departmentName || 'General',
        jobTitle: emp?.jobTitle || 'Employee',
        date: modalDate,
        status: modalStatus,
        checkInTime: modalStatus === 'ABSENT' || modalStatus === 'ON_LEAVE' ? '—' : modalCheckIn,
        checkOutTime: modalStatus === 'ABSENT' || modalStatus === 'ON_LEAVE' ? '—' : modalCheckOut,
        workingHours: hours,
        remarks: modalRemarks || `Marked ${modalStatus} by HR`,
      });

      toast('success', `Attendance updated for ${emp?.name || modalEmpId} on ${modalDate}!`);
      setIsModalOpen(false);
      await loadData();
      if (activeTab === 'profile') {
        await loadEmployeeProfileData();
      }
    } catch {
      toast('error', 'Failed to save attendance record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && employees.length === 0 && dailyRecords.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F3DCCB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1410] flex items-center gap-2.5">
            <UserCheck size={26} className="text-[#EF7D35]" />
            HR Attendance Maintenance System
          </h1>
          <p className="text-xs text-[#78655A] mt-1">
            Maintain, mark, and track employee daily check-in/out records and monthly profile summaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenMaintainModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EF7D35] text-white hover:bg-[#DC6422] transition shadow-md shadow-[#EF7D35]/20"
          >
            <Edit3 size={16} /> Maintain Attendance
          </button>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-[#F3DCCB] gap-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'daily'
              ? 'border-[#EF7D35] text-[#EF7D35]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={18} /> Daily Attendance Sheet
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-[#EF7D35] text-[#EF7D35]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={18} /> Employee Attendance Profile
        </button>
      </div>

      {/* ================= TAB 1: DAILY ATTENDANCE SHEET ================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <DailyAttendanceTable onInspectEmployee={handleInspectEmployee} isAdmin={true} />

          <EmployeeDailyInspectionModal
            isOpen={isInspectionModalOpen}
            employeeId={inspectingEmpId}
            date={inspectingDate}
            onClose={() => setIsInspectionModalOpen(false)}
          />
        </div>
      )}

      {/* ================= TAB 2: EMPLOYEE ATTENDANCE PROFILE ================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Employee Profile Selector Header */}
          <div className="card p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-[#F3DCCB]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {selectedEmployee ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#EF7D35] p-1 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full rounded-xl bg-[#EF7D35] text-white font-extrabold text-2xl flex items-center justify-center">
                      {selectedEmployee.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-[#1F1410]">{selectedEmployee.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EF7D35] text-white">
                        {selectedEmployee.employeeId}
                      </span>
                    </div>
                    <p className="text-xs text-[#78655A] font-medium mt-0.5">
                      {selectedEmployee.jobTitle || 'Employee'} • {selectedEmployee.departmentName || 'General Department'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>📧 {selectedEmployee.email}</span>
                      <span>🗓️ Joined: {selectedEmployee.joiningDate || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold text-slate-700">Select an Employee Profile</h2>
                  <p className="text-xs text-slate-500">Choose an employee from the dropdown to inspect monthly attendance records</p>
                </div>
              )}

              {/* Employee & Month Dropdowns */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Employee Profile:</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] bg-white w-full sm:w-48"
                  >
                    {employees.length === 0 ? (
                      <option value="">No employees found</option>
                    ) : (
                      employees.map((e) => (
                        <option key={e.employeeId} value={e.employeeId}>
                          {e.name} ({e.employeeId})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Month:</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] bg-white w-full sm:w-36"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Statistics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="stat-card border-l-4 border-l-emerald-500 text-center">
              <p className="text-2xl font-bold text-emerald-600">{profileStats.present}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Days Present</p>
            </div>
            <div className="stat-card border-l-4 border-l-orange-500 text-center">
              <p className="text-2xl font-bold text-orange-600">{profileStats.late}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Days Late</p>
            </div>
            <div className="stat-card border-l-4 border-l-amber-500 text-center">
              <p className="text-2xl font-bold text-amber-600">{profileStats.halfDay}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Half Days</p>
            </div>
            <div className="stat-card border-l-4 border-l-blue-500 text-center">
              <p className="text-2xl font-bold text-blue-600">{profileStats.leave}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">On Leave</p>
            </div>
            <div className="stat-card border-l-4 border-l-red-500 text-center">
              <p className="text-2xl font-bold text-red-600">{profileStats.absent}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Days Absent</p>
            </div>
            <div className="stat-card border-l-4 border-l-[#EF7D35] text-center">
              <p className="text-2xl font-bold text-[#EF7D35]">{profileStats.totalHours.toFixed(1)}h</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Total Hours</p>
            </div>
          </div>

          {/* Monthly Attendance Sheet */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar size={16} className="text-[#EF7D35]" />
                Monthly Attendance Log {selectedEmployee ? `for ${selectedEmployee.name}` : ''} ({selectedMonth})
              </h3>
              <span className="text-xs text-slate-500 font-medium">{profileRecords.length} Records</span>
            </div>

            {profileRecords.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  message={`No attendance records found for ${selectedMonth}`}
                  description="Click 'Maintain Attendance' to add records for this employee profile."
                />
                <div className="text-center mt-4">
                  <button
                    onClick={() => handleOpenMaintainModal(selectedEmpId, selectedEmployee?.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EF7D35] text-white hover:bg-[#DC6422] transition"
                  >
                    <PlusCircle size={16} /> Maintain Attendance Record
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="table-header">Date</th>
                      <th className="table-header">Day</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Check In</th>
                      <th className="table-header">Check Out</th>
                      <th className="table-header">Hours</th>
                      <th className="table-header">HR Notes</th>
                      <th className="table-header text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {profileRecords.map((r) => {
                      const dateObj = r.date ? new Date(r.date) : new Date();
                      const dayName = isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const cfg = STATUS_CONFIG[r.status] || DEFAULT_STATUS_CFG;
                      const IconComp = cfg.icon;

                      return (
                        <tr key={r.date} className="hover:bg-slate-50 transition">
                          <td className="table-cell font-mono text-xs font-semibold text-slate-700">{r.date}</td>
                          <td className="table-cell font-semibold text-xs text-slate-500">{dayName}</td>
                          <td className="table-cell">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <IconComp size={12} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="table-cell font-mono text-xs text-emerald-700">{r.checkInTime || '—'}</td>
                          <td className="table-cell font-mono text-xs text-slate-600">{r.checkOutTime || '—'}</td>
                          <td className="table-cell font-mono text-xs font-semibold text-slate-800">
                            {r.workingHours ? `${r.workingHours}h` : '—'}
                          </td>
                          <td className="table-cell text-xs text-slate-500 max-w-[200px] truncate">{r.remarks || '—'}</td>
                          <td className="table-cell text-right">
                            <button
                              onClick={() => handleOpenMaintainModal(selectedEmpId, selectedEmployee?.name, r.date, r.status)}
                              className="text-xs text-[#EF7D35] hover:text-[#DC6422] font-semibold underline"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= HR MAINTAIN ATTENDANCE MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#F3DCCB]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FFF4EC]">
              <h3 className="font-bold text-[#1F1410] text-lg flex items-center gap-2">
                <Edit3 size={20} className="text-[#EF7D35]" />
                Maintain Employee Attendance
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Employee Profile *
                </label>
                {employees.length > 0 ? (
                  <select
                    value={modalEmpId}
                    onChange={(e) => {
                      setModalEmpId(e.target.value);
                      const emp = employees.find((x) => x.employeeId === e.target.value);
                      if (emp) setModalEmpName(emp.name);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm bg-white font-medium"
                  >
                    {employees.map((e) => (
                      <option key={e.employeeId} value={e.employeeId}>
                        {e.name} ({e.employeeId}) — {e.departmentName || 'General'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter Employee ID (e.g. EMP001)"
                    value={modalEmpId}
                    onChange={(e) => setModalEmpId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm bg-white font-medium"
                  />
                )}
              </div>

              {/* Attendance Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm bg-white font-semibold"
                  >
                    <option value="PRESENT">✅ Present</option>
                    <option value="LATE">⏰ Late</option>
                    <option value="HALF_DAY">⚠️ Half Day</option>
                    <option value="ON_LEAVE">📅 On Leave</option>
                    <option value="ABSENT">❌ Absent</option>
                  </select>
                </div>
              </div>

              {/* Check In / Out Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={modalCheckIn}
                    onChange={(e) => setModalCheckIn(e.target.value)}
                    disabled={modalStatus === 'ABSENT' || modalStatus === 'ON_LEAVE'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm bg-white disabled:bg-slate-100 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 05:30 PM"
                    value={modalCheckOut}
                    onChange={(e) => setModalCheckOut(e.target.value)}
                    disabled={modalStatus === 'ABSENT' || modalStatus === 'ON_LEAVE'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm bg-white disabled:bg-slate-100 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  HR Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide reason or notes regarding this attendance entry..."
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35] text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#EF7D35] text-white hover:bg-[#DC6422] transition disabled:opacity-50 shadow-md shadow-[#EF7D35]/20"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
