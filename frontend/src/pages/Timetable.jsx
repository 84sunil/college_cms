import { useEffect, useState } from 'react';
import { courses as coursesAPI, timetable as timetableAPI } from '../services/api';
import '../styles/global.css';

export const Timetable = () => {
  const [timetableList, setTimetableList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [filterDay, setFilterDay] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'list'
  const [formData, setFormData] = useState({
    course: '',
    day_of_week: 'MON',
    start_time: '09:00',
    end_time: '10:30',
    classroom: '',
    building: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const dayOptions = [
    { value: 'MON', label: 'Monday' },
    { value: 'TUE', label: 'Tuesday' },
    { value: 'WED', label: 'Wednesday' },
    { value: 'THU', label: 'Thursday' },
    { value: 'FRI', label: 'Friday' },
    { value: 'SAT', label: 'Saturday' },
  ];

  const semesterColors = {
    1: '#dbeafe', 2: '#dcfce7', 3: '#fef3c7', 4: '#fde2e4',
    5: '#fce7f3', 6: '#ede9fe', 7: '#e0e7ff', 8: '#f0f9ff'
  };

  const getDayOrder = (day) => {
    const order = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };
    return order[day] || 9;
  };

  useEffect(() => {
    fetchTimetable();
    fetchCourses();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await timetableAPI.list();
      setTimetableList(response.data.results || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch timetable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.list();
      setCoursesList(res.data.results || []);
    } catch (err) {
      console.error('Failed to load courses');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      course: '',
      day_of_week: 'MON',
      start_time: '09:00',
      end_time: '10:30',
      classroom: '',
      building: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = {
        ...formData,
        course: parseInt(formData.course)
      };

      if (editingId) {
        await timetableAPI.update(editingId, data);
        setSuccess('Timetable entry updated successfully');
      } else {
        await timetableAPI.create(data);
        setSuccess('Timetable entry added successfully');
      }

      setShowModal(false);
      resetForm();
      fetchTimetable();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save timetable entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      course: entry.course || '',
      day_of_week: entry.day_of_week || 'MON',
      start_time: entry.start_time || '09:00',
      end_time: entry.end_time || '10:30',
      classroom: entry.classroom || '',
      building: entry.building || '',
      is_active: entry.is_active !== false
    });
    setEditingId(entry.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await timetableAPI.delete(id);
      setSuccess('Timetable entry deleted successfully');
      fetchTimetable();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const filteredTimetable = timetableList.filter(entry => {
    const matchesDay = !filterDay || entry.day_of_week === filterDay;
    const course = coursesList.find(c => c.id === entry.course);
    const matchesSemester = !filterSemester || (course && course.semester === parseInt(filterSemester));
    const matchesCourse = !filterCourse || entry.course === parseInt(filterCourse);
    return matchesDay && matchesSemester && matchesCourse;
  });

  // Statistics
  const totalClasses = filteredTimetable.length;
  const activeClasses = filteredTimetable.filter(t => t.is_active).length;
  const bySemester = {};
  filteredTimetable.forEach(entry => {
    const course = coursesList.find(c => c.id === entry.course);
    const sem = course?.semester || 'Unknown';
    bySemester[sem] = (bySemester[sem] || 0) + 1;
  });

  // Group by semester and day
  const groupedByDay = {};
  filteredTimetable.forEach((entry) => {
    if (!groupedByDay[entry.day_of_week]) {
      groupedByDay[entry.day_of_week] = [];
    }
    groupedByDay[entry.day_of_week].push(entry);
  });

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Class Timetable Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Class</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Total Classes</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{totalClasses}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>across all semesters</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #34d399', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Active Classes</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{activeClasses}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>operational</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Seminars Scheduled</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{Object.keys(bySemester).length}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>semesters involved</p>
        </div>
      </div>

      {/* View Mode & Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setViewMode('day')}
            style={{ flex: 1 }}
          >
            📅 Daily View
          </button>
          <button 
            className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('week')}
            style={{ flex: 1 }}
          >
            📊 Weekly Grid
          </button>
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
            style={{ flex: 1 }}
          >
            📋 List View
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '150px', flex: 1 }}>
            <label>Filter by Day:</label>
            <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} style={{ marginTop: '0.5rem' }}>
              <option value="">All Days</option>
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '150px', flex: 1 }}>
            <label>Filter by Semester:</label>
            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} style={{ marginTop: '0.5rem' }}>
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '150px', flex: 1 }}>
            <label>Filter by Course:</label>
            <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={{ marginTop: '0.5rem' }}>
              <option value="">All Courses</option>
              {coursesList.map((course) => (
                <option key={course.id} value={course.id}>{course.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'day' && (
        <>
          {Object.keys(filteredTimetable.reduce((acc, entry) => {
            if (!acc[entry.day_of_week]) acc[entry.day_of_week] = [];
            acc[entry.day_of_week].push(entry);
            return acc;
          }, {})).sort((a, b) => getDayOrder(a) - getDayOrder(b)).length > 0 ? (
            Object.keys(filteredTimetable.reduce((acc, entry) => {
              if (!acc[entry.day_of_week]) acc[entry.day_of_week] = [];
              acc[entry.day_of_week].push(entry);
              return acc;
            }, {})).sort((a, b) => getDayOrder(a) - getDayOrder(b)).map((day) => {
              const dayEntries = filteredTimetable.filter(e => e.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
              return (
                <div key={day} style={{ marginBottom: '2rem' }}>
                  <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>
                    {dayOptions.find(d => d.value === day)?.label}
                  </h2>
                  <div className="card">
                    <table>
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th>Semester</th>
                          <th>Time</th>
                          <th>Classroom</th>
                          <th>Building</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayEntries.map((entry) => {
                          const course = coursesList.find(c => c.id === entry.course);
                          return (
                            <tr key={entry.id}>
                              <td>{entry.course_code}</td>
                              <td>{entry.course_name}</td>
                              <td>Semester {course?.semester || 'N/A'}</td>
                              <td>{entry.start_time} - {entry.end_time}</td>
                              <td>{entry.classroom || '-'}</td>
                              <td>{entry.building || '-'}</td>
                              <td>
                                <span style={{
                                  background: entry.is_active ? '#dcfce7' : '#fee2e2',
                                  color: entry.is_active ? '#166534' : '#991b1b',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: 'var(--border-radius)',
                                  fontSize: '0.875rem',
                                }}>
                                  {entry.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(entry)} style={{ marginRight: '0.5rem' }}>Edit</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry.id)}>Delete</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
              <p>No timetable entries found</p>
            </div>
          )}
        </>
      )}

      {/* Weekly Grid View */}
      {viewMode === 'week' && (
        <div className="card" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #3b82f6' }}>Time</th>
                {dayOptions.map(day => (
                  <th key={day.value} style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #3b82f6' }}>
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                <tr key={time}>
                  <td style={{ padding: '1rem', fontWeight: 'bold', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                    {time}
                  </td>
                  {dayOptions.map(day => {
                    const classesAtTime = filteredTimetable.filter(e => 
                      e.day_of_week === day.value && 
                      e.start_time <= time && 
                      e.end_time > time
                    );
                    return (
                      <td key={`${day.value}-${time}`} style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        {classesAtTime.map(entry => {
                          const course = coursesList.find(c => c.id === entry.course);
                          return (
                            <div
                              key={entry.id}
                              style={{
                                backgroundColor: semesterColors[course?.semester] || '#f0f9ff',
                                border: `2px solid #3b82f6`,
                                padding: '0.5rem',
                                borderRadius: 'var(--border-radius)',
                                marginBottom: '0.5rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleEdit(entry)}
                              title={`Click to edit: ${entry.course_name}`}
                            >
                              <strong>{entry.course_code}</strong>
                              <br />
                              <span style={{ fontSize: '0.75rem' }}>{entry.start_time}-{entry.end_time}</span>
                              <br />
                              <span style={{ fontSize: '0.75rem' }}>{entry.classroom}</span>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card">
          {filteredTimetable.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Classroom</th>
                  <th>Building</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimetable.sort((a, b) => {
                  if (a.day_of_week !== b.day_of_week) return getDayOrder(a.day_of_week) - getDayOrder(b.day_of_week);
                  return a.start_time.localeCompare(b.start_time);
                }).map((entry) => {
                  const course = coursesList.find(c => c.id === entry.course);
                  const day = dayOptions.find(d => d.value === entry.day_of_week);
                  return (
                    <tr key={entry.id}>
                      <td>{entry.course_code}</td>
                      <td>{entry.course_name}</td>
                      <td>{day?.label || entry.day_of_week}</td>
                      <td>{entry.start_time} - {entry.end_time}</td>
                      <td>{entry.classroom || '-'}</td>
                      <td>{entry.building || '-'}</td>
                      <td>Sem {course?.semester || 'N/A'}</td>
                      <td>
                        <span style={{
                          background: entry.is_active ? '#dcfce7' : '#fee2e2',
                          color: entry.is_active ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--border-radius)',
                          fontSize: '0.875rem',
                        }}>
                          {entry.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(entry)} style={{ marginRight: '0.5rem' }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>No timetable entries found</p>
          )}
        </div>
      )}

      {filteredTimetable.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>No timetable entries found. Try adjusting your filters.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>{editingId ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Course</label>
                  <select name="course" required value={formData.course} onChange={handleInputChange}>
                    <option value="">Select Course</option>
                    {coursesList.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Day of Week</label>
                  <select name="day_of_week" value={formData.day_of_week} onChange={handleInputChange}>
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" name="start_time" required value={formData.start_time} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" name="end_time" required value={formData.end_time} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Classroom</label>
                  <input type="text" name="classroom" value={formData.classroom} onChange={handleInputChange} placeholder="e.g., A101" />
                </div>
                <div className="form-group">
                  <label>Building</label>
                  <input type="text" name="building" value={formData.building} onChange={handleInputChange} placeholder="e.g., Building A" />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active" style={{ marginLeft: '0.5rem', marginBottom: 0 }}>Active</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
