import React, { useState, useEffect } from 'react';
import { Building2, Plus, Calendar, Loader2, Users, GraduationCap, BookOpen } from 'lucide-react';
import api from '../../utils/api';
import { CardSkeleton } from '../../components/Skeleton';
import Toast, { ToastMessage } from '../../components/Toast';

interface DepartmentData {
  id: number;
  name: string;
  code: string;
  _count: {
    students: number;
    faculty: number;
    subjects: number;
  };
}

const ManageDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch departments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Name and Code are required' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/departments', { name, code: code.toUpperCase() });
      setToast({ id: Date.now().toString(), type: 'success', text: 'Department created successfully' });
      setName('');
      setCode('');
      setIsAddModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to create department' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-slate-500" />
            Departments & Semesters
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize college departments, curriculum semesters, and aggregate metrics.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Department
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="glass-panel p-6 rounded-2xl relative overflow-hidden group shadow-xl">
              {/* Decorative side accent */}
              <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-slate-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800500/10 text-slate-400 border border-slate-700500/25 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-200 mt-2 group-hover:text-slate-400 transition-colors">
                    {dept.name}
                  </h3>
                </div>
              </div>

              {/* Statistics list */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 mt-4 text-center">
                <div className="space-y-1">
                  <div className="flex justify-center text-slate-550 group-hover:text-slate-400 transition-colors">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-base font-bold text-slate-200">{dept._count.students}</p>
                  <p className="text-[9px] font-medium uppercase text-slate-500 tracking-wider">Students</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-center text-slate-550 group-hover:text-slate-400 transition-colors">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <p className="text-base font-bold text-slate-200">{dept._count.faculty}</p>
                  <p className="text-[9px] font-medium uppercase text-slate-500 tracking-wider">Faculty</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-center text-slate-550 group-hover:text-slate-400 transition-colors">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="text-base font-bold text-slate-200">{dept._count.subjects}</p>
                  <p className="text-[9px] font-medium uppercase text-slate-500 tracking-wider">Subjects</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <Building2 className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No departments setup</h3>
          <p className="text-sm mt-1">Create one using the button in the top right.</p>
        </div>
      )}

      {/* Semesters Info Panel */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/20 to-transparent" />
        
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-slate-400" />
          B.Tech Curriculum Semesters
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 flex flex-col justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-200">Semester {index + 1}</h4>
                <p className="text-xs text-slate-500 mt-0.5">B.Tech core program</p>
              </div>
              <span className="mt-4 inline-flex items-center justify-center text-[10px] font-semibold text-slate-400 bg-slate-900/10 border border-slate-800500/20 px-2.5 py-1 rounded-full">
                Year {2026 + Math.floor(index / 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-200">Create Department</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Department Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="glass-input w-full uppercase"
                  placeholder="e.g. CSE"
                  disabled={submitting}
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Department Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full"
                  placeholder="e.g. Computer Science & Engineering"
                  disabled={submitting}
                />
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
                  className="flex items-center gap-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Department
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

export default ManageDepartments;
