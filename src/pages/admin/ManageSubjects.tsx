import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Loader2, X, GraduationCap 
} from 'lucide-react';
import api from '../../utils/api';
import { TableSkeleton } from '../../components/Skeleton';
import Toast, { ToastMessage } from '../../components/Toast';

interface SubjectData {
  id: number;
  name: string;
  code: string;
  credits: number;
  department: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    number: number;
    year: number;
  };
  faculty: {
    id: number;
    employeeId: string;
    user: {
      name: string;
    };
  } | null;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Faculty {
  id: number;
  employeeId: string;
  user: {
    name: string;
  };
}

interface Semester {
  id: number;
  number: number;
  year: number;
}

const ManageSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [semesterId, setSemesterId] = useState<number | ''>('');
  const [facultyId, setFacultyId] = useState<number | ''>('');

  const fetchData = async () => {
    try {
      const [subRes, deptRes, facRes, semRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/departments'),
        api.get('/admin/faculty'),
        api.get('/admin/semesters')
      ]);
      setSubjects(subRes.data);
      setDepartments(deptRes.data);
      setFaculty(facRes.data);
      setSemesters(semRes.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to load subjects data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !credits || !departmentId || !semesterId) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/subjects', {
        name,
        code: code.toUpperCase(),
        credits,
        departmentId,
        semesterId,
        facultyId: facultyId || null,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Subject created and students enrolled' });
      setIsAddModalOpen(false);
      setName('');
      setCode('');
      setCredits('');
      setDepartmentId('');
      setSemesterId('');
      setFacultyId('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to create subject' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter((sub) => {
    return (
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.code.toLowerCase().includes(search.toLowerCase()) ||
      sub.department.code.toLowerCase().includes(search.toLowerCase()) ||
      (sub.faculty?.user.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-brand-500" />
            Manage Subjects
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Register academic courses, set credit values, and assign faculty instructors.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/10 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-xl">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search subjects by name, code, department, faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10"
          />
        </div>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredSubjects.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Subject Code</th>
                  <th className="py-4 px-6">Subject Name</th>
                  <th className="py-4 px-6 text-center">Credits</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Semester</th>
                  <th className="py-4 px-6">Instructor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-900/25 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {sub.code}
                    </td>
                    <td className="py-4 px-6 text-slate-350 font-medium">
                      {sub.name}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-brand-400">
                      {sub.credits}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
                        {sub.department.name} ({sub.department.code})
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      Semester {sub.semester.number}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {sub.faculty ? (
                        <div className="flex items-center gap-1.5 text-slate-350">
                          <GraduationCap className="h-4 w-4 text-brand-400" />
                          <span>{sub.faculty.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not Assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <BookOpen className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No subjects found</h3>
          <p className="text-sm mt-1">Try modifying your search or department filters.</p>
        </div>
      )}

      {/* Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-200">Register New Subject</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Subject Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Database Management"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Subject Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="glass-input w-full uppercase"
                    placeholder="CS204"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Credits</label>
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="glass-input w-full"
                    placeholder="4"
                    min={1}
                    max={6}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    className="glass-input w-full"
                    disabled={submitting}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Semester</label>
                  <select
                    value={semesterId}
                    onChange={(e) => setSemesterId(Number(e.target.value))}
                    className="glass-input w-full"
                    disabled={submitting}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        Semester {sem.number} (Year {sem.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Instructor (Optional)</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input w-full"
                    disabled={submitting}
                  >
                    <option value="">Unassigned</option>
                    {faculty.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.user.name} ({fac.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 text-sm font-semibold text-slate-300"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/10"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default ManageSubjects;
