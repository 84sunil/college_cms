import { useEffect, useState } from 'react';
import { attendance as attendanceAPI, courses as coursesAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const AdminAttendance = () => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.list();
      const records = Array.isArray(response.data) ? response.data : response.data.results || [];
      setAttendanceList(records);
      setError('');
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.list();
      setStudentsList(response.data.results || []);
    } catch (err) {
      console.error('Failed to fetch students');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.list();
      setCoursesList(response.data.results || []);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  const getStudentName = (studentId) => {
    const student = studentsList.find(s => s.id === studentId);
    return student ? `${student.user?.first_name} ${student.user?.last_name}` : 'Unknown Student';
  };

  const getCourseName = (courseId) => {
    const course = coursesList.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const filteredAttendance = attendanceList.filter((record) => {
    const matchesSearch =
      getStudentName(record.student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date?.includes(searchTerm);

    const matchesSemester =
      filterSemester === '' ||
      (studentsList.find(s => s.id === record.student)?.semester === parseInt(filterSemester));

    const matchesCourse =
      filterCourse === '' || record.course === parseInt(filterCourse);

    const matchesStatus =
      filterStatus === '' || record.status === filterStatus;

    const recordDate = new Date(record.date);
    const matchesStartDate = !startDate || recordDate >= new Date(startDate);
    const matchesEndDate = !endDate || recordDate <= new Date(endDate);

    return (
      matchesSearch &&
      matchesSemester &&
      matchesCourse &&
      matchesStatus &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  // Statistics
  const totalRecords = filteredAttendance.length;
  const presentCount = filteredAttendance.filter(r => r.status === 'PRESENT').length;
  const absentCount = filteredAttendance.filter(r => r.status === 'ABSENT').length;
  const lateCount = filteredAttendance.filter(r => r.status === 'LATE').length;
  const presentPercentage = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : 0;

  // Group by date
  const groupedByDate = {};
  filteredAttendance.forEach((record) => {
    if (!groupedByDate[record.date]) {
      groupedByDate[record.date] = [];
    }
    groupedByDate[record.date].push(record);
  });

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Attendance Records</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-4" style={{ marginBottom: '2rem', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Total Records</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{totalRecords}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #34d399', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Present</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{presentCount + lateCount}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {presentPercentage}% attendance
          </p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ff6b6b', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Absent</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{absentCount}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #fbbf24', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Late</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{lateCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <input
            type="search"
            placeholder="Search by student name or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {coursesList.map((course) => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
      </div>

      {/* Attendance Records by Date */}
      {Object.keys(groupedByDate)
        .sort()
        .reverse()
        .map((date) => (
          <div key={date} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>
              📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '1rem' }}>
                ({groupedByDate[date].length} records)
              </span>
            </h2>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByDate[date].map((record, idx) => {
                    const student = studentsList.find(s => s.id === record.student);
                    const statusColor = {
                      'PRESENT': { bg: '#dcfce7', color: '#166534' },
                      'ABSENT': { bg: '#fee2e2', color: '#991b1b' },
                      'LATE': { bg: '#fef3c7', color: '#92400e' }
                    }[record.status] || { bg: '#f3f4f6', color: '#6b7280' };

                    return (
                      <tr key={idx}>
                        <td>{student?.roll_number}</td>
                        <td>{getStudentName(record.student)}</td>
                        <td>{getCourseName(record.course)}</td>
                        <td>Semester {student?.semester}</td>
                        <td>
                          <span style={{
                            background: statusColor.bg,
                            color: statusColor.color,
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--border-radius)',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.time || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {Object.keys(groupedByDate).length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>No attendance records found</p>
        </div>
      )}
    </div>
  );
};
