import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { stats } from '../services/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    students: 0,
    faculty: 0,
    courses: 0,
    departments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await stats.getCounts();
        setDashboardStats(res.data.data);
        setError('');
      } catch (err) {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statList = [
    { label: 'Total Students', value: dashboardStats.students, icon: '👥' },
    { label: 'Total Faculty', value: dashboardStats.faculty, icon: '🎓' },
    { label: 'Active Courses', value: dashboardStats.courses, icon: '📚' },
    { label: 'Departments', value: dashboardStats.departments, icon: '🏢' },
  ];

  const adminActions = [
    { label: 'Manage Students', path: '/students', icon: '👥' },
    { label: 'Manage Faculty', path: '/faculty', icon: '🎓' },
    { label: 'Manage Courses', path: '/courses', icon: '📚' },
    { label: 'Manage Timetable', path: '/timetable', icon: '📅' },
    { label: 'View Attendance', path: '/admin-attendance', icon: '✓' },
    { label: 'Manage Payments', path: '/admin-payments', icon: '💳' },
    { label: 'Send Notifications', path: '/admin-notifications', icon: '📢' },
  ];

  const studentActions = [
    { label: 'My Attendance', path: '/attendance-tracker', icon: '📅' },
    { label: 'My Grades', path: '/student-grades', icon: '📊' },
    { label: 'My Fees', path: '/student-fees', icon: '💳' },
    { label: 'My Assignments', path: '/student-assignments', icon: '📝' },
  ];

  const facultyActions = [
    { label: 'Track Attendance', path: '/attendance-tracker', icon: '✓' },
    { label: 'Manage Grades', path: '/faculty-grades', icon: '📊' },
    { label: 'My Assignments', path: '/faculty-assignments', icon: '📝' },
    { label: 'View Timetable', path: '/timetable', icon: '📅' },
  ];

  const actionList = user?.role === 'admin' ? adminActions : user?.role === 'student' ? studentActions : facultyActions;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Welcome, {user?.first_name}! 👋</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Role: <strong>{user?.role?.toUpperCase()}</strong> | 
        <button 
          onClick={() => navigate('/profile')} 
          style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '1rem' }}
        >
          👤 View Profile
        </button>
      </p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Statistics Cards */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        {statList.map((stat, index) => (
          <div key={index} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {stat.icon}
            </div>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>
              {stat.label}
            </p>
            <h2 style={{ marginBottom: '0' }}>{loading ? '...' : stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div className="grid grid-4" style={{ marginTop: '1rem', gap: '1rem' }}>
          {actionList.map((action, index) => (
            <button
              key={index}
              className="btn btn-primary"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
              }}
              onClick={() => navigate(action.path)}
            >
              <span style={{ fontSize: '2rem' }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
