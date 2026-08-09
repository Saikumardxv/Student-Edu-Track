import React, { useState, useContext, useEffect, useRef } from 'react';
import { User as UserIcon, Mail, Shield, Key, Camera, Loader2, Save } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Toast, { ToastMessage } from '../components/Toast';

const Profile: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth) return null;
  const { user, updateUser } = auth;

  if (!user) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  
  // Info Form States
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if context changes
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhotoPreview(user.photo);
  }, [user]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'Name and email are required' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      const response = await api.put('/student/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update state and context
      updateUser(response.data.user);
      setToast({ id: Date.now().toString(), type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      console.error(err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile info',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'All password fields are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ id: Date.now().toString(), type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/student/profile', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ id: Date.now().toString(), type: 'success', text: 'Password changed successfully' });
    } catch (err: any) {
      console.error(err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Avatar & Summary */}
        <div className="w-full md:w-1/3 flex flex-col items-center p-6 glass-panel rounded-2xl text-center h-fit relative">
          {/* Accent border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
          
          <div className="relative group cursor-pointer mb-4" onClick={triggerFileInput}>
            <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center shadow-lg transition-all group-hover:border-slate-400">
              {photoPreview ? (
                <img src={photoPreview} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-slate-500" />
              )}
            </div>
            {/* Camera Overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />

          <h3 className="text-xl font-bold text-slate-100">{user.name}</h3>
          <p className="text-xs font-semibold text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 mt-2">
            {user.role}
          </p>

          <div className="w-full border-t border-slate-800/80 mt-6 pt-6 space-y-3 text-left text-sm">
            {user.rollNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Roll Number:</span>
                <span className="text-slate-300 font-semibold">{user.rollNumber}</span>
              </div>
            )}
            {user.employeeId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="text-slate-300 font-semibold">{user.employeeId}</span>
              </div>
            )}
            {user.currentSemester && (
              <div className="flex justify-between">
                <span className="text-slate-500">Semester:</span>
                <span className="text-slate-300 font-semibold">{user.currentSemester}</span>
              </div>
            )}
            {user.departmentName && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-300 font-medium text-xs leading-relaxed bg-slate-900 border border-slate-800 p-2 rounded-lg">
                  {user.departmentName} ({user.departmentCode})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden shadow-xl">
          {/* Navigation tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-900/40">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors border-b-2
                ${activeTab === 'info' 
                  ? 'border-slate-400 text-slate-100 bg-slate-900/80' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors border-b-2
                ${activeTab === 'security' 
                  ? 'border-slate-400 text-slate-100 bg-slate-900/80' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Security Settings
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'info' ? (
              <form onSubmit={handleInfoSubmit} className="space-y-6">
                <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
                  <UserIcon className="h-5 w-5 text-slate-300" />
                  Edit Profile Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="glass-input w-full pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input w-full pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSecuritySubmit} className="space-y-6">
                <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-slate-300" />
                  Change Password
                </h4>

                <div className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="glass-input w-full"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="glass-input w-full"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input w-full"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default Profile;
