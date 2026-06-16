import React, { useState, useEffect } from 'react';
import { Award, FileSpreadsheet, Info, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface GradeItem {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  credits: number;
  semester: number;
  internal1: number | null;
  internal2: number | null;
  midterm: number | null;
  external: number | null;
  total: number | null;
  grade: string | null;
}

interface GradesResponse {
  gpa: number;
  grades: GradeItem[];
}

const GradesView: React.FC = () => {
  const [data, setData] = useState<GradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await api.get('/student/grades');
        setData(res.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to retrieve academic grades.' });
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-550">Loading academic records...</p>
        </div>
      </div>
    );
  }

  const grades = data?.grades || [];
  const gpa = data?.gpa || 0.0;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header and GPA KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-brand-500" />
            Grades & GPA Card
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review detailed scores and final grade mappings for enrolled subjects.
          </p>
        </div>

        {/* Big GPA highlight */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl shrink-0">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center">
            <Award className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Cumulative GPA</span>
            <p className="text-xl font-bold text-slate-100">{gpa !== 0 ? gpa.toFixed(2) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {grades.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Subject Code</th>
                  <th className="py-4 px-6">Subject Name</th>
                  <th className="py-4 px-4 text-center">Semester</th>
                  <th className="py-4 px-4 text-center">Credits</th>
                  <th className="py-4 px-4 text-center">Internal 1 (25%)</th>
                  <th className="py-4 px-4 text-center">Internal 2 (25%)</th>
                  <th className="py-4 px-4 text-center">Midterm</th>
                  <th className="py-4 px-4 text-center">External (50%)</th>
                  <th className="py-4 px-4 text-center">Total (100)</th>
                  <th className="py-4 px-6 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {grades.map((item) => (
                  <tr key={item.subjectId} className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-200">
                      {item.subjectCode}
                    </td>
                    <td className="py-3.5 px-6 text-slate-300 font-medium">
                      {item.subjectName}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      Sem {item.semester}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-brand-400">
                      {item.credits}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {item.internal1 !== null ? item.internal1 : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {item.internal2 !== null ? item.internal2 : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {item.midterm !== null ? item.midterm : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {item.external !== null ? item.external : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {item.total !== null ? item.total : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {item.grade ? (
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded border ${
                            item.grade === 'F'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {item.grade}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic text-xs">Awaiting Entry</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-md">
          <Info className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No academic grades logged</h3>
          <p className="text-sm mt-1">Final grades are published at the end of semesters.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default GradesView;
