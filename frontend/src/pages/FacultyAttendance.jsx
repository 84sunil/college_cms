import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendance as attendanceAPI, courses as coursesAPI, enrollments as enrollmentsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const FacultyAttendance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('mark'); // 'mark' or 'history'
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceHistory();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.list();
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await enrollmentsAPI.list();
      setEnrollments(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentsAPI.list();
      setStudents(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const res = await attendanceAPI.list();
      const filtered = (res.data.results || res.data || []).filter(a => a.course === parseInt(selectedCourse));
      setAttendanceHistory(filtered);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    }
  };

  const getEnrolledStudents = () => {
    if (!selectedCourse) return [];
    const courseEnrollments = enrollments.filter(e => e.course === parseInt(selectedCourse));
    return courseEnrollments.map(e => {
      const student = students.find(s => s.id === e.student);
      return student;
    }).filter(Boolean);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const enrolled = getEnrolledStudents();
    const newRecords = { ...attendanceRecords };
    enrolled.forEach(s => {
      newRecords[s.id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  const handleSubmit = async () => {
    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }

    if (Object.keys(attendanceRecords).length === 0) {
      setError('Please mark attendance for at least one student.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Submit attendance for each student
      const promises = Object.entries(attendanceRecords).map(([studentId, status]) => {
        return attendanceAPI.create({
          student: studentId,
          course: selectedCourse,
          date,
          status
        });
      });
      await Promise.all(promises);
      setSuccess(`Attendance submitted for ${Object.keys(attendanceRecords).length} students.`);
      setAttendanceRecords({});
      setDate(new Date().toISOString().split('T')[0]);
      fetchAttendanceHistory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to submit some or all attendance records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const enrolledStudents = getEnrolledStudents();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Attendance Management</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '0' }}>
        <button
          onClick={() => setTab('mark')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: tab === 'mark' ? '#3b82f6' : '#f3f4f6',
            color: tab === 'mark' ? 'white' : '#374151',
            cursor: 'pointer',
            borderRadius: '0',
          }}
        >
          ✅ Mark Attendance
        </button>
        <button
          onClick={() => setTab('history')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: tab === 'history' ? '#3b82f6' : '#f3f4f6',
            color: tab === 'history' ? 'white' : '#374151',
            cursor: 'pointer',
            borderRadius: '0',
          }}
        >
          📊 Attendance History
        </button>
      </div>

      {tab === 'mark' ? (
        <>
          {/* Course & Date Selection */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Course <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {/* Quick Selection Buttons */}
            {enrolledStudents.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleMarkAll('PRESENT')}
                  style={{ background: '#dcfce7', color: '#166534', border: 'none' }}
                >
                  Mark All Present
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleMarkAll('ABSENT')}
                  style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }}
                >
                  Mark All Absent
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleMarkAll('LATE')}
                  style={{ background: '#fef3c7', color: '#92400e', border: 'none' }}
                >
                  Mark All Late
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setAttendanceRecords({})}
                  style={{ background: '#f3f4f6', color: '#6b7280', border: 'none' }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Students List */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              Students ({enrolledStudents.length})
            </h2>
            {enrolledStudents.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th style={{ minWidth: '150px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(s => (
                    <tr key={s.id}>
                      <td>{s.roll_number}</td>
                      <td>{s.user?.first_name} {s.user?.last_name}</td>
                      <td>
                        <select 
                          value={attendanceRecords[s.id] || 'PRESENT'} 
                          onChange={(e) => handleStatusChange(s.id, e.target.value)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            background: attendanceRecords[s.id] === 'ABSENT' ? '#fee2e2' : attendanceRecords[s.id] === 'LATE' ? '#fef3c7' : '#dcfce7'
                          }}
                        >
                          <option value="PRESENT">✓ Present</option>
                          <option value="ABSENT">✗ Absent</option>
                          <option value="LATE">⏱ Late</option>
                          <option value="EXCUSED">! Excused</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                {selectedCourse ? 'No students enrolled in this course.' : 'Please select a course first.'}
              </p>
            )}
          </div>

          {/* Submit Button */}
          {enrolledStudents.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || Object.keys(attendanceRecords).length === 0}
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              >
                {loading ? 'Submitting...' : `Submit Attendance (${Object.keys(attendanceRecords).length})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* History Tab */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <label>Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="card">
            {attendanceHistory.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map(a => (
                    <tr key={a.id}>
                      <td>{a.student_roll_number}</td>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          background: a.status === 'PRESENT' ? '#dcfce7' : a.status === 'ABSENT' ? '#fee2e2' : a.status === 'LATE' ? '#fef3c7' : '#d1d5db',
                          color: a.status === 'PRESENT' ? '#166534' : a.status === 'ABSENT' ? '#991b1b' : a.status === 'LATE' ? '#92400e' : '#374151',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                {selectedCourse ? 'No attendance records found for this course.' : 'Please select a course.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
