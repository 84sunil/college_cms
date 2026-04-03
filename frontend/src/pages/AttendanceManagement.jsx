import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendance as attendanceAPI, courses as coursesAPI, enrollments as enrollmentsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const AttendanceManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('mark'); // mark | track | edit

  // Courses, Students, Enrollments
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Semester dropdown
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);

  // MARK ATTENDANCE TAB
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLecture, setSelectedLecture] = useState('');
  const [lectures, setLectures] = useState([]);
  const [attendanceRecords_toMark, setAttendanceRecords_toMark] = useState({});

  // TRACK & FILTER ATTENDANCE TAB
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // EDIT/DELETE ATTENDANCE
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters when data changes
  useEffect(() => {
    applyFilters();
  }, [attendanceRecords, dateRangeStart, dateRangeEnd, filterSemester, filterCourse, filterStatus]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [coursesRes, studentsRes, enrollmentsRes, attendanceRes] = await Promise.all([
        coursesAPI.list(),
        studentsAPI.list(),
        enrollmentsAPI.list(),
        attendanceAPI.list()
      ]);

      setCourses(coursesRes.data.results || coursesRes.data || []);
      setStudents(studentsRes.data.results || studentsRes.data || []);
      setEnrollments(enrollmentsRes.data.results || enrollmentsRes.data || []);
      setAttendanceRecords(attendanceRes.data.results || attendanceRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // MARK ATTENDANCE FUNCTIONS (CREATE)
  // ════════════════════════════════════════════════════════════

  const getCoursesBySemester = () => {
    if (!selectedSemester) return [];
    return courses.filter(c => c.semester === parseInt(selectedSemester));
  };

  const getEnrolledStudents = () => {
    if (!selectedCourse || !selectedSemester) return [];
    const courseEnrollments = enrollments.filter(e => e.course === parseInt(selectedCourse));
    return courseEnrollments.map(e => {
      const student = students.find(s => s.id === e.student && s.semester === parseInt(selectedSemester));
      return student;
    }).filter(Boolean);
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
        message: `❌ Cannot mark attendance for future date (${daysAhead} day(s) ahead)`
      };
    }
    return { isValid: true, message: '' };
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords_toMark(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const enrolled = getEnrolledStudents();
    const newRecords = { ...attendanceRecords_toMark };
    enrolled.forEach(s => {
      newRecords[s.id] = status;
    });
    setAttendanceRecords_toMark(newRecords);
  };

  const handleMarkSubmit = async () => {
    // VALIDATION
    if (!selectedSemester) {
      setError('Please select a semester');
      return;
    }
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }
    const dateValidation = validateAttendanceDate(selectedDate);
    if (!dateValidation.isValid) {
      setError(dateValidation.message);
      return;
    }
    if (Object.keys(attendanceRecords_toMark).length === 0) {
      setError('Please mark attendance for at least one student');
      return;
    }

    // SUBMIT ATTENDANCE
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const promises = Object.entries(attendanceRecords_toMark).map(([studentId, status]) => {
        const attendanceData = {
          student: parseInt(studentId),
          course: parseInt(selectedCourse),
          date: selectedDate,
          status,
          lecture_type: selectedLecture ? `Lecture ${selectedLecture}` : 'Default',
          semester: selectedSemester
        };
        return attendanceAPI.create(attendanceData);
      });

      await Promise.all(promises);

      setSuccess(`✅ Attendance marked for ${Object.keys(attendanceRecords_toMark).length} students`);
      setAttendanceRecords_toMark({});
      setSelectedDate(new Date().toISOString().split('T')[0]);
      
      // Refresh attendance records
      const res = await attendanceAPI.list();
      setAttendanceRecords(res.data.results || res.data || []);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError('Failed to mark attendance: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // TRACK & FILTER FUNCTIONS (READ)
  // ════════════════════════════════════════════════════════════

  const applyFilters = () => {
    let filtered = attendanceRecords;

    if (dateRangeStart) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(dateRangeEnd));
    }
    if (filterSemester) {
      filtered = filtered.filter(r => r.semester === parseInt(filterSemester));
    }
    if (filterCourse) {
      filtered = filtered.filter(r => r.course === parseInt(filterCourse));
    }
    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    setFilteredRecords(filtered);
  };

  // ════════════════════════════════════════════════════════════
  // EDIT FUNCTIONS (UPDATE)
  // ════════════════════════════════════════════════════════════

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus('');
    setEditRemarks('');
  };

  const handleSaveEdit = async (recordId) => {
    if (!editStatus) {
      setError('Please select a status');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await attendanceAPI.update(recordId, {
        status: editStatus,
        remarks: editRemarks
      });

      // Update local state
      setAttendanceRecords(prev =>
        prev.map(r => r.id === recordId
          ? { ...r, status: editStatus, remarks: editRemarks }
          : r
        )
      );

      setSuccess('✅ Attendance updated successfully');
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update attendance: ' + (err.response?.data?.detail || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // DELETE FUNCTIONS (DELETE)
  // ════════════════════════════════════════════════════════════

  const handleDelete = async (recordId) => {
    try {
      setLoading(true);
      setError('');

      await attendanceAPI.delete(recordId);

      // Update local state
      setAttendanceRecords(prev => prev.filter(r => r.id !== recordId));

      setSuccess('✅ Attendance record deleted successfully');
      setShowDeleteConfirm(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete attendance: ' + (err.response?.data?.detail || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ════════════════════════════════════════════════════════════

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PRESENT': return { bg: '#dcfce7', color: '#166534', label: '✓ Present' };
      case 'ABSENT': return { bg: '#fee2e2', color: '#991b1b', label: '✗ Absent' };
      case 'LATE': return { bg: '#fef3c7', color: '#92400e', label: '⏱ Late' };
      case 'EXCUSED': return { bg: '#d1d5db', color: '#374151', label: '! Excused' };
      default: return { bg: '#f3f4f6', color: '#6b7280', label: status };
    }
  };

  const getCourseNameById = (courseId) => {
    return courses.find(c => c.id === courseId)?.name || `Course ${courseId}`;
  };

  const getStudentNameById = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.user?.first_name} ${student.user?.last_name}` : `Student ${studentId}`;
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  const enrolledStudents = getEnrolledStudents();
  const dateValidation = validateAttendanceDate(selectedDate);

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>📚 Unified Attendance Management (CRUD)</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Create, Read, Update, Delete attendance records with backend integration
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      {/* TAB NAVIGATION */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: 0 }}>
        <button
          onClick={() => setActiveTab('mark')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: activeTab === 'mark' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'mark' ? 'white' : '#374151',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ✏️ Mark Attendance (CREATE)
        </button>
        <button
          onClick={() => setActiveTab('track')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: activeTab === 'track' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'track' ? 'white' : '#374151',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📊 Track Attendance (READ)
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: activeTab === 'edit' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'edit' ? 'white' : '#374151',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ✏️ Edit/Delete (UPDATE/DELETE)
        </button>
      </div>

      {/* TAB: MARK ATTENDANCE (CREATE) */}
      {activeTab === 'mark' && (
        <>
          {/* Policy Banner */}
          <div className="card" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#0c4a6e', marginBottom: '0.5rem' }}>Before Lecture Only</p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#075985', lineHeight: '1.5' }}>
                  ✓ Can mark attendance for today or past dates<br />
                  ✓ Future dates are blocked to ensure accurate attendance<br />
                  ✓ All attendance is saved in real-time to the backend
                </p>
              </div>
            </div>
          </div>

          {/* Selection Form */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📋 Mark Attendance</h3>
            <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Semester <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedCourse('');
                    setAttendanceRecords_toMark({});
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
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setAttendanceRecords_toMark({});
                  }}
                  disabled={!selectedSemester}
                >
                  <option value="">Select Course</option>
                  {getCoursesBySemester().map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                <input
                  type="text"
                  value={selectedLecture}
                  onChange={(e) => setSelectedLecture(e.target.value)}
                  placeholder="e.g., Lecture 1, Practical"
                  disabled={!selectedCourse}
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {enrolledStudents.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                  className="btn btn-sm"
                  onClick={() => handleMarkAll('PRESENT')}
                  style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '0.5rem 1rem' }}
                >
                  ✓ Mark All Present
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleMarkAll('ABSENT')}
                  style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '0.5rem 1rem' }}
                >
                  ✗ Mark All Absent
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleMarkAll('LATE')}
                  style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '0.5rem 1rem' }}
                >
                  ⏱ Mark All Late
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setAttendanceRecords_toMark({})}
                  style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', padding: '0.5rem 1rem' }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Students List */}
          {enrolledStudents.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0 }}>👥 Students ({enrolledStudents.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(s => (
                      <tr key={s.id}>
                        <td>{s.roll_number}</td>
                        <td>{s.user?.first_name} {s.user?.last_name}</td>
                        <td>
                          <select
                            value={attendanceRecords_toMark[s.id] || 'PRESENT'}
                            onChange={(e) => handleStatusChange(s.id, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              background: attendanceRecords_toMark[s.id] === 'ABSENT' ? '#fee2e2' : attendanceRecords_toMark[s.id] === 'LATE' ? '#fef3c7' : '#dcfce7'
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
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleMarkSubmit}
                  disabled={loading || Object.keys(attendanceRecords_toMark).length === 0}
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                  {loading ? 'Saving...' : `Save Attendance (${Object.keys(attendanceRecords_toMark).length})`}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB: TRACK ATTENDANCE (READ) */}
      {activeTab === 'track' && (
        <>
          {/* Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>🔍 Filter Records</h3>
            <div className="grid grid-4" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
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
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">✓ Present</option>
                  <option value="ABSENT">✗ Absent</option>
                  <option value="LATE">⏱ Late</option>
                  <option value="EXCUSED">! Excused</option>
                </select>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDateRangeStart('');
                  setDateRangeEnd('');
                  setFilterSemester('');
                  setFilterCourse('');
                  setFilterStatus('');
                }}
                style={{ padding: '0.5rem 1rem' }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="card">
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📋 Attendance Records ({filteredRecords.length})</h3>
            {filteredRecords.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Lecture</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => {
                      const statusInfo = getStatusBadgeColor(record.status);
                      return (
                        <tr key={record.id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{getStudentNameById(record.student)}</td>
                          <td>{getCourseNameById(record.course)}</td>
                          <td style={{ fontSize: '0.9rem', color: '#6b7280' }}>{record.lecture_type || '-'}</td>
                          <td>
                            <span style={{
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: '600'
                            }}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.9rem', color: '#6b7280', maxWidth: '150px' }}>
                            {record.remarks || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                No attendance records found.
              </p>
            )}
          </div>
        </>
      )}

      {/* TAB: EDIT/DELETE (UPDATE/DELETE) */}
      {activeTab === 'edit' && (
        <>
          {/* Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>🔍 Find Records to Edit/Delete</h3>
            <div className="grid grid-4" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
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
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Edit/Delete Table */}
          <div className="card">
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>📝 Edit or Delete Records</h3>
            {filteredRecords.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th style={{ minWidth: '250px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => {
                      const statusInfo = getStatusBadgeColor(record.status);
                      const isEditing = editingId === record.id;

                      return (
                        <tr key={record.id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{getStudentNameById(record.student)}</td>
                          <td>{getCourseNameById(record.course)}</td>
                          <td>
                            {isEditing ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: '4px',
                                  border: '1px solid #e5e7eb'
                                }}
                              >
                                <option value="PRESENT">✓ Present</option>
                                <option value="ABSENT">✗ Absent</option>
                                <option value="LATE">⏱ Late</option>
                                <option value="EXCUSED">! Excused</option>
                              </select>
                            ) : (
                              <span style={{
                                background: statusInfo.bg,
                                color: statusInfo.color,
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                              }}>
                                {statusInfo.label}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editRemarks}
                                onChange={(e) => setEditRemarks(e.target.value)}
                                placeholder="Add remarks"
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: '4px',
                                  border: '1px solid #e5e7eb',
                                  width: '100%'
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                {record.remarks || '-'}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleSaveEdit(record.id)}
                                  disabled={loading}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    background: '#dcfce7',
                                    color: '#166534',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-sm"
                                  onClick={handleCancelEdit}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleEdit(record)}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    background: '#e0f2fe',
                                    color: '#0c4a6e',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="btn btn-sm"
                                  onClick={() => setShowDeleteConfirm(record.id)}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}

                            {/* Delete Confirmation */}
                            {showDeleteConfirm === record.id && (
                              <div style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '8px',
                                boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '300px'
                              }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Confirm Delete?</h4>
                                <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                                  This will permanently delete this attendance record.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: '#f3f4f6',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleDelete(record.id)}
                                    disabled={loading}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: '600'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                No attendance records found to edit or delete.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
