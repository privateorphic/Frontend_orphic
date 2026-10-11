import React, { useState } from 'react';
import { Moon, CheckCircle2, Clock, Lock, ArrowRight } from 'lucide-react';
import type { DailyAttendanceSummary } from '../../types';
import { CheckoutConfirmationModal } from './CheckoutConfirmationModal';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../common/Toast';
import { formatTime } from '../../utils/formatters.ts';

interface Props {
  summary: DailyAttendanceSummary | null;
  onAttendanceUpdated: () => void;
}

export const EveningCheckoutCard: React.FC<Props> = ({ summary, onAttendanceUpdated }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  const isCheckedIn = summary?.status === 'CHECKED_IN' || summary?.status === 'REOPENED';
  const isCheckedOut = summary?.status === 'CHECKED_OUT';

  const handleConfirmCheckout = async (location?: { latitude?: number; longitude?: number }) => {
    try {
      await attendanceService.checkOut(location);
      showToast('Evening Check-Out successful!', 'success');
      setModalOpen(false);
      onAttendanceUpdated();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-out failed.';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isCheckedOut
                    ? 'bg-indigo-50 text-indigo-600'
                    : isCheckedIn
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Evening Check-Out</h3>
                <p className="text-xs text-slate-500">Record your departure time</p>
              </div>
            </div>

            {isCheckedOut ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                Checked Out
              </span>
            ) : isCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Ready to Check Out
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Locked
              </span>
            )}
          </div>

          {/* Body Content */}
          {isCheckedOut ? (
            <div className="mt-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Departure Time</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatTime(summary?.eveningCheckOut, false)}
                  </span>
                </div>
              </div>
              {summary?.officeDuration && (
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                  Duration: {summary.officeDuration}
                </span>
              )}
            </div>
          ) : isCheckedIn ? (
            <div className="mt-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-900 leading-relaxed font-medium">
              Ready to wrap up your workday? Click below to record your departure time and finalize today's attendance.
            </div>
          ) : (
            <div className="mt-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center gap-3 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Evening Check-Out unlocks after morning check-in is completed.</span>
            </div>
          )}
        </div>

        {/* Action Button if checked in and not checked out */}
        {isCheckedIn && !isCheckedOut && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Moon className="w-4 h-4" />
              <span>Perform Evening Check-Out</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
            </button>
          </div>
        )}
      </div>

      <CheckoutConfirmationModal
        isOpen={modalOpen}
        summary={summary}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmCheckout}
      />
    </>
  );
};
