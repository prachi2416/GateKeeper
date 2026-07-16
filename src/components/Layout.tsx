import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
