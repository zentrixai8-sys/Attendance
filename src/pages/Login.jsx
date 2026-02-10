"use client";

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, Building2, Eye, EyeOff } from "lucide-react";
import { AuthContext } from '../App';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header - Always visible on mobile */}
      <div className="lg:hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
        <div className="relative z-10 px-6 py-8 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30 mb-3">
              <Building2 className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">AttendanceHub</h1>
            <p className="text-yellow-300 text-sm font-medium">Powered by Zentrix</p>
          </motion.div>
        </div>
        
        {/* Wave SVG */}
        <div className="relative">
          <svg className="w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </div>

      {/* Left Panel - Branded Section (Desktop only) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo/Brand */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AttendanceHub</h1>
                <p className="text-sm text-emerald-100">Powered by Zentrix</p>
              </div>
            </div>
          </motion.div>

          {/* Main Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-5xl font-bold text-yellow-300 mb-4 leading-tight">
                Track. Manage. Excel.
              </h2>
              <p className="text-2xl text-white font-light">
                Let's make your team WIN.
              </p>
            </div>
            
            <div className="bg-yellow-400 text-emerald-900 px-4 py-2 rounded-lg inline-block text-sm font-medium">
              Attendance | Reports | Analytics | Real-time Updates
            </div>

            {/* Illustration placeholder */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-12"
            >
              <div className="relative">
                {/* Simple illustration representation */}
                <div className="flex items-end justify-center gap-4">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-32 bg-white/20 backdrop-blur-sm rounded-t-full border-4 border-white/30"
                  ></motion.div>
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="w-32 h-40 bg-white/30 backdrop-blur-sm rounded-t-full border-4 border-white/40"
                  ></motion.div>
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="w-24 h-28 bg-white/20 backdrop-blur-sm rounded-t-full border-4 border-white/30"
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-emerald-100 text-sm"
          >
            <p>© 2024 | AttendanceHub. All Rights Reserved</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:p-8 bg-gray-50 flex-1">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back!</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username/Email Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-gray-600 mb-2 tracking-wide"
                >
                  Email id / mobile no.
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-6 pr-0 py-3 border-b-2 border-gray-300 focus:border-emerald-600 outline-none transition-colors bg-transparent text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="Please enter email id or mobile no"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-600 mb-2 tracking-wide"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-3 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-6 pr-10 py-3 border-b-2 border-gray-300 focus:border-emerald-600 outline-none transition-colors bg-transparent text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-3 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </motion.button>
            </form>

            {/* Footer Text */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>© 2024 HROne. All rights reserved. <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
