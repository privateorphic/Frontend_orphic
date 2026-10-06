import React, { useState } from 'react';
import { Square, X, AlertCircle } from 'lucide-react';
import { wfhService } from '../../services/wfhService';
import type { AttendanceRecord } from '../../types';

interface EndWorkDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (attendance: AttendanceRecord) => void;
}

export const EndWorkDayModal: React.FC<EndWorkDayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEndWorkDay = async () => {
    setLoading(true);
    setError(null);

    const completeWorkDay = async (lat?: number, lng?: number) => {
      try {
        const res = await wfhService.endWorkDay(
          lat && lng ? { latitude: lat, longitude: lng } : undefined
        );
        onSuccess(res);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to end workday');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => completeWorkDay(pos.coords.latitude, pos.coords.longitude),
        () => completeWorkDay(), // fallback without location if denied
        { timeout: 5000 }
      );
    } else {
      completeWorkDay();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Square className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">End Work Day?</h3>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to end your workday? Your shift duration and final task status snapshot will be finalized for today.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEndWorkDay}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Square className="w-4 h-4 fill-white" />
            )}
            <span>Confirm End Work Day</span>
          </button>
        </div>
      </div>
    </div>
  );
};
