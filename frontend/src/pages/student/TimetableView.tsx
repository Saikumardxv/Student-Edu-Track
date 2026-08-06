import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, GraduationCap, Loader2, Info } from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface TimetableSlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
}

const TimetableView: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDayTab, setActiveDayTab] = useState<string>('Monday');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await api.get('/student/timetable');
        setSlots(res.data);
        
        // Default active tab to current day if today is Mon-Sat
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        if (daysOfWeek.includes(currentDay)) {
          setActiveDayTab(currentDay);
        }
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to retrieve academic timetable.' });
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  // Filter slots for active day
  const activeDaySlots = slots
    .filter((s) => s.day.toLowerCase() === activeDayTab.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-slate-100" />
          Weekly Class Timetable
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review class times, lecture rooms, and professors for the current semester.
        </p>
      </div>

      {/* Day Tabs selector */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-900 bg-slate-950/20 sticky top-16 z-10">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDayTab(day)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all shrink-0 border border-transparent ${
              activeDayTab === day
                ? 'bg-slate-800 text-slate-100 shadow-lg shadow-slate-900/40'
                : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-900'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Slots List */}
      {loading ? (
        <div className="flex h-[250px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : activeDaySlots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDaySlots.map((slot) => (
            <div 
              key={slot.id} 
              className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-lg group"
            >
              {/* Left accent strip */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-slate-700 transition-colors" />
              
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[9px] font-bold tracking-wide uppercase bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-200">
                      {slot.subjectCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-250 mt-2 leading-relaxed">
                      {slot.subjectName}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400 border-t border-slate-850 pt-3 mt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-550 shrink-0" />
                    <span className="font-semibold text-slate-350">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  
                  {slot.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-550 shrink-0" />
                      <span className="text-slate-450">Lecture Location: <span className="font-semibold text-slate-350">{slot.room}</span></span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-550 shrink-0" />
                    <span className="text-slate-450">Instructor: <span className="font-semibold text-slate-350">{slot.facultyName}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-md">
          <Info className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">No classes scheduled</h3>
          <p className="text-sm mt-1">Take a break! There are no lectures planned for {activeDayTab}.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default TimetableView;
