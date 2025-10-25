import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react'; // Added LayoutDashboard and Settings icons
import useAuthStore from '../stores/authStore';
import { toast } from 'react-hot-toast';

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-2xl font-extrabold text-blue-600 hover:text-blue-800 transition-colors duration-200">
              PixelForge Nexus
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user.role === 'admin' && (
              <Link
                to="/users"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1"
              >
                <Users size={18} /> User Management
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex gap-2 items-center rounded-full bg-blue-50 text-sm py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                aria-label="User profile menu"
              >
                <div className="h-9 w-9 rounded-full bg-blue-400 flex items-center justify-center text-white font-semibold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-800 font-medium hidden md:block">{user?.name}</span>
                <ChevronDown size={18} className={`text-blue-600 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <Link
                    to="/account"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <Settings size={16} className="mr-2 text-gray-400" /> Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    <LogOut size={16} className="mr-2 text-gray-400" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;