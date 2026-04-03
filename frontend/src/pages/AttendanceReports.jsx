import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendance as attendanceAPI, courses as coursesAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const AttendanceReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter State
  const [reportType, setReportType] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedMonth, selectedSemester, selectedCourse, dateRangeStart, dateRangeEnd]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [coursesRes, studentsRes, attendanceRes] = await Promise.all([
        coursesAPI.list(),
        studentsAPI.list(),
        attendanceAPI.list()
      ]);
      
      setCourses(coursesRes.data.results || coursesRes.data || []);
      setStudents(studentsRes.data.results || studentsRes.data || []);
      setAttendanceData(attendanceRes.data.results || attendanceRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data for reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    try {
      let filteredAttendance = attendanceData;

      // Filter by semester
      if (selectedSemester) {
        filteredAttendance = filteredAttendance.filter(a => 
          a.semester === parseInt(selectedSemester)
        );
      }

      // Filter by course
      if (selectedCourse) {
        filteredAttendance = filteredAttendance.filter(a => 
          a.course === parseInt(selectedCourse)
        );
      }

      if (reportType === 'daily') {
        generateDailyReport(filteredAttendance);
      } else if (reportType === 'monthly') {
        generateMonthlyReport(filteredAttendance);
      } else if (reportType === 'summary') {
        generateSummaryReport(filteredAttendance);
      } else if (reportType === 'class') {
        generateClassReport(filteredAttendance);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    }
  };

  const generateDailyReport = (attendance) => {
    // Group by date and provide statistics
    const groupedByDate = {};
    attendance.forEach(record => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = [];
      }
      groupedByDate[record.date].push(record);
    });

    const dates = Object.keys(groupedByDate).sort().reverse();
    const dailyStats = dates.map(date => {
      const records = groupedByDate[date];
      const total = records.length;
      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE').length;
      const excused = records.filter(r => r.status === 'EXCUSED').length;

      return {
        date,
        total,
        present,
        absent,
        late,
        excused,
        percentage: ((present / total) * 100).toFixed(1),
        records
      };
    });

    setReportData({
      type: 'daily',
      stats: dailyStats,
      title: `Daily Attendance Report - ${selectedCourse ? courses.find(c => c.id === parseInt(selectedCourse))?.name : 'All Courses'}`
    });
  };

  const generateMonthlyReport = (attendance) => {
    const [year, month] = selectedMonth.split('-');
    
    // Filter attendance for selected month
    const monthAttendance = attendance.filter(record => {
      const recordDate = record.date.substring(0, 7);
      return recordDate === selectedMonth;
    });

    // Group by student
    const groupedByStudent = {};
    monthAttendance.forEach(record => {
      const student = students.find(s => s.id === record.student);
      if (!groupedByStudent[record.student]) {
        groupedByStudent[record.student] = {
          studentId: record.student,
          studentName: `${student?.user?.first_name} ${student?.user?.last_name}`,
          rollNumber: student?.roll_number,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }

      groupedByStudent[record.student].total++;
      if (record.status === 'PRESENT') groupedByStudent[record.student].present++;
      else if (record.status === 'ABSENT') groupedByStudent[record.student].absent++;
      else if (record.status === 'LATE') groupedByStudent[record.student].late++;
      else if (record.status === 'EXCUSED') groupedByStudent[record.student].excused++;
    });

    const studentStats = Object.values(groupedByStudent).map(stat => ({
      ...stat,
      percentage: ((stat.present / stat.total) * 100).toFixed(1)
    }));

    setReportData({
      type: 'monthly',
      stats: studentStats,
      month: selectedMonth,
      title: `Monthly Attendance Report - ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    });
  };

  const generateSummaryReport = (attendance) => {
    if (attendance.length === 0) {
      setReportData({
        type: 'summary',
        stats: [],
        title: 'Summary Report - No Data',
        totalRecords: 0
      });
      return;
    }

    // Overall statistics
    const total = attendance.length;
    const present = attendance.filter(r => r.status === 'PRESENT').length;
    const absent = attendance.filter(r => r.status === 'ABSENT').length;
    const late = attendance.filter(r => r.status === 'LATE').length;
    const excused = attendance.filter(r => r.status === 'EXCUSED').length;

    // Group by course
    const courseStats = {};
    attendance.forEach(record => {
      if (!courseStats[record.course]) {
        const course = courses.find(c => c.id === record.course);
        courseStats[record.course] = {
          courseId: record.course,
          courseName: course?.name,
          courseCode: course?.code,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }

      courseStats[record.course].total++;
      if (record.status === 'PRESENT') courseStats[record.course].present++;
      else if (record.status === 'ABSENT') courseStats[record.course].absent++;
      else if (record.status === 'LATE') courseStats[record.course].late++;
      else if (record.status === 'EXCUSED') courseStats[record.course].excused++;
    });

    const courseData = Object.values(courseStats).map(stat => ({
      ...stat,
      percentage: ((stat.present / stat.total) * 100).toFixed(1)
    }));

    setReportData({
      type: 'summary',
      overallStats: {
        total,
        present,
        absent,
        late,
        excused,
        presentPercentage: ((present / total) * 100).toFixed(1)
      },
      courseStats: courseData,
      title: 'Attendance Summary Report'
    });
  };

  const generateClassReport = (attendance) => {
    // Group by date for class attendance
    const groupedByDate = {};
    attendance.forEach(record => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = [];
      }
      groupedByDate[record.date].push(record);
    });

    const dateStats = Object.keys(groupedByDate).sort().reverse().map(date => {
      const records = groupedByDate[date];
      const total = records.length;
      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE').length;

      return {
        date,
        total,
        present,
        absent,
        late,
        percentage: ((present / total) * 100).toFixed(1)
      };
    });

    setReportData({
      type: 'class',
      stats: dateStats,
      title: `Class Attendance Report`
    });
  };

  const exportToPDF = () => {
    // Simple text-based PDF generation
    const doc = new (window.jsPDF || class {})();
    const content = JSON.stringify(reportData, null, 2);
    const lines = content.split('\n');
    
    doc?.text('Attendance Report', 10, 10);
    lines.forEach((line, index) => {
      doc?.text(line, 10, 20 + (index * 5));
    });
    
    doc?.save('attendance_report.pdf');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>📊 Attendance Reports</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        View and analyze attendance data with various report types
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Report Type Selection */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>📈 Report Type</h3>
        <div className="grid grid-4" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label>Select Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily">Daily Attendance</option>
              <option value="monthly">Monthly Summary</option>
              <option value="class">Class Statistics</option>
              <option value="summary">Overall Summary</option>
            </select>
          </div>

          {reportType === 'monthly' && (
            <div className="form-group">
              <label>Month</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Semester</label>
            <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)}
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
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading report...</p>
        </div>
      ) : reportData ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#1f2937' }}>{reportData.title}</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              style={{ padding: '0.5rem 1rem' }}
            >
              🖨️ Print
            </button>
          </div>

          {reportData.type === 'daily' && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Excused</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.stats.map((stat, idx) => (
                    <tr key={idx}>
                      <td><strong>{new Date(stat.date).toLocaleDateString()}</strong></td>
                      <td>{stat.total}</td>
                      <td style={{ color: '#059669' }}><strong>{stat.present}</strong></td>
                      <td style={{ color: '#dc2626' }}><strong>{stat.absent}</strong></td>
                      <td style={{ color: '#b45309' }}><strong>{stat.late}</strong></td>
                      <td>{stat.excused}</td>
                      <td>
                        <span style={{
                          background: parseFloat(stat.percentage) >= 80 ? '#dcfce7' : '#fee2e2',
                          color: parseFloat(stat.percentage) >= 80 ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {stat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportData.type === 'monthly' && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll #</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Excused</th>
                    <th>Total</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.stats.map((stat, idx) => (
                    <tr key={idx}>
                      <td><strong>{stat.studentName}</strong></td>
                      <td>{stat.rollNumber}</td>
                      <td style={{ color: '#059669' }}>{stat.present}</td>
                      <td style={{ color: '#dc2626' }}>{stat.absent}</td>
                      <td style={{ color: '#b45309' }}>{stat.late}</td>
                      <td>{stat.excused}</td>
                      <td>{stat.total}</td>
                      <td>
                        <span style={{
                          background: parseFloat(stat.percentage) >= 75 ? '#dcfce7' : '#fee2e2',
                          color: parseFloat(stat.percentage) >= 75 ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {stat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportData.type === 'class' && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.stats.map((stat, idx) => (
                    <tr key={idx}>
                      <td><strong>{new Date(stat.date).toLocaleDateString()}</strong></td>
                      <td>{stat.total}</td>
                      <td style={{ color: '#059669' }}><strong>{stat.present}</strong></td>
                      <td style={{ color: '#dc2626' }}><strong>{stat.absent}</strong></td>
                      <td style={{ color: '#b45309' }}><strong>{stat.late}</strong></td>
                      <td>
                        <span style={{
                          background: parseFloat(stat.percentage) >= 80 ? '#dcfce7' : '#fee2e2',
                          color: parseFloat(stat.percentage) >= 80 ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {stat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportData.type === 'summary' && (
            <div>
              {/* Overall Statistics Cards */}
              <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: '#dcfce7', borderLeft: '4px solid #059669' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Total Present</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
                    {reportData.overallStats.present}
                  </p>
                </div>
                <div className="card" style={{ background: '#fee2e2', borderLeft: '4px solid #dc2626' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Total Absent</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>
                    {reportData.overallStats.absent}
                  </p>
                </div>
                <div className="card" style={{ background: '#fef3c7', borderLeft: '4px solid #b45309' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Total Late</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '700', color: '#b45309' }}>
                    {reportData.overallStats.late}
                  </p>
                </div>
                <div className="card" style={{ background: '#eff6ff', borderLeft: '4px solid #0284c7' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Attendance %</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '700', color: '#0284c7' }}>
                    {reportData.overallStats.presentPercentage}%
                  </p>
                </div>
              </div>

              {/* Course-wise Statistics */}
              <h4 style={{ marginTop: '2rem', color: '#1f2937' }}>Course-wise Statistics</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Course Code</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Total</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.courseStats.map((stat, idx) => (
                      <tr key={idx}>
                        <td><strong>{stat.courseName}</strong></td>
                        <td>{stat.courseCode}</td>
                        <td style={{ color: '#059669' }}>{stat.present}</td>
                        <td style={{ color: '#dc2626' }}>{stat.absent}</td>
                        <td style={{ color: '#b45309' }}>{stat.late}</td>
                        <td>{stat.total}</td>
                        <td>
                          <span style={{
                            background: parseFloat(stat.percentage) >= 80 ? '#dcfce7' : '#fee2e2',
                            color: parseFloat(stat.percentage) >= 80 ? '#166534' : '#991b1b',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {stat.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No data available for the selected filters.</p>
        </div>
      )}
    </div>
  );
};
