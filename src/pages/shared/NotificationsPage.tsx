import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { toast } from '../../components/common/Toast';

function NotificationIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    TASK_ASSIGNED: '📋', TASK_UPDATED: '✏️', TASK_COMPLETED: '✅',
    LEAVE_REQUEST: '📅', LEAVE_APPROVED: '✅', LEAVE_REJECTED: '❌',
    EMPLOYEE_CREATED: '👤', SYSTEM: '🔔',
  };
  return <span className="text-lg">{icons[type] ?? '🔔'}</span>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true); setError('');
    try {
      setNotifications(await notificationService.getAll());
    } catch {
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast('error', 'Failed to mark as read'); }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast('success', 'All notifications marked as read');
    } catch { toast('error', 'Failed to mark all as read'); }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="btn-secondary text-sm">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {error ? <ErrorState message={error} onRetry={fetchNotifications} /> :
        notifications.length === 0 ? (
          <EmptyState
            message="No notifications yet"
            description="You'll see task assignments, leave updates, and system alerts here."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`card p-4 flex items-start gap-4 transition ${!n.isRead ? 'border-primary-200 bg-primary-50/30' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <NotificationIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition shrink-0"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    {n.senderName && <span>From: {n.senderName}</span>}
                    {n.createdAt && <span>{new Date(n.createdAt).toLocaleString()}</span>}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
