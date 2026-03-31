import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendance, attendanceBySemester } from '../services/api';
import '../styles/global.css';

export const AttendanceTracker = () => {
  const { user } = useAuth();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendance_percentage: 0,
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedSemester, user?.role]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let response;
      
      // Students can only access their own attendance
      if (user?.role === 'student') {
        response = await attendance.myAttendance();
      } else {
        // Faculty and Admin can access by semester
        response = await attendanceBySemester.list(selectedSemester);
      }
      
      const records = response.data.data || [];
      setAttendanceList(records);
      calculateStats(records);
      setError('');
    } catch (err) {
      // Handle permission errors (403) for students accessing other semesters
      if (err.response?.status === 403) {
        setError('You do not have permission to view this attendance data');
      } else {
        setError('Failed to fetch attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const excused = records.filter(r => r.status === 'EXCUSED').length;
    const attendance_percentage = total > 0 ? ((present + late + excused) / total) * 100 : 0;

    setStats({
      total,
      present,
      absent,
      late,
      excused,
      attendance_percentage: attendance_percentage.toFixed(2),
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      PRESENT: { bg: '#dcfce7', text: '#166534' },
      ABSENT: { bg: '#fee2e2', text: '#991b1b' },
      LATE: { bg: '#fef3c7', text: '#92400e' },
      EXCUSED: { bg: '#dbeafe', text: '#1e40af' },
    };
    const color = colors[status] || colors.ABSENT;
    return (
      <span style={{
        background: color.bg,
        color: color.text,
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--border-radius)',
        fontSize: '0.875rem',
      }}>
        {status}
      </span>
    );
  };

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Attendance Tracker</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {user?.role !== 'student' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <label>Semester:</label>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-5" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>{stats.total}</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>Total Classes</p>
        </div>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#dcfce7' }}>
          <h3 style={{ color: '#166534' }}>{stats.present}</h3>
          <p style={{ margin: 0, color: '#166534' }}>Present</p>
        </div>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#fee2e2' }}>
          <h3 style={{ color: '#991b1b' }}>{stats.absent}</h3>
          <p style={{ margin: 0, color: '#991b1b' }}>Absent</p>
        </div>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#fef3c7' }}>
          <h3 style={{ color: '#92400e' }}>{stats.late}</h3>
          <p style={{ margin: 0, color: '#92400e' }}>Late</p>
        </div>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#dbeafe' }}>
          <h3 style={{ color: '#1e40af' }}>{stats.attendance_percentage}%</h3>
          <p style={{ margin: 0, color: '#1e40af' }}>Attendance %</p>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="card">
        {attendanceList.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((record) => (
                <tr key={record.id}>
                  <td>{record.date || 'N/A'}</td>
                  <td>{record.course_code}</td>
                  <td>{record.course_name}</td>
                  <td>{getStatusBadge(record.status)}</td>
                  <td>{record.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No attendance records found for this semester</p>
        )}
      </div>
    </div>
  );
};
