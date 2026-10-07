import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, TrendingUp, Award, UserX, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface AttendanceReport {
  departmentName: string;
  departmentCode: string;
  averageAttendance: number;
}

interface GradeDistribution {
  grade: string;
  count: number;
}

interface SubjectAverage {
  subjectName: string;
  subjectCode: string;
  deptCode: string;
  averageMark: number;
}

interface Performer {
  studentName: string;
  rollNumber: string;
  deptCode: string;
  gpa: number;
}

interface MarksReport {
  gradeDistribution: GradeDistribution[];
  subjectAverages: SubjectAverage[];
  topPerformers: Performer[];
  bottomPerformers: Performer[];
}

const AdminReports: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [marksData, setMarksData] = useState<MarksReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Curated color themes for recharts
  const COLORS = ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'];
  const BAR_COLOR_1 = '#cbd5e1';
  const BAR_COLOR_2 = '#94a3b8';

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [attRes, marksRes] = await Promise.all([
          api.get('/admin/reports/attendance'),
          api.get('/admin/reports/marks'),
        ]);
        setAttendanceData(attRes.data);
        setMarksData(marksRes.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to compile analytical reports' });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-slate-100" />
          Reports & Performance Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review academic performance, grade mappings, and attendance percentages across all departments.
        </p>
      </div>

      {/* Row 1: Attendance & Grade Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Attendance */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col min-h-[350px]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-slate-100" />
            Average Attendance Percentage by Department
          </h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="departmentCode" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Bar dataKey="averageAttendance" fill={BAR_COLOR_2} radius={[4, 4, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col min-h-[350px]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          <h3 className="text-base font-bold text-slate-200 mb-6">Grade Distribution (System-wide)</h3>
          
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-full sm:w-1/2 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marksData?.gradeDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="grade"
                  >
                   {(marksData?.gradeDistribution || []).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#cbd5e1' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-400">
              {(marksData?.gradeDistribution || []).map((entry, index) => (
                <div key={entry.grade} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>Grade {entry.grade}: {entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Subject Average Marks */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col min-h-[380px]">
<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <h3 className="text-base font-bold text-slate-200 mb-6">Subject Average Marks (Out of 100)</h3>
        
        <div className="flex-1 w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marksData?.subjectAverages || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="subjectCode" stroke="#94a3b8" fontSize={10} angle={-30} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                itemStyle={{ color: '#cbd5e1' }}
              />
              <Bar dataKey="averageMark" fill={BAR_COLOR_1} radius={[4, 4, 0, 0]} name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Rank lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Performers */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-slate-100" />
            Academic Performers (Top 5)
          </h3>
          
          <div className="divide-y divide-slate-850/60 text-sm">
            {marksData?.topPerformers && marksData.topPerformers.length > 0 ? (
              marksData.topPerformers.map((perf) => (
                <div key={perf.rollNumber} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold text-slate-200">{perf.studentName}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{perf.rollNumber} • {perf.deptCode}</p>
                  </div>
                  <span className="font-extrabold text-slate-100 bg-slate-800/60 border border-slate-700 px-2.5 py-0.5 rounded text-xs">
                    {perf.gpa}% Avg
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No performance records</p>
            )}
          </div>
        </div>

        {/* Low Performers (Warning List) */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <UserX className="h-5 w-5 text-slate-100" />
            Performance Focus List (Bottom 5)
          </h3>
          
          <div className="divide-y divide-slate-850/60 text-sm">
            {marksData?.bottomPerformers && marksData.bottomPerformers.length > 0 ? (
              marksData.bottomPerformers.map((perf) => (
                <div key={perf.rollNumber} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold text-slate-200">{perf.studentName}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{perf.rollNumber} • {perf.deptCode}</p>
                  </div>
                  <span className="font-extrabold text-slate-100 bg-slate-800/60 border border-slate-700 px-2.5 py-0.5 rounded text-xs">
                    {perf.gpa}% Avg
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No performance records</p>
            )}
          </div>
        </div>

      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminReports;
