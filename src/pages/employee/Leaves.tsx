import { useEffect, useState } from 'react';
import { Plus, X, AlertCircle, Calendar, Paperclip, FileText, Upload } from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import type { LeaveRequest, LeaveRequestInput, LeaveType } from '../../types';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getOneDayAheadStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getTwoDaysAheadStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [form, setForm] = useState<LeaveRequestInput>({
    leaveType: 'WORK_FROM_HOME',
    startDate: getTodayDateStr(),
    endDate: getTodayDateStr(),
    reason: '',
  });

  // Attached medical document file
  const [attachedDoc, setAttachedDoc] = useState<{ name: string; base64?: string } | null>(null);

  const fetchLeaves = async () => {
    setLoading(true); setError('');
    try { setLeaves(await leaveService.getMyLeaves()); }
    catch { setError('Unable to load leave requests.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const getMinDateForType = (type: LeaveType) => {
    if (type === 'SICK' || type === 'WORK_FROM_HOME') return getTodayDateStr();
    if (type === 'CASUAL') return getOneDayAheadStr();
    return getTwoDaysAheadStr();
  };

  const minStartDate = getMinDateForType(form.leaveType);

  const handleLeaveTypeChange = (type: LeaveType) => {
    setForm((p) => {
      const newMin = getMinDateForType(type);
      let newStart = p.startDate;
      if (!newStart || newStart < newMin) {
        newStart = newMin;
      }
      return {
        ...p,
        leaveType: type,
        startDate: newStart,
        endDate: p.endDate && p.endDate < newStart ? newStart : p.endDate,
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('error', 'File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedDoc({
        name: file.name,
        base64: reader.result as string,
      });
      toast('success', `Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.startDate) {
      toast('error', 'Please select a start date');
      return;
    }

    if (!form.reason.trim()) {
      toast('error', 'Please provide a reason for your leave request');
      return;
    }

    // End date is optional. If left blank, default to start date (1-day leave).
    const finalEndDate = form.endDate && form.endDate.trim() ? form.endDate : form.startDate;

    if (finalEndDate < form.startDate) {
      toast('error', 'End date cannot be before start date');
      return;
    }

    // Advance notice requirement rules
    if (form.leaveType === 'CASUAL' && form.startDate < getOneDayAheadStr()) {
      toast('error', 'Casual Leave must be informed at least 1 day in advance.');
      return;
    }
    if (form.leaveType === 'OTHER' && form.startDate < getTwoDaysAheadStr()) {
      toast('error', 'Other Leave requests must be informed at least 2 days in advance.');
      return;
    }

    let finalReason = form.reason.trim();
    if (attachedDoc) {
      if (attachedDoc.base64) {
        finalReason = `[Medical Doc: ${attachedDoc.name} | DATA:${attachedDoc.base64}] ${finalReason}`;
      } else {
        finalReason = `[Medical Doc: ${attachedDoc.name}] ${finalReason}`;
      }
    }

    setFormLoading(true);
    try {
      await leaveService.applyLeave({
        ...form,
        endDate: finalEndDate,
        reason: finalReason,
      });
      toast('success', 'Leave application submitted successfully');
      setApplyOpen(false);
      setForm({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
      setAttachedDoc(null);
      fetchLeaves();
    } catch (err: any) {
      toast('error', err.message || 'Failed to submit leave application');
    }
    finally { setFormLoading(false); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await leaveService.cancelLeave(id);
      toast('success', 'Leave request cancelled');
      fetchLeaves();
    } catch { toast('error', 'Failed to cancel leave request'); }
  };

  const isSickLeave = form.leaveType === 'SICK';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">{leaves.length} total requests</p>
        </div>
        <button onClick={() => setApplyOpen(true)} className="btn-primary">
          <Plus size={16} /> Apply Leave / WFH
        </button>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchLeaves} /> :
        leaves.length === 0 ? (
          <EmptyState message="No leave or WFH requests yet" description="Click 'Apply Leave / WFH' to submit your first request" />
        ) : (
          <div className="space-y-3">
            {leaves.map((l) => (
              <div key={l.id} className="card p-4 border border-[#F3DCCB]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge value={l.leaveType === 'SICK' ? 'MEDICAL / EMERGENCY' : l.leaveType === 'WORK_FROM_HOME' ? 'WORK FROM HOME (WFH)' : l.leaveType} />
                      <Badge value={l.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>📅 {l.startDate} {l.endDate && l.endDate !== l.startDate ? `→ ${l.endDate}` : '(Single Day)'}</span>
                      <span className="font-semibold">{l.totalDays || 1} day{(l.totalDays || 1) !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1.5 font-medium">{l.reason}</p>
                    {l.reviewedByName && (
                      <p className="text-xs text-slate-400 mt-1">
                        Reviewed by {l.reviewedByName}
                        {l.reviewComments && ` — "${l.reviewComments}"`}
                      </p>
                    )}
                  </div>
                  {l.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(l.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                      title="Cancel request"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Apply Modal */}
      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for Leave / WFH Request" size="md">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="form-label">Request Type <span className="text-red-500">*</span></label>
            <select
              value={form.leaveType}
              onChange={(e) => handleLeaveTypeChange(e.target.value as LeaveType)}
              className="form-select font-medium text-slate-800"
            >
              <option value="WORK_FROM_HOME">🏠 Work From Home (WFH) Request (Immediate)</option>
              <option value="SICK">Medical / Emergency Leave (Immediate)</option>
              <option value="CASUAL">Casual Leave (Inform 1 day in advance)</option>
              <option value="OTHER">Other Leave (Inform 2 days in advance)</option>
            </select>
            <p className={`text-xs mt-1.5 flex items-center gap-1 ${
              form.leaveType === 'WORK_FROM_HOME' || form.leaveType === 'SICK'
                ? 'text-emerald-700 font-medium'
                : 'text-amber-700 font-medium'
            }`}>
              <AlertCircle size={13} />
              {form.leaveType === 'WORK_FROM_HOME' && 'WFH requests can be submitted immediately for today.'}
              {form.leaveType === 'SICK' && 'Medical / Emergency leave can be applied immediately.'}
              {form.leaveType === 'CASUAL' && 'Casual leave requests must be informed at least 1 day in advance.'}
              {form.leaveType === 'OTHER' && 'Other leave requests must be informed at least 2 days in advance.'}
            </p>
          </div>

          {/* Simple Medical Document Attachment Section */}
          {isSickLeave && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
              <label className="form-label flex items-center gap-1.5 text-xs text-amber-900 font-bold mb-0">
                <Paperclip size={14} className="text-[#EF7D35]" /> Medical Certificate / Document (Optional)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:border-[#EF7D35] rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition">
                  <Upload size={13} className="text-[#EF7D35]" />
                  {attachedDoc ? 'Change Document' : 'Attach Medical Document / Prescriptions'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {attachedDoc && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800">
                    <FileText size={13} />
                    <span className="truncate max-w-[170px]">{attachedDoc.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedDoc(null)}
                      className="text-emerald-700 hover:text-red-600 ml-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start Date <span className="text-red-500">*</span></label>
              <input
                required
                type="date"
                value={form.startDate}
                min={minStartDate}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  startDate: e.target.value,
                  endDate: p.endDate && p.endDate < e.target.value ? e.target.value : p.endDate,
                }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label flex items-center justify-between">
                <span>End Date</span>
                <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || minStartDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="form-input"
                placeholder="Defaults to start date"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Calendar size={11} /> Leave blank for 1-day leave
              </p>
            </div>
          </div>

          <div>
            <label className="form-label">Reason / Description <span className="text-red-500">*</span></label>
            <textarea
              required
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              rows={3}
              placeholder="Please provide details about your leave application..."
              className="form-input"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setApplyOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={formLoading} className="btn-primary">
              {formLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
