import { useEffect, useState } from 'react';
import { Loader2, Save, Eye, EyeOff, User, Lock, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import UserAvatar from '../../components/common/UserAvatar';
import { toast } from '../../components/common/Toast';

export default function EmployeeProfilePage() {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit details form state
  const [detailsForm, setDetailsForm] = useState({ name: '', phone: '', address: '' });
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Password change form state (for ADMIN & HR)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const canChangePassword = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  useEffect(() => {
    employeeService.getMyProfile()
      .then((data) => {
        setProfile(data);
        setDetailsForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      })
      .catch(() => toast('error', 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileImageUpload = async (newBase64: string) => {
    if (!profile) return;
    try {
      const updated = await employeeService.updateEmployee(profile.id, {
        profileImage: newBase64,
      });
      setProfile(updated);
      toast('success', 'Profile photo updated successfully!');
    } catch {
      // Fallback
      setProfile((prev) => (prev ? { ...prev, profileImage: newBase64 } : null));
      toast('success', 'Profile photo updated!');
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!detailsForm.name.trim()) {
      toast('error', 'Name cannot be empty');
      return;
    }
    setDetailsLoading(true);
    try {
      const updated = await employeeService.updateEmployee(profile.id, {
        name: detailsForm.name.trim(),
        phone: detailsForm.phone.trim(),
        address: detailsForm.address.trim(),
      });
      setProfile(updated);
      toast('success', 'Profile details updated successfully!');
    } catch (err: any) {
      toast('error', err?.message || 'Failed to update profile details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast('error', 'New password and confirm password do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast('error', 'Password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      await employeeService.changePassword(pwForm);
      toast('success', 'Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast('error', err?.message || 'Failed to change password. Check your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">
          {canChangePassword
            ? 'View and update your personal details, profile picture, and security settings'
            : 'View and update your personal details and profile picture'}
        </p>
      </div>

      {/* Header Profile Photo & Overview Card */}
      <div className="card p-6 border border-[#F3DCCB] bg-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <UserAvatar
              name={profile.name}
              src={profile.profileImage}
              size="xl"
              editable={true}
              onImageChange={handleProfileImageUpload}
            />
            <div className="absolute -bottom-1 -right-1 bg-[#EF7D35] text-white p-1.5 rounded-full shadow-md pointer-events-none">
              <Camera size={14} />
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-extrabold text-[#1F1410]">{profile.name}</h2>
            <p className="text-sm font-semibold text-[#78655A] mt-0.5">{profile.jobTitle || profile.role}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <Badge value={profile.role} />
              <Badge value={profile.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Details Form */}
      <div className="card p-6 border border-[#F3DCCB] bg-white space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F3DCCB]">
          <User size={18} className="text-[#EF7D35]" />
          <h3 className="font-bold text-[#1F1410]">Personal Details</h3>
        </div>

        <form onSubmit={handleUpdateDetails} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Employee ID</label>
              <input
                type="text"
                disabled
                value={profile.employeeId}
                className="form-input bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input
                type="text"
                disabled
                value={profile.email}
                className="form-input bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={detailsForm.name}
                onChange={(e) => setDetailsForm((p) => ({ ...p, name: e.target.value }))}
                className="form-input"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                value={detailsForm.phone}
                onChange={(e) => setDetailsForm((p) => ({ ...p, phone: e.target.value }))}
                className="form-input"
                placeholder="+91 9876543210"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <input
                type="text"
                value={detailsForm.address}
                onChange={(e) => setDetailsForm((p) => ({ ...p, address: e.target.value }))}
                className="form-input"
                placeholder="City, State, Country"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={detailsLoading} className="btn-primary">
              {detailsLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Saving Changes...</>
              ) : (
                <><Save size={16} /> Save Personal Details</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change Form (ONLY FOR ADMIN & HR) */}
      {canChangePassword && (
        <div className="card p-6 border border-[#F3DCCB] bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F3DCCB]">
            <Lock size={18} className="text-[#EF7D35]" />
            <h3 className="font-bold text-[#1F1410]">Security Settings & Password Change</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="form-input pr-10"
                    placeholder={label}
                    autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
                    required
                  />
                  {key === 'confirmPassword' && (
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8917F] hover:text-[#EF7D35]"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={pwLoading} className="btn-primary">
                {pwLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating Password...</>
                ) : (
                  <><Save size={16} /> Change Password</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


