// utils/auth.js
import Cookies from 'js-cookie';

// Token management with cookies for consistency
export const setToken = (token, isAdmin = false) => {
  if (typeof window !== 'undefined') {
    const tokenKey = isAdmin ? 'admin_token' : 'token';
    Cookies.set(tokenKey, token, { expires: 1 }); // 1 day expiry
    console.log(`✅ Token stored as ${tokenKey}`);
  }
};

export const getToken = (isAdmin = false) => {
  if (typeof window !== 'undefined') {
    const tokenKey = isAdmin ? 'admin_token' : 'token';
    return Cookies.get(tokenKey);
  }
  return null;
};

export const removeToken = (isAdmin = false) => {
  if (typeof window !== 'undefined') {
    const tokenKey = isAdmin ? 'admin_token' : 'token';
    Cookies.remove(tokenKey);
    console.log(`✅ Token removed: ${tokenKey}`);
  }
};

export const isAuthenticated = () => {
  return !!getToken(false);
};

// Admin authentication functions
export const isAdminAuthenticated = () => {
  const token = getToken(true);
  console.log('🔍 Admin auth check - Token present:', !!token);
  return !!token;
};

export const setAdminToken = (token) => {
  setToken(token, true);
};

export const getAdminToken = () => {
  return getToken(true);
};

export const removeAdminToken = () => {
  removeToken(true);
};

// Clear all tokens
export const clearAllTokens = () => {
  if (typeof window !== 'undefined') {
    Cookies.remove('token');
    Cookies.remove('admin_token');
    console.log('✅ All tokens cleared');
  }
};

// Get user type based on available tokens
export const getUserType = () => {
  if (typeof window !== 'undefined') {
    if (Cookies.get('admin_token')) {
      return 'admin';
    }
    if (Cookies.get('token')) {
      return 'user';
    }
  }
  return null;
};