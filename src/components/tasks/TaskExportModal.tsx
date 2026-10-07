import React, { useState, useEffect } from 'react';
import { Download, X, Calendar, User as UserIcon, Building2, Filter, Loader2, FileSpreadsheet } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { toast } from '../common/Toast';
import type { TaskStatus, TaskPriority, Employee, Department } from '../../types';

interface TaskExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'thisWeek' | 'thisMonth' | 'custom';

export const TaskExportModal: React.FC<TaskExportModalProps> = ({ isOpen, onClose }) => {
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Compute dates based on preset
  useEffect(() => {
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

    if (datePreset === 'today') {
      const dateStr = formatDateStr(today);
      setFromDate(dateStr);
      setToDate(dateStr);
    } else if (datePreset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      const dateStr = formatDateStr(yest);
      setFromDate(dateStr);
      setToDate(dateStr);
    } else if (datePreset === 'last7days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      setFromDate(formatDateStr(past));
      setToDate(formatDateStr(today));
    } else if (datePreset === 'thisWeek') {
      const first = today.getDate() - today.getDay();
      const firstDay = new Date(today.setDate(first));
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(lastDay));
    } else if (datePreset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(new Date()));
    }
  }, [datePreset]);

  // Load dropdown options when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoadingOptions(true);
        try {
          const [empData, deptData] = await Promise.all([
            employeeService.getAllEmployees(),
            departmentService.getAll()
          ]);
          setEmployees(Array.isArray(empData) ? empData : []);
          setDepartments(Array.isArray(deptData) ? deptData : []);
        } catch (err) {
          console.error('Failed to load export options', err);
        } finally {
          setLoadingOptions(false);
        }
      };
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params: any = {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
        departmentId: selectedDepartmentId ? parseInt(selectedDepartmentId, 10) : undefined,
        status: selectedStatus ? (selectedStatus as TaskStatus) : undefined,
        priority: selectedPriority ? (selectedPriority as TaskPriority) : undefined,
      };

      const { blob, filename } = await taskService.exportTasksExcel(params);

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast('success', 'Excel work report downloaded successfully.');
      onClose();
    } catch (err: any) {
      console.error('Download failed', err);
      toast('error', err?.response?.data?.message || 'Unable to generate Excel report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Export Work Report</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate multi-sheet Excel analytical tasks report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={downloading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Date Range Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" /> Date Range
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7days', label: 'Last 7 Days' },
                { id: 'thisWeek', label: 'This Week' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'custom', label: 'Custom' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDatePreset(item.id as DatePreset)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                    datePreset === item.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Filter Criteria */}
          <div className="space-y-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-500" /> Report Filters
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" /> Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || `EMP${emp.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Department
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="TODO">Pending (TODO)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Task Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Included Excel Sheets:</p>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 list-disc list-inside">
              <li>Sheet 1: Employee Summary</li>
              <li>Sheet 2: Daily Summary</li>
              <li>Sheet 3: Task Details</li>
              <li>Sheet 4: Employee Performance</li>
              <li>Sheet 5: Status Analysis</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing report...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Excel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
