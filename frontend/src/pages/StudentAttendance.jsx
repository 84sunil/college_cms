import { useEffect, useState } from 'react';
import { attendance as attendanceAPI } from '../services/api';
import '../styles/global.css';

export const StudentAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.myAttendance();
      setAttendanceRecords(res.data.results || res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch your attendance.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group by course
  const courses = {};
  attendanceRecords.forEach(a => {
    const courseName = a.course_name || a.course_code || 'Unknown Course';
    if (!courses[courseName]) {
      courses[courseName] = [];
    }
    courses[courseName].push(a);
  });

  const getAttendanceStats = (records) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const excused = records.filter(r => r.status === 'EXCUSED').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, late, excused, percentage };
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return { bg: '#dcfce7', color: '#166534', text: '🟢 Excellent' };
    if (percentage >= 75) return { bg: '#d1fae5', color: '#059669', text: '🟢 Good' };
    if (percentage >= 60) return { bg: '#fef3c7', color: '#92400e', text: '🟡 Average' };
    return { bg: '#fee2e2', color: '#991b1b', text: '🔴 Low' };
  };

  const filteredCourses = Object.keys(courses).filter(name =>
    selectedCourse === '' || name.includes(selectedCourse)
  );

  const allStats = getAttendanceStats(attendanceRecords);

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>My Attendance</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Overall Attendance Summary */}
      {attendanceRecords.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem', background: '#f9fafb' }}>
          <h2 style={{ marginTop: 0 }}>Overall Attendance Summary</h2>
          <div className="grid grid-5" style={{ gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total Classes</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>{allStats.total}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>Present</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold', color: '#166534' }}>{allStats.present}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>Absent</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold', color: '#991b1b' }}>{allStats.absent}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>Late</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold', color: '#92400e' }}>{allStats.late}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#e0e7ff', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#4f46e5' }}>Excused</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold', color: '#4f46e5' }}>{allStats.excused}</p>
            </div>
          </div>

          {/* Attendance Percentage */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem' }}>Attendance Percentage</h3>
            <div style={{
              background: getAttendanceColor(allStats.percentage).bg,
              color: getAttendanceColor(allStats.percentage).color,
              padding: '2rem',
              borderRadius: '12px',
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {allStats.percentage}%
            </div>
            <p style={{ margin: 0, fontSize: '1.1rem', ...getAttendanceColor(allStats.percentage) }}>
              {getAttendanceColor(allStats.percentage).text}
            </p>
          </div>
        </div>
      )}

      {/* Course-wise Attendance */}
      {attendanceRecords.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <label>Filter by Course:</label>
            <input
              type="search"
              placeholder="Search courses..."
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          {filteredCourses.map(courseName => {
            const courseRecords = courses[courseName];
            const stats = getAttendanceStats(courseRecords);
            const color = getAttendanceColor(stats.percentage);

            return (
              <div key={courseName} style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>
                  {courseName}
                </h2>
                
                {/* Stats */}
                <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ borderLeft: `4px solid ${color.color}`, padding: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Attendance</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: color.color }}>
                      {stats.percentage}%
                    </p>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Present</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {stats.present}/{stats.total}
                    </p>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Absent</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                      {stats.absent}
                    </p>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Late</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                      {stats.late}
                    </p>
                  </div>
                </div>

                {/* Records Table */}
                <div className="card">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => (
                        <tr key={a.id}>
                          <td>{new Date(a.date).toLocaleDateString()}</td>
                          <td>
                            <span style={{
                              background: a.status === 'PRESENT' ? '#dcfce7' : a.status === 'ABSENT' ? '#fee2e2' : a.status === 'LATE' ? '#fef3c7' : '#e0e7ff',
                              color: a.status === 'PRESENT' ? '#166534' : a.status === 'ABSENT' ? '#991b1b' : a.status === 'LATE' ? '#92400e' : '#4f46e5',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              {a.status}
                            </span>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>{a.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attendanceRecords.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📋 No Attendance Records</p>
          <p>Your attendance records will appear here once your attendance has been marked.</p>
        </div>
      )}
    </div>
  );
};
