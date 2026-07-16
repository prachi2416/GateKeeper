import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { auth, sendPasswordResetEmail } from '../lib/firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">GateKeeper</h1>
          <p className="text-slate-500 text-sm">Distributed API Gateway & Rate Limiting Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
            <ArrowLeft size={14} />
            Back to login
          </Link>

          <h2 className="text-lg font-semibold text-white mb-1">Reset password</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link</p>

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-200 font-medium mb-1">Check your email</p>
              <p className="text-slate-500 text-sm">We've sent a password reset link to {email}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gatekeeper.io"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
