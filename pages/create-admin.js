// pages/create-admin.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProtectedRoute from '../context/ProtectedRoute';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    email: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      await api.post('/api/admin/create-admin', submitData);
      toast.success('Admin created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Create admin error:', error);
      const message = error.response?.data?.message || 'Failed to create admin';
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h3 className="text-2xl font-bold">
                Create New Admin
              </h3>
              <p className="mt-2 text-blue-100">
                Create a new admin user with specified role and permissions.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.username 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter username"
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.full_name 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.full_name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    Super Admin can create/manage other admins
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.password}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                        : 'border-gray-300 focus:border-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </button>
              </div>
            </form>
          </div>

        
        </div>
      </div>
    </Layout>
  );
};

export default function CreateAdminPage() {
  return (
    <ProtectedRoute requireSuperAdmin={true}>
      <CreateAdmin />
    </ProtectedRoute>
  );
}