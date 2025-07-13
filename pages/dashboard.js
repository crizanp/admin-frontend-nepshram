// pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../context/ProtectedRoute';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const router = useRouter();
  const { admin, logout, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard stats or data here
    setLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="bg-white shadow-sm rounded-xl p-8 mb-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {admin?.full_name || admin?.username}!
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    {admin?.email}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize">{admin?.role}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${
                  admin?.role === 'superadmin' 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200' 
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {admin?.role === 'superadmin' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Super Admin
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Admin
                    </>
                  )}
                </span>
              
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Applications</h3>
                <p className="text-sm text-gray-600 mb-4">View and manage applications</p>
                <button 
                  onClick={() => router.push('/applications')}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                >
                  View Applications
                </button>
              </div>

              <div className="group bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
                <p className="text-sm text-gray-600 mb-4">Update your profile settings</p>
                <button 
                  onClick={() => router.push('/profile')}
                  className="w-full bg-gray-600 text-white py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  Edit Profile
                </button>
              </div>

              {/* Super Admin Only Actions */}
              {isSuperAdmin && (
                <>
                  <div className="group bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-green-200 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Admin</h3>
                    <p className="text-sm text-gray-600 mb-4">Create new admin accounts</p>
                    <button 
                      onClick={() => router.push('/create-admin')}
                      className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                    >
                      Create Admin
                    </button>
                  </div>

                  <div className="group bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Admins</h3>
                    <p className="text-sm text-gray-600 mb-4">View and manage admin accounts</p>
                    <button 
                      onClick={() => router.push('/manage-admins')}
                      className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
                    >
                      Manage Admins
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}