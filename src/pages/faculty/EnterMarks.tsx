import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Save, Loader2, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface Subject {
  id: number;
  name: string;
  code: string;
  department: { code: string };
  semester: { number: number };
}

interface StudentMarksRow {
  studentId: number;
  rollNumber: string;
  name: string;
  markId: number | null;
  internal1: number | string;
  internal2: number | string;
  midterm: number | string;
  external: number | string;
  total: number | null;
  grade: string | null;
  saving?: boolean; // Row-level saving state
}

const EnterMarks: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [studentsList, setStudentsList] = useState<StudentMarksRow[]>([]);
  
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
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

  // Fetch student roster and marks when subject changes
  const fetchMarksSheet = async () => {
    if (!selectedSubjectId) return;
    setLoadingSheet(true);
    try {
      const res = await api.get(`/marks?subjectId=${selectedSubjectId}`);
      // Replace nulls with empty strings to make input management clean in React
      const cleaned = res.data.map((row: any) => ({
        ...row,
        internal1: row.internal1 !== null ? row.internal1 : '',
        internal2: row.internal2 !== null ? row.internal2 : '',
        midterm: row.midterm !== null ? row.midterm : '',
        external: row.external !== null ? row.external : '',
        saving: false,
      }));
      setStudentsList(cleaned);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to load grade sheets.' });
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    fetchMarksSheet();
  }, [selectedSubjectId]);

  // Handle local cell edit
  const handleCellChange = (studentId: number, field: 'internal1' | 'internal2' | 'midterm' | 'external', value: string) => {
    // Validate bounds (0 to 100)
    if (value !== '') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) return;
    }

    setStudentsList((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;

        const updatedRow = { ...row, [field]: value };

        // Recalculate total & grade locally in real-time
        const i1 = updatedRow.internal1 !== '' ? Number(updatedRow.internal1) : null;
        const i2 = updatedRow.internal2 !== '' ? Number(updatedRow.internal2) : null;
        const ext = updatedRow.external !== '' ? Number(updatedRow.external) : null;

        if (i1 !== null || i2 !== null || ext !== null) {
          const v1 = i1 || 0;
          const v2 = i2 || 0;
          const vExt = ext || 0;
          const total = parseFloat((v1 * 0.25 + v2 * 0.25 + vExt * 0.5).toFixed(2));

          let grade = 'F';
          if (total >= 90) grade = 'A+';
          else if (total >= 80) grade = 'A';
          else if (total >= 70) grade = 'B+';
          else if (total >= 60) grade = 'B';
          else if (total >= 50) grade = 'C';
          else if (total >= 40) grade = 'D';

          return { ...updatedRow, total, grade };
        } else {
          return { ...updatedRow, total: null, grade: null };
        }
      })
    );
  };

  // Row-level save trigger
  const handleSaveRow = async (studentId: number) => {
    const row = studentsList.find((r) => r.studentId === studentId);
    if (!row || !selectedSubjectId) return;

    // Set row saving loader
    setStudentsList((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, saving: true } : r))
    );

    try {
      await api.post('/marks', {
        subjectId: selectedSubjectId,
        studentId: row.studentId,
        internal1: row.internal1,
        internal2: row.internal2,
        midterm: row.midterm,
        external: row.external,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: `Marks saved for ${row.name}.` });
      
      // Update saving flag to false
      setStudentsList((prev) =>
        prev.map((r) => (r.studentId === studentId ? { ...r, saving: false } : r))
      );
    } catch (err: any) {
      console.error(err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        text: err.response?.data?.message || `Failed to save marks for ${row.name}.`,
      });
      setStudentsList((prev) =>
        prev.map((r) => (r.studentId === studentId ? { ...r, saving: false } : r))
      );
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-brand-500" />
            Enter Academic Marks
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Edit exam scores and calculate grades. Total is computed: Internal 1 (25%) + Internal 2 (25%) + External (50%).
          </p>
        </div>
      </div>

      {/* Selector Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-400">Select Subject</label>
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
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

          {/* Roster Title */}
          <div className="pb-4 mb-4 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-200">
                Gradesheet - {selectedSubject?.name} ({selectedSubject?.department.code})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Curriculum Active Semester: Semester {selectedSubject?.semester.number}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg text-xs text-slate-400">
              <Info className="h-4 w-4 text-brand-400 shrink-0" />
              <span>Click "Save" row button to upload student scores.</span>
            </div>
          </div>

          {/* Table Spreadsheet */}
          {loadingSheet ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-xs text-slate-500 mt-2">Loading gradesheet...</p>
            </div>
          ) : studentsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-2 text-center w-24">Internal 1 (25%)</th>
                    <th className="py-3 px-2 text-center w-24">Internal 2 (25%)</th>
                    <th className="py-3 px-2 text-center w-24">Midterm</th>
                    <th className="py-3 px-2 text-center w-24">External (50%)</th>
                    <th className="py-3 px-2 text-center w-20">Total (100)</th>
                    <th className="py-3 px-2 text-center w-16">Grade</th>
                    <th className="py-3 px-4 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {studentsList.map((row) => (
                    <tr key={row.studentId} className="hover:bg-slate-900/15 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-350">
                        {row.rollNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-200 font-medium">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={row.internal1}
                          onChange={(e) => handleCellChange(row.studentId, 'internal1', e.target.value)}
                          className="glass-input text-center w-full py-1.5 px-1 bg-slate-950/20 border-slate-850"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={row.internal2}
                          onChange={(e) => handleCellChange(row.studentId, 'internal2', e.target.value)}
                          className="glass-input text-center w-full py-1.5 px-1 bg-slate-950/20 border-slate-850"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={row.midterm}
                          onChange={(e) => handleCellChange(row.studentId, 'midterm', e.target.value)}
                          className="glass-input text-center w-full py-1.5 px-1 bg-slate-950/20 border-slate-850"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={row.external}
                          onChange={(e) => handleCellChange(row.studentId, 'external', e.target.value)}
                          className="glass-input text-center w-full py-1.5 px-1 bg-slate-950/20 border-slate-850"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-brand-400">
                        {row.total !== null ? row.total : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {row.grade ? (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                              row.grade === 'F'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {row.grade}
                          </span>
                        ) : (
                          <span className="text-slate-650 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(row.studentId)}
                          disabled={row.saving}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-brand-400 disabled:opacity-50 transition-colors"
                          title="Save Marks"
                        >
                          {row.saving ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <AlertCircle className="h-12 w-12 text-slate-800 mb-2" />
              <p className="text-sm">No students registered in this course.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <FileSpreadsheet className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No Course Selected</h3>
          <p className="text-sm mt-1">Please select an assigned subject to configure student grades.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default EnterMarks;
