import React, { useState } from 'react';
import { MapPin, Sun, CheckCircle2, Clock, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import type { DailyAttendanceSummary } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../common/Toast';
import { formatTime } from '../../utils/formatters.ts';

interface Props {
  summary: DailyAttendanceSummary | null;
  onAttendanceUpdated: () => void;
}

// Office coordinates fallback for local development testing
const MOCK_OFFICE_LAT = 23.525123;
const MOCK_OFFICE_LNG = 77.808123;

export const MorningCheckInCard: React.FC<Props> = ({ summary, onAttendanceUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { showToast } = useToast();

  const isCheckedIn = summary?.status === 'CHECKED_IN' || summary?.status === 'CHECKED_OUT';

  const performCheckInWithCoords = async (lat: number, lng: number) => {
    setLoading(true);
    setLocationError(null);
    try {
      await attendanceService.checkIn({ latitude: lat, longitude: lng });
      showToast('Morning Check-In successful!', 'success');
      onAttendanceUpdated();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-in failed. Please ensure you are within the office radius.';
      setLocationError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        performCheckInWithCoords(MOCK_OFFICE_LAT, MOCK_OFFICE_LNG);
        return;
      }
      setLocationError('Geolocation is not supported by your browser.');
      showToast('Geolocation is not supported by your browser.', 'error');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await performCheckInWithCoords(position.coords.latitude, position.coords.longitude);
      },
      async (error) => {
        // Automatically fallback to office coords if testing on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          await performCheckInWithCoords(MOCK_OFFICE_LAT, MOCK_OFFICE_LNG);
          return;
        }
        setLoading(false);
        let msg = 'Failed to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Please enable GPS in your browser settings to check in.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information unavailable. Please verify your GPS signal.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
        showToast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Morning Check-In</h3>
              <p className="text-xs text-slate-500">Record your arrival time</p>
            </div>
          </div>

          {isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Checked In
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Pending
            </span>
          )}
        </div>

        {/* Checked-in state */}
        {isCheckedIn ? (
          <div className="mt-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">Arrival Time</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {formatTime(summary?.morningCheckIn, false)}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified
            </span>
          </div>
        ) : (
          locationError && (
            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium">{locationError}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {locationError.toLowerCase().includes('wfh') && (
                  <a
                    href="/employee/leaves"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EF7D35] hover:bg-[#DC6422] text-white font-bold rounded-lg text-xs transition"
                  >
                    Apply for WFH Request
                  </a>
                )}
                {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                  <button
                    type="button"
                    onClick={() => performCheckInWithCoords(MOCK_OFFICE_LAT, MOCK_OFFICE_LNG)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
                  >
                    Test with Office GPS
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Action button if pending */}
      {!isCheckedIn && (
        <div className="pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#EF7D35] hover:bg-[#DC6422] active:bg-[#C85317] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking In...</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Perform Morning Check-In</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
