import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { courses as coursesAPI, grades as gradesAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const FacultyGrades = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student: '',
    exam_type: 'MIDTERM',
    marks_obtained: '',
    total_marks: 100,
    exam_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.list();
      // Filter logically if needed, for now just show all or rely on backend
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Calculate percentage and grade
      const percentage = (parseFloat(formData.marks_obtained) / parseFloat(formData.total_marks)) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';

      await gradesAPI.create({
        ...formData,
        course: selectedCourse,
        percentage: percentage.toFixed(2),
        grade
      });
      setSuccess('Grade recorded successfully.');
      setFormData({ ...formData, marks_obtained: '', remarks: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit grade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Record Grades</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Student</label>
            <select name="student" value={formData.student} onChange={handleChange} required>
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.user?.first_name} {s.user?.last_name} ({s.roll_number})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Exam Type</label>
              <select name="exam_type" value={formData.exam_type} onChange={handleChange} required>
                <option value="MIDTERM">Midterm</option>
                <option value="FINAL">Final Exam</option>
                <option value="PRACTICAL">Practical</option>
                <option value="PROJECT">Project</option>
                <option value="ASSIGNMENT">Assignment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Exam Date</label>
              <input type="date" name="exam_date" value={formData.exam_date} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Marks Obtained</label>
              <input type="number" step="0.01" name="marks_obtained" value={formData.marks_obtained} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Total Marks</label>
              <input type="number" step="0.01" name="total_marks" value={formData.total_marks} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3"></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !selectedCourse}>
            {loading ? 'Submitting...' : 'Record Grade'}
          </button>
        </form>
      </div>
    </div>
  );
};
