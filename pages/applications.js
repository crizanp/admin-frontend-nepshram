// pages/applications.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../context/ProtectedRoute';
import toast from 'react-hot-toast';

const Applications = () => {
    const router = useRouter();
    const { admin, token, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalApplications: 0
    });
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        page: 1,
        limit: 10
    });

    console.log('🔍 Applications Component Render - State:', {
        loading,
        authLoading,
        applicationsCount: applications.length,
        hasToken: !!token,
        hasAdmin: !!admin,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'No token',
        adminInfo: admin ? { id: admin.id, username: admin.username, role: admin.role } : null
    });

    useEffect(() => {
        console.log('🔄 useEffect triggered - authLoading:', authLoading, 'token:', !!token);

        // Wait for auth to finish loading
        if (authLoading) {
            console.log('⏳ Auth still loading, waiting...');
            return;
        }

        if (token) {
            console.log('✅ Token exists, calling fetchApplications');
            fetchApplications();
        } else {
            console.log('❌ No token found after auth loaded');
            setLoading(false);
            toast.error('Authentication token not found. Please login again.');
            router.push('/login');
        }
    }, [token, authLoading, filters.page, filters.status, filters.search]);

    // Helper function to construct proper API URL
    const constructApiUrl = (endpoint) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Remove trailing slash from baseUrl if present
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

        // Ensure endpoint starts with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        return `${cleanBaseUrl}${cleanEndpoint}`;
    };

    const fetchApplications = async () => {
        console.log('📡 Starting fetchApplications...');

        try {
            setLoading(true);
            console.log('⏳ Set loading to true');

            // Build query parameters
            const queryParams = new URLSearchParams({
                page: filters.page,
                limit: filters.limit,
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.search && { search: filters.search })
            });

            // Use helper function to construct URL properly
            const apiUrl = constructApiUrl(`/api/admin/dashboard/applications?${queryParams}`);

            console.log('🌐 API URL:', apiUrl);
            console.log('🔑 Token for request:', token ? `${token.substring(0, 20)}...` : 'No token');

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Response not ok:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });

                if (response.status === 401) {
                    toast.error('Session expired. Please login again.');
                    router.push('/admin/login');
                    return;
                }

                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Response data:', data);

            setApplications(data.applications || []);
            setPagination(data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalApplications: 0
            });
            console.log('✅ Applications set successfully');

        } catch (error) {
            console.error('❌ Error in fetchApplications:', error);
            toast.error(`Failed to load applications: ${error.message}`);
            setApplications([]);
        } finally {
            console.log('🏁 Finally block - setting loading to false');
            setLoading(false);
        }
    };

    const handleStatusChange = async (applicationId, newStatus, note = '') => {
        try {
            // Use helper function to construct URL properly
            const apiUrl = constructApiUrl(`/api/admin/dashboard/application/${applicationId}/status`);

            console.log('🔄 Updating status for application:', applicationId);
            console.log('🔄 API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus, note })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Status update failed:', errorData);
                throw new Error(errorData.message || 'Failed to update status');
            }

            const data = await response.json();
            toast.success('Application status updated successfully');
            console.log('✅ Status updated successfully:', data);

            // Refresh applications
            fetchApplications();
        } catch (error) {
            console.error('❌ Error updating status:', error);
            toast.error('Failed to update application status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'submitted': 'bg-blue-100 text-blue-800',
            'under_review': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-purple-100 text-purple-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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
            page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
        }));
    };
    const deleteApplication = async (applicationId, applicationNumber) => {
    if (!confirm(`Are you sure you want to delete application ${applicationNumber}? This action cannot be undone.`)) {
        return;
    }

    try {
        // FIX: Add 'application' to the URL path
        const apiUrl = constructApiUrl(`/api/admin/dashboard/application/${applicationId}`);

        console.log('🗑️ Deleting application:', applicationId);
        console.log('🌐 DELETE URL:', apiUrl); // Add this for debugging

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
            throw new Error(errorData.message || 'Failed to delete application');
        }

        toast.success('Application deleted successfully');
        console.log('✅ Application deleted successfully');

        // Refresh applications
        fetchApplications();
    } catch (error) {
        console.error('❌ Error deleting application:', error);
        toast.error('Failed to delete application');
    }
};

    console.log('🎯 Before render - loading state:', loading, 'authLoading:', authLoading);

    // Show loading if auth is still loading or data is loading
    if (authLoading || loading) {
        console.log('⏳ Rendering loading state');
        return (
            <Layout>
                <div className="min-h-screen flex justify-center items-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                            {authLoading ? 'Authenticating...' : 'Loading applications...'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Check console for debug info</p>
                    </div>
                </div>
            </Layout>
        );
    }

    console.log('🎯 Rendering main content with applications:', applications.length);

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Applications Management</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Total: {pagination.totalApplications} applications
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex space-x-3">
                                <button
                                    onClick={() => {
                                        console.log('🔄 Refresh clicked');
                                        fetchApplications();
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={() => {
                                        console.log('🔙 Back to dashboard clicked');
                                        router.push('/dashboard');
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status Filter
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="processing">Processing</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
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
                                    placeholder="Search by name, email, or application number..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
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


                    {/* Applications Table */}
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                        {applications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-gray-400 text-6xl mb-4">📋</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                                <p className="text-gray-600 mb-4">
                                    {filters.search || filters.status !== 'all'
                                        ? 'No applications match your current filters.'
                                        : 'No applications have been submitted yet.'}
                                </p>
                                <button
                                    onClick={() => {
                                        console.log('🔄 Refresh clicked');
                                        fetchApplications();
                                    }}
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Application Details
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact Info
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Submitted
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {applications.map((application) => {
                                                console.log('🔍 Rendering application:', application.id);
                                                return (
                                                    <tr key={application.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {application.application_number}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {application.full_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {application.email}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {application.phone}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                                                                {application.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {formatDate(application.submitted_at)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => router.push(`/application/${application.id}`)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                >
                                                                    View
                                                                </button>
                                                                <select
                                                                    value={application.status}
                                                                    onChange={(e) => handleStatusChange(application.id, e.target.value)}
                                                                    className="text-sm border-gray-300 rounded-md"
                                                                >
                                                                    <option value="submitted">Submitted</option>
                                                                    <option value="under_review">Under Review</option>
                                                                    <option value="processing">Processing</option>
                                                                    <option value="approved">Approved</option>
                                                                    <option value="rejected">Rejected</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => deleteApplication(application.id, application.application_number)}
                                                                    className="text-red-600 hover:text-red-900 ml-2"
                                                                    title="Delete application"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>

                                                    </tr>
                                                );
                                            })}
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
        </Layout>
    );
};

export default function ApplicationsPage() {
    return (
        <ProtectedRoute>
            <Applications />
        </ProtectedRoute>
    );
}