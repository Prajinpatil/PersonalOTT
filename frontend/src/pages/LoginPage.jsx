import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, LogIn, Lock, Mail, AlertCircle, Info } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glowing gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 items-center justify-center shadow-lg shadow-red-600/30 mb-2">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-zinc-400">Sign in to resume watching PersonalOTT streams</p>
        </div>

        {/* Demo Credentials Quick Fill Box */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-red-400">
            <Info className="w-4 h-4 text-red-500" />
            <span>Demo Tester One-Click Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@ott.com', 'admin123')}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold py-1.5 px-2 rounded border border-zinc-700/80 transition-colors"
            >
              Admin (admin@ott.com)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('user@ott.com', 'user123')}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold py-1.5 px-2 rounded border border-zinc-700/80 transition-colors"
            >
              User (user@ott.com)
            </button>
          </div>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="p-3 bg-red-950/60 border border-red-900/60 rounded-xl flex items-center space-x-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
          Don't have an account?{' '}
          <Link to="/register" className="text-red-400 hover:text-red-300 font-bold ml-1">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
