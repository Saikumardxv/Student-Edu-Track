import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, Loader2, Palette } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext, Theme } from '../context/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);
  const navigate = useNavigate();

  const currentTheme = themeCtx?.theme || 'slate';
  const setTheme = themeCtx?.setTheme;

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
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const themesList: Array<{ id: Theme; name: string; color: string }> = [
    { id: 'slate', name: 'Slate Dark', color: 'bg-slate-700' },
    { id: 'indigo', name: 'Indigo Glow', color: 'bg-indigo-500' },
    { id: 'emerald', name: 'Emerald Forest', color: 'bg-emerald-500' },
    { id: 'sunset', name: 'Sunset Amber', color: 'bg-orange-500' },
    { id: 'crimson', name: 'Crimson Vampire', color: 'bg-red-500' },
    { id: 'light', name: 'Luxury Light', color: 'bg-slate-300' },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden font-sans theme-bg text-[var(--text-primary)] transition-colors duration-300">
      {/* Dynamic Glowing Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--glow-color),_transparent_35%),radial-gradient(circle_at_bottom_right,_var(--glow-color),_transparent_35%)] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Logo and Headings */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] shadow-xl shadow-black/30 mb-4 transition-all">
            <School className="h-6 w-6 text-[var(--accent-foreground)]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Welcome to EduTrack
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all">
          {/* Top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
                  className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-accent text-sm font-semibold py-3 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
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
              <span className="text-[var(--text-muted)] text-sm">
                New User?{' '}
              </span>
              <Link
                to="/register"
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold transition-colors text-sm"
              >
                Register Here
              </Link>
            </div>
          </form>

          {/* Theme Selector Widget */}
          <div className="mt-8 pt-6 border-t theme-border flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-[var(--accent)]" /> Customize Page Theme
            </span>
            <div className="flex gap-2">
              {themesList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme?.(t.id)}
                  className={`h-5 w-5 rounded-full ${t.color} border border-white/20 transition-transform hover:scale-125 ${
                    currentTheme === t.id ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)] scale-110' : ''
                  }`}
                  title={t.name}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
