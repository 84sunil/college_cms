import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignments as assignmentsAPI, courses as coursesAPI, assignmentSubmissions as submissionsAPI } from '../services/api';
import '../styles/global.css';

export const FacultyAssignments = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'submissions'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    file_url: ''
  });
  const [gradeFormData, setGradeFormData] = useState({
    marks_obtained: '',
    feedback: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grading, setGrading] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.list();
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await assignmentsAPI.myCourseAssignments();
      setAssignments(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await submissionsAPI.courseSubmissions();
      setSubmissions(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGradeFormChange = (e) => {
    const { name, value } = e.target;
    setGradeFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user?.faculty_id) {
      setError('You are not mapped to a faculty profile.');
      setLoading(false);
      return;
    }

    try {
      await assignmentsAPI.create({
        ...formData,
        faculty: user.faculty_id
      });
      setSuccess('Assignment posted successfully.');
      setFormData({ ...formData, title: '', description: '', file_url: '', course: '' });
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to post assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmission = async (submission) => {
    if (!gradeFormData.marks_obtained) {
      setError('Please enter marks');
      return;
    }

    try {
      setGrading(true);
      await submissionsAPI.approveSubmission(submission.id, {
        marks_obtained: parseFloat(gradeFormData.marks_obtained),
        feedback: gradeFormData.feedback
      });
      setSuccess('Submission approved successfully!');
      setShowGradeModal(false);
      setGradeFormData({ marks_obtained: '', feedback: '' });
      fetchSubmissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to approve submission');
      console.error(err);
    } finally {
      setGrading(false);
    }
  };

  const handleRejectSubmission = async (submission) => {
    if (!gradeFormData.feedback) {
      setError('Please provide feedback for rejection');
      return;
    }

    try {
      setRejecting(true);
      await submissionsAPI.rejectSubmission(submission.id, {
        feedback: gradeFormData.feedback
      });
      setSuccess('Submission rejected successfully!');
      setShowGradeModal(false);
      setGradeFormData({ marks_obtained: '', feedback: '' });
      fetchSubmissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject submission');
      console.error(err);
    } finally {
      setRejecting(false);
    }
  };

  const filteredSubmissions = submissions.filter(s =>
    !selectedAssignment || s.assignment === selectedAssignment
  );

  const submissionStats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'PENDING' || s.status === 'SUBMITTED').length,
    approved: submissions.filter(s => s.status === 'APPROVED').length,
    rejected: submissions.filter(s => s.status === 'REJECTED').length,
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': { bg: '#fef3c7', color: '#92400e' },
      'SUBMITTED': { bg: '#dbeafe', color: '#1e40af' },
      'APPROVED': { bg: '#dcfce7', color: '#166534' },
      'REJECTED': { bg: '#fee2e2', color: '#991b1b' },
      'REVIEWED': { bg: '#dbeafe', color: '#1e40af' }
    };
    const style = styles[status] || styles['PENDING'];
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Assignments Management</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '0' }}>
        <button
          onClick={() => setActiveTab('post')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: activeTab === 'post' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'post' ? 'white' : '#374151',
            cursor: 'pointer',
            borderRadius: '0',
          }}
        >
          📝 Post Assignment
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: activeTab === 'submissions' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'submissions' ? 'white' : '#374151',
            cursor: 'pointer',
            borderRadius: '0',
          }}
        >
          ✅ Grade Submissions ({submissionStats.pending})
        </button>
      </div>

      {/* Post Assignment Tab */}
      {activeTab === 'post' && (
        <div className="grid grid-2" style={{ gap: '2rem' }}>
          <div className="card">
            <h2>Create New Assignment</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course</label>
                <select name="course" value={formData.course} onChange={handleChange} required>
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assignment Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Physics Lab Report" />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Reference URL (Optional)</label>
                <input type="url" name="file_url" value={formData.file_url} onChange={handleChange} placeholder="https://drive.google.com/..." />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Detailed instructions..."></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Posting...' : 'Post Assignment'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>My Assignments</h2>
            {assignments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignments.map(a => (
                  <div key={a.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{a.title}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(a.due_date).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6b7280' }}>{a.course_name}</p>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>{submissions.filter(s => s.assignment === a.id)?.length || 0} submissions</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No assignments posted yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div>
          {/* Stats */}
          <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6', padding: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{submissionStats.total}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #fbbf24', padding: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Pending</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{submissionStats.pending}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Approved</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{submissionStats.approved}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Rejected</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{submissionStats.rejected}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <label>Filter by Assignment:</label>
            <select
              value={selectedAssignment || ''}
              onChange={(e) => setSelectedAssignment(e.target.value ? parseInt(e.target.value) : null)}
              style={{ width: '100%' }}
            >
              <option value="">All Assignments</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Submissions List */}
          <div className="card">
            {filteredSubmissions.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map(s => (
                    <tr key={s.id}>
                      <td>{s.student_name} ({s.student_roll_number})</td>
                      <td style={{ fontSize: '0.9rem' }}>{s.assignment_title}</td>
                      <td style={{ fontSize: '0.9rem' }}>{new Date(s.submission_date).toLocaleDateString()}</td>
                      <td>{getStatusBadge(s.status)}</td>
                      <td>
                        {s.marks_obtained !== null ? (
                          <span style={{ fontWeight: 'bold' }}>{s.marks_obtained}/{s.total_marks}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedSubmission(s);
                            setGradeFormData({
                              marks_obtained: s.marks_obtained || '',
                              feedback: s.feedback || ''
                            });
                            setShowGradeModal(true);
                          }}
                          disabled={s.status === 'APPROVED'}
                        >
                          {s.status === 'APPROVED' ? '✓ Graded' : 'Grade'}
                        </button>
                        {s.submission_file_url && (
                          <a href={s.submission_file_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem' }} className="btn btn-sm btn-secondary">
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No submissions yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>Grade Submission</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              <strong>{selectedSubmission.student_name}</strong> - {selectedSubmission.assignment_title}
            </p>

            {selectedSubmission.submission_file_url && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Submission File:</p>
                <a href={selectedSubmission.submission_file_url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  {selectedSubmission.submission_file_url}
                </a>
              </div>
            )}

            {selectedSubmission.submission_text && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Submission Text:</p>
                <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{selectedSubmission.submission_text}</pre>
              </div>
            )}

            <div className="form-group">
              <label>Marks Obtained (out of {selectedSubmission.total_marks})</label>
              <input
                type="number"
                name="marks_obtained"
                min="0"
                max={selectedSubmission.total_marks}
                step="0.5"
                value={gradeFormData.marks_obtained}
                onChange={handleGradeFormChange}
                placeholder="Enter marks"
              />
            </div>

            <div className="form-group">
              <label>Feedback</label>
              <textarea
                name="feedback"
                value={gradeFormData.feedback}
                onChange={handleGradeFormChange}
                rows="4"
                placeholder="Provide feedback for the student..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowGradeModal(false)}
                disabled={grading || rejecting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRejectSubmission(selectedSubmission)}
                disabled={grading || rejecting || !gradeFormData.feedback}
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleApproveSubmission(selectedSubmission)}
                disabled={grading || rejecting || !gradeFormData.marks_obtained}
              >
                {grading ? 'Grading...' : 'Approve & Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
