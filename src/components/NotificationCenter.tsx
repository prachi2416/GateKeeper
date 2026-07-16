import { useEffect, useState, useRef } from 'react';
import { Bell, X, AlertTriangle, Server, Database, TrendingUp, CheckCircle, Trash2, CheckCheck } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  created_at: string;
}

const severityConfig: Record<string, { color: string; bg: string; icon: any }> = {
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Database },
  success: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
};

const typeConfig: Record<string, { icon: any; label: string }> = {
  rate_limit: { icon: TrendingUp, label: 'Rate Limit' },
  gateway: { icon: Server, label: 'Gateway' },
  redis: { icon: Database, label: 'Redis' },
  tier: { icon: CheckCircle, label: 'Tier' },
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    fetchNotifications();
  };

  const clearAll = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_all' }),
    });
    fetchNotifications();
  };

  const markRead = async (id: number) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    });
    fetchNotifications();
  };

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                </button>
                <button
                  onClick={clearAll}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const sev = severityConfig[n.severity] || severityConfig.info;
                  const typ = typeConfig[n.type] || { icon: Bell, label: 'General' };
                  const Icon = typ.icon;
                  const SevIcon = sev.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors ${
                        !n.read ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${sev.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${sev.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-200 font-medium truncate">{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${sev.color}`}>
                            <SevIcon size={10} />
                            {n.severity}
                          </span>
                          <span className="text-[10px] text-slate-600">{formatTime(n.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
