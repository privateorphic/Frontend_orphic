import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

// Office Coordinates from Google Maps (https://maps.app.goo.gl/Kr79KhSYvdmvGCyc6)
const OFFICE_LAT = 23.2338255;
const OFFICE_LNG = 77.4355138;
const OFFICE_RADIUS_METERS = 500; // 500 meters radius

// Helper: Haversine Formula for distance calculation in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Acquire location via GPS or IP fallback
async function acquireLocation(): Promise<{
  isOfficeLocation: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}> {
  // 1. Try Browser Geolocation API
  if (navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4000,
          enableHighAccuracy: true,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const dist = getDistanceMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);

      if (dist <= OFFICE_RADIUS_METERS) {
        return { isOfficeLocation: true, locationName: 'In Office' };
      } else {
        // Outside office: Reverse geocode exact locality/address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
          );
          const data = await res.json();
          const place = data.display_name
            ? data.display_name.split(',').slice(0, 3).join(', ')
            : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          return {
            isOfficeLocation: false,
            latitude: lat,
            longitude: lng,
            locationName: place,
          };
        } catch {
          return {
            isOfficeLocation: false,
            latitude: lat,
            longitude: lng,
            locationName: `Outside Office (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          };
        }
      }
    } catch {
      // GPS unavailable/denied -> proceed to IP lookup
    }
  }

  // 2. IP-based Geolocation Fallback
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      const lat = data.latitude;
      const lng = data.longitude;
      const dist = getDistanceMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);

      if (dist <= OFFICE_RADIUS_METERS) {
        return { isOfficeLocation: true, locationName: 'In Office' };
      } else {
        const place = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
        return {
          isOfficeLocation: false,
          latitude: lat,
          longitude: lng,
          locationName: place || `Outside Office (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        };
      }
    }
  } catch {
    // Ignore error
  }

  return { isOfficeLocation: true, locationName: 'In Office' };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Location data acquired silently in background (does not show on sign-in UI)
  const [locationData, setLocationData] = useState<{
    isOfficeLocation: boolean;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }>({
    isOfficeLocation: true,
    locationName: 'In Office',
  });

  // Background Geolocation Detection on mount
  useEffect(() => {
    acquireLocation().then(setLocationData);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your Employee ID/Email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Re-resolve location if current locationData is missing coords while outside office
      let currentLoc = locationData;
      if (currentLoc.isOfficeLocation && !currentLoc.latitude) {
        currentLoc = await acquireLocation();
      }

      const user = await login(identifier.trim(), password, currentLoc);
      if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'HR') navigate('/hr/dashboard', { replace: true });
      else navigate('/employee/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(msg.includes('401') || msg.includes('Bad credentials')
        ? 'Invalid Employee ID/Email or password.'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1F1410]">Sign in to your account</h2>
        <p className="text-[#78655A] text-sm mt-1">Enter your Employee ID or email address</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#1F1410] mb-1.5">
            Employee ID or Email
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="EMP001 or name@company.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FFF4EC] border border-[#FBCBA8] text-[#1F1410] placeholder-[#A8917F] focus:outline-none focus:border-[#EF7D35] focus:ring-4 focus:ring-[#EF7D35]/25 transition"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1F1410] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FFF4EC] border border-[#FBCBA8] text-[#1F1410] placeholder-[#A8917F] focus:outline-none focus:border-[#EF7D35] focus:ring-4 focus:ring-[#EF7D35]/25 transition pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8917F] hover:text-[#EF7D35] transition"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 text-white text-base font-bold rounded-xl shadow-[0_4px_14px_rgba(239,125,53,0.4)] transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          style={{
            background: 'linear-gradient(135deg, #EF7D35 0%, #DC6422 100%)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #DC6422 0%, #B84E1A 100%)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #EF7D35 0%, #DC6422 100%)';
          }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Signing in...</>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}
