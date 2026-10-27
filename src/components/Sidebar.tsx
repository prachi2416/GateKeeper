import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GitCompare,
  Activity,
  Server,
  Settings,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/algorithms', label: 'Algorithms', icon: GitCompare },
  { path: '/benchmarks', label: 'Benchmarks', icon: BarChart3 },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/gateway', label: 'Gateway Instances', icon: Server },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 z-40 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Clickable GateKeeper logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            aria-label="GateKeeper Dashboard"
            title="Go to Dashboard"
            className={`flex items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              collapsed ? 'justify-center flex-1' : ''
            }`}
          >
            <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>

            {!collapsed && (
              <div>
                <h1 className="text-white font-bold text-sm tracking-wide">
                  GateKeeper
                </h1>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">
                  API Gateway
                </p>
              </div>
            )}
          </Link>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1 rounded hover:bg-slate-800 text-slate-400"
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* System status */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <div
            className={`flex items-center gap-3 px-3 py-2 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {!collapsed && (
              <span className="text-xs text-slate-500">System Online</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
