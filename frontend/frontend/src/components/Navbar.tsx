import React, { useContext, useState } from 'react';
import { Menu, Bell, User, CalendarDays, Palette } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ThemeContext, Theme } from '../context/ThemeContext';

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const auth = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  if (!auth) return null;
  const { user } = auth;

  if (!user) return null;

  const currentTheme = themeCtx?.theme || 'slate';
  const setTheme = themeCtx?.setTheme;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const getNoticesPath = () => {
    if (user.role === 'ADMIN') return '/admin/notices';
    if (user.role === 'FACULTY') return '/faculty/dashboard';
    return '/student/notices';
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b theme-border theme-surface px-6 backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-primary)] lg:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] capitalize hidden sm:block">
            {user.role.toLowerCase()} Area
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg bg-[var(--border)]/30 px-3 py-1.5 border theme-border text-xs text-[var(--text-muted)] md:flex">
          <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
          <span>{today}</span>
        </div>

        {/* Dynamic Theme Picker */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="relative rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-primary)] transition-colors border theme-border"
            title="Switch Theme"
          >
            <Palette className="h-5 w-5 text-indigo-400" />
          </button>
          
          {showThemeMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowThemeMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl theme-surface border theme-border shadow-2xl p-2 z-50 animate-slide-up">
                <p className="text-[10px] font-bold text-[var(--text-muted)] px-3 py-1.5 uppercase tracking-wider">
                  Select Theme
                </p>
                <div className="space-y-1">
                  {themesList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme?.(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--border)] ${
                        currentTheme === t.id ? 'bg-[var(--border)] border border-[var(--accent)]/30' : 'border border-transparent'
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${t.color} border border-white/20`} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={() => navigate(getNoticesPath())}
          className="relative rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-primary)] transition-colors border theme-border"
        >
          <Bell className="h-5 w-5 text-amber-400" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse border border-[var(--surface)]" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-full border theme-border p-0.5 pr-3 bg-[var(--border)]/20 hover:bg-[var(--border)] transition-colors"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--border)] flex items-center justify-center">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-[var(--text-muted)]" />
            )}
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)] hidden md:block max-w-[120px] truncate">
            {user.name.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
