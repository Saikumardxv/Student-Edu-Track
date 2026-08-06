import React, { useContext } from 'react';
import { Menu, Bell, User, CalendarDays } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  if (!auth) return null;
  const { user } = auth;

  if (!user) return null;

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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-400 capitalize hidden sm:block">
            {user.role.toLowerCase()} Area
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-1.5 border border-slate-800 text-xs text-slate-400 md:flex">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span>{today}</span>
        </div>

        <button 
          onClick={() => navigate(getNoticesPath())}
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors border border-slate-900 hover:border-slate-800"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse border border-slate-950" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-full border border-slate-800/60 p-0.5 pr-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-300 hidden md:block max-w-[120px] truncate">
            {user.name.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
