import { useEffect, useState } from 'react';
import { grades as gradesAPI } from '../services/api';
import '../styles/global.css';

export const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await gradesAPI.myGrades();
      setGrades(res.data.results || res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch your grades.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>My Grades</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {grades.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Exam Type</th>
                <th>Date</th>
                <th>Marks</th>
                <th>%</th>
                <th>Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g.id}>
                  <td>{g.course_name || g.course_code}</td>
                  <td>{g.exam_type}</td>
                  <td>{g.exam_date}</td>
                  <td>{g.marks_obtained} / {g.total_marks}</td>
                  <td>{g.percentage}%</td>
                  <td><strong>{g.grade}</strong></td>
                  <td>{g.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No grades available at the moment.</p>
        )}
      </div>
    </div>
  );
};
