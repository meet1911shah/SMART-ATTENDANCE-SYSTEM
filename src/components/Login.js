import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff, GraduationCap, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: New Password
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const { user, login, signup, forceBootstrapAdmin, forgotPassword, resetPassword, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(`/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const result = await forgotPassword(email, formData.role);
    if (result.success) {
      setRecoveryEmail(email);
      setForgotStep(2);
      toast.success('Identity verified! Please set a new password.');
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    const result = await resetPassword(formData.role, recoveryEmail, newPassword);
    if (result.success) {
      setShowForgotModal(false);
      setForgotStep(1);
      setRecoveryEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.username, formData.password, formData.role);

    if (result.success) {
      navigate(`/${formData.role}`);
    }
  };

  const initializeAdminAccount = async () => {
    toast.loading('Performing deep rescue...', { id: 'rescue' });
    const result = await forceBootstrapAdmin();
    toast.dismiss('rescue');

    if (result.success) {
      toast.success('Admin account rescued! Redirecting...');
    } else {
      toast.error(`Rescue failed: ${result.error}`);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student', icon: GraduationCap, color: 'text-blue-600' },
    { value: 'teacher', label: 'Teacher', icon: Users, color: 'text-green-600' }
  ];

  return (


    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo className="mx-auto mb-6 transform scale-150" showText={false} />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${formData.role === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-1 ${option.color}`} />
                      <span className="text-xs font-medium text-gray-700">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username/Email Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Email or Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="Enter your email or username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {showForgotModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {forgotStep === 1 ? 'Verify Identity' : 'Set New Password'}
                  </h3>
                  <button
                    onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Lock className="h-5 w-5" />
                  </button>
                </div>

                {forgotStep === 1 ? (
                  <>
                    <p className="text-sm text-gray-600 mb-6">
                      Enter your registered email address and role to verify your identity.
                    </p>
                    <form onSubmit={handleForgotVerify} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          className="input-field h-10 py-0"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input name="email" type="email" required className="input-field" placeholder="your@email.com" />
                      </div>
                      <div className="flex space-x-3 pt-2">
                        <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 btn-primary">
                          {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-6">
                      Identity verified for <strong>{recoveryEmail}</strong>. Please enter your new password.
                    </p>
                    <form onSubmit={handleForgotReset} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input name="newPassword" type="password" required className="input-field" placeholder="••••••••" minLength="6" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input name="confirmPassword" type="password" required className="input-field" placeholder="••••••••" minLength="6" />
                      </div>
                      <div className="flex space-x-3 pt-2">
                        <button type="button" onClick={() => { setShowForgotModal(false); setForgotStep(1); }} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 btn-primary">
                          {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up
              </button>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
