import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen, 
  Calendar, BellRing, BarChart3, CalendarCheck, FileSpreadsheet, 
  AlertTriangle, User, LogOut, X, School
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const auth = useContext(AuthContext);
  if (!auth) return null;
  const { user, logout } = auth;

  if (!user) return null;

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-sky-400' },
    { to: '/admin/students', label: 'Students', icon: Users, color: 'text-emerald-400' },
    { to: '/admin/faculty', label: 'Faculty', icon: GraduationCap, color: 'text-indigo-400' },
    { to: '/admin/departments', label: 'Departments', icon: Building2, color: 'text-amber-400' },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen, color: 'text-pink-400' },
    { to: '/admin/timetable', label: 'Timetable', icon: Calendar, color: 'text-violet-400' },
    { to: '/admin/notices', label: 'Notices', icon: BellRing, color: 'text-rose-400' },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3, color: 'text-teal-400' },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-sky-400' },
    { to: '/faculty/attendance', label: 'Mark Attendance', icon: CalendarCheck, color: 'text-teal-400' },
    { to: '/faculty/marks', label: 'Enter Marks', icon: FileSpreadsheet, color: 'text-fuchsia-400' },
    { to: '/faculty/defaulters', label: 'Defaulters List', icon: AlertTriangle, color: 'text-rose-400' },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-sky-400' },
    { to: '/student/grades', label: 'Grades & GPA', icon: FileSpreadsheet, color: 'text-amber-400' },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck, color: 'text-teal-400' },
    { to: '/student/timetable', label: 'Timetable', icon: Calendar, color: 'text-violet-400' },
    { to: '/student/notices', label: 'Notices Board', icon: BellRing, color: 'text-rose-400' },
  ];

  const links = 
    user.role === 'ADMIN' ? adminLinks : 
    user.role === 'FACULTY' ? facultyLinks : 
    studentLinks;

  const activeClass = 'bg-[var(--border)] text-[var(--text-primary)] border-l-4 border-[var(--accent)] font-semibold';
  const inactiveClass = 'text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-primary)] border-l-4 border-transparent';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col theme-surface backdrop-blur-md border-r theme-border transition-all duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b theme-border">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] shadow-md shadow-black/30">
              <School className="h-5 w-5 text-[var(--accent-foreground)]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent font-sans">
              EduTrack
            </span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-primary)] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} onClick={onClose}>
                {({ isActive }) => (
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${isActive ? activeClass : inactiveClass}`}>
                    <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'scale-110 opacity-100' : 'opacity-70 group-hover:opacity-100'} ${link.color}`} />
                    <span>{link.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile / Logout bottom panel */}
        <div className="border-t theme-border p-4 bg-black/10">
          <NavLink 
            to="/profile" 
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--border)] group transition-colors mb-3"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--border)] flex items-center justify-center">
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <User className="h-5 w-5 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {user.name}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {user.role}
              </p>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border)] hover:text-red-400 transition-all font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
