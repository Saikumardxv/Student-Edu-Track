import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, BookOpen, Loader2, AlertCircle, Mail } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface Subject {
  id: number;
  name: string;
  code: string;
  department: { code: string };
  semester: { number: number };
}

interface DefaulterStudent {
  studentId: number;
  name: string;
  email: string;
  rollNumber: string;
  totalClasses: number;
  presentClasses: number;
  attendancePercentage: number;
}

const DefaultersList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [defaulters, setDefaulters] = useState<DefaulterStudent[]>([]);
  
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Fetch subjects assigned to this faculty
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/faculty/subjects');
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubjectId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch assigned subjects.' });
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch defaulters when subject changes
  const fetchDefaulters = async () => {
    if (!selectedSubjectId) return;
    setLoadingReport(true);
    try {
      const res = await api.get(`/faculty/reports/defaulters?subjectId=${selectedSubjectId}`);
      setDefaulters(res.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch attendance defaulters report.' });
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, [selectedSubjectId]);

  const filteredDefaulters = defaulters.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-slate-500" />
            Attendance Defaulters List
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit students with attendance falling below the mandatory 75% limit for your assigned subjects.
          </p>
        </div>
      </div>

      {/* Select Subject Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/20 to-transparent" />
        
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-400">Select Course</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
            className="glass-input w-full"
            disabled={loadingSubjects}
          >
            {loadingSubjects ? (
              <option>Loading assigned subjects...</option>
            ) : subjects.length > 0 ? (
              subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name} (Sem {sub.semester.number})
                </option>
              ))
            ) : (
              <option value="">No subjects assigned</option>
            )}
          </select>
        </div>
      </div>

      {selectedSubjectId ? (
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/30 to-transparent" />

          {/* Header */}
          <div className="pb-4 mb-4 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-200">
                Low Attendance Log - {selectedSubject?.name} ({selectedSubject?.department.code})
              </h3>
              <p className="text-xs text-slate-300400/80 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Highlighting student enrollments with attendance &lt; 75.0%
              </p>
            </div>

            {/* Local Search inside report */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search defaulter student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input w-full pl-10 py-1.5"
              />
            </div>
          </div>

          {/* Roster list */}
          {loadingReport ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <p className="text-xs text-slate-500 mt-2">Running audit scan...</p>
            </div>
          ) : filteredDefaulters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4 text-center">Total Classes</th>
                    <th className="py-3 px-4 text-center">Attended</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredDefaulters.map((row) => (
                    <tr key={row.studentId} className="hover:bg-slate-900/5 hover:border-l-4 hover:border-l-slate-800/20 transition-all">
                      <td className="py-3.5 px-4 font-semibold text-slate-350">
                        {row.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-450">
                        <a href={`mailto:${row.email}`} className="flex items-center gap-1.5 hover:text-slate-350 transition-colors">
                          <Mail className="h-3.5 w-3.5" />
                          {row.email}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-semibold">
                        {row.totalClasses}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {row.presentClasses}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-extrabold text-slate-400 bg-slate-900/10 border border-slate-800500/20 px-2.5 py-1 rounded-full">
                          {row.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <BookOpen className="h-12 w-12 text-slate-800 mb-2" />
              <h3 className="text-sm font-semibold text-slate-350">Roster Clear</h3>
              <p className="text-xs mt-1">All enrolled students in this subject are currently above the 75% attendance threshold!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <AlertTriangle className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No Course Selected</h3>
          <p className="text-sm mt-1">Please select an assigned subject to audit attendance defaulters.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default DefaultersList;
