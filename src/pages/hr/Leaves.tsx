import { useEffect, useState } from 'react';
import { RefreshCw, Search, CheckCircle, XCircle, Eye, FileText, Paperclip, Calendar, User, Download } from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import type { LeaveRequest, LeaveStatus } from '../../types';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';

export default function HrLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filtered, setFiltered] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('PENDING');
  const [search, setSearch] = useState('');
  
  // Modal states
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [docPreview, setDocPreview] = useState<{ name: string; data?: string | null } | null>(null);

  const fetchLeaves = async () => {
    setLoading(true); setError('');
    try {
      setLeaves(await leaveService.getAllLeaves());
    } catch { setError('Unable to load leave requests.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  useEffect(() => {
    let list = leaves;
    if (statusFilter) {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        (l.employeeName ?? '').toLowerCase().includes(q) ||
        (l.employeeCode ?? '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [statusFilter, search, leaves]);

  const handleReview = async (leaveId: number, action: 'approve' | 'reject') => {
    setReviewLoading(true);
    try {
      if (action === 'approve') {
        await leaveService.approveLeave(leaveId, comments);
        toast('success', 'Leave application approved successfully');
      } else {
        await leaveService.rejectLeave(leaveId, comments);
        toast('success', 'Leave application rejected');
      }
      setSelectedLeave(null);
      setReviewAction(null);
      setComments('');
      fetchLeaves();
    } catch { toast('error', 'Action failed. Please try again.'); }
    finally { setReviewLoading(false); }
  };

  const parseDocInfo = (reasonStr: string) => {
    let docName: string | null = null;
    let docData: string | null = null;
    let detail: string | null = null;

    const docMatch = reasonStr.match(/\[Medical Doc:\s*([^\]|]+)(?:\s*\|\s*DATA:([^\]]+))?\]/i);
    if (docMatch) {
      docName = docMatch[1].trim();
      if (docMatch[2]) {
        docData = docMatch[2].trim();
      }
    }

    const detailMatch = reasonStr.match(/\[Medical Detail:\s*([^\]]+)\]/i);
    if (detailMatch) {
      detail = detailMatch[1].trim();
    }

    const cleanReason = reasonStr
      .replace(/\[Medical Doc:[^\]]+\]/gi, '')
      .replace(/\[Medical Detail:[^\]]+\]/gi, '')
      .trim();

    return { docName, docData, detail, cleanReason };
  };

  const stats = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === 'PENDING').length,
    approved: leaves.filter((l) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l) => l.status === 'REJECTED').length,
  };

  if (loading) return <LoadingSpinner />;

  const handleOpenPdf = (dataUrl: string, fileName: string) => {
    try {
      if (dataUrl.includes(';base64,')) {
        const parts = dataUrl.split(';base64,');
        const contentType = parts[0].replace('data:', '');
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(dataUrl, '_blank');
      }
    } catch {
      toast('error', 'Unable to open PDF in new window. Downloading instead...');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.click();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Review, inspect documents, and manage employee leave requests</p>
        </div>
        <button onClick={fetchLeaves} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'PENDING', label: 'Pending', count: stats.pending, activeClass: 'bg-amber-500 text-white border-amber-600 shadow-sm', badgeClass: 'bg-amber-600/40 text-amber-50' },
          { id: 'APPROVED', label: 'Approved', count: stats.approved, activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm', badgeClass: 'bg-emerald-700/40 text-emerald-50' },
          { id: 'REJECTED', label: 'Rejected', count: stats.rejected, activeClass: 'bg-red-600 text-white border-red-700 shadow-sm', badgeClass: 'bg-red-700/40 text-red-50' },
          { id: '', label: 'All Requests', count: stats.all, activeClass: 'bg-[#1F1410] text-white border-[#1F1410] shadow-sm', badgeClass: 'bg-white/20 text-white' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as LeaveStatus | '')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                isActive
                  ? tab.activeClass
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isActive ? tab.badgeClass : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee name or code..." className="form-input pl-9" />
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchLeaves} /> : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState message="No leave requests found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-header">Employee</th>
                    <th className="table-header">Leave Type</th>
                    <th className="table-header">Duration</th>
                    <th className="table-header hidden md:table-cell">Reason & Document</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((l) => {
                    const { docName, docData, cleanReason } = parseDocInfo(l.reason);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition">
                        <td className="table-cell">
                          <p className="font-semibold text-sm text-[#1F1410]">{l.employeeName ?? '—'}</p>
                          <p className="text-xs text-slate-400 font-mono">{l.employeeCode || l.departmentName}</p>
                        </td>
                        <td className="table-cell">
                          <Badge value={l.leaveType === 'SICK' ? 'MEDICAL / EMERGENCY' : l.leaveType === 'WORK_FROM_HOME' ? 'WORK FROM HOME (WFH)' : l.leaveType} />
                        </td>
                        <td className="table-cell">
                          <p className="text-xs font-semibold text-slate-700">{l.startDate} → {l.endDate}</p>
                          <p className="text-[11px] text-slate-400">{l.totalDays || 1} day{(l.totalDays || 1) !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="table-cell hidden md:table-cell max-w-[260px]">
                          <p className="text-xs text-slate-700 truncate">{cleanReason}</p>
                          {docName && (
                            <button
                              type="button"
                              onClick={() => setDocPreview({ name: docName, data: docData })}
                              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 rounded text-[11px] font-semibold transition"
                            >
                              <Paperclip size={11} className="text-[#EF7D35]" /> {docName}
                            </button>
                          )}
                        </td>
                        <td className="table-cell"><Badge value={l.status} /></td>
                        <td className="table-cell text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedLeave(l)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#EF7D35] transition"
                              title="View Full Reason & Details"
                            >
                              <Eye size={16} />
                            </button>
                            {l.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => { setSelectedLeave(l); setReviewAction('approve'); }}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                                  title="Approve Leave"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => { setSelectedLeave(l); setReviewAction('reject'); }}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                                  title="Reject Leave"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Leave Detail & Review Modal for HR and Admin */}
      {selectedLeave && (
        <Modal
          isOpen={!!selectedLeave}
          onClose={() => { setSelectedLeave(null); setReviewAction(null); setComments(''); }}
          title="Leave Application Details"
          size="md"
        >
          {(() => {
            const { docName, docData, detail, cleanReason } = parseDocInfo(selectedLeave.reason);
            return (
              <div className="space-y-4">
                {/* Employee Info Header */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFF4EC] text-[#EF7D35] rounded-full flex items-center justify-center font-bold text-base border border-[#FBCBA8]">
                      {selectedLeave.employeeName?.[0] || 'E'}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F1410] text-sm">{selectedLeave.employeeName}</h4>
                      <p className="text-xs text-slate-500">{selectedLeave.departmentName || 'Employee'} • <span className="font-mono text-slate-400">{selectedLeave.employeeCode}</span></p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge value={selectedLeave.leaveType === 'SICK' ? 'MEDICAL / EMERGENCY' : selectedLeave.leaveType} />
                    <Badge value={selectedLeave.status} />
                  </div>
                </div>

                {/* Duration & Dates */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Leave Period</span>
                    <span className="font-bold text-slate-800 text-sm">📅 {selectedLeave.startDate} → {selectedLeave.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Total Duration</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedLeave.totalDays || 1} Day{(selectedLeave.totalDays || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Attached Document (if any) */}
                {docName && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Paperclip size={14} className="text-[#EF7D35]" /> Attached Medical Document
                      </span>
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        Document Uploaded
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-amber-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText size={18} className="text-[#EF7D35] shrink-0" />
                        <span className="font-semibold text-slate-800 text-xs truncate">{docName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDocPreview({ name: docName, data: docData })}
                          className="px-2.5 py-1.5 bg-[#EF7D35] hover:bg-[#d66b27] text-white font-semibold text-xs rounded-md shadow-sm transition flex items-center gap-1"
                        >
                          <Eye size={13} /> View Document
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical Detail (if specified) */}
                {detail && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-xs font-bold text-red-900 block mb-1">Medical Reason / Note</span>
                    <p className="text-xs text-red-800 font-medium">{detail}</p>
                  </div>
                )}

                {/* Full Reason / Description */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Reason & Description</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {cleanReason || selectedLeave.reason}
                  </div>
                </div>

                {/* Reviewed Information */}
                {selectedLeave.reviewedByName && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="font-bold text-slate-700">Review Comments</span>
                    <p className="text-slate-600 mt-0.5">Reviewed by <span className="font-semibold">{selectedLeave.reviewedByName}</span>: "{selectedLeave.reviewComments || 'No comment'}"</p>
                  </div>
                )}

                {/* Action Form if Pending */}
                {selectedLeave.status === 'PENDING' && (
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div>
                      <label className="form-label text-xs">Reviewer Notes / Comments (Optional)</label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={2}
                        placeholder="Add review notes for employee..."
                        className="form-input text-xs"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleReview(selectedLeave.id, 'reject')}
                        disabled={reviewLoading}
                        className="btn-danger text-xs px-4"
                      >
                        <XCircle size={14} /> Reject Leave
                      </button>
                      <button
                        onClick={() => handleReview(selectedLeave.id, 'approve')}
                        disabled={reviewLoading}
                        className="btn-success text-xs px-4"
                      >
                        <CheckCircle size={14} /> Approve Leave
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Robust Document Viewer Modal */}
      {docPreview && (
        <Modal
          isOpen={!!docPreview}
          onClose={() => setDocPreview(null)}
          title={`📄 Document: ${docPreview.name}`}
          size="md"
        >
          <div className="space-y-4">
            {docPreview.data && docPreview.data.startsWith('data:image') ? (
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-2 text-center">
                <img src={docPreview.data} alt={docPreview.name} className="max-w-full h-auto mx-auto rounded-lg shadow-sm" />
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-left">
                <div className="flex items-center gap-3 p-3.5 bg-white border border-amber-200 rounded-xl shadow-sm">
                  <FileText size={32} className="text-[#EF7D35] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{docPreview.name}</h4>
                    <p className="text-xs text-slate-500">Medical Certificate / Doctor Prescription Document</p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-slate-900 border-b pb-1 text-sm">📄 Document Inspection Summary</p>
                  <p><span className="font-semibold text-slate-600">Document Name:</span> {docPreview.name}</p>
                  <p><span className="font-semibold text-slate-600">Verification Status:</span> Document attached by employee</p>
                  <p><span className="font-semibold text-slate-600">Access Control:</span> Verified for HR & Admin Review</p>
                </div>

                {docPreview.data && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                    <span>PDF / Document File Ready</span>
                    <button
                      type="button"
                      onClick={() => handleOpenPdf(docPreview.data!, docPreview.name)}
                      className="px-3 py-1.5 bg-[#EF7D35] hover:bg-[#d66b27] text-white font-semibold rounded-md shadow-sm transition flex items-center gap-1.5"
                    >
                      <Eye size={13} /> Open Document PDF
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {docPreview.data && (
                <button
                  type="button"
                  onClick={() => handleOpenPdf(docPreview.data!, docPreview.name)}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Download size={14} /> Download / Open PDF
                </button>
              )}
              <button onClick={() => setDocPreview(null)} className="btn-secondary text-xs">
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
