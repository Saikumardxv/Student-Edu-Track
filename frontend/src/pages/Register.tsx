import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, Palette } from "lucide-react";
import api from "../utils/api";
import { ThemeContext, Theme } from "../context/ThemeContext";

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  number: number;
  year: number;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);

  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);

  const currentTheme = themeCtx?.theme || 'slate';
  const setTheme = themeCtx?.setTheme;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rollNumber: "",
    departmentId: "",
    currentSemester: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, semRes] = await Promise.all([
          api.get('/auth/departments'),
          api.get('/auth/semesters'),
        ]);
        setDepartments(deptRes.data);
        setSemesters(semRes.data);
      } catch (err) {
        console.error('Load registration data error:', err);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!formData.departmentId || !formData.currentSemester) {
      alert("Please select a department and semester");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        rollNumber: formData.rollNumber,
        departmentId: Number(formData.departmentId),
        currentSemester: Number(formData.currentSemester),
      });

      alert("Registration successful! Please login to continue.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const themesList: Array<{ id: Theme; name: string; color: string }> = [
    { id: 'slate', name: 'Slate Dark', color: 'bg-slate-700' },
    { id: 'indigo', name: 'Indigo Glow', color: 'bg-indigo-500' },
    { id: 'emerald', name: 'Emerald Forest', color: 'bg-emerald-500' },
    { id: 'sunset', name: 'Sunset Amber', color: 'bg-orange-500' },
    { id: 'crimson', name: 'Crimson Vampire', color: 'bg-red-500' },
    { id: 'light', name: 'Luxury Light', color: 'bg-slate-300' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden font-sans theme-bg text-[var(--text-primary)] transition-colors duration-300">
      {/* Dynamic Glowing Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--glow-color),_transparent_35%),radial-gradient(circle_at_bottom_right,_var(--glow-color),_transparent_35%)] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Card Header & graduation cap */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] p-4 rounded-3xl shadow-lg shadow-black/30 transition-all">
            <GraduationCap className="text-[var(--accent-foreground)] w-8 h-8" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center text-[var(--text-primary)]">
          Create Account
        </h1>

        <p className="text-center text-[var(--text-muted)] mt-2 mb-8">
          Register to access EduTrack
        </p>

        {/* Glassmorphic Card Container */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-2xl relative overflow-hidden transition-all">
          {/* Top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full glass-input pl-4"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full glass-input pl-4"
                />
              </div>
            </div>

            {/* Roll Number */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Roll Number
              </label>
              <input
                type="text"
                name="rollNumber"
                required
                placeholder="Enter roll number"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full glass-input"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full glass-input appearance-none block bg-[var(--input-bg)]"
                required
              >
                <option value="" className="theme-surface">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="theme-surface">
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Semester
              </label>
              <select
                name="currentSemester"
                value={formData.currentSemester}
                onChange={handleChange}
                className="w-full glass-input appearance-none block bg-[var(--input-bg)]"
                required
              >
                <option value="" className="theme-surface">Select semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id} className="theme-surface">
                    Semester {semester.number} - {semester.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full glass-input pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full glass-input pl-4"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-3 rounded-lg font-semibold shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center mt-4">
              <span className="text-[var(--text-muted)] text-sm">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold transition-colors text-sm"
              >
                Sign In
              </Link>
            </div>

          </form>

          {/* Theme Selector Widget */}
          <div className="mt-8 pt-6 border-t theme-border flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-[var(--accent)]" /> Customize Page Theme
            </span>
            <div className="flex gap-2">
              {themesList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme?.(t.id)}
                  className={`h-5 w-5 rounded-full ${t.color} border border-white/20 transition-transform hover:scale-125 ${
                    currentTheme === t.id ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)] scale-110' : ''
                  }`}
                  title={t.name}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;