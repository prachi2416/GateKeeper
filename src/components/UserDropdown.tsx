import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Shield, KeyRound, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, signOut } from '../lib/firebase';

export default function UserDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Account Settings', icon: Settings, path: '/settings' },
    { label: 'Security', icon: Shield, path: '/settings' },
    { label: 'API Keys', icon: KeyRound, path: '/api-keys' },
  ];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <User className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm text-slate-200 font-medium">{user?.email?.split('@')[0] || 'Admin'}</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
        <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-200 font-medium truncate">{user?.email}</p>
              <p className="text-xs text-slate-500">GateKeeper Admin</p>
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}

            <div className="border-t border-slate-800 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
