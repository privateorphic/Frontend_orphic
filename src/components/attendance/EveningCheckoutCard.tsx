import React, { useState } from 'react';
import { Moon, CheckCircle2, Clock, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import type { DailyAttendanceSummary } from '../../types';
import { CheckoutConfirmationModal } from './CheckoutConfirmationModal';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../common/Toast';

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
      showToast('Evening Check-Out successful! Work summary finalized.', 'success');
      setModalOpen(false);
      onAttendanceUpdated();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-out failed.';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between group">
        {/* Top Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 transition-all ${
            isCheckedOut
              ? 'bg-indigo-600'
              : isCheckedIn
              ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700'
              : 'bg-slate-300'
          }`}
        />

        {/* Background Glow */}
        <div
          className={`absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-opacity ${
            isCheckedOut
              ? 'bg-indigo-500/10'
              : isCheckedIn
              ? 'bg-purple-500/15'
              : 'bg-slate-200/20'
          }`}
        />

        <div>
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                  isCheckedOut
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : isCheckedIn
                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-purple-700 border border-purple-200/60'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Evening Office Departure</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Record departure time & lock final daily work state</p>
              </div>
            </div>

            {isCheckedOut ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Checked Out
              </span>
            ) : isCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80 shadow-2xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Ready to Check-Out
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Locked
              </span>
            )}
          </div>

          {isCheckedOut ? (
            <div className="space-y-3 mt-4">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Departure Timestamp</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {summary?.eveningCheckOut || '06:00 PM'}
                    </span>
                  </div>
                </div>
                <span className="text-2xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                  Finalized
                </span>
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-900/70 font-medium block">Total Office Work Duration</span>
                    <span className="text-xs font-extrabold text-indigo-950 font-mono">
                      {summary?.officeDuration || '9h 00m'}
                    </span>
                  </div>
                </div>
                <span className="text-2xs font-bold text-indigo-800 bg-indigo-200/60 px-2.5 py-1 rounded-lg font-mono">
                  Full Shift
                </span>
              </div>
            </div>
          ) : isCheckedIn ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>End-of-Day Workflow</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When ready to conclude your workday, click below to review your task progression, log completed objectives, and finalize departure.
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-200/60 text-slate-500 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-600 font-semibold">
                  Evening Check-Out is locked until Morning Check-In is performed.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-2xs text-slate-400 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" /> Follow the morning check-in card on the left
                </div>
              </div>
            </div>
          )}
        </div>

        {isCheckedIn && !isCheckedOut && (
          <div className="pt-5 mt-4 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 hover:from-indigo-700 hover:to-purple-900 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 active:translate-y-0"
            >
              <Moon className="w-4.5 h-4.5" />
              <span>Perform Evening Check-Out</span>
              <ArrowRight className="w-4 h-4 text-indigo-200 ml-auto" />
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

