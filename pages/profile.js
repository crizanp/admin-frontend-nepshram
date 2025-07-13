// pages/profile.js
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../context/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (admin) {
      setProfileData({
        full_name: admin.full_name || '',
        email: admin.email || '',
      });
    }
  }, [admin]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (profileData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.put('/api/admin/update-profile', profileData);
      toast.success('Profile updated successfully!');
      // You might want to refresh the auth context here
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param) {
            serverErrors[err.param] = err.msg;
          }
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.put('/api/admin/change-password', passwordData);
      toast.success('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password change error:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param) {
            serverErrors[err.param] = err.msg;
          }
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information' },
    { id: 'password', name: 'Change Password' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h3 className="text-2xl font-bold">
                Account Settings
              </h3>
              <p className="mt-2 text-blue-100">
                Manage your account information and security settings.
              </p>
            </div>

            {/* Admin Info */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                    <span className="text-white font-bold text-xl">
                      {admin?.full_name?.charAt(0) || admin?.username?.charAt(0) || 'A'}
                    </span>
                  </div>
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-semibold text-gray-900">
                    {admin?.full_name || admin?.username}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {admin?.email} • {admin?.username}
                  </p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                    admin?.role === 'superadmin' 
                      ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200' 
                      : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200'
                  }`}>
                    {admin?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 bg-gray-50/50">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-lg'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="px-8 py-8">
              {activeTab === 'profile' && (
                <div className="max-w-2xl">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Profile Information</h4>
                    <p className="text-sm text-gray-600">Update your account details below.</p>
                  </div>
                  
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          id="full_name"
                          value={profileData.full_name}
                          onChange={handleProfileChange}
                          className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.full_name 
                              ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                              : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                          }`}
                          placeholder="Enter your full name"
                        />
                        {errors.full_name && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                            {errors.full_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.email 
                              ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                              : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                          }`}
                          placeholder="Enter your email"
                        />
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                            Updating...
                          </>
                        ) : (
                          'Update Profile'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'password' && (
                <div className="max-w-md">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h4>
                    <p className="text-sm text-gray-600">Update your password to keep your account secure.</p>
                  </div>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.currentPassword 
                            ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                            : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Enter current password"
                      />
                      {errors.currentPassword && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.newPassword 
                            ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                            : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Enter new password"
                      />
                      {errors.newPassword && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                          {errors.newPassword}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500 flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.confirmPassword 
                            ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                            : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}