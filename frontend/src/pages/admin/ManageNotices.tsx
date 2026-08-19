import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, BellRing, Loader2, X, Users, Building2, Calendar } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface Notice {
  id: number;
  title: string;
  content: string;
  targetRole: string | null;
  departmentId: number | null;
  createdAt: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const ManageNotices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<string>(''); // "" maps to null (All)
  const [departmentId, setDepartmentId] = useState<number | ''>(''); // "" maps to null (All)

  const fetchData = async () => {
    try {
      const [noticeRes, deptRes] = await Promise.all([
        api.get('/notices'),
        api.get('/admin/departments')
      ]);
      setNotices(noticeRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
      setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch notices history' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Title and content are required' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/notices', {
        title,
        content,
        targetRole: targetRole || null,
        departmentId: departmentId || null,
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Announcement broadcasted successfully!' });
      setIsAddModalOpen(false);
      setTitle('');
      setContent('');
      setTargetRole('');
      setDepartmentId('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to publish announcement' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDeptCode = (id: number | null) => {
    if (!id) return null;
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.code : null;
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-slate-500" />
            Daily College Notices
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and publish daily campus notices, maintenance updates, and student announcements.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Post Announcement
        </button>
      </div>

      {/* Notices Feed / History List */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/20 to-transparent" />
        
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6 border-b border-slate-800/85 pb-4">
          <BellRing className="h-5 w-5 text-slate-400" />
          Broadcast History
        </h3>

        <div className="space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <p className="text-xs text-slate-500 mt-2">Loading notice board history...</p>
            </div>
          ) : notices.length > 0 ? (
            notices.map((notice) => {
              const deptCode = getDeptCode(notice.departmentId);
              return (
                <div 
                  key={notice.id} 
                  className="p-5 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 transition-all"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-slate-200 text-base">{notice.title}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Target Audience Badges */}
                      <span className="text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-500" />
                        {notice.targetRole || 'ALL ROLES'}
                      </span>
                      {deptCode && (
                        <span className="text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-100500/80" />
                          {deptCode}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-550 flex items-center gap-1 ml-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(notice.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mt-2 whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Megaphone className="h-12 w-12 text-slate-800 mb-2" />
              <p className="text-sm">No announcements broadcasted yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-200">Compose Notice</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Notice Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full"
                  placeholder="e.g. End Semester Exam Fee Payment"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="glass-input appearance-none w-full"
                    disabled={submitting}
                  >
                    <option value="">All Roles</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="FACULTY">Faculty Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Target Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input appearance-none w-full"
                    disabled={submitting}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Content Description</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="glass-input w-full min-h-[140px]"
                  placeholder="Type the notice details here..."
                  disabled={submitting}
                  required
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
                  Broadcast Notice
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

export default ManageNotices;
