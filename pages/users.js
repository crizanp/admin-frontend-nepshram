// pages/users.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../context/ProtectedRoute';
import toast from 'react-hot-toast';

const Users = () => {
    const router = useRouter();
    const { admin, token, loading: authLoading } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0
    });
    const [filters, setFilters] = useState({
        verified: 'all',
        search: '',
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC'
    });
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    console.log('🔍 Users Component Render - State:', {
        loading,
        authLoading,
        usersCount: users.length,
        hasToken: !!token,
        hasAdmin: !!admin,
        selectedUsersCount: selectedUsers.length
    });

    useEffect(() => {
        console.log('🔄 useEffect triggered - authLoading:', authLoading, 'token:', !!token);

        if (authLoading) {
            console.log('⏳ Auth still loading, waiting...');
            return;
        }

        if (token) {
            console.log('✅ Token exists, calling fetchUsers');
            fetchUsers();
        } else {
            console.log('❌ No token found after auth loaded');
            setLoading(false);
            toast.error('Authentication token not found. Please login again.');
            router.push('/admin/login');
        }
    }, [token, authLoading, filters.page, filters.verified, filters.search, filters.sortBy, filters.sortOrder]);

    // Helper function to construct proper API URL
    const constructApiUrl = (endpoint) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${cleanBaseUrl}${cleanEndpoint}`;
    };

    const fetchUsers = async () => {
        console.log('📡 Starting fetchUsers...');

        try {
            setLoading(true);
            console.log('⏳ Set loading to true');

            // Build query parameters
            const queryParams = new URLSearchParams({
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                ...(filters.verified !== 'all' && { verified: filters.verified }),
                ...(filters.search && { search: filters.search })
            });

            const apiUrl = constructApiUrl(`/api/admin/users?${queryParams}`);


            console.log('🌐 API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Response not ok:', errorData);

                if (response.status === 401) {
                    toast.error('Session expired. Please login again.');
                    router.push('/admin/login');
                    return;
                }

                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Response data:', data);

            setUsers(data.users || []);
            setPagination(data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalUsers: 0
            });
            console.log('✅ Users set successfully');

        } catch (error) {
            console.error('❌ Error in fetchUsers:', error);
            toast.error(`Failed to load users: ${error.message}`);
            setUsers([]);
        } finally {
            console.log('🏁 Finally block - setting loading to false');
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            setDeleteLoading(userId);
            console.log('🗑️ Deleting user:', userId);

            const apiUrl = constructApiUrl(`/api/admin/users/${userId}`);

            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Delete failed:', errorData);
                throw new Error(errorData.message || 'Failed to delete user');
            }

            toast.success('User deleted successfully');
            console.log('✅ User deleted successfully');

            // Remove user from local state
            setUsers(prev => prev.filter(user => user.id !== userId));
            setSelectedUsers(prev => prev.filter(id => id !== userId));

            // Update pagination count
            setPagination(prev => ({
                ...prev,
                totalUsers: prev.totalUsers - 1
            }));

        } catch (error) {
            console.error('❌ Error deleting user:', error);
            toast.error('Failed to delete user');
        } finally {
            setDeleteLoading(null);
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        try {
            setDeleteLoading('bulk');
            console.log('🗑️ Bulk deleting users:', selectedUsers);

            const apiUrl = constructApiUrl('/api/admin/users/bulk-delete');

            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userIds: selectedUsers })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Bulk delete failed:', errorData);
                throw new Error(errorData.message || 'Failed to delete users');
            }

            const data = await response.json();
            toast.success(`${data.deletedCount} users deleted successfully`);
            console.log('✅ Users deleted successfully');

            // Remove users from local state
            setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
            setSelectedUsers([]);

            // Update pagination count
            setPagination(prev => ({
                ...prev,
                totalUsers: prev.totalUsers - data.deletedCount
            }));

        } catch (error) {
            console.error('❌ Error bulk deleting users:', error);
            toast.error('Failed to delete users');
        } finally {
            setDeleteLoading(null);
            setShowBulkDeleteModal(false);
        }
    };

    const handleVerifyUser = async (userId, verified) => {
        try {
            console.log('🔄 Updating verification for user:', userId);

            const apiUrl = constructApiUrl(`/api/admin/users/${userId}/verify`);

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ verified })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Verification update failed:', errorData);
                throw new Error(errorData.message || 'Failed to update verification');
            }

            toast.success(`User ${verified ? 'verified' : 'unverified'} successfully`);

            // Update user in local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, is_verified: verified } : user
            ));

        } catch (error) {
            console.error('❌ Error updating verification:', error);
            toast.error('Failed to update user verification');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value
        }));
        setSelectedUsers([]); // Clear selection when filters change
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <Layout>
                <div className="min-h-screen flex justify-center items-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                            {authLoading ? 'Authenticating...' : 'Loading users...'}
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Total: {pagination.totalUsers} users
                                    {selectedUsers.length > 0 && (
                                        <span className="ml-2 text-indigo-600">
                                            ({selectedUsers.length} selected)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex space-x-3">
                                {selectedUsers.length > 0 && (
                                    <button
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        disabled={deleteLoading === 'bulk'}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {deleteLoading === 'bulk' ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
                                    </button>
                                )}
                                <button
                                    onClick={fetchUsers}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Status
                                </label>
                                <select
                                    value={filters.verified}
                                    onChange={(e) => handleFilterChange('verified', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">All Users</option>
                                    <option value="true">Verified</option>
                                    <option value="false">Unverified</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by name, email, phone..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="created_at">Registration Date</option>
                                    <option value="name">Name</option>
                                    <option value="email">Email</option>
                                    <option value="is_verified">Verification Status</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Items per page
                                </label>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                        {users.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-gray-400 text-6xl mb-4">👥</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                <p className="text-gray-600 mb-4">
                                    {filters.search || filters.verified !== 'all'
                                        ? 'No users match your current filters.'
                                        : 'No users have registered yet.'}
                                </p>
                                <button
                                    onClick={fetchUsers}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Refresh
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.length === users.length}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User Details
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact Info
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Registered
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => handleSelectUser(user.id)}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {user.id}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {user.email}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.phone || 'No phone'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_verified
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {user.is_verified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatDate(user.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => router.push(`/user/${user.id}`)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyUser(user.id, !user.is_verified)}
                                                            className={`${user.is_verified
                                                                ? 'text-yellow-600 hover:text-yellow-900'
                                                                : 'text-green-600 hover:text-green-900'
                                                                }`}
                                                        >
                                                            {user.is_verified ? 'Unverify' : 'Verify'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setUserToDelete(user);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            disabled={deleteLoading === user.id}
                                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                        >
                                                            {deleteLoading === user.id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                                                disabled={!pagination.hasPrevPage}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                                                disabled={!pagination.hasNextPage}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                                                    <span className="font-medium">{pagination.totalPages}</span> pages
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                                                        disabled={!pagination.hasPrevPage}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                                                        disabled={!pagination.hasNextPage}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Next
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Single User Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete User</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete user &quot;{userToDelete.name || userToDelete.email}&quot;?
                                    This action cannot be undone and will also delete all associated applications.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={() => handleDeleteUser(userToDelete.id)}
                                    disabled={deleteLoading === userToDelete.id}
                                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 disabled:opacity-50"
                                >
                                    {deleteLoading === userToDelete.id ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setUserToDelete(null);
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Multiple Users</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete {selectedUsers.length} selected users?
                                    This action cannot be undone and will also delete all associated applications.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={deleteLoading === 'bulk'}
                                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md mr-2 hover:bg-red-600 disabled:opacity-50"
                                >
                                    {deleteLoading === 'bulk' ? 'Deleting...' : 'Delete All'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBulkDeleteModal(false);
                                        setSelectedUsers([]);
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default function UsersPage() {
    return (
        <ProtectedRoute>
            <Users />
        </ProtectedRoute>
    );
}