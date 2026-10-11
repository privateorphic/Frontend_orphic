import React, { useState } from 'react';
import { X, Moon, CheckCircle2, Clock, ListTodo, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { DailyAttendanceSummary } from '../../types';
import { formatTime } from '../../utils/formatters.ts';

interface Props {
  isOpen: boolean;
  summary: DailyAttendanceSummary | null;
  onClose: () => void;
  onConfirm: (location?: { latitude?: number; longitude?: number }) => Promise<void>;
}

export const CheckoutConfirmationModal: React.FC<Props> = ({
  isOpen,
  summary,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmCheckout = async () => {
    setSubmitting(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await onConfirm({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            setSubmitting(false);
          },
          async () => {
            // Even if location fails, complete evening checkout
            await onConfirm();
            setSubmitting(false);
          },
          { timeout: 5000 }
        );
      } else {
        await onConfirm();
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7C2D12] via-[#94401A] to-[#EF7D35] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-orange-200 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/20 text-white border border-white/30 flex items-center justify-center shadow-inner">
              <Moon className="w-6.5 h-6.5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Evening Check-Out</h3>
              <p className="text-xs text-orange-100 font-medium mt-0.5">Confirm departure & finalize today's work snapshot</p>
            </div>
          </div>
        </div>

        {/* Modal Body - Today's Summary */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#EF7D35]" /> Today's Work Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium block">Morning Check-In</span>
                <span className="font-extrabold text-slate-900 font-mono text-base">{formatTime(summary?.morningCheckIn)}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium block">Current Time</span>
                <span className="font-extrabold text-[#EF7D35] font-mono text-base">{formatTime(new Date())}</span>
              </div>
            </div>
          </div>

          {/* Task Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#FFF4EC] border border-[#FBCBA8] rounded-2xl text-center">
              <ListTodo className="w-4 h-4 text-[#EF7D35] mx-auto mb-1" />
              <span className="text-2xs text-[#7C2D12] font-bold block">Morning</span>
              <span className="text-xl font-black text-[#7C2D12]">{summary?.morningTaskCount ?? 0}</span>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-center">
              <PlusCircle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span className="text-2xs text-amber-800 font-bold block">Added</span>
              <span className="text-xl font-black text-amber-900">+{summary?.tasksAdded ?? 0}</span>
            </div>

            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-2xs text-emerald-800 font-bold block">Completed</span>
              <span className="text-xl font-black text-emerald-900">{summary?.completedTaskCount ?? 0}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">
              Performing Evening Check-Out locks your final task snapshot for today. Tasks completed on previous shifts are excluded from this report.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4.5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmCheckout}
            disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-[#EF7D35] via-[#DC6422] to-[#B84E1A] hover:from-[#DC6422] hover:to-[#7C2D12] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" /> Finalizing Check-Out...
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" /> Confirm Evening Departure
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

