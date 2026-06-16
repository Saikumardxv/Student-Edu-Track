import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Calendar, Clock, MapPin, 
  Loader2, ArrowRight, CalendarCheck, FileSpreadsheet, Plus 
} from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface FacultyDashboardData {
  stats: {
    subjectsCount: number;
    todayClassesCount: number;
  };
  todayClasses: Array<{
    id: number;
    day: string;
    startTime: string;
    endTime: string;
    room: string | null;
    subject: {
      name: string;
      code: string;
    };
    timetable: {
      department: { code: string };
      semester: { number: number };
    };
  }>;
  recentMarks: Array<{
    id: number;
    internal1: number | null;
    internal2: number | null;
    external: number | null;
    total: number | null;
    grade: string | null;
    student: {
      user: { name: string };
    };
    subject: {
      name: string;
      code: string;
    };
  }>;
}

const FacultyDashboard: React.FC = () => {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/faculty/dashboard');
        setData(response.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to load faculty dashboard' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-550">Loading dashboard contents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Faculty Workstation
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review today's schedule, assigned courses, and manage grade sheets.
        </p>
      </div>

      {/* Grid Layout: Today's Classes & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule (2 cols on large screen) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col min-h-[350px]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
          
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Clock className="h-5 w-5 text-brand-400" />
            Schedule for Today ({data?.todayClasses.length || 0} Classes)
          </h3>

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
                        {cls.subject.code}
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">{cls.subject.name}</span>
                    </div>
                    <div className="flex items-center gap-x-4 text-xs text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {cls.startTime} - {cls.endTime}
                      </span>
                      {cls.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {cls.room}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/faculty/attendance', { state: { subjectId: cls.id, autoSelect: true } })}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-95 shrink-0 w-fit"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Mark Attendance
                  </button>
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

        {/* Quick Operations Widget */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
          
          <h3 className="text-base font-bold text-slate-200 mb-6 border-b border-slate-800/80 pb-3">
            Quick Actions
          </h3>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <button
              onClick={() => navigate('/faculty/attendance')}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-brand-500/30 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-550/10 flex items-center justify-center border border-emerald-500/20">
                  <CalendarCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Roll Call</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Submit attendance logs</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-650 group-hover:text-brand-400 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/faculty/marks')}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-brand-500/30 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-550/10 flex items-center justify-center border border-blue-500/20">
                  <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Upload Grades</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Upload exam grade sheets</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-650 group-hover:text-brand-400 transition-colors" />
            </button>
          </div>
        </div>

      </div>

      {/* Recent Marks Entry Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/25 to-transparent" />
        
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800/80">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-400" />
            Recent Grade Submissions
          </h3>
        </div>

        <div className="divide-y divide-slate-850/60 text-sm">
          {data?.recentMarks && data.recentMarks.length > 0 ? (
            data.recentMarks.map((mk) => (
              <div key={mk.id} className="flex justify-between items-center py-3">
                <div>
                  <span className="font-semibold text-slate-200">{mk.student.user.name}</span>
                  <p className="text-[10px] text-slate-550 mt-0.5">Subject: {mk.subject.name} ({mk.subject.code})</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-slate-400">
                    <span>Score: {mk.total || 0}/100</span>
                  </div>
                  <span className={`font-extrabold text-xs px-2.5 py-0.5 rounded border
                    ${mk.grade === 'F' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'}`}
                  >
                    Grade {mk.grade}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-550 py-4 text-center">No grades entered recently.</p>
          )}
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default FacultyDashboard;
