import React, { useState } from 'react';
import { Calendar, FileText, Send, X, AlertCircle } from 'lucide-react';
import { wfhService } from '../../services/wfhService';
import type { WfhResponse } from '../../types';

interface WfhRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: WfhResponse) => void;
}

export const WfhRequestModal: React.FC<WfhRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please enter a valid reason for Work From Home');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await wfhService.createWfhRequest({ date, reason, notes });
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit WFH request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Request Work From Home</h2>
              <p className="text-xs text-slate-400">Submit WFH request for HR/Admin approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              WFH Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Reason for WFH *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to Work From Home on this date..."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Will be available on Slack / Phone throughout shift"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder:text-slate-600"
            />
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              WFH requests must be approved by HR or Admin before WFH check-in is enabled. You can monitor your request status in the Leave & WFH section.
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
