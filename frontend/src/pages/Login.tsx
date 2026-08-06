import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  // If user is already logged in, redirect them
  useEffect(() => {
    if (auth?.user) {
      if (auth.user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (auth.user.role === 'FACULTY') navigate('/faculty/dashboard', { replace: true });
      else navigate('/student/dashboard', { replace: true });
    }
  }, [auth?.user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (auth) {
        await auth.login(email, password);
        // Redirect handled by useEffect
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden font-sans bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.06),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),_transparent_20%)] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Logo and Headings */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 shadow-xl shadow-slate-900/40 mb-4">
            <School className="h-6 w-6 text-slate-100" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Welcome to EduTrack
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-700/60" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-slate-800/70 border border-slate-700/80 px-4 py-3 text-sm text-slate-200">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address

              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full"
                placeholder="name@edutrack.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pr-10"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-350"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-accent text-sm font-semibold py-3 shadow-lg shadow-slate-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            <div className="mt-4 text-center">
                 <span className="text-gray-400">
                   New User?{" "}
                 </span>
 
                 <Link
                    to="/register"
                    className="text-slate-300 hover:text-slate-100 font-semibold"
                  >
                    Register Here
                  </Link>
                </div>
          </form>


        </div>
      </div>
    </div>
  );
};

export default Login;
