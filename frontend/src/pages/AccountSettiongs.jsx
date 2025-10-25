import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';
import { ChevronDown, Loader2, User, Lock, Mail } from 'lucide-react'; // Added icons
import axiosInstance from '../services/axiosInstance';
import Navbar from '../components/Navbar';

function AccountSettings() {
  const { user, logout } = useAuthStore();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields', { style: { background: '#fef2f2', color: '#b91c1c' } });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match', { style: { background: '#fef2f2', color: '#b91c1c' } });
      return;
    }
    if (newPassword.length < 4) { // Increased minimum password length for better security
      toast.error('New password must be at least 8 characters', { style: { background: '#fef2f2', color: '#b91c1c' } });
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put('/api/auth/users/password', { currentPassword, newPassword });
      toast.success('Password updated successfully!', { style: { background: '#dcfce7', color: '#15803d' } });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update password. Please try again.', { style: { background: '#fef2f2', color: '#b91c1c' } });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('You have been successfully logged out!', { style: { background: '#dcfce7', color: '#15803d' } });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">

      {/* Navbar */}
      <Navbar/>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Profile Information */}
        <div className="mb-8 bg-white overflow-hidden shadow-lg rounded-xl transform transition-all hover:scale-[1.005]">
          <div className="px-5 py-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-5 border-b pb-3">Your Profile Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <div className="flex items-center">
                <User size={20} className="text-indigo-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base text-gray-900 mt-1">{user?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail size={20} className="text-indigo-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-base text-gray-900 mt-1">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Lock size={20} className="text-indigo-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-base text-gray-900 mt-1 capitalize">{user?.role || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white overflow-hidden shadow-lg rounded-xl transform transition-all hover:scale-[1.005]">
          <div className="px-5 py-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">Update Your Password</h2>
            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  required
                  minLength="4"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  required
                  minLength="4"
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 mt-4 flex justify-start">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                  aria-label="Change password"
                >
                  {loading && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountSettings;