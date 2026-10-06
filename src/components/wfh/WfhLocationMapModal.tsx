import React from 'react';
import { MapPin, X, ExternalLink, Clock, User } from 'lucide-react';
import type { WfhActiveEmployee } from '../../types';

interface WfhLocationMapModalProps {
  employee: WfhActiveEmployee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WfhLocationMapModal: React.FC<WfhLocationMapModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  const lat = employee.lastLatitude;
  const lng = employee.lastLongitude;
  const mapUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  const embedMapUrl = lat && lng ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{employee.employeeName} — WFH Location</h3>
              <p className="text-xs text-slate-400">
                {employee.departmentName || 'Department'} • Code: {employee.employeeCode || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider block mb-1">Status</span>
              <span className="font-semibold text-emerald-400">{employee.status}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider block mb-1">Check-in Time</span>
              <span className="font-semibold text-slate-200">{employee.checkInTime || '—'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider block mb-1">Last Captured</span>
              <span className="font-semibold text-slate-200">
                {employee.lastCapturedAt ? new Date(employee.lastCapturedAt).toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>

          {/* Map Preview */}
          {embedMapUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-64 shadow-inner">
              <iframe
                title="Employee WFH Location"
                width="100%"
                height="100%"
                frameBorder="0"
                src={embedMapUrl}
                className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
              />
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm">
              No GPS coordinates captured yet for this active session.
            </div>
          )}

          {lat && lng && (
            <div className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span>Latitude: {lat.toFixed(6)}</span>
              <span>Longitude: {lng.toFixed(6)}</span>
              {employee.lastAccuracyMeters && (
                <span>Accuracy: ±{Math.round(employee.lastAccuracyMeters)}m</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
