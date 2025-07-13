// pages/manage-admins.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProtectedRoute from '../context/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ManageAdmins = () => {
  const { admin: currentAdmin } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit form state
  const [editData, setEditData] = useState({
    role: '',
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/api/admin/admins');
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (adminId, newRole) => {
    if (adminId === currentAdmin.id) {
      toast.error('Cannot change your own role');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`role_${adminId}`]: true }));

    try {
      await api.put(`/api/admin/admins/${adminId}/role`, { role: newRole });
      toast.success('Admin role updated successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin role:', error);
      const message = error.response?.data?.message || 'Failed to update admin role';
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`role_${adminId}`]: false }));
    }
  };

  const handleToggleStatus = async (adminId, isActive) => {
    if (adminId === currentAdmin.id) {
      toast.error('Cannot change your own status');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`status_${adminId}`]: true }));

    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      await api.put(`/api/admin/admins/${adminId}/${endpoint}`);
      toast.success(`Admin ${isActive ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin status:', error);
      const message = error.response?.data?.message || 'Failed to update admin status';
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`status_${adminId}`]: false }));
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setEditData({
      role: admin.role,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedAdmin) return;

    setActionLoading(prev => ({ ...prev, edit: true }));

    try {
      await handleRoleChange(selectedAdmin.id, editData.role);
      setShowEditModal(false);
      setSelectedAdmin(null);
    } catch (error) {
      // Error handling is already done in handleRoleChange
    } finally {
      setActionLoading(prev => ({ ...prev, edit: false }));
    }
  };

  const openDeleteModal = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAdmin) return;

    await handleToggleStatus(selectedAdmin.id, true); // Deactivate
    setShowDeleteModal(false);
    setSelectedAdmin(null);
  };

  // Filter admins based on search and filters
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && admin.is_active) ||
                         (filterStatus === 'inactive' && !admin.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
              <div className="px-8 py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading admins...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    Admin Management
                  </h3>
                  <p className="mt-2 text-blue-100">
                    Manage admin accounts, roles, and permissions.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/create-admin')}
                  className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Create New Admin
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by name, email, or username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRole('all');
                      setFilterStatus('all');
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{admins.length}</div>
                  <div className="text-sm text-gray-600">Total Admins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {admins.filter(a => a.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {admins.filter(a => a.role === 'superadmin').length}
                  </div>
                  <div className="text-sm text-gray-600">Super Admins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {admins.filter(a => !a.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Inactive</div>
                </div>
              </div>
            </div>

            {/* Admins Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {admin.full_name?.charAt(0) || admin.username?.charAt(0) || 'A'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {admin.full_name || admin.username}
                              {admin.id === currentAdmin.id && (
                                <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {admin.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              @{admin.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.role === 'superadmin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.last_login ? formatDate(admin.last_login) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(admin.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {admin.id !== currentAdmin.id && (
                            <>
                              <button
                                onClick={() => openEditModal(admin)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                                disabled={actionLoading[`status_${admin.id}`]}
                                className={`font-medium ${
                                  admin.is_active 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                } disabled:opacity-50`}
                              >
                                {actionLoading[`status_${admin.id}`] ? 'Loading...' : 
                                 admin.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAdmins.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">No admins found</div>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Admin Role</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin: {selectedAdmin.full_name || selectedAdmin.username}
              </label>
              <select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={actionLoading.edit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading.edit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Deactivate Admin</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate {selectedAdmin.full_name || selectedAdmin.username}? 
              They will no longer be able to access the admin panel.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default function ManageAdminsPage() {
  return (
    <ProtectedRoute requireSuperAdmin={true}>
      <ManageAdmins />
    </ProtectedRoute>
  );
}