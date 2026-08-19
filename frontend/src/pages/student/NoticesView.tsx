import React, { useState, useEffect } from 'react';
import { BellRing, Calendar, Megaphone, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

const NoticesView: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/notices');
        setNotices(res.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch notice board announcements.' });
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          <p className="text-xs text-slate-550">Syncing notice board announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <BellRing className="h-8 w-8 text-slate-100" />
          Daily College Notices
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Stay updated with daily campus alerts, service notices, and maintenance information.
        </p>
      </div>

      {/* Notices Stack */}
      <div className="space-y-4">
        {notices.length > 0 ? (
          notices.map((notice) => (
            <div 
              key={notice.id} 
              className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300"
            >
              {/* Top gradient glow bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-200 transition-colors">
                  {notice.title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(notice.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                {notice.content}
              </p>
            </div>
          ))
        ) : (
          <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-md">
            <Megaphone className="h-14 w-14 text-slate-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-355">Notice board clear</h3>
            <p className="text-sm mt-1">There are no notices broadcasted to your role or department at this time.</p>
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default NoticesView;
