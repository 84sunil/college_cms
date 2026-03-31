import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { faculty as facultyAPI, students as studentsAPI } from '../services/api';
import '../styles/layout.css';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  // Fetch profile picture when user or location changes
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        if (user?.role === 'student') {
          const studentRes = await studentsAPI.list();
          const currentStudent = studentRes.data.results?.find(s => s.user?.id === user?.id);
          if (currentStudent?.profile_picture) {
            const picUrl = currentStudent.profile_picture.startsWith('http')
              ? currentStudent.profile_picture
              : `http://localhost:8000${currentStudent.profile_picture}`;
            setProfilePicture(picUrl);
          }
        } else if (user?.role === 'faculty') {
          const facultyRes = await facultyAPI.list();
          const currentFaculty = facultyRes.data.results?.find(f => f.user?.id === user?.id);
          if (currentFaculty?.profile_picture) {
            const picUrl = currentFaculty.profile_picture.startsWith('http')
              ? currentFaculty.profile_picture
              : `http://localhost:8000${currentFaculty.profile_picture}`;
            setProfilePicture(picUrl);
          }
        }
      } catch (err) {
        // Silently handle profile picture fetch errors
        setProfilePicture(null);
      }
    };

    if (user && isAuthenticated) {
      fetchProfilePicture();
    }
  }, [user, isAuthenticated, location]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          📚 College CMS
        </Link>

        <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
              </li>
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link
                      to="/students"
                      className={`nav-link ${isActive('/students') ? 'active' : ''}`}
                    >
                      Students
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faculty"
                      className={`nav-link ${isActive('/faculty') ? 'active' : ''}`}
                    >
                      Faculty
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/courses"
                      className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
                    >
                      Courses
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/timetable"
                      className={`nav-link ${isActive('/timetable') ? 'active' : ''}`}
                    >
                      Timetable
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-attendance"
                      className={`nav-link ${isActive('/admin-attendance') ? 'active' : ''}`}
                    >
                      Attendance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-payments"
                      className={`nav-link ${isActive('/admin-payments') ? 'active' : ''}`}
                    >
                      Payments
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-notifications"
                      className={`nav-link ${isActive('/admin-notifications') ? 'active' : ''}`}
                    >
                      Notifications
                    </Link>
                  </li>
                </>
              )}
              {user?.role === 'faculty' && (
                <>
                  <li>
                    <Link
                      to="/faculty-attendance"
                      className={`nav-link ${isActive('/faculty-attendance') ? 'active' : ''}`}
                    >
                      Attendance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/attendance-tracker"
                      className={`nav-link ${isActive('/attendance-tracker') ? 'active' : ''}`}
                    >
                      Track Attendance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faculty-grades"
                      className={`nav-link ${isActive('/faculty-grades') ? 'active' : ''}`}
                    >
                      Grades
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faculty-assignments"
                      className={`nav-link ${isActive('/faculty-assignments') ? 'active' : ''}`}
                    >
                      Assignments
                    </Link>
                  </li>
                </>
              )}
              {user?.role === 'student' && (
                <>
                  <li>
                    <Link
                      to="/student-attendance"
                      className={`nav-link ${isActive('/student-attendance') ? 'active' : ''}`}
                    >
                      Attendance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/attendance-tracker"
                      className={`nav-link ${isActive('/attendance-tracker') ? 'active' : ''}`}
                    >
                      My Attendance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/student-assignments"
                      className={`nav-link ${isActive('/student-assignments') ? 'active' : ''}`}
                    >
                      Assignments
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/student-grades"
                      className={`nav-link ${isActive('/student-grades') ? 'active' : ''}`}
                    >
                      Grades
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/student-fees"
                      className={`nav-link ${isActive('/student-fees') ? 'active' : ''}`}
                    >
                      Fees
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/student-notifications"
                      className={`nav-link ${isActive('/student-notifications') ? 'active' : ''}`}
                    >
                      Alerts
                    </Link>
                  </li>
                </>
              )}
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>

        {isAuthenticated && (
          <div className="user-menu">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Profile Picture */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid white',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onClick={() => navigate('/profile')}
                title="Click to view/edit profile"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => {
                      setProfilePicture(null);
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '1.5rem' }}>
                    {user?.role === 'student' ? '👨‍🎓' : user?.role === 'faculty' ? '👨‍🏫' : '👤'}
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="user-info">
                <div className="username">{user?.username}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile')}>
                👤 Profile
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/change-password')}>
                ⚙️ Password
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
