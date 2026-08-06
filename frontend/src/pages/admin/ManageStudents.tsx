import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, 
  X, Loader2, UserCheck, AlertTriangle
} from 'lucide-react';
import api from '../../utils/api';
import { TableSkeleton } from '../../components/Skeleton';
import Toast, { ToastMessage } from '../../components/Toast';

interface StudentData {
  id: number;
  rollNumber: string;
  currentSemester: number;
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
  department: {
    id: number;
    name: string;
    code: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const ManageStudents: React.FC = () => {
  const location = useLocation();
  
  // Lists
  const [students, setStudents] = useState<StudentData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<number | 'ALL'>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [currentSemester, setCurrentSemester] = useState<number>(1);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [stuRes, deptRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/departments')
      ]);
      setStudents(stuRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch students data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to navigation state triggers (e.g. from Quick Actions)
  useEffect(() => {
    if (location.state && (location.state as any).openAddModal) {
      setIsAddModalOpen(true);
      // Clean state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle open actions
  const openEditModal = (stu: StudentData) => {
    setSelectedStudent(stu);
    setName(stu.user.name);
    setEmail(stu.user.email);
    setRollNumber(stu.rollNumber);
    setDepartmentId(stu.department.id);
    setCurrentSemester(stu.currentSemester);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (stu: StudentData) => {
    setSelectedStudent(stu);
    setIsDeleteModalOpen(true);
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRollNumber('');
    setDepartmentId('');
    setCurrentSemester(1);
    setSelectedStudent(null);
  };

  // Submit methods
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !rollNumber || !departmentId || !currentSemester) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/students', {
        name,
        email,
        password,
        rollNumber,
        departmentId,
        currentSemester,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Student added successfully' });
      setIsAddModalOpen(false);
      clearForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to add student' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !rollNumber || !departmentId || !currentSemester) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/admin/students/${selectedStudent!.id}`, {
        name,
        email,
        rollNumber,
        departmentId,
        currentSemester,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Student updated successfully' });
      setIsEditModalOpen(false);
      clearForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update student' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/admin/students/${selectedStudent!.id}`);
      setToast({ id: Date.now().toString(), type: 'success', text: 'Student deleted successfully' });
      setIsDeleteModalOpen(false);
      clearForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to delete student' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter calculations
  const filteredStudents = students.filter((stu) => {
    const matchesSearch = 
      stu.user.name.toLowerCase().includes(search.toLowerCase()) ||
      stu.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      stu.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || stu.department.id === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Users className="h-8 w-8 text-slate-500" />
            Manage Students
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Register new students, update profiles, and manage system roles.
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
          Add Student
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student by name, email, roll number..."
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
      ) : filteredStudents.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Roll Number</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Semester</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-900/25 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {stu.rollNumber}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {stu.user.name}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {stu.user.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
                        {stu.department.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      Sem {stu.currentSemester}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(stu)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(stu)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-900/10 hover:text-slate-300 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4" />
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
          <UserCheck className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No students found</h3>
          <p className="text-sm mt-1">Try modifying your search or department filters.</p>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-200">Register New Student</h3>
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
                    placeholder="John Doe"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="glass-input w-full"
                    placeholder="CSE001"
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
                    placeholder="student@edutrack.com"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Current Semester</label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="glass-input w-full"
                    disabled={submitting}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
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
                  className="flex items-center gap-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register Student
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
              <h3 className="text-lg font-bold text-slate-200">Update Student Information</h3>
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
                  <label className="text-xs font-semibold uppercase text-slate-400">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Current Semester</label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="glass-input w-full"
                    disabled={submitting}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
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

      {/* Delete / Deactivate Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/50 to-transparent" />
            
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-900/10 border border-slate-800500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200">Deactivate Student?</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Are you sure you want to deactivate <span className="font-semibold text-slate-200">{selectedStudent?.user.name}</span> ({selectedStudent?.rollNumber})? 
                  This will permanently delete the student and user records along with all attendance, marks, and enrollments. This action is irreversible.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-4 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 text-xs font-semibold text-slate-350"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900/10600 hover:bg-slate-900/10500 px-4 py-2 text-xs font-semibold text-white shadow-lg"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Deactivation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default ManageStudents;
