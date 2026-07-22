import React, { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Shared Pages
import Login from './pages/Login';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageNotices from './pages/admin/ManageNotices';
import AdminReports from './pages/admin/AdminReports';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MarkAttendance from './pages/faculty/MarkAttendance';
import EnterMarks from './pages/faculty/EnterMarks';
import DefaultersList from './pages/faculty/DefaultersList';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import GradesView from './pages/student/GradesView';
import AttendanceView from './pages/student/AttendanceView';
import TimetableView from './pages/student/TimetableView';
import NoticesView from './pages/student/NoticesView';

// App Layout Wrapper
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useContext(AuthContext);

  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 bg-gradient-to-b from-slate-900/40 to-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const auth = useContext(AuthContext);
  if (auth?.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
      </div>
    );
  }
  
  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to respective dashboard
  if (auth.user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (auth.user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<ManageStudents />} />
                <Route path="/admin/faculty" element={<ManageFaculty />} />
                <Route path="/admin/departments" element={<ManageDepartments />} />
                <Route path="/admin/subjects" element={<ManageSubjects />} />
                <Route path="/admin/timetable" element={<ManageTimetable />} />
                <Route path="/admin/notices" element={<ManageNotices />} />
                <Route path="/admin/reports" element={<AdminReports />} />
              </Route>

              {/* Faculty Routes */}
              <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/attendance" element={<MarkAttendance />} />
                <Route path="/faculty/marks" element={<EnterMarks />} />
                <Route path="/faculty/defaulters" element={<DefaultersList />} />
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/grades" element={<GradesView />} />
                <Route path="/student/attendance" element={<AttendanceView />} />
                <Route path="/student/timetable" element={<TimetableView />} />
                <Route path="/student/notices" element={<NoticesView />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
