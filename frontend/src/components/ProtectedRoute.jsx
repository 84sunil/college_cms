import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated && user?.role === 'admin' ? (
    children
  ) : (
    <Navigate to="/dashboard" />
  );
};

export const FacultyRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="spinner"></div>;

  return isAuthenticated && user?.role === 'faculty' ? (
    children
  ) : (
    <Navigate to="/dashboard" />
  );
};

export const StudentRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="spinner"></div>;

  return isAuthenticated && user?.role === 'student' ? (
    children
  ) : (
    <Navigate to="/dashboard" />
  );
};
