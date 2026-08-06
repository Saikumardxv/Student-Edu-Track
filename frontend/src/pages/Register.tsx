import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";
import api from "../utils/api";

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

  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/95 rounded-[2rem] shadow-[0_24px_120px_-40px_rgba(15,23,42,0.8)] border border-slate-800/40 p-8 backdrop-blur-xl">

        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 p-4 rounded-3xl shadow-lg shadow-slate-900/20">
            <GraduationCap className="text-slate-100 w-8 h-8" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center text-white">
          Create Account
        </h1>

        <p className="text-center text-gray-400 mt-2 mb-8">
          Register to access EduTrack
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="text-gray-300 text-sm">
              FULL NAME
            </label>

            <div className="relative mt-2">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />

              <input
                type="text"
                name="name"
                required
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-900 text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-300 text-sm">
              EMAIL ADDRESS
            </label>

            <input
              type="email"
              name="email"
              required
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="w-full mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 outline-none"
            />
          </div>

          {/* Roll Number */}
          <div>
            <label className="text-gray-300 text-sm">
              ROLL NUMBER
            </label>

            <input
              type="text"
              name="rollNumber"
              required
              placeholder="Enter roll number"
              value={formData.rollNumber}
              onChange={handleChange}
              className="w-full mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 outline-none"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-gray-300 text-sm">
              DEPARTMENT
            </label>

            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 outline-none"
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="text-gray-300 text-sm">
              SEMESTER
            </label>

            <select
              name="currentSemester"
              value={formData.currentSemester}
              onChange={handleChange}
              className="w-full mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 outline-none"
              required
            >
              <option value="">Select semester</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  Semester {semester.number} - {semester.year}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-300 text-sm">
              PASSWORD
            </label>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-12 py-3 rounded-2xl bg-slate-900/90 text-slate-100 outline-none border border-slate-700 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/30"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? (
                  <EyeOff className="text-gray-500 w-5 h-5" />
                ) : (
                  <Eye className="text-gray-500 w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-300 text-sm">
              CONFIRM PASSWORD
            </label>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />

              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-900 text-slate-100 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-slate-700 text-slate-100 font-semibold shadow-xl shadow-slate-900/30 hover:bg-slate-600 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div className="text-center mt-4">
            <span className="text-gray-400">
              Already have an account?{" "}
            </span>

            <Link
              to="/login"
              className="text-slate-300 hover:text-slate-100 font-semibold"
            >
              Sign In
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;