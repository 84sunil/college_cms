import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendance as attendanceAPI, courses as coursesAPI } from '../services/api';
import '../styles/global.css';

export const AttendanceEdit = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search & Filter State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [courses, setCourses] = useState([]);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  useEffect(() => {
    fetchAttendanceRecords();
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendanceRecords, dateRangeStart, dateRangeEnd, filterSemester, filterCourse, filterStatus]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.list();
      const records = res.data.results || res.data || [];
      setAttendanceRecords(records);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.list();
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const applyFilters = () => {
    let filtered = attendanceRecords;

    // Date range filter
    if (dateRangeStart) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(dateRangeEnd));
    }

    // Semester filter
    if (filterSemester) {
      filtered = filtered.filter(r => r.semester === parseInt(filterSemester));
    }

    // Course filter
    if (filterCourse) {
      filtered = filtered.filter(r => r.course === parseInt(filterCourse));
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    setFilteredRecords(filtered);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
  };

  const handleCancel = () => {
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
      // Make API call to update attendance
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
      setError('Failed to update attendance record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
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

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>✏️ Edit Attendance Records</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Update or correct previously marked attendance records
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      {/* Filters Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>🔍 Filter Records</h3>
        <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '1rem' }}>
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
        <div className="grid grid-2" style={{ gap: '1rem' }}>
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setDateRangeStart('');
                setDateRangeEnd('');
                setFilterSemester('');
                setFilterCourse('');
                setFilterStatus('');
              }}
              style={{ flex: 1 }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#1f2937' }}>📊 Records ({filteredRecords.length})</h3>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchAttendanceRecords}
            disabled={loading}
            style={{ padding: '0.5rem 1rem' }}
          >
            🔄 Refresh
          </button>
        </div>

        {loading && !editingId ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading records...</p>
        ) : filteredRecords.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Current Status</th>
                  <th>Remarks</th>
                  <th style={{ minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => {
                  const statusInfo = getStatusBadgeColor(record.status);
                  const isEditing = editingId === record.id;

                  return (
                    <tr key={record.id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.student_roll_number}</td>
                      <td>{getCourseNameById(record.course)}</td>
                      <td>
                        {isEditing ? (
                          <select 
                            value={editStatus} 
                            onChange={(e) => setEditStatus(e.target.value)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              width: '100%'
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
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
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
                            placeholder="Add remarks (optional)"
                            style={{
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              width: '100%',
                              fontsize: '0.9rem'
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
                              onClick={handleCancel}
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
            No attendance records found matching your filters.
          </p>
        )}
      </div>
    </div>
  );
};
