// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null); // Add token state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = Cookies.get('admin_token');
    console.log('🔍 AuthProvider: Initial token check:', adminToken ? 'Token found' : 'No token');
    
    if (adminToken) {
      setToken(adminToken); // Set token in state
      fetchAdminProfile(adminToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdminProfile = async (adminToken) => {
    try {
      // Use the token parameter or get it from cookies
      const tokenToUse = adminToken || Cookies.get('admin_token');
      console.log('🔍 Fetching admin profile with token:', tokenToUse ? 'Token present' : 'No token');
      
      const response = await api.get('/api/admin/me');
      setAdmin(response.data);
      setToken(tokenToUse); // Ensure token is set in state
      console.log('✅ Admin profile fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching admin profile:', error);
      Cookies.remove('admin_token');
      setToken(null); // Clear token on error
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/admin/login', {
        username,
        password,
      });
      const { token: newToken, admin: adminData } = response.data;
      
      Cookies.set('admin_token', newToken, { expires: 1 }); // 1 day
      setToken(newToken); // Set token in state
      setAdmin(adminData);
      console.log('✅ Login successful, token set');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    Cookies.remove('admin_token');
    setToken(null); // Clear token from state
    setAdmin(null);
    console.log('✅ Logout successful, token cleared');
  };

  const value = {
    admin,
    token, // Expose token
    login,
    logout,
    loading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'superadmin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};