import React, { useState, useEffect } from 'react';
import { Home, MapPin, Play, Square, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { wfhService } from '../../services/wfhService';
import type { AttendanceRecord } from '../../types';
import { formatTime } from '../../utils/formatters.ts';

interface WfhWorkdayCardProps {
  attendance: AttendanceRecord | null;
  isWfhApprovedToday: boolean;
  onRefresh: () => void;
  onOpenEndWorkDay: () => void;
}

export const WfhWorkdayCard: React.FC<WfhWorkdayCardProps> = ({
  attendance,
  isWfhApprovedToday,
  onRefresh,
  onOpenEndWorkDay,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Idle');

  const isWorking = attendance?.status === 'WORKING' || attendance?.status === 'CHECKED_IN';
  const isCompleted = attendance?.status === 'COMPLETED' || attendance?.status === 'CHECKED_OUT';
  const isWfh = attendance?.workMode === 'WFH';

  // Periodic location ping when working under WFH mode
  useEffect(() => {
    if (!isWorking || !isWfh) return;

    const sendLocationPing = () => {
      if (!navigator.geolocation) {
        setLocationStatus('GPS not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await wfhService.recordLocation(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy
            );
            setLocationStatus(`Location verified (${formatTime(new Date())})`);
          } catch {
            setLocationStatus('Location update failed');
          }
        },
        (err) => {
          setLocationStatus(`GPS permission error: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Initial ping
    sendLocationPing();

    // 5-minute interval ping
    const interval = setInterval(sendLocationPing, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isWorking, isWfh]);

  const handleWfhCheckIn = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is required for WFH Check-in');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await wfhService.wfhCheckIn({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          onRefresh();
        } catch (err: any) {
          setError(err.message || 'WFH Check-in failed');
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLoading(false);
        setError(`Location access required for WFH check-in: ${geoErr.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            isWfh
              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
          }`}>
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">
                {isWfh ? 'Work From Home Shift' : 'Today Work Status'}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isWfh
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {attendance?.workMode || (isWfhApprovedToday ? 'WFH APPROVED' : 'OFFICE')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isWorking
                ? 'Your workday is active. Tasks and location are being monitored.'
                : isCompleted
                ? 'Your workday has been completed today.'
                : isWfhApprovedToday
                ? 'You have an approved WFH request for today!'
                : 'Regular office work day'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Shift Status</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isWorking ? 'bg-emerald-400 animate-pulse' : isCompleted ? 'bg-blue-400' : 'bg-slate-500'
            }`} />
            <span className="font-semibold text-slate-200 text-sm">
              {attendance?.status || 'NOT_STARTED'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Check-in Time</span>
          <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>{formatTime(attendance?.morningCheckIn)}</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Work Duration</span>
          <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{attendance?.officeDuration || (isWorking ? 'In Progress' : '—')}</span>
          </div>
        </div>
      </div>

      {/* Location Status Indicator for Active WFH */}
      {isWorking && isWfh && (
        <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <MapPin className="w-4 h-4 text-purple-400 animate-bounce" />
            <span>Location Verification: <strong>{locationStatus}</strong></span>
          </div>
          <span className="text-slate-400">Updates auto-pings every 5 mins</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isWorking && !isCompleted && isWfhApprovedToday && (
          <button
            onClick={handleWfhCheckIn}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>Start WFH Workday</span>
          </button>
        )}

        {isWorking && (
          <button
            onClick={onOpenEndWorkDay}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/20"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>End Work Day</span>
          </button>
        )}

        {isCompleted && (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Workday Completed Today</span>
          </div>
        )}
      </div>
    </div>
  );
};
