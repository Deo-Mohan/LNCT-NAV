import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminGuard protects routes that require administrative privileges.
 * In a real production app, this would check a JWT token or a session 
 * from a backend to verify the user's role.
 */
const AdminGuard = ({ children }) => {
  // Mock authentication check
  // In reality: const { user } = useAuth(); return user.role === 'admin' ? ...
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true';

  if (!isAuthenticated) {
    // Redirect to login if not an admin
    console.warn("Access denied: User is not an admin.");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminGuard;
