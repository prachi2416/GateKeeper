import NotificationCenter from './NotificationCenter';
import UserDropdown from './UserDropdown';

export default function TopNavbar() {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-end px-6 sticky top-0 z-30 gap-4">
      <NotificationCenter />
      <UserDropdown />
    </header>
  );
}
