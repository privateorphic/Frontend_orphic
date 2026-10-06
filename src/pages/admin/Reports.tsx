import { useEffect, useState } from 'react';
import { Download, RefreshCw, Paperclip, ExternalLink, FileText, Eye, X, Calendar, User, Info, FileSpreadsheet } from 'lucide-react';
import { dailyWorkService } from '../../services/dailyWorkService';
import { loginActivityService } from '../../services/loginActivityService';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';
import type { DailyWork, LoginActivity, LeaveRequest, Employee } from '../../types';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { toast } from '../../components/common/Toast';

type ReportType = 'daily-work' | 'attendance' | 'leave';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily-work');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [dailyWork, setDailyWork] = useState<DailyWork[]>([]);
  const [attendance, setAttendance] = useState<LoginActivity[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected Report for Details Modal
  const [selectedReport, setSelectedReport] = useState<DailyWork | null>(null);

  useEffect(() => {
    employeeService.getAllEmployees().then(setEmployees).catch(() => {});
  }, []);

  const fetchReport = async () => {
    setLoading(true); setError('');
    try {
      if (reportType === 'daily-work') {
        const empId = selectedEmployee ? Number(selectedEmployee) : undefined;
        setDailyWork(await dailyWorkService.getAllWork(empId, startDate, endDate));
      } else if (reportType === 'attendance') {
        setAttendance(await loginActivityService.getAll({ startDate, endDate }));
      } else {
        setLeaves(await leaveService.getAllLeaves());
      }
    } catch {
      setError('Unable to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportType, startDate, endDate, selectedEmployee]);

  // Download Attached PDF / DOCX File or Generate PDF Document for a Client Report
  const downloadReportFile = (report: DailyWork) => {
    const filename = report.reportFileName || `Client_Report_${report.employeeName?.replace(/\s+/g, '_') || 'Employee'}_${report.workDate}.pdf`;
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const isDocx = filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc');

    const content = `========================================================================\n` +
      `                   ORPHIC TASK MANAGER - CLIENT WORK REPORT             \n` +
      `========================================================================\n\n` +
      `EMPLOYEE NAME   : ${report.employeeName || 'N/A'}\n` +
      `EMPLOYEE CODE   : ${report.employeeCode || report.employeeId || 'N/A'}\n` +
      `WORK DATE       : ${report.workDate}\n` +
      `REPORT FILENAME : ${report.reportFileName || 'None (Generated PDF)'}\n` +
      `GOOGLE DRIVE    : ${report.driveLink || 'None'}\n` +
      `------------------------------------------------------------------------\n` +
      `CLIENT WORK DESCRIPTION:\n` +
      `${report.description}\n` +
      `------------------------------------------------------------------------\n` +
      `ADDITIONAL NOTES / CLIENT FEEDBACK:\n` +
      `${report.notes || 'None'}\n\n` +
      `========================================================================\n` +
      `Submitted via Orphic Task Manager Portal\n` +
      `Generated Date: ${new Date().toLocaleString()}\n` +
      `========================================================================\n`;

    const mimeType = isPdf
      ? 'application/pdf'
      : isDocx
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/octet-stream';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('success', `Downloaded ${filename}`);
  };

  // Download Full CSV Export
  const handleDownloadCSV = () => {
    if (reportType === 'daily-work') {
      if (dailyWork.length === 0) {
        toast('error', 'No client report data to download');
        return;
      }
      const headers = ['Employee Name', 'Employee Code', 'Work Date', 'Client Work Description', 'Attached File', 'Drive Link', 'Notes'];
      const rows = dailyWork.map((d) => [
        `"${d.employeeName || ''}"`,
        `"${d.employeeCode || d.employeeId || ''}"`,
        `"${d.workDate}"`,
        `"${(d.description || '').replace(/"/g, '""')}"`,
        `"${d.reportFileName || 'None'}"`,
        `"${d.driveLink || 'None'}"`,
        `"${(d.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Client_Work_Reports_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('success', 'Client work report CSV downloaded successfully!');
    } else if (reportType === 'attendance') {
      if (attendance.length === 0) {
        toast('error', 'No attendance data to download');
        return;
      }
      const headers = ['Employee Name', 'Employee ID', 'Login Date', 'Login Time', 'Logout Time', 'Duration', 'Status'];
      const rows = attendance.map((a) => [
        `"${a.employeeName || ''}"`,
        `"${a.employeeId || ''}"`,
        `"${a.loginDate}"`,
        `"${a.loginTime || ''}"`,
        `"${a.logoutTime || 'N/A'}"`,
        `"${a.sessionDuration || 'N/A'}"`,
        `"${a.status}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Attendance_Report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('success', 'Attendance report CSV downloaded successfully!');
    } else {
      if (leaves.length === 0) {
        toast('error', 'No leave data to download');
        return;
      }
      const headers = ['Employee Name', 'Employee Code', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
      const rows = leaves.map((l) => [
        `"${l.employeeName || ''}"`,
        `"${l.employeeCode || ''}"`,
        `"${l.leaveType}"`,
        `"${l.startDate}"`,
        `"${l.endDate}"`,
        `"${l.totalDays || ''}"`,
        `"${l.status}"`,
        `"${(l.reason || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Leave_Report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('success', 'Leave report CSV downloaded successfully!');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Client Work & Operations Reports</h1>
          <p className="page-subtitle">View, review, and download employee client work reports (PDF / DOCX) and analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleDownloadCSV} className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={fetchReport} className="btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="form-select sm:w-56 font-medium">
          <option value="daily-work">Client Work Reports</option>
          <option value="attendance">Attendance Report</option>
          <option value="leave">Leave Report</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input sm:w-40" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input sm:w-40" />
        {reportType === 'daily-work' && (
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="form-select flex-1">
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
          </select>
        )}
      </div>

      {/* Summary cards for client work reports */}
      {reportType === 'daily-work' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Client Reports', value: dailyWork.length },
            { label: 'Attached PDF/DOCX Files', value: dailyWork.filter(d => d.reportFileName).length },
            { label: 'Google Drive Links', value: dailyWork.filter(d => d.driveLink).length },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={fetchReport} /> : (
        <div className="card overflow-hidden">
          {reportType === 'daily-work' && (
            dailyWork.length === 0 ? <EmptyState message="No client work reports found for selected period" /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="table-header">Employee</th>
                    <th className="table-header">Work Date</th>
                    <th className="table-header">Client Work Description</th>
                    <th className="table-header">Report File (PDF/DOCX)</th>
                    <th className="table-header">Drive / Cloud Link</th>
                    <th className="table-header text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyWork.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedReport(d)}>
                        <td className="table-cell">
                          <p className="font-semibold text-slate-800">{d.employeeName ?? '—'}</p>
                          <p className="text-xs text-slate-400 font-mono">{d.employeeCode || d.employeeId}</p>
                        </td>
                        <td className="table-cell whitespace-nowrap text-xs font-mono font-medium text-slate-600">{d.workDate}</td>
                        <td className="table-cell min-w-[240px] max-w-[360px]">
                          <p className="text-sm text-slate-800 whitespace-pre-line line-clamp-2">{d.description}</p>
                        </td>
                        <td className="table-cell whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {d.reportFileName ? (
                            <button
                              onClick={() => downloadReportFile(d)}
                              className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium transition"
                              title="Click to download PDF/DOCX file"
                            >
                              <Paperclip size={13} className="text-emerald-600" />
                              <span className="truncate max-w-[140px]">{d.reportFileName}</span>
                              <Download size={12} className="text-emerald-700 ml-0.5 shrink-0" />
                            </button>
                          ) : (
                            <button
                              onClick={() => downloadReportFile(d)}
                              className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-medium transition"
                              title="Download report PDF document"
                            >
                              <FileText size={12} /> Download PDF
                            </button>
                          )}
                        </td>
                        <td className="table-cell whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {d.driveLink ? (
                            <a
                              href={d.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-medium transition"
                            >
                              <ExternalLink size={13} />
                              <span>Google Drive</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="table-cell text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => downloadReportFile(d)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                              title="Download Report (PDF/DOCX)"
                            >
                              <Download size={13} /> Download
                            </button>
                            <button
                              onClick={() => setSelectedReport(d)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#DC6422] hover:text-[#B84E1A] bg-[#FFF4EC] hover:bg-[#FDE5D3] px-2.5 py-1 rounded-xl transition"
                              title="View Full Details"
                            >
                              <Eye size={13} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {reportType === 'attendance' && (
            attendance.length === 0 ? <EmptyState message="No attendance records found" /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-200">
                    <th className="table-header">Employee</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Login</th>
                    <th className="table-header">Logout</th>
                    <th className="table-header">Duration</th>
                    <th className="table-header">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((la) => (
                      <tr key={la.id} className="hover:bg-slate-50">
                        <td className="table-cell">
                          <p className="font-medium">{la.employeeName ?? '—'}</p>
                          <p className="text-xs text-slate-400 font-mono">{la.employeeId}</p>
                        </td>
                        <td className="table-cell">{la.loginDate}</td>
                        <td className="table-cell font-mono text-sm text-emerald-700">{la.loginTime}</td>
                        <td className="table-cell font-mono text-sm text-red-600">{la.logoutTime ?? '—'}</td>
                        <td className="table-cell font-mono text-sm">{la.sessionDuration ?? '—'}</td>
                        <td className="table-cell"><Badge value={la.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {reportType === 'leave' && (
            leaves.length === 0 ? <EmptyState message="No leave records found" /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-200">
                    <th className="table-header">Employee</th>
                    <th className="table-header">Leave Type</th>
                    <th className="table-header">From</th>
                    <th className="table-header">To</th>
                    <th className="table-header">Days</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Reviewed By</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="table-cell">
                          <p className="font-medium">{l.employeeName ?? '—'}</p>
                          <p className="text-xs text-slate-400 font-mono">{l.employeeCode}</p>
                        </td>
                        <td className="table-cell"><Badge value={l.leaveType} /></td>
                        <td className="table-cell">{l.startDate}</td>
                        <td className="table-cell">{l.endDate}</td>
                        <td className="table-cell font-medium">{l.totalDays ?? '—'}</td>
                        <td className="table-cell"><Badge value={l.status} /></td>
                        <td className="table-cell">{l.reviewedByName ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* View Full Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-emerald-600" />
                Client Work Report Details
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Employee Info */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{selectedReport.employeeName ?? 'Employee'}</h4>
                    <p className="text-xs text-slate-500 font-mono">{selectedReport.employeeCode || selectedReport.employeeId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Work Date</span>
                  <span className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                    <Calendar size={13} className="text-emerald-600" />
                    {selectedReport.workDate}
                  </span>
                </div>
              </div>

              {/* Work Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Info size={13} className="text-emerald-600" /> Client Work Description
                </label>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {selectedReport.description}
                </div>
              </div>

              {/* Attachments & Links */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Attachments & Resources
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-2 truncate">
                      <Paperclip size={15} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{selectedReport.reportFileName || `Client_Report_${selectedReport.workDate}.pdf`}</span>
                    </span>
                    <button
                      onClick={() => downloadReportFile(selectedReport)}
                      className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-sm shrink-0 ml-2"
                    >
                      <Download size={13} />
                      <span>Download File</span>
                    </button>
                  </div>

                  {selectedReport.driveLink ? (
                    <a
                      href={selectedReport.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 text-blue-800 transition"
                    >
                      <span className="text-xs font-semibold flex items-center gap-2 truncate">
                        <ExternalLink size={15} />
                        <span className="truncate">{selectedReport.driveLink}</span>
                      </span>
                      <span className="text-[11px] bg-blue-600 text-white px-2.5 py-1 rounded-lg font-medium shrink-0 ml-2">Open Link</span>
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No Google Drive link provided</p>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {selectedReport.notes && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Additional Notes / Client Feedback
                  </label>
                  <p className="p-3 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed">
                    {selectedReport.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => downloadReportFile(selectedReport)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-md"
              >
                <Download size={16} />
                <span>Download Report Document</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
