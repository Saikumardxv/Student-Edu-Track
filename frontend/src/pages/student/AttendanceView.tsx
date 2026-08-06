import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, Info, Loader2, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface AttendanceSubjectItem {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendancePercentage: number;
  warning: boolean;
}

const AttendanceView: React.FC = () => {
  const [reportList, setReportList] = useState<AttendanceSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/student/attendance');
        setReportList(res.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch attendance details.' });
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          <p className="text-xs text-slate-550">Compiling attendance records...</p>
        </div>
      </div>
    );
  }

  // Calculate overall metrics
  const totalClasses = reportList.reduce((acc, curr) => acc + curr.totalClasses, 0);
  const totalPresent = reportList.reduce((acc, curr) => acc + curr.present, 0);
  const overallPercentage = totalClasses > 0 ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(2)) : 100.0;
  const isBelow75 = overallPercentage < 75.0;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header and Summary Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-slate-300" />
            Attendance Roster
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Check subject-wise lectures attended, late logs, and overall percentage warnings.
          </p>
        </div>

        {/* Big Overall highlight */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl shrink-0">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-slate-800">
            <CalendarCheck className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Overall Average</span>
            <p className="text-xl font-bold text-slate-100">
              {overallPercentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Roster Cards Grid */}
      {reportList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportList.map((item) => (
            <div 
              key={item.subjectId} 
              className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-slate-700"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wide uppercase bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-300">
                      {item.subjectCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-200 mt-2 leading-relaxed">
                      {item.subjectName}
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/10 border border-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                    {item.warning ? <><AlertTriangle className="h-3 w-3" /> &lt; 75% Alert</> : <><Sparkles className="h-3 w-3" /> Clear Roster</>}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Attendance Rate</span>
                    <span className="text-slate-300">
                      {item.attendancePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                    <div 
                      className="h-full rounded-full transition-all duration-500 bg-slate-300"
                      style={{ width: `${Math.min(item.attendancePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Attendance metrics details */}
              <div className="grid grid-cols-4 gap-2 text-center border-t border-slate-850 pt-4 mt-6 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Held</p>
                  <p className="text-sm font-bold text-slate-300">{item.totalClasses}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Present</p>
                  <p className="text-sm font-bold text-slate-300">{item.present}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Late</p>
                  <p className="text-sm font-bold text-slate-300">{item.late}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Absent</p>
                  <p className="text-sm font-bold text-slate-300">{item.absent}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-md">
          <Info className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No classes registered</h3>
          <p className="text-sm mt-1">Attendance records appear once professors mark daily rosters.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AttendanceView;
