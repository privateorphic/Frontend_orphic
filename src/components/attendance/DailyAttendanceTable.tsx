import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Eye, CheckCircle, Clock, RotateCcw, ChevronLeft, ChevronRight, User, RefreshCw } from 'lucide-react';
import type { AttendanceRecord } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../common/Toast';

interface Props {
  onInspectEmployee: (employeeId: number | string, date: string) => void;
  isAdmin?: boolean;
}

export const DailyAttendanceTable: React.FC<Props> = ({ onInspectEmployee, isAdmin = false }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const { showToast } = useToast();

  const loadAttendance = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await attendanceService.getAdminAttendanceList(date, page, 20);
      setRecords(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      if (!silent) showToast('Failed to load daily attendance list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    // Auto-polling every 15 seconds for live attendance synchronization
    const interval = setInterval(() => {
      loadAttendance(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [date, page]);

  const handleReopen = async (attendanceId: number) => {
    if (!window.confirm('Are you sure you want to reopen this employee\'s attendance for today? This allows further task updates.')) {
      return;
    }
    try {
      await attendanceService.reopenAttendanceDay(attendanceId);
      showToast('Attendance day reopened successfully', 'success');
      loadAttendance();
    } catch (err: any) {
      showToast(err.message || 'Failed to reopen attendance day', 'error');
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.employeeCode || String(r.employeeId)).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_OUT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Checked Out</span>;
      case 'CHECKED_IN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Checked In</span>;
      case 'REOPENED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Reopened</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Not Started</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Daily Office Attendance & Task Logs</h3>
            <p className="text-xs text-slate-500">Monitor employee check-in/out times and daily task progression metrics</p>
          </div>

          {/* Date Picker & Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(0);
                }}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => loadAttendance(false)}
              disabled={refreshing}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs"
              title="Refresh Attendance List"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="REOPENED">Reopened</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Check-In</th>
              <th className="px-6 py-4">Check-Out</th>
              <th className="px-6 py-4">Office Duration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Loading attendance records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No attendance records found for {date}.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100">
                        {record.employeeName ? record.employeeName.charAt(0) : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{record.employeeName}</div>
                        <div className="text-xs text-slate-400 font-mono">#{record.employeeCode || record.employeeId}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                    {record.morningCheckIn || record.checkInTime || '—'}
                  </td>

                  <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                    {record.eveningCheckOut || record.checkOutTime || '—'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {record.officeDuration || `${record.workingHours || 0}h`}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {getStatusBadge(record.status)}
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onInspectEmployee(record.employeeId, date)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Tasks
                    </button>

                    {isAdmin && record.status === 'CHECKED_OUT' && (
                      <button
                        onClick={() => handleReopen(Number(record.id))}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                        title="Reopen day for employee to edit tasks"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page + 1} of {totalPages} ({totalElements} records)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
