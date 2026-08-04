import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // TODO: Connect your backend API here
    console.log(formData);

    alert("Registration Successful!");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#09091b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#13132a] rounded-2xl shadow-xl border border-gray-800 p-8">

        <div className="flex justify-center mb-6">
          <div className="bg-purple-600 p-4 rounded-xl">
            <GraduationCap className="text-white w-8 h-8" />
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
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-black outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-300 text-sm">
              EMAIL ADDRESS
            </label>

            <div className="relative mt-2">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />

              <input
                type="email"
                name="email"
                required
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-black outline-none"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-gray-300 text-sm">
              ROLE
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full mt-2 p-3 rounded-lg bg-white text-black outline-none"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-300 text-sm">
              PASSWORD
            </label>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-12 py-3 rounded-lg bg-white text-black outline-none"
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
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-black outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold hover:opacity-90 transition"
          >
            Register
          </button>

          <div className="text-center mt-4">
            <span className="text-gray-400">
              Already have an account?{" "}
            </span>

            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold"
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