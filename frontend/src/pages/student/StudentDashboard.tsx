import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, CalendarCheck, Clock, BellRing, 
  MapPin, AlertTriangle, ArrowRight, Loader2, Award, Calendar
} from 'lucide-react';
import api from '../../utils/api';
import { CardSkeleton } from '../../components/Skeleton';
import Toast, { ToastMessage } from '../../components/Toast';

interface StudentDashboardData {
  stats: {
    gpa: number;
    attendancePercentage: number;
    defaulterAlert: boolean;
  };
  notices: Array<{
    id: number;
    title: string;
    content: string;
    createdAt: string;
  }>;
  todayClasses: Array<{
    id: number;
    subjectName: string;
    subjectCode: string;
    startTime: string;
    endTime: string;
    room: string | null;
    facultyName: string;
  }>;
}

const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/student/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to load student dashboard.' });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 CardSkeleton h-[250px]" />
          <div className="CardSkeleton h-[250px]" />
        </div>
      </div>
    );
  }

  const attendance = data?.stats.attendancePercentage || 0;
  const isBelow75 = attendance < 75;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Student Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor your grades, review class attendance records, and check notices.
        </p>
      </div>

      {/* Warning Banner */}
      {isBelow75 && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-4 flex items-start gap-3 text-sm text-rose-400 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Attendance Warning Notice</h4>
            <p className="text-xs leading-relaxed mt-0.5">
              Your overall attendance is currently at <span className="font-bold underline">{attendance}%</span>, which is below the mandatory 75% limit. 
              Please attend classes regularly to avoid academic penalties or exam disqualification.
            </p>
          </div>
        </div>
      )}

      {/* Row 1: KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GPA KPI */}
        <div 
          onClick={() => navigate('/student/grades')}
          className="glass-panel p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl border-l-4 border-l-brand-500"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cumulative GPA</span>
            <p className="text-3xl font-bold text-slate-100">{data?.stats.gpa !== 0 ? data?.stats.gpa : 'N/A'}</p>
            <p className="text-[10px] text-slate-500">Based on published final grades</p>
          </div>
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-tr from-brand-650 to-violet-500 shadow-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Attendance KPI */}
        <div 
          onClick={() => navigate('/student/attendance')}
          className={`glass-panel p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xl border-l-4 ${
            isBelow75 ? 'border-l-rose-500 shadow-rose-950/10' : 'border-l-emerald-500 shadow-emerald-950/10'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance</span>
            <p className="text-3xl font-bold text-slate-100">{attendance}%</p>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isBelow75 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isBelow75 ? 'Warning: Under 75%' : 'Good Standing'}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
            isBelow75 ? 'bg-gradient-to-tr from-rose-650 to-orange-500' : 'bg-gradient-to-tr from-emerald-650 to-teal-550'
          }`}>
            <CalendarCheck className="h-6 w-6 text-white" />
          </div>
        </div>

      </div>

      {/* Row 2: Today's Schedule & Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Classes Today */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col min-h-[350px]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
          
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800/80">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-400" />
              Today's Schedule ({data?.todayClasses.length || 0} Lectures)
            </h3>
            <button 
              onClick={() => navigate('/student/timetable')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              Weekly Grid <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {data?.todayClasses && data.todayClasses.length > 0 ? (
              data.todayClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-wide uppercase bg-slate-900 text-brand-400 border border-slate-850 px-2 py-0.5 rounded">
                        {cls.subjectCode}
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">{cls.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-x-4 text-xs text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {cls.startTime} - {cls.endTime}
                      </span>
                      {cls.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {cls.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg w-fit shrink-0">
                    Instructor: <span className="font-semibold text-slate-300">{cls.facultyName}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Calendar className="h-10 w-10 text-slate-800 mb-2" />
                <p className="text-sm">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notices Board */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
          
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800/80">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <BellRing className="h-5 w-5 text-violet-400" />
              Notices Board
            </h3>
            <button 
              onClick={() => navigate('/student/notices')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              All Notices
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[350px]">
            {data?.notices && data.notices.length > 0 ? (
              data.notices.map((notice) => (
                <div 
                  key={notice.id} 
                  className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-200 text-xs truncate max-w-[130px]" title={notice.title}>
                      {notice.title}
                    </h4>
                    <span className="text-[9px] text-slate-500">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                    {notice.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-550">
                <BellRing className="h-8 w-8 text-slate-800 mb-2" />
                <p className="text-xs">No notice bulletins</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default StudentDashboard;
