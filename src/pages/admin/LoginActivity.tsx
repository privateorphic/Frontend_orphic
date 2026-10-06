import { useEffect, useState, useMemo } from 'react';
import {
  Search, RefreshCw, Clock, Calendar, UserCheck,
  LogOut, Activity, Filter, MapPin, Building2, ExternalLink, X, Navigation
} from 'lucide-react';
import { loginActivityService } from '../../services/loginActivityService';
import type { LoginActivity } from '../../types';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const QUICK_FILTERS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
];

function calculateDuration(loginTime?: string, logoutTime?: string, status?: string): string {
  if (!loginTime) return '—';
  if (status === 'ACTIVE' || !logoutTime || logoutTime === '—') {
    return 'Active Session';
  }

  try {
    const parseTime = (timeStr: string) => {
      if (timeStr.includes('T')) {
        return new Date(timeStr).getTime();
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      return new Date(`${todayStr} ${timeStr}`).getTime();
    };

    const start = parseTime(loginTime);
    const end = parseTime(logoutTime);

    if (isNaN(start) || isNaN(end) || end <= start) {
      return '—';
    }

    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${mins}m`;
  } catch {
    return '—';
  }
}

export default function AdminLoginActivityPage() {
  const [data, setData] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('ALL'); // ALL, IN_OFFICE, OUTSIDE_OFFICE
  const [viewMode, setViewMode] = useState<'daywise' | 'table'>('daywise');

  // Selected Activity for Map Modal
  const [selectedMapActivity, setSelectedMapActivity] = useState<LoginActivity | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      let result: LoginActivity[] = [];
      try {
        result = await loginActivityService.getAll({ startDate, endDate });
      } catch {
        result = await loginActivityService.hrGetAll();
      }
      setData(result || []);
    } catch {
      setError('Unable to load login activity.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  // Filtered records
  const filtered = useMemo(() => {
    return data.filter((la) => {
      const matchSearch =
        !search ||
        (la.employeeName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (la.employeeId ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (la.departmentName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (la.locationName ?? '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = !statusFilter || la.status === statusFilter;

      const isOffice = la.isOfficeLocation === true || (!la.isOfficeLocation && la.locationName === 'In Office');
      const matchLocation =
        locationFilter === 'ALL' ||
        (locationFilter === 'IN_OFFICE' && isOffice) ||
        (locationFilter === 'OUTSIDE_OFFICE' && !isOffice);

      return matchSearch && matchStatus && matchLocation;
    });
  }, [data, search, statusFilter, locationFilter]);

  // Day-wise Grouped Data Mapping
  const dayWiseGroups = useMemo(() => {
    const map: Record<string, LoginActivity[]> = {};
    filtered.forEach((item) => {
      const dateKey = item.loginDate || new Date().toISOString().slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });

    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalSessions = filtered.length;
    const activeSessions = filtered.filter((d) => d.status === 'ACTIVE').length;
    const inOfficeCount = filtered.filter((d) => d.isOfficeLocation === true || d.locationName === 'In Office').length;
    const outsideOfficeCount = totalSessions - inOfficeCount;
    return { totalSessions, activeSessions, inOfficeCount, outsideOfficeCount };
  }, [filtered]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F3DCCB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1410] flex items-center gap-2">
            <Activity size={26} className="text-[#EF7D35]" />
            Employee Login & Location Tracking Log
          </h1>
          <p className="text-xs text-[#78655A] mt-1">
            Real-time employee logins, session durations, and location tracking (In Office vs. Outside Office GPS)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-[#EF7D35]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Logins</p>
              <p className="text-2xl font-bold text-[#1F1410] mt-1">{stats.totalSessions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EC] text-[#EF7D35] flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Now</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeSessions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">🏢 In Office Logins</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.inOfficeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">📍 Outside Office Logins</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{stats.outsideOfficeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <MapPin size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Switcher */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => applyQuickFilter(days)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#FFF4EC] hover:text-[#DC6422] text-slate-600 transition"
              >
                {label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('daywise')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'daywise'
                  ? 'bg-[#EF7D35] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} /> Day-Wise Grouped Log
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-[#EF7D35] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter size={14} /> All Activity Table
            </button>
          </div>
        </div>

        {/* Inputs Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name, ID, department, or location..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35]"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="LOGGED_OUT">Logged Out Only</option>
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white font-semibold text-[#EF7D35] focus:outline-none focus:ring-2 focus:ring-[#EF7D35]/20 focus:border-[#EF7D35]"
          >
            <option value="ALL">All Locations</option>
            <option value="IN_OFFICE">🏢 In Office Only</option>
            <option value="OUTSIDE_OFFICE">📍 Outside Office Only</option>
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No login activity found" description="Try adjusting the date range or location filters" />
      ) : viewMode === 'daywise' ? (
        /* ================= VIEW 1: DAY-WISE GROUPED VIEW ================= */
        <div className="space-y-6">
          {dayWiseGroups.map(([dateStr, items]) => {
            const dateObj = new Date(dateStr);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={dateStr} className="card overflow-hidden border border-[#F3DCCB] shadow-sm">
                {/* Date Group Header */}
                <div className="bg-[#FFF4EC] px-6 py-3.5 border-b border-[#FBCBA8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-[#EF7D35]" />
                    <h3 className="font-bold text-[#1F1410] text-sm sm:text-base">{formattedDate}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EF7D35] text-white">
                      {dateStr}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-[#78655A]">
                    <span>Total Logins: <strong className="text-[#1F1410]">{items.length}</strong></span>
                    <span>In Office: <strong className="text-blue-600">{items.filter((x) => x.isOfficeLocation === true || x.locationName === 'In Office').length}</strong></span>
                    <span>Outside Office: <strong className="text-purple-600">{items.filter((x) => x.isOfficeLocation === false && x.locationName !== 'In Office').length}</strong></span>
                  </div>
                </div>

                {/* Day's Employee Activity Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                        <th className="table-header">Employee</th>
                        <th className="table-header">Employee ID</th>
                        <th className="table-header hidden md:table-cell">Department</th>
                        <th className="table-header">Login Location</th>
                        <th className="table-header">Login Time</th>
                        <th className="table-header">Logout Time</th>
                        <th className="table-header">Day Duration</th>
                        <th className="table-header hidden lg:table-cell">IP Address</th>
                        <th className="table-header">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {items.map((la) => {
                        const durationStr = la.sessionDuration || calculateDuration(la.loginTime, la.logoutTime, la.status);
                        const isOffice = la.isOfficeLocation === true || (!la.isOfficeLocation && la.locationName === 'In Office');

                        return (
                          <tr key={la.id} className="hover:bg-amber-50/20 transition">
                            <td className="table-cell">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#FFF4EC] border border-[#FBCBA8] text-[#EF7D35] font-bold text-xs flex items-center justify-center">
                                  {la.employeeName?.charAt(0) || 'E'}
                                </div>
                                <span className="font-semibold text-slate-800">{la.employeeName ?? '—'}</span>
                              </div>
                            </td>
                            <td className="table-cell font-mono text-xs font-semibold text-slate-600">{la.employeeId ?? '—'}</td>
                            <td className="table-cell hidden md:table-cell text-slate-600">{la.departmentName ?? '—'}</td>

                            {/* Location Column */}
                            <td className="table-cell">
                              {isOffice ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Building2 size={13} /> In Office
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 max-w-[240px]"
                                    title={la.locationName || 'Outside Office'}
                                  >
                                    <MapPin size={13} className="shrink-0 text-purple-600" />
                                    <span className="truncate">{la.locationName || 'Outside Office'}</span>
                                  </span>
                                  <button
                                    onClick={() => setSelectedMapActivity(la)}
                                    title="View exact location on Map"
                                    className="p-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition shrink-0"
                                  >
                                    <Navigation size={13} />
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="table-cell font-mono text-xs font-bold text-emerald-700">{la.loginTime}</td>
                            <td className="table-cell font-mono text-xs font-bold text-red-600">
                              {la.logoutTime && la.logoutTime !== '—' ? la.logoutTime : (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">Logged In Now</span>
                              )}
                            </td>
                            <td className="table-cell font-mono text-xs font-extrabold text-[#1F1410]">
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
                                <Clock size={12} className="text-[#EF7D35]" />
                                {durationStr}
                              </span>
                            </td>
                            <td className="table-cell hidden lg:table-cell font-mono text-xs text-slate-400">{la.ipAddress || '192.168.1.1'}</td>
                            <td className="table-cell">
                              <Badge value={la.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= VIEW 2: FLAT TABLE VIEW ================= */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="table-header">Employee</th>
                  <th className="table-header">Employee ID</th>
                  <th className="table-header hidden md:table-cell">Department</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Login Time</th>
                  <th className="table-header">Logout Time</th>
                  <th className="table-header">Duration</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((la) => {
                  const isOffice = la.isOfficeLocation === true || (!la.isOfficeLocation && la.locationName === 'In Office');
                  return (
                    <tr key={la.id} className="hover:bg-slate-50 transition">
                      <td className="table-cell font-semibold text-slate-800">{la.employeeName ?? '—'}</td>
                      <td className="table-cell font-mono text-xs font-semibold text-slate-600">{la.employeeId ?? '—'}</td>
                      <td className="table-cell hidden md:table-cell text-slate-600">{la.departmentName ?? '—'}</td>
                      <td className="table-cell font-mono text-xs text-slate-700">{la.loginDate}</td>
                      <td className="table-cell">
                        {isOffice ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Building2 size={12} /> In Office
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedMapActivity(la)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition max-w-[240px]"
                            title={la.locationName || 'Outside Office'}
                          >
                            <MapPin size={12} className="shrink-0 text-purple-600" />
                            <span className="truncate">{la.locationName || 'Outside Office'}</span>
                          </button>
                        )}
                      </td>
                      <td className="table-cell font-mono text-xs font-semibold text-emerald-700">{la.loginTime}</td>
                      <td className="table-cell font-mono text-xs font-semibold text-red-600">{la.logoutTime ?? '—'}</td>
                      <td className="table-cell font-mono text-xs font-semibold text-slate-800">
                        {la.sessionDuration || calculateDuration(la.loginTime, la.logoutTime, la.status)}
                      </td>
                      <td className="table-cell">
                        <Badge value={la.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Location Map Popup Modal */}
      {selectedMapActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#FBCBA8] space-y-5 relative">
            <button
              onClick={() => setSelectedMapActivity(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {selectedMapActivity.employeeName} ({selectedMapActivity.employeeId})
                </h3>
                <p className="text-xs text-slate-500">
                  Login Location Details • {selectedMapActivity.loginDate} at {selectedMapActivity.loginTime}
                </p>
              </div>
            </div>

            {/* Location Details Box */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Location Status</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                  <MapPin size={16} className="text-purple-600" />
                  Outside Office Login
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Captured Location Name / Address</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {selectedMapActivity.locationName || 'Outside Office (GPS Recorded)'}
                </p>
              </div>

              {selectedMapActivity.latitude && selectedMapActivity.longitude && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200/60 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px]">LATITUDE</span>
                    <p className="font-bold text-slate-800">{selectedMapActivity.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">LONGITUDE</span>
                    <p className="font-bold text-slate-800">{selectedMapActivity.longitude.toFixed(6)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Map Preview Embed / Link */}
            {selectedMapActivity.latitude && selectedMapActivity.longitude ? (
              <div className="space-y-3">
                <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedMapActivity.longitude - 0.005}%2C${selectedMapActivity.latitude - 0.005}%2C${selectedMapActivity.longitude + 0.005}%2C${selectedMapActivity.latitude + 0.005}&layer=mapnik&marker=${selectedMapActivity.latitude}%2C${selectedMapActivity.longitude}`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${selectedMapActivity.latitude},${selectedMapActivity.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full justify-center text-xs py-2.5 rounded-xl shadow-md flex items-center gap-2"
                >
                  <ExternalLink size={14} /> Open in Google Maps
                </a>
              </div>
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMapActivity.locationName || 'Outside Office')}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full justify-center text-xs py-2.5 rounded-xl shadow-md flex items-center gap-2"
              >
                <ExternalLink size={14} /> Search Location on Google Maps
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
