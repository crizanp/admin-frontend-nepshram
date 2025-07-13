// context/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, requireSuperAdmin = false }) => {
  const router = useRouter();
  const { admin, loading, isAuthenticated, isSuperAdmin } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 ProtectedRoute: Checking authentication...');
    console.log('🔍 Auth loading:', loading);
    console.log('🔍 Is authenticated:', isAuthenticated);
    console.log('🔍 Is super admin:', isSuperAdmin);
    console.log('🔍 Requires super admin:', requireSuperAdmin);
    console.log('🔍 Admin data:', admin);

    if (loading) {
      console.log('🔍 Auth still loading, waiting...');
      return;
    }

    if (!isAuthenticated) {
      console.log('🔍 Not authenticated, redirecting to login');
      toast.error('Please log in to access this page');
      router.push('/login');
      return;
    }

    if (requireSuperAdmin && !isSuperAdmin) {
      console.log('🔍 Super admin required but user is not super admin');
      toast.error('Access denied. Super admin privileges required.');
      router.push('/dashboard');
      return;
    }

    console.log('✅ Authentication verified, showing protected content');
    setIsAuthorized(true);
    setIsLoading(false);
  }, [loading, isAuthenticated, isSuperAdmin, requireSuperAdmin, router, admin]);

  if (loading || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div className="spinner" style={{ marginBottom: '10px' }}></div>
        <div>Verifying authentication...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Redirecting...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;