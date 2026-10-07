import React, { useState } from 'react';
import { MapPin, Sun, CheckCircle2, Clock, AlertCircle, RefreshCw, ShieldCheck, Terminal } from 'lucide-react';
import type { DailyAttendanceSummary } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../common/Toast';
import { formatTime } from '../../utils/formatters.ts';

interface Props {
  summary: DailyAttendanceSummary | null;
  onAttendanceUpdated: () => void;
}

// Default Office Coordinates for Developer Mocking
const MOCK_OFFICE_LAT = 23.525123;
const MOCK_OFFICE_LNG = 77.808123;

export const MorningCheckInCard: React.FC<Props> = ({ summary, onAttendanceUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addressName, setAddressName] = useState<string | null>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    if (summary?.morningLatitude && summary?.morningLongitude) {
      const lat = summary.morningLatitude;
      const lng = summary.morningLongitude;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setAddressName(data.display_name);
          }
        })
        .catch(() => {});
    }
  }, [summary?.morningLatitude, summary?.morningLongitude]);

  const isCheckedIn = summary?.status === 'CHECKED_IN' || summary?.status === 'CHECKED_OUT';

  const performCheckInWithCoords = async (lat: number, lng: number) => {
    setLoading(true);
    setLocationError(null);
    try {
      await attendanceService.checkIn({ latitude: lat, longitude: lng });
      showToast('Morning Check-In successful! Morning task snapshot recorded.', 'success');
      onAttendanceUpdated();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-in failed. Please ensure you are within office radius.';
      setLocationError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await performCheckInWithCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLoading(false);
        let msg = 'Failed to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Please enable GPS access in your browser settings to check in.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information unavailable. Please verify GPS signal.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
        showToast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDevMockCheckIn = () => {
    performCheckInWithCoords(MOCK_OFFICE_LAT, MOCK_OFFICE_LNG);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between group">
      {/* Decorative Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all ${isCheckedIn ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'}`} />

      {/* Background Accent Glow */}
      <div className={`absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-opacity ${isCheckedIn ? 'bg-emerald-500/10' : 'bg-amber-500/15'}`} />

      <div>
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${isCheckedIn ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 border border-amber-200/60'}`}>
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Morning Office Arrival</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Record arrival time & freeze morning task snapshot</p>
            </div>
          </div>

          {isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Checked In
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Check-In
            </span>
          )}
        </div>

        {isCheckedIn ? (
          <div className="space-y-3 mt-4">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Check-In Timestamp</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {formatTime(summary?.morningCheckIn)}
                  </span>
                </div>
              </div>
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                Verified
              </span>
            </div>

            <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200/70 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <span className="text-xs text-sky-900/70 font-semibold block">Exact Check-In Location</span>
                  <span className="text-xs font-mono font-extrabold text-sky-950 block">
                    {summary?.morningLatitude && summary?.morningLongitude
                      ? `Lat: ${summary.morningLatitude.toFixed(6)}, Lng: ${summary.morningLongitude.toFixed(6)}`
                      : 'GPS Verified Location'}
                  </span>
                  {addressName && (
                    <span className="text-2xs text-slate-600 font-medium line-clamp-1 mt-0.5 block" title={addressName}>
                      📍 {addressName}
                    </span>
                  )}
                </div>
              </div>
              {summary?.morningDistanceFromOffice !== undefined && summary?.morningDistanceFromOffice !== null && (
                <span className="text-2xs font-bold text-sky-800 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg shrink-0">
                  {summary.morningDistanceFromOffice < 1 ? 'At Office' : `${Math.round(summary.morningDistanceFromOffice)}m from office`}
                </span>
              )}
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs text-amber-900/70 font-medium block">Locked Task Snapshot</span>
                  <span className="text-xs font-extrabold text-amber-950">
                    {summary?.morningTaskCount ?? 0} Tasks Captured at Check-In
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3 h-3 text-amber-700" /> Snapshot Frozen
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Automated Office Check-In Rules</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking <strong className="text-slate-900 font-semibold">Perform Morning Check-In</strong> will verify your GPS location against the office perimeter and capture your starting daily task snapshot for manager review.
              </p>
            </div>

            {locationError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl space-y-2.5 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-medium">{locationError}</span>
                </div>
                {locationError.toLowerCase().includes('wfh') && (
                  <a
                    href="/employee/leaves"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EF7D35] hover:bg-[#DC6422] text-white font-bold rounded-xl shadow-xs text-xs transition mt-1"
                  >
                    🏠 Apply for WFH Request
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!isCheckedIn && (
        <div className="pt-5 mt-4 border-t border-slate-100 space-y-3">
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Verifying Location & Checking In...</span>
              </>
            ) : (
              <>
                <MapPin className="w-4.5 h-4.5" />
                <span>Perform Morning Check-In</span>
              </>
            )}
          </button>

          {/* Dev Mode Testing Shortcut */}
          <button
            onClick={handleDevMockCheckIn}
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
            title="Use Default Office Location Coordinates (23.525123, 77.808123) for testing"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dev Mode: Check-In with Office GPS Coordinates</span>
          </button>
        </div>
      )}
    </div>
  );
};


