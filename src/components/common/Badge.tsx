import type { TaskPriority, TaskStatus, LeaveStatus, UserStatus, LoginActivityStatus } from '../../types';

const statusMap: Record<string, string> = {
  // TaskStatus
  TODO:        'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  OVERDUE:     'bg-red-100 text-red-700',
  CANCELLED:   'bg-slate-100 text-slate-400',
  // TaskPriority
  LOW:         'bg-slate-100 text-slate-600',
  MEDIUM:      'bg-yellow-100 text-yellow-700',
  HIGH:        'bg-orange-100 text-orange-700',
  URGENT:      'bg-red-100 text-red-700',
  // LeaveStatus
  PENDING:     'bg-yellow-100 text-yellow-700',
  APPROVED:    'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-red-100 text-red-700',
  // UserStatus
  ACTIVE:      'bg-emerald-100 text-emerald-700',
  INACTIVE:    'bg-slate-100 text-slate-500',
  SUSPENDED:   'bg-orange-100 text-orange-700',
  TERMINATED:  'bg-red-100 text-red-700',
  // LoginActivityStatus
  LOGGED_OUT:  'bg-slate-100 text-slate-600',
};

const labelMap: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
  LOGGED_OUT: 'Logged Out',
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
  FREELANCE: 'Freelance',
  CASUAL: 'Casual',
  SICK: 'Sick',
  EARNED: 'Earned',
  UNPAID: 'Unpaid',
  OTHER: 'Other',
};

interface Props {
  value: TaskPriority | TaskStatus | LeaveStatus | UserStatus | LoginActivityStatus | string;
  className?: string;
}

export default function Badge({ value, className = '' }: Props) {
  const colorClass = statusMap[value] ?? 'bg-slate-100 text-slate-700';
  const label = labelMap[value] ?? value;
  return (
    <span className={`badge ${colorClass} ${className}`}>{label}</span>
  );
}
