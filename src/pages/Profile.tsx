import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Clock, Camera } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account information</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User className="w-10 h-10 text-emerald-400" />
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <Camera size={12} />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.displayName || user?.email?.split('@')[0] || 'Admin User'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
              <Shield size={10} />
              Administrator
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                defaultValue={user?.displayName || 'Admin User'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                defaultValue="Administrator"
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Last Login</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                defaultValue={user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-800">
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
            Save Changes
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
