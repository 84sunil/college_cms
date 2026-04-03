import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendance as attendanceAPI, courses as coursesAPI, enrollments as enrollmentsAPI, students as studentsAPI, timetable as timetablesAPI } from '../services/api';
import '../styles/global.css';

export const FacultyAttendance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('');
  const [lectures, setLectures] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('mark'); // 'mark' or 'history'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [semesters, setSemesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [dateValidation, setDateValidation] = useState({ isValid: true, message: '' });

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
    fetchStudents();
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceHistory();
      fetchLecturesForCourse();
    }
  }, [selectedCourse, date, selectedSemester]);

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

  const fetchTimetables = async () => {
    try {
      const res = await timetablesAPI?.list?.();
      // Timetables are used to filter lectures
    } catch (err) {
      console.error('Failed to fetch timetables:', err);
    }
  };

  const fetchLecturesForCourse = async () => {
    try {
      // Get lectures for the selected course based on timetable
      // This filters lectures scheduled for this course on the selected date
      const today = new Date(date);
      const dayName = today.toLocaleString('en-US', { weekday: 'long' });
      
      // Mock lecture data based on course/day - in production, fetch from backend
      const courseLectures = [
        { id: 1, name: 'Regular Lecture', time: '09:00-10:00', duration: 60 },
        { id: 2, name: 'Practical Lab', time: '10:00-11:30', duration: 90 },
        { id: 3, name: 'Seminar', time: '14:00-15:30', duration: 90 },
      ];
      
      setLectures(courseLectures);
    } catch (err) {
      console.error('Failed to fetch lectures:', err);
      setLectures([]);
    }
  };

  const getEnrolledStudents = () => {
    if (!selectedCourse || !selectedSemester) return [];
    const courseEnrollments = enrollments.filter(e => e.course === parseInt(selectedCourse));
    return courseEnrollments.map(e => {
      const student = students.find(s => s.id === e.student && s.semester === parseInt(selectedSemester));
      return student;
    }).filter(Boolean);
  };

  const getCoursesBySemester = () => {
    if (!selectedSemester) return [];
    return courses.filter(c => c.semester === parseInt(selectedSemester));
  };

  const isAttendanceDate = (checkDate) => {
    const selectedDay = new Date(checkDate);
    selectedDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDay <= today;
  };

  const validateAttendanceDate = (checkDate) => {
    const selectedDay = new Date(checkDate);
    selectedDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDay > today) {
      const daysAhead = Math.ceil((selectedDay - today) / (1000 * 60 * 60 * 24));
      return {
        isValid: false,
        message: `❌ Cannot record attendance for future date. (${daysAhead} day(s) ahead)`
      };
    }
    return { isValid: true, message: '' };
  };

  const canSubmitForLecture = (lectureTime) => {
    if (!lectureTime) return true; // If no specific lecture time, allow submission
    
    const today = new Date();
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    const todayDay = new Date();
    todayDay.setHours(0, 0, 0, 0);

    // If date is in the past, allow it
    if (selectedDay < todayDay) return true;

    // If date is today, check lecture end time
    if (selectedDay.getTime() === todayDay.getTime()) {
      try {
        const [, endTime] = lectureTime.split('-');
        const [hours, minutes] = endTime.trim().split(':').map(Number);
        const lectureEndTime = new Date(today);
        lectureEndTime.setHours(hours, minutes, 0);
        
        return today >= lectureEndTime;
      } catch (e) {
        return true;
      }
    }
    return false;
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
    setDateValidation(validateAttendanceDate(date));
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
    if (!selectedSemester) {
      setError('Please select a semester.');
      return;
    }

    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }

    const dateValidationResult = validateAttendanceDate(date);
    if (!dateValidationResult.isValid) {
      setError(dateValidationResult.message);
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
        const attendanceData = {
          student: studentId,
          course: selectedCourse,
          date,
          status,
          lecture_type: selectedLecture ? `Lecture ${selectedLecture}` : 'Default',
          semester: selectedSemester
        };
        return attendanceAPI.create(attendanceData);
      });
      await Promise.all(promises);
      setSuccess(`✅ Attendance submitted for ${Object.keys(attendanceRecords).length} students (Semester ${selectedSemester}).`);
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
      <h1>📋 Attendance Management System</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Mark and track student attendance by lecture and semester
      </p>

      {/* After-Lecture Policy Banner */}
      <div className="card" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
          <div>
            <p style={{ margin: 0, fontWeight: '600', color: '#0c4a6e', marginBottom: '0.5rem' }}>After-Lecture Attendance Policy</p>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#075985', lineHeight: '1.5' }}>
              ✓ Attendance can only be recorded for <strong>today or past dates</strong>
              <br />
              ✓ Future dates are blocked to ensure attendance is marked only after lectures conclude
              <br />
              ✓ For today's lectures, wait until after the lecture time to mark attendance
            </p>
          </div>
        </div>
      </div>

      {/* Current Selection Summary */}
      {selectedSemester && selectedCourse && (
        <div className="card" style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📌</span>
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#1e40af' }}>
                Semester {selectedSemester} • {courses.find(c => c.id === parseInt(selectedCourse))?.name}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#3b82f6' }}>
                {tab === 'mark' ? `📅 Date: ${date}` : 'Viewing attendance history'}
                {selectedLecture && ` • 🎓 Lecture: ${selectedLecture}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}
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
          {/* Semester, Course & Date Selection */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📋 Select Attendance Details</h3>
            <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Semester <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={selectedSemester} 
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedCourse(''); // Reset course when semester changes
                    setAttendanceRecords({}); // Clear attendance records
                  }}
                  style={{ fontWeight: '600' }}
                >
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Course <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={!selectedSemester}
                >
                  <option value="">Select Course</option>
                  {getCoursesBySemester().map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDateValidation(validateAttendanceDate(e.target.value));
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={!selectedCourse}
                  style={{ 
                    borderColor: !dateValidation.isValid ? '#ef4444' : undefined,
                    background: !dateValidation.isValid ? '#fee2e2' : undefined
                  }}
                />
                {!dateValidation.isValid && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '0.25rem' }}>
                    {dateValidation.message}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Lecture/Session</label>
                <select 
                  value={selectedLecture} 
                  onChange={(e) => setSelectedLecture(e.target.value)}
                  disabled={!selectedCourse}
                >
                  <option value="">All Lectures</option>
                  {lectures.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.time})</option>
                  ))}
                </select>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '0.25rem' }}>
                  Semester {selectedSemester} Students ({enrolledStudents.length})
                </h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                  📚 {courses.find(c => c.id === parseInt(selectedCourse))?.name}
                </p>
              </div>
              <span style={{ fontSize: '2rem' }}>👥</span>
            </div>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              {date === new Date().toISOString().split('T')[0] && selectedLecture && (
                <div style={{ 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  flex: 1,
                  textAlign: 'right'
                }}>
                  ⏱️ {lectures.find(l => l.id === parseInt(selectedLecture))?.name} ends at {lectures.find(l => l.id === parseInt(selectedLecture))?.time?.split('-')[1]}. Record attendance after lecture time.
                </div>
              )}\n              <button 
                className="btn btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || Object.keys(attendanceRecords).length === 0 || (!dateValidation.isValid && date === new Date().toISOString().split('T')[0])}
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              >
                {loading ? 'Submitting...' : `Submit Attendance (${Object.keys(attendanceRecords).length})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* History Tab - Semester & Course Selection */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>Semester</label>
                <select 
                  value={selectedSemester} 
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedCourse('');
                    setAttendanceHistory([]);
                  }}
                >
                  <option value="">All Semesters</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Course</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {selectedSemester 
                    ? getCoursesBySemester().map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))
                    : courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - Sem {c.semester}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {attendanceHistory.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Lecture Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map(a => (
                    <tr key={a.id}>
                      <td>{a.student_roll_number}</td>
                      <td>{a.course_name || 'N/A'}</td>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        {a.lecture_type || 'Default'}
                      </td>
                      <td>
                        <span style={{
                          background: a.status === 'PRESENT' ? '#dcfce7' : a.status === 'ABSENT' ? '#fee2e2' : a.status === 'LATE' ? '#fef3c7' : '#d1d5db',
                          color: a.status === 'PRESENT' ? '#166534' : a.status === 'ABSENT' ? '#991b1b' : a.status === 'LATE' ? '#92400e' : '#374151',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
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
