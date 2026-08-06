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
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/faculty', label: 'Faculty', icon: GraduationCap },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/timetable', label: 'Timetable', icon: Calendar },
    { to: '/admin/notices', label: 'Notices', icon: BellRing },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { to: '/faculty/marks', label: 'Enter Marks', icon: FileSpreadsheet },
    { to: '/faculty/defaulters', label: 'Defaulters List', icon: AlertTriangle },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/grades', label: 'Grades & GPA', icon: FileSpreadsheet },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/timetable', label: 'Timetable', icon: Calendar },
    { to: '/student/notices', label: 'Notices Board', icon: BellRing },
  ];

  const links = 
    user.role === 'ADMIN' ? adminLinks : 
    user.role === 'FACULTY' ? facultyLinks : 
    studentLinks;

  const activeClass = 'bg-slate-800/70 text-slate-100 border-l-4 border-slate-400 font-semibold';
  const inactiveClass = 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-l-4 border-transparent';

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
        fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col bg-slate-900/90 backdrop-blur-md border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 shadow-md shadow-slate-950/30">
              <School className="h-5 w-5 text-slate-100" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-sans">
              EduTrack
            </span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
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
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'icon-accent' : 'icon-muted'}`} />
                    <span>{link.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile / Logout bottom panel */}
        <div className="border-t border-slate-800/80 p-4 bg-slate-950/20">
          <NavLink 
            to="/profile" 
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/60 group transition-colors mb-3"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center">
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <User className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.role}
              </p>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition-all font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
