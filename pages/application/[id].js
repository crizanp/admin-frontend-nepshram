// pages/application/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../context/ProtectedRoute';
import toast from 'react-hot-toast';

const ApplicationDetail = () => {
    const router = useRouter();
    const { id } = router.query;
    const { admin, token, loading: authLoading } = useAuth();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    console.log('🔍 Application Detail Component - ID:', id, 'Loading:', loading);

    useEffect(() => {
        if (authLoading) return;
        
        if (id && token) {
            fetchApplicationDetail();
        } else if (!token) {
            toast.error('Authentication required');
            router.push('/login');
        }
    }, [id, token, authLoading]);

    // Helper function to construct proper API URL
    const constructApiUrl = (endpoint) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${cleanBaseUrl}${cleanEndpoint}`;
    };

    const fetchApplicationDetail = async () => {
        try {
            setLoading(true);
            console.log('📡 Fetching application detail for ID:', id);

            const apiUrl = constructApiUrl(`/api/admin/dashboard/application/${id}`);
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
                    router.push('/login');
                    return;
                }
                
                if (response.status === 404) {
                    toast.error('Application not found');
                    router.push('/applications');
                    return;
                }

                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Application data:', data);
            setApplication(data);

        } catch (error) {
            console.error('❌ Error fetching application:', error);
            toast.error(`Failed to load application: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status, note = '') => {
        try {
            setIsUpdating(true);
            console.log('🔄 Updating status to:', status, 'with note:', note);

            const apiUrl = constructApiUrl(`/api/admin/dashboard/application/${id}/status`);
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, note })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update status');
            }

            const data = await response.json();
            console.log('✅ Status updated:', data);
            
            toast.success('Application status updated successfully');
            setShowStatusModal(false);
            setStatusNote('');
            setNewStatus('');
            
            // Refresh application data
            fetchApplicationDetail();

        } catch (error) {
            console.error('❌ Error updating status:', error);
            toast.error('Failed to update application status');
        } finally {
            setIsUpdating(false);
        }
    };

    const openStatusModal = (status) => {
        setNewStatus(status);
        setShowStatusModal(true);
    };

    const getStatusColor = (status) => {
        const colors = {
            'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
            'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'processing': 'bg-purple-100 text-purple-800 border-purple-200',
            'approved': 'bg-green-100 text-green-800 border-green-200',
            'rejected': 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fixed function to handle different file types
    const downloadDocument = (doc, filename) => {
        try {
            if (doc.base64Data) {
                // Handle base64 data
                const link = document.createElement('a');
                link.href = doc.base64Data;
                link.download = filename || doc.fileName || 'document';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (doc.url) {
                // Handle URL-based documents
                const link = document.createElement('a');
                link.href = doc.url;
                link.download = filename || doc.fileName || 'document';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast.error('Document data not available');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        }
    };

    // Function to view document inline
    const viewDocument = (doc) => {
        if (doc.base64Data) {
            const newWindow = window.open('', '_blank');
            if (doc.fileType && doc.fileType.startsWith('image/')) {
                // Display image
                newWindow.document.write(`
                    <html>
                        <head><title>Document Viewer</title></head>
                        <body style="margin: 0; padding: 20px; background: #f5f5f5;">
                            <div style="text-align: center;">
                                <h3>${doc.fileName || 'Document'}</h3>
                                <img src="${doc.base64Data}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
                            </div>
                        </body>
                    </html>
                `);
            } else if (doc.fileType === 'application/pdf') {
                // Display PDF
                newWindow.document.write(`
                    <html>
                        <head><title>PDF Viewer</title></head>
                        <body style="margin: 0; padding: 0;">
                            <embed src="${doc.base64Data}" type="application/pdf" width="100%" height="100%" />
                        </body>
                    </html>
                `);
            } else {
                // For other file types, just download
                downloadDocument(doc, doc.fileName);
                newWindow.close();
            }
        } else if (doc.url) {
            window.open(doc.url, '_blank');
        } else {
            toast.error('Document data not available');
        }
    };

    // Function to get file type icon
    const getFileTypeIcon = (fileType) => {
        if (fileType?.startsWith('image/')) {
            return '🖼️';
        } else if (fileType === 'application/pdf') {
            return '📄';
        } else if (fileType?.includes('word') || fileType?.includes('document')) {
            return '📝';
        } else if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) {
            return '📊';
        } else {
            return '📎';
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
                            {authLoading ? 'Authenticating...' : 'Loading application details...'}
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    // No application found
    if (!application) {
        return (
            <Layout>
                <div className="min-h-screen flex justify-center items-center bg-gray-50">
                    <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Application not found</h3>
                        <p className="text-gray-600 mb-4">The requested application could not be found.</p>
                        <button
                            onClick={() => router.push('/applications')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Back to Applications
                        </button>
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
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Application Details
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Application #{application.application_number}
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex space-x-3">
                                <button
                                    onClick={fetchApplicationDetail}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={() => router.push('/applications')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Back to Applications
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status and Quick Actions */}
                    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-700">Current Status:</span>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(application.status)}`}>
                                    {application.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                                <button
                                    onClick={() => openStatusModal('under_review')}
                                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                                >
                                    Under Review
                                </button>
                                <button
                                    onClick={() => openStatusModal('processing')}
                                    className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                                >
                                    Processing
                                </button>
                                <button
                                    onClick={() => openStatusModal('approved')}
                                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => openStatusModal('rejected')}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="bg-white shadow-sm rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Full Name:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.full_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Email:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.email}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.phone}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">WhatsApp:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.whatsapp_number}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Passport:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.passport_number}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                                    <span className="text-sm text-gray-900 col-span-2">
                                        {application.date_of_birth ? formatDate(application.date_of_birth) : 'Not provided'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Nationality:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.nationality || 'Not provided'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Address:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.address || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Application Timeline */}
                        <div className="bg-white shadow-sm rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h2>
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Submitted:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{formatDate(application.submitted_at)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{formatDate(application.updated_at)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">IP Address:</span>
                                    <span className="text-sm text-gray-900 col-span-2">{application.ip_address || 'Not recorded'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <span className="text-sm font-medium text-gray-500">User Account:</span>
                                    <span className="text-sm text-gray-900 col-span-2">
                                        {application.user_name} ({application.user_email})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Documents - FIXED SECTION */}
                        <div className="bg-white shadow-sm rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                            {application.documents && Object.keys(application.documents).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(application.documents).map(([key, doc]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">
                                                    {getFileTypeIcon(doc.fileType)}
                                                </span>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900 capitalize block">
                                                        {key.replace('_', ' ')}
                                                    </span>
                                                    <p className="text-xs text-gray-500">
                                                        {doc.fileName || 'Document'}
                                                    </p>
                                                    {doc.fileSize && (
                                                        <p className="text-xs text-gray-400">
                                                            {(doc.fileSize / 1024).toFixed(1)} KB
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => viewDocument(doc)}
                                                    className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => downloadDocument(doc, doc.fileName || `${key}.${doc.fileType?.split('/')[1] || 'file'}`)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No documents uploaded</p>
                            )}
                        </div>

                        {/* Agreements */}
                        <div className="bg-white shadow-sm rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agreements</h2>
                            {application.agreements && Object.keys(application.agreements).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(application.agreements).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-900 capitalize">
                                                {key.replace('_', ' ')}
                                            </span>
                                            <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                                                {value ? 'Accepted' : 'Not Accepted'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No agreements recorded</p>
                            )}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white shadow-sm rounded-xl p-6 mt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h2>
                        {application.admin_notes && application.admin_notes.length > 0 ? (
                            <div className="space-y-4">
                                {application.admin_notes.map((note, index) => (
                                    <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                {note.admin_username || 'Admin'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(note.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{note.note}</p>
                                        {note.status && (
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(note.status)}`}>
                                                Status changed to: {note.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No admin notes yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Update Application Status
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Change status to: <span className="font-semibold capitalize">{newStatus.replace('_', ' ')}</span>
                                </p>
                                <textarea
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    placeholder="Add a note about this status change (optional)"
                                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-center gap-3 mt-4">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(newStatus, statusNote)}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isUpdating ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default function ApplicationDetailPage() {
    return (
        <ProtectedRoute>
            <ApplicationDetail />
        </ProtectedRoute>
    );
}