import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Search, Filter, Plus, Edit2, 
  X, Loader2, BookOpen
} from 'lucide-react';
import api from '../../utils/api';
import { TableSkeleton } from '../../components/Skeleton';
import Toast, { ToastMessage } from '../../components/Toast';

interface FacultyData {
  id: number;
  employeeId: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  department: {
    id: number;
    name: string;
    code: string;
  };
  subjects: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const ManageFaculty: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<number | 'ALL'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFac, setSelectedFac] = useState<FacultyData | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');

  const fetchData = async () => {
    try {
      const [facRes, deptRes] = await Promise.all([
        api.get('/admin/faculty'),
        api.get('/admin/departments')
      ]);
      setFaculty(facRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch faculty data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (fac: FacultyData) => {
    setSelectedFac(fac);
    setName(fac.user.name);
    setEmail(fac.user.email);
    setEmployeeId(fac.employeeId);
    setDepartmentId(fac.department.id);
    setIsEditModalOpen(true);
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setEmployeeId('');
    setDepartmentId('');
    setSelectedFac(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !employeeId || !departmentId) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/faculty', {
        name,
        email,
        password,
        employeeId,
        departmentId,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Faculty created successfully' });
      setIsAddModalOpen(false);
      clearForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to create faculty member' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId || !departmentId) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/admin/faculty/${selectedFac!.id}`, {
        name,
        email,
        employeeId,
        departmentId,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Faculty updated successfully' });
      setIsEditModalOpen(false);
      clearForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update faculty member' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaculty = faculty.filter((fac) => {
    const matchesSearch = 
      fac.user.name.toLowerCase().includes(search.toLowerCase()) ||
      fac.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      fac.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || fac.department.id === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-slate-500" />
            Manage Faculty
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Register academic staff, assign teaching roles, and configure system permissions.
          </p>
        </div>
        <button
          onClick={() => {
            clearForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Faculty
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search staff by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto items-center">
          <Filter className="h-4 w-4 text-slate-500 shrink-0 hidden sm:block" />
          <select
            value={selectedDept === 'ALL' ? 'ALL' : selectedDept}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDept(val === 'ALL' ? 'ALL' : Number(val));
            }}
            className="glass-input w-full md:w-56"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredFaculty.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Assigned Subjects</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredFaculty.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-900/25 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {fac.employeeId}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {fac.user.name}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {fac.user.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
                        {fac.department.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {fac.subjects.length > 0 ? (
                          fac.subjects.map((sub) => (
                            <span 
                              key={sub.id} 
                              className="text-[10px] font-semibold bg-slate-800500/10 text-slate-400 border border-slate-700500/20 px-2 py-0.5 rounded-full"
                              title={sub.name}
                            >
                              {sub.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openEditModal(fac)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Edit Faculty"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-md">
          <BookOpen className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No faculty members found</h3>
          <p className="text-sm mt-1">Try modifying your search or department filters.</p>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-200">Appoint Academic Staff</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Dr. Alan Turing"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="glass-input w-full"
                    placeholder="EMP001"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full"
                    placeholder="alan.turing@edutrack.com"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </div>
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
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-200">Update Faculty Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="glass-input w-full"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full"
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
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
                  Save Changes
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

export default ManageFaculty;
