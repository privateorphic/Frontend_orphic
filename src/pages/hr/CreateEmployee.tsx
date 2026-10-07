import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, UserPlus, RefreshCw } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import type { CreateEmployeeRequest, Department } from '../../types';
import { toast } from '../../components/common/Toast';
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="form-label text-slate-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function HrCreateEmployeePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const basePath = isAdmin ? '/admin/employees' : '/hr/employees';

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [form, setForm] = useState<CreateEmployeeRequest>({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentType: 'FULL_TIME',
    address: '',
    departmentId: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateEmployeeRequest | 'confirmPassword', string>>>({});

  const DEFAULT_DEPARTMENTS: Department[] = [
    { id: 1, name: 'Search Engine Optimisation (SEO)', description: 'Search Engine Optimisation Department' },
    { id: 2, name: 'Video Editing', description: 'Video Editing and Post Production' },
    { id: 3, name: 'Social Media', description: 'Social Media Marketing & Operations' },
    { id: 4, name: 'Graphic Design', description: 'Graphic Design and Visual Media' },
    { id: 5, name: 'Digital Marketing', description: 'Digital Marketing & Advertising' },
    { id: 6, name: 'Human Resource (HR)', description: 'Human Resource and People Operations' }
  ];

  useEffect(() => {
    departmentService.getAll().then((depts) => {
      const list = (depts && depts.length > 0) ? depts : DEFAULT_DEPARTMENTS;
      setDepartments(list);
      if (list.length > 0 && !form.departmentId) {
        setForm((p) => ({ ...p, departmentId: list[0].id }));
      }
    }).catch(() => {
      setDepartments(DEFAULT_DEPARTMENTS);
      if (!form.departmentId) {
        setForm((p) => ({ ...p, departmentId: DEFAULT_DEPARTMENTS[0].id }));
      }
    });
  }, []);

  const formatEmployeeId = (val: string) => {
    let clean = val.trim().toUpperCase();
    if (!clean) return '';
    if (/^\d+$/.test(clean)) {
      return `EMP${clean.padStart(3, '0')}`;
    }
    if (/^EMP\d+$/i.test(clean)) {
      const numPart = clean.slice(3);
      return `EMP${numPart.padStart(3, '0')}`;
    }
    return clean;
  };

  const generateEmployeeId = () => {
    const randomNum = Math.floor(1 + Math.random() * 999);
    const newId = `EMP${String(randomNum).padStart(3, '0')}`;
    setForm((p) => ({ ...p, employeeId: newId }));
    if (errors.employeeId) setErrors((prev) => ({ ...prev, employeeId: undefined }));
  };

  const set = (k: keyof CreateEmployeeRequest, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    const formattedId = formatEmployeeId(form.employeeId);
    if (!formattedId) {
      e.employeeId = 'Employee ID is required';
    } else if (formattedId.length < 4) {
      e.employeeId = 'Employee ID must be properly formatted (e.g. EMP021)';
    }

    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = formatEmployeeId(form.employeeId);
    const updatedForm = { ...form, employeeId: formattedId };
    setForm(updatedForm);

    if (!validate()) {
      toast('error', 'Please fill in all required fields accurately.');
      return;
    }
    setLoading(true);
    try {
      const created = await employeeService.createEmployee(updatedForm);
      toast('success', `Employee ${created.name} created successfully!`);
      navigate(basePath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create employee';
      toast('error', msg.includes('409') || msg.includes('Duplicate') ? 'Employee ID or email already exists' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(basePath)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Back to Employees
        </button>
      </div>

      <div>
        <h1 className="page-title text-2xl font-bold text-slate-900">Create New Employee</h1>
        <p className="page-subtitle text-slate-500 text-sm mt-0.5">Add a new team member to your organization</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <UserPlus size={16} className="text-primary-600" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee ID" required error={errors.employeeId}>
              <div className="flex gap-2">
                <input
                  value={form.employeeId}
                  onChange={(e) => set('employeeId', e.target.value.toUpperCase())}
                  onBlur={() => {
                    if (form.employeeId) {
                      set('employeeId', formatEmployeeId(form.employeeId));
                    }
                  }}
                  placeholder="EMP021"
                  className="form-input font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={generateEmployeeId}
                  title="Auto-generate ID"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                >
                  <RefreshCw size={13} /> Generate
                </button>
              </div>
            </Field>

            <Field label="Full Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. John Doe"
                className="form-input"
              />
            </Field>

            <Field label="Email Address" required error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="john.doe@company.com"
                className="form-input"
              />
            </Field>

            <Field label="Phone Number" error={errors.phone}>
              <input
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 555-0192"
                className="form-input"
              />
            </Field>
          </div>
        </div>

        {/* Employment Info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">Employment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job Title" error={errors.jobTitle}>
              <input
                value={form.jobTitle ?? ''}
                onChange={(e) => set('jobTitle', e.target.value)}
                placeholder="Software Developer"
                className="form-input"
              />
            </Field>

            <Field label="Department" error={errors.departmentId}>
              <select
                value={form.departmentId ?? ''}
                onChange={(e) => set('departmentId', e.target.value ? Number(e.target.value) : undefined)}
                className="form-select"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Joining Date" error={errors.joiningDate}>
              <input
                type="date"
                value={form.joiningDate ?? ''}
                onChange={(e) => set('joiningDate', e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Employment Type">
              <select
                value={form.employmentType ?? 'FULL_TIME'}
                onChange={(e) => set('employmentType', e.target.value)}
                className="form-select"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address}>
                <input
                  value={form.address ?? ''}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="City, Country"
                  className="form-input"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">Login Credentials</h3>
          <p className="text-xs text-slate-500">Set an initial password. The employee can change it upon logging in.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Initial Password" required error={errors.password}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Min. 8 characters"
                className="form-input"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="form-input"
                autoComplete="new-password"
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating Employee...</>
            ) : (
              <><UserPlus size={16} /> Create Employee</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
