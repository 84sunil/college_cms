import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendance, courses, payments, stats, students as studentsAPI } from '../services/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    students: 0,
    faculty: 0,
    courses: 0,
    departments: 0,
  });
  const [roleSpecificData, setRoleSpecificData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await stats.getCounts();
        setDashboardStats(res.data?.data ?? res.data ?? {
          students: 0,
          faculty: 0,
          courses: 0,
          departments: 0,
        });

        // Load role-specific data
        if (user?.role === 'student') {
          const [attendanceRes, feesRes, gradesRes] = await Promise.all([
            attendance.list().catch(() => ({ data: {} })),
            payments.myPayments().catch(() => ({ data: [] })),
            studentsAPI.feeSummary().catch(() => ({ data: {} })),
          ]);
          
          const attendanceRecords = attendanceRes.data.results || [];
          const totalClasses = attendanceRecords.length || 1;
          const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
          const attendancePercentage = ((presentCount / totalClasses) * 100).toFixed(1);
          
          const fees = feesRes.data || [];
          const pendingFee = fees.filter(p => p.status !== 'COMPLETED').reduce((acc, p) => acc + (p.amount || 0), 0);
          
          setRoleSpecificData({
            attendancePercentage,
            pendingFees: pendingFee,
            totalClasses,
            presentCount,
          });
        } else if (user?.role === 'faculty') {
          const [coursesRes, attendanceRes] = await Promise.all([
            courses.list().catch(() => ({ data: { results: [] } })),
            attendance.list().catch(() => ({ data: {} })),
          ]);
          
          const facultyCourses = coursesRes.data.results || [];
          const attendanceRecords = attendanceRes.data.results || [];
          
          setRoleSpecificData({
            coursesCount: facultyCourses.length,
            attendanceRecordsCount: attendanceRecords.length,
          });
        }
        
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

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
    { label: 'Mark Attendance', path: '/faculty-attendance', icon: '✓' },
    { label: 'Manage Grades', path: '/faculty-grades', icon: '📊' },
    { label: 'My Assignments', path: '/faculty-assignments', icon: '📝' },
    { label: 'View Timetable', path: '/timetable', icon: '📅' },
  ];

  const actionList = user?.role === 'admin' ? adminActions : user?.role === 'student' ? studentActions : facultyActions;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Welcome, {user?.first_name}! 👋</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Role: <strong>{user?.role?.toUpperCase()}</strong>
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

      {/* Role-Specific Data Cards */}
      {user?.role === 'student' && (
        <div className="grid grid-4" style={{ marginBottom: '2rem', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>Attendance %</p>
            <h2 style={{ marginBottom: '0', color: '#10b981' }}>{loading ? '...' : roleSpecificData.attendancePercentage}%</h2>
            <small style={{ color: '#6b7280' }}>{roleSpecificData.presentCount}/{roleSpecificData.totalClasses}</small>
          </div>
          <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>Pending Fees</p>
            <h2 style={{ marginBottom: '0', color: '#ef4444' }}>₹{loading ? '...' : roleSpecificData.pendingFees}</h2>
            <small style={{ color: '#6b7280' }}>Due this semester</small>
          </div>
        </div>
      )}

      {user?.role === 'faculty' && (
        <div className="grid grid-4" style={{ marginBottom: '2rem', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>Active Courses</p>
            <h2 style={{ marginBottom: '0', color: '#06b6d4' }}>{loading ? '...' : roleSpecificData.coursesCount}</h2>
            <small style={{ color: '#6b7280' }}>Teaching this semester</small>
          </div>
          <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✓</div>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>Attendance Records</p>
            <h2 style={{ marginBottom: '0', color: '#8b5cf6' }}>{loading ? '...' : roleSpecificData.attendanceRecordsCount}</h2>
            <small style={{ color: '#6b7280' }}>Marked so far</small>
          </div>
        </div>
      )}

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
