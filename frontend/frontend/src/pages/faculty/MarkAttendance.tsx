import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarCheck, Calendar, Loader2, Save, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface Subject {
  id: number;
  name: string;
  code: string;
  department: { code: string };
  semester: { number: number };
}

interface StudentAttendanceRow {
  studentId: number;
  rollNumber: string;
  name: string;
  attendanceId: number | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  isMarked: boolean;
}

const MarkAttendance: React.FC = () => {
  const location = useLocation();
  const state = location.state as { subjectId?: number; autoSelect?: boolean } | null;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [studentsList, setStudentsList] = useState<StudentAttendanceRow[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Fetch subjects assigned to this faculty
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/faculty/subjects');
        setSubjects(res.data);
        
        // Auto-select subject if navigated from dashboard today's class shortcut
        if (state && state.subjectId) {
          // Find matching subject by checking the timetable slot's subject
          // Or if dashboard passed subjectId directly
          const matched = res.data.find((s: Subject) => s.id === state.subjectId);
          if (matched) {
            setSelectedSubjectId(matched.id);
          } else if (res.data.length > 0) {
            // Backup fallback: see if we can find the subject by code/name, or just take first
            setSelectedSubjectId(res.data[0].id);
          }
        } else if (res.data.length > 0) {
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
  }, [state]);

  // Fetch student roster and logs when subject or date changes
  const fetchAttendanceSheet = async () => {
    if (!selectedSubjectId) return;
    setLoadingSheet(true);
    try {
      const res = await api.get(`/attendance?subjectId=${selectedSubjectId}&date=${date}`);
      setStudentsList(res.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to load attendance roster.' });
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSheet();
  }, [selectedSubjectId, date]);

  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudentsList((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, status } : row))
    );
  };

  const markAllAs = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudentsList((prev) => prev.map((row) => ({ ...row, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubjectId) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please select a subject first.' });
      return;
    }

    setSubmitting(true);
    try {
      const records = studentsList.map((row) => ({
        studentId: row.studentId,
        status: row.status,
      }));

      await api.post('/attendance', {
        subjectId: selectedSubjectId,
        date,
        records,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Attendance logged successfully.' });
      // Re-fetch sheet to refresh state/IDs
      fetchAttendanceSheet();
    } catch (err: any) {
      console.error(err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit attendance logs.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-slate-500" />
            Mark Attendance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Select course and date to manage student attendance records.
          </p>
        </div>
      </div>

      {/* Select Subject & Date Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/20 to-transparent" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-400">Assigned Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
              className="glass-input w-full"
              disabled={loadingSubjects}
            >
              {loadingSubjects ? (
                <option>Loading subjects...</option>
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-400">Class Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {selectedSubjectId ? (
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/30 to-transparent" />

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-slate-200">
                Student Roster - {selectedSubject?.name} ({selectedSubject?.department.code})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Active Session: Semester {selectedSubject?.semester.number}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => markAllAs('PRESENT')}
                className="rounded-lg bg-slate-900/10 border border-slate-800500/20 hover:bg-slate-900/20 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors"
                disabled={loadingSheet || submitting}
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAllAs('ABSENT')}
                className="rounded-lg bg-slate-900/10 border border-slate-800500/20 hover:bg-slate-900/20 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors"
                disabled={loadingSheet || submitting}
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student List Grid */}
          {loadingSheet ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <p className="text-xs text-slate-500 mt-2">Loading roster...</p>
            </div>
          ) : studentsList.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {studentsList.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-900/15 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-300">
                          {row.rollNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-200">
                          {row.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentId, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                row.status === 'PRESENT'
                                  ? 'bg-slate-900/20 text-slate-400 border-slate-800500/40 shadow-sm shadow-slate-900/5'
                                  : 'bg-slate-950/45 text-slate-500 border-slate-900 hover:text-slate-350 hover:bg-slate-900/30'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentId, 'LATE')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                row.status === 'LATE'
                                  ? 'bg-slate-900/20 text-slate-400 border-slate-800500/40 shadow-sm shadow-slate-900/5'
                                  : 'bg-slate-950/45 text-slate-500 border-slate-900 hover:text-slate-350 hover:bg-slate-900/30'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentId, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                row.status === 'ABSENT'
                                  ? 'bg-slate-900/20 text-slate-400 border-slate-800500/40 shadow-sm shadow-slate-900/5'
                                  : 'bg-slate-950/45 text-slate-500 border-slate-900 hover:text-slate-350 hover:bg-slate-900/30'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Attendance
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <AlertCircle className="h-12 w-12 text-slate-800 mb-2" />
              <p className="text-sm">No students enrolled in this course.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <CalendarCheck className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No Course Selected</h3>
          <p className="text-sm mt-1">Please select an assigned subject to configure attendance records.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default MarkAttendance;
