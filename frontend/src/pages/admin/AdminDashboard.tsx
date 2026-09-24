import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, Building2, BookOpen, 
  BellRing, Plus, Calendar, Megaphone, ArrowUpRight
} from 'lucide-react';
import api from '../../utils/api';
import { CardSkeleton } from '../../components/Skeleton';

interface DashboardData {
  stats: {
    totalStudents: number;
    totalFaculty: number;
    totalDepartments: number;
    totalSubjects: number;
  };
  recentNotices: Array<{
    id: number;
    title: string;
    content: string;
    createdAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 CardSkeleton h-[300px]" />
          <div className="CardSkeleton h-[300px]" />
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Total Students',
      value: data?.stats.totalStudents || 0,
      icon: Users,
      color: 'from-slate-800 to-slate-700',
      shadow: 'shadow-slate-950/20',
      path: '/admin/students',
    },
    {
      label: 'Total Faculty',
      value: data?.stats.totalFaculty || 0,
      icon: GraduationCap,
      color: 'from-slate-800 to-slate-700',
      shadow: 'shadow-slate-950/20',
      path: '/admin/faculty',
    },
    {
      label: 'Departments',
      value: data?.stats.totalDepartments || 0,
      icon: Building2,
      color: 'from-slate-800 to-slate-700',
      shadow: 'shadow-slate-950/20',
      path: '/admin/departments',
    },
    {
      label: 'Total Subjects',
      value: data?.stats.totalSubjects || 0,
      icon: BookOpen,
      color: 'from-slate-800 to-slate-700',
      shadow: 'shadow-slate-950/20',
      path: '/admin/subjects',
    },
  ];

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Welcome Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            System Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time operations, management shortcuts, and announcements.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 px-4 py-2 text-xs font-semibold text-slate-100 border border-slate-850/80 transition-all active:scale-95"
        >
          View Full Analytics
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className={`glass-panel p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl ${card.shadow}`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <p className="text-3xl font-bold text-slate-100">{card.value}</p>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-slate-800/70 shadow-lg">
                <Icon className="h-6 w-6 text-slate-100" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Double Column Layout: Notices & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Notices */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <BellRing className="h-5 w-5 text-slate-100" />
              Recent Announcements
            </h3>
            <button
              onClick={() => navigate('/admin/notices')}
              className="text-xs text-slate-200 hover:text-slate-100 font-semibold"
            >
              Manage Board
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {data?.recentNotices && data.recentNotices.length > 0 ? (
              data.recentNotices.map((notice) => (
                <div key={notice.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-bold text-slate-200 text-sm">{notice.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed truncate">
                    {notice.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <BellRing className="h-10 w-10 text-slate-700 mb-2" />
                <p className="text-sm">No notices posted yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Widget */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          
          <div className="pb-4 mb-4 border-b border-slate-800/80">
            <h3 className="text-lg font-bold text-slate-200">
              Quick Operations
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 flex-1 justify-center">
            <button
              onClick={() => navigate('/admin/students', { state: { openAddModal: true } })}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850/80 hover:border-slate-700 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                  <Plus className="h-5 w-5 text-slate-100" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Add Student</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Enrolls into subjects</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/faculty')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850/80 hover:border-slate-700 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                  <Plus className="h-5 w-5 text-slate-100" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Add Faculty</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Appoints staff members</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/timetable')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850/80 hover:border-slate-700 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                  <Calendar className="h-4 w-4 text-slate-100" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Create Timetable</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Configures time slots</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/notices')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850/80 hover:border-slate-700 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                  <Megaphone className="h-4 w-4 text-slate-100" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Post Announcement</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Broadcasts bulletins</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
