import React, { useState, useEffect } from 'react';
import { 
  Calendar, Building2, Plus, Trash2, Save, Loader2, Clock, MapPin
} from 'lucide-react';
import api from '../../utils/api';
import Toast, { ToastMessage } from '../../components/Toast';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  semesterId: number;
}

interface Semester {
  id: number;
  number: number;
  year: number;
}

interface TimetableSlot {
  id?: number;
  subjectId: number;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  subjectCode?: string;
  subjectName?: string;
}

const ManageTimetable: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  // Selection
  const [selectedDept, setSelectedDept] = useState<number | ''>('');
  const [selectedSem, setSelectedSem] = useState<number | ''>('');
  
  // Timetable State
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // New Slot Form Fields
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch departments & semesters
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, semRes] = await Promise.all([
          api.get('/admin/departments'),
          api.get('/admin/semesters'),
        ]);
        setDepartments(deptRes.data);
        setSemesters(semRes.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to load configuration metadata' });
      }
    };
    fetchMetadata();
  }, []);

  // Fetch existing slots and subjects when department + semester changes
  useEffect(() => {
    if (!selectedDept || !selectedSem) {
      setSlots([]);
      setSubjects([]);
      return;
    }

    const fetchDataForSelection = async () => {
      setLoadingSlots(true);
      try {
        const [slotsRes, subRes] = await Promise.all([
          api.get(`/admin/timetable?departmentId=${selectedDept}&semesterId=${selectedSem}`),
          api.get(`/admin/subjects?departmentId=${selectedDept}&semesterId=${selectedSem}`),
        ]);
        setSlots(slotsRes.data);
        setSubjects(subRes.data);
      } catch (err) {
        console.error(err);
        setToast({ id: Date.now().toString(), type: 'error', text: 'Failed to fetch timetable data' });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchDataForSelection();
  }, [selectedDept, selectedSem]);

  // Filter subjects (already filtered by API query parameters)
  const filteredSubjects = subjects;

  const handleAddLocalSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !day || !startTime || !endTime || !room) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please fill in all slot details' });
      return;
    }

    // Find subject details
    const selectedSub = subjects.find((s) => s.id === subjectId);
    if (!selectedSub) return;

    // Check for collision (same day and overlapping time)
    // For simplicity, we check direct overlap of start times
    const isConflict = slots.some(
      (s) => s.day === day && s.startTime === startTime && s.room === room
    );

    if (isConflict) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Time collision detected for this room!' });
      return;
    }

    const newSlot: TimetableSlot = {
      subjectId,
      day,
      startTime,
      endTime,
      room,
      subjectCode: selectedSub.code,
      subjectName: selectedSub.name,
    };

    setSlots((prev) => [...prev, newSlot]);
    
    // Clear inputs except day and room for quick consecutive entries
    setSubjectId('');
    setStartTime('');
    setEndTime('');
  };

  const handleDeleteLocalSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePublishTimetable = async () => {
    if (!selectedDept || !selectedSem) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Please select department and semester' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/timetable', {
        departmentId: selectedDept,
        semesterId: selectedSem,
        slots: slots.map((s) => ({
          subjectId: s.subjectId,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
        })),
      });

      setToast({ id: Date.now().toString(), type: 'success', text: 'Timetable published successfully!' });
    } catch (err: any) {
      console.error(err);
      setToast({ 
        id: Date.now().toString(), 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to publish timetable' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-slate-500" />
            Timetable Planner
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build and edit weekly class schedules for departments and active semesters.
          </p>
        </div>
      </div>

      {/* Target Config Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/20 to-transparent" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-400">Department</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value ? Number(e.target.value) : '');
                  setSubjectId('');
                }}
                className="glass-input w-full pl-10"
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-400">Curriculum Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value ? Number(e.target.value) : '');
                setSubjectId('');
              }}
              className="glass-input w-full"
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  Semester {sem.number} (Year {sem.year})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedDept && selectedSem ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Slot Draft Form */}
          <div className="glass-panel p-6 rounded-2xl h-fit relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/30 to-transparent" />
            
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
              <Plus className="h-5 w-5 text-slate-400" />
              Add Class Slot
            </h3>

            <form onSubmit={handleAddLocalSlot} className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(Number(e.target.value))}
                  className="glass-input w-full"
                  required
                >
                  <option value="">Select Course</option>
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
                {filteredSubjects.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    No subjects registered for this semester yet.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Day of Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="glass-input w-full"
                  required
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="glass-input w-full"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="glass-input w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Lecture Room / Hall</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="glass-input w-full"
                  placeholder="e.g. Room 101 / LAB A"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 py-2.5 font-semibold text-slate-400 active:scale-95 transition-all mt-6"
              >
                <Plus className="h-4 w-4" />
                Add Slot to Draft
              </button>
            </form>
          </div>

          {/* Draft & Active Schedule List */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700500/30 to-transparent" />
            
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800/80">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-400" />
                Schedule Drafts ({slots.length} slots)
              </h3>
              <button
                onClick={handlePublishTimetable}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-500 px-4 py-2 text-xs font-semibold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Publish Schedule
              </button>
            </div>

            <div className="flex-1 space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                  <p className="text-xs text-slate-500 mt-2">Loading timetable slots...</p>
                </div>
              ) : slots.length > 0 ? (
                slots.map((slot, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-slate-800/80 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-slate-800500/10 text-slate-400 border border-slate-700500/20 px-1.5 py-0.5 rounded">
                          {slot.subjectCode}
                        </span>
                        <span className="font-semibold text-slate-200 text-sm">{slot.subjectName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-550" />
                          <span>{slot.day}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-550" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-550" />
                          <span>{slot.room}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLocalSlot(index)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-900/10 hover:text-slate-400 transition-colors"
                      title="Remove Slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                  <Calendar className="h-12 w-12 text-slate-800 mb-2" />
                  <p className="text-sm">No slots added yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Draft a timetable slot using the form on the left.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-panel py-20 rounded-2xl flex flex-col items-center justify-center text-slate-550 shadow-md">
          <Calendar className="h-14 w-14 text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-350">Timetable Planner Inactive</h3>
          <p className="text-sm mt-1">Please select a Department and Semester from the selectors above.</p>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default ManageTimetable;
