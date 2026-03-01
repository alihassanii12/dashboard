"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import gsap from 'gsap';
import { 
  ArrowLeft, 
  User, 
  HardDrive, 
  Moon, 
  Mail,
  LogOut,
  RefreshCw,
  Key,
  FolderLock,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

// ==================== API CONFIGURATION ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  // Lock Folder Password state
  const [hasLockPassword, setHasLockPassword] = useState(false);
  
  // Preferences state
  const [darkMode, setDarkMode] = useState(true);
  
  // Storage state
  const [storage, setStorage] = useState<StorageInfo>({
    used: 0,
    total: 15 * 1024 * 1024 * 1024,
    percentage: 0
  });

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'otp' | 'confirm'>('otp');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // GSAP animation for modals
  useEffect(() => {
    if (modalRef.current && (showForgotModal || showDeleteModal)) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [showForgotModal, showDeleteModal]);

  // Fetch user data on mount
  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    setLoading(true);
    try {
    
      // Get user data
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          withCredentials: true
        });
        
        if (res.data.user) {
          setUser(res.data.user);
          setDisplayName(res.data.user.name || '');
          setEmail(res.data.user.email || '');
          setForgotEmail(res.data.user.email || '');
        }
      } catch (err: any) {
        console.error('Auth check error:', err);
        if (err.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/login');
          return;
        }
      }
      
      // Load dark mode preference
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setDarkMode(prefs.darkMode ?? true);
      }

      await fetchStorageInfo();
      await checkLockPasswordStatus();
      
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/media/storage`, {
        withCredentials: true
      });
      setStorage({
        used: res.data.used || 0,
        total: res.data.total || 15 * 1024 * 1024 * 1024,
        percentage: res.data.percentage || 0
      });
    } catch (err) {
      console.error('Failed to fetch storage:', err);
    }
  };

  const checkLockPasswordStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/locked/has-password`, {
        withCredentials: true
      });
      setHasLockPassword(res.data.hasPassword);
    } catch (err) {
      console.error('Failed to check lock password status:', err);
      setHasLockPassword(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/auth/update-profile`,
        { name: displayName, email },
        { withCredentials: true }
      );
      
      toast.success('Profile updated successfully');
      
      if (user) {
        setUser({ ...user, name: displayName, email });
        setForgotEmail(email);
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Save dark mode preference
  const saveDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    const prefs = { darkMode: newDarkMode };
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success('Dark mode updated');
  };

  // ==================== FORGOT PASSWORD FLOW ====================
  const handleSendForgotOtp = async () => {
    if (!forgotEmail) {
      toast.error('Enter your email');
      return;
    }

    setForgotLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/forgotPassword/send-otp`, {
        email: forgotEmail,
      });
      toast.success('OTP sent to your email ✅');
      setForgotStep('otp');
    } catch (err: any) {
      console.error('Send OTP error:', err);
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    if (!forgotOtp) {
      toast.error('Enter OTP');
      return;
    }

    setForgotLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/forgotPassword/verify-otp`, {
        email: forgotEmail,
        otp: forgotOtp,
      });
      toast.success('OTP verified ✅');
      setForgotStep('reset');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error('Enter new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/forgotPassword/reset-password`, {
        email: forgotEmail,
        password: newPassword,
      });
      toast.success('Password reset successful ✅');
      setShowForgotModal(false);
      setForgotStep('email');
      setForgotOtp('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Reset password error:', err);
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  // ==================== DELETE ACCOUNT FLOW ====================
  const handleSendDeleteOtp = async () => {
    setDeleteLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/delete-account/send-otp`,
        {},
        { withCredentials: true }
      );
      toast.success('OTP sent to your email ✅');
      setDeleteStep('confirm');
    } catch (err: any) {
      console.error('Send delete OTP error:', err);
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOtp) {
      toast.error('Enter OTP');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/delete-account/confirm`,
        { otp: deleteOtp },
        { withCredentials: true }
      );
      
      toast.success(res.data.message || 'Account deleted successfully 🗑️');
      
      // Clear cookies
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      
      setTimeout(() => router.push('/register'), 1500);
    } catch (err: any) {
      console.error('Delete account error:', err);
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleLogout = async () => {
    const logoutToast = toast.loading('Logging out...');
    
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      toast.success('Logged out successfully', { id: logoutToast });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Logout failed', { id: logoutToast });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '12px',
          },
        }}
      />
      
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5 border border-gray-800"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {forgotStep === 'email' && 'Forgot Password'}
                {forgotStep === 'otp' && 'Enter OTP'}
                {forgotStep === 'reset' && 'Reset Password'}
              </h2>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep('email');
                  setForgotOtp('');
                  setNewPassword('');
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400">
              {forgotStep === 'email' && 'Enter your email to receive OTP'}
              {forgotStep === 'otp' && 'Enter the OTP sent to your email'}
              {forgotStep === 'reset' && 'Enter your new password'}
            </p>

            {forgotStep === 'email' && (
              <>
                <input
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  disabled={!forgotEmail || forgotLoading}
                  onClick={handleSendForgotOtp}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            )}

            {forgotStep === 'otp' && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  disabled={!forgotOtp || forgotLoading}
                  onClick={handleVerifyForgotOtp}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  disabled={!newPassword || forgotLoading}
                  onClick={handleResetPassword}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5 border border-gray-800"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {deleteStep === 'otp' ? 'Delete Account' : 'Confirm Delete'}
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteStep('otp');
                  setDeleteOtp('');
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {deleteStep === 'otp' && (
              <>
                <p className="text-sm text-gray-400">
                  Click below to receive OTP on your registered email
                </p>
                <button
                  disabled={deleteLoading}
                  onClick={handleSendDeleteOtp}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {deleteLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            )}

            {deleteStep === 'confirm' && (
              <>
                <p className="text-sm text-gray-400">
                  Enter the OTP sent to your email
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <p className="text-xs text-red-400 text-center">
                  ⚠️ This action is permanent and cannot be undone
                </p>
                <button
                  disabled={!deleteOtp || deleteLoading}
                  onClick={handleConfirmDelete}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-30 px-4 sm:px-6 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-xl transition"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </nav>

      <main className="pt-20 p-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <User size={20} className="text-blue-400" />
              <span>Profile</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>

          {/* Lock Folder Password Status */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <FolderLock size={20} className="text-blue-400" />
              <span>Lock Folder</span>
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock size={16} className={hasLockPassword ? "text-green-400" : "text-gray-500"} />
                <span className={hasLockPassword ? "text-green-400" : "text-gray-400"}>
                  {hasLockPassword ? 'Password Set' : 'No Password'}
                </span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
              >
                Manage in Dashboard
              </button>
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Account Security</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowForgotModal(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition group"
              >
                <div className="flex items-center space-x-3">
                  <Key size={18} className="text-blue-400" />
                  <span className="text-gray-300">Reset Password</span>
                </div>
                <span className="text-gray-500 group-hover:text-gray-400">→</span>
              </button>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition group"
              >
                <div className="flex items-center space-x-3">
                  <Trash2 size={18} className="text-red-400" />
                  <span className="text-gray-300">Delete Account</span>
                </div>
                <span className="text-gray-500 group-hover:text-gray-400">→</span>
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <Moon size={20} className="text-blue-400" />
              <span>Preferences</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Dark Mode</span>
                <button
                  onClick={saveDarkMode}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      darkMode ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Storage - Real Time */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <HardDrive size={20} className="text-blue-400" />
                <span>Storage</span>
              </h2>
              <button
                onClick={fetchStorageInfo}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Used</span>
                <span className="text-white font-medium">
                  {formatFileSize(storage.used)} / {formatFileSize(storage.total)}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300" 
                  style={{ width: `${storage.percentage}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {storage.percentage.toFixed(1)}% used
              </p>
            </div>
          </div>

          {/* Session */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <LogOut size={20} className="text-blue-400" />
              <span>Session</span>
            </h2>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}