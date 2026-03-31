import { useEffect, useState } from 'react';
import { assignments as assignmentsAPI, assignmentSubmissions as submissionsAPI } from '../services/api';
import '../styles/global.css';

export const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    submission_file_url: '',
    submission_text: ''
  });

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsAPI.myCourseAssignments();
      setAssignments(res.data.results || res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch assignments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await submissionsAPI.mySubmissions();
      setSubmissions(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find(s => s.assignment === assignmentId);
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#dcfce7', color: '#166534' };
      case 'REJECTED':
        return { bg: '#fee2e2', color: '#991b1b' };
      case 'SUBMITTED':
      case 'REVIEWED':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'PENDING':
        return { bg: '#fef3c7', color: '#92400e' };
      default:
        return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const handleSubmitClick = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({ submission_file_url: '', submission_text: '' });
    setShowSubmitModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    
    if (!formData.submission_file_url && !formData.submission_text) {
      setError('Please provide either a file URL or submission text');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const existingSubmission = getSubmissionForAssignment(selectedAssignment.id);
      
      const submitData = {
        assignment: selectedAssignment.id,
        submission_file_url: formData.submission_file_url || null,
        submission_text: formData.submission_text || null,
      };

      if (existingSubmission) {
        await submissionsAPI.update(existingSubmission.id, {
          ...submitData,
          status: 'SUBMITTED'
        });
        setSuccess('Assignment resubmitted successfully!');
      } else {
        await submissionsAPI.create({
          ...submitData,
          status: 'SUBMITTED'
        });
        setSuccess('Assignment submitted successfully!');
      }

      setShowSubmitModal(false);
      fetchSubmissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeAssignments = assignments.filter(a => !isOverdue(a.due_date));
  const overdueAssignments = assignments.filter(a => isOverdue(a.due_date));

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>My Assignments</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Overdue Assignments */}
      {overdueAssignments.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #ef4444', color: '#991b1b' }}>
            ⚠️ Overdue ({overdueAssignments.length})
          </h2>
          <div className="card">
            {overdueAssignments.map(a => {
              const submission = getSubmissionForAssignment(a.id);
              const statusColor = submission ? getStatusColor(submission.status) : { bg: '#f3f4f6', color: '#374151' };
              
              return (
                <div key={a.id} style={{ padding: '1.5rem', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{a.title}</h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        <strong>Course:</strong> {a.course_name} | <strong>Faculty:</strong> {a.faculty_name}
                      </p>
                      <p style={{ margin: '0 0 1rem 0', color: '#991b1b', fontSize: '0.9rem' }}>
                        <strong>Due:</strong> {new Date(a.due_date).toLocaleDateString()} (Overdue!)
                      </p>
                      <p style={{ color: '#374151', marginBottom: '1rem' }}>{a.description}</p>
                    </div>
                    {submission && (
                      <span style={{
                        background: statusColor.bg,
                        color: statusColor.color,
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        marginLeft: '1rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {submission.status}
                      </span>
                    )}
                  </div>

                  {submission ? (
                    <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                      <p><strong>Submitted:</strong> {new Date(submission.submission_date).toLocaleDateString()}</p>
                      {submission.marks_obtained !== null && (
                        <p><strong>Marks:</strong> {submission.marks_obtained}/{submission.total_marks}</p>
                      )}
                      {submission.feedback && (
                        <p><strong>Feedback:</strong> {submission.feedback}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSubmitClick(a)}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Submit Assignment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Assignments */}
      {activeAssignments.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>
            📚 Active ({activeAssignments.length})
          </h2>
          <div className="card">
            {activeAssignments.map(a => {
              const submission = getSubmissionForAssignment(a.id);
              const statusColor = submission ? getStatusColor(submission.status) : { bg: '#f3f4f6', color: '#374151' };
              
              return (
                <div key={a.id} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{a.title}</h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        <strong>Course:</strong> {a.course_name} | <strong>Faculty:</strong> {a.faculty_name}
                      </p>
                      <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        <strong>Due:</strong> {new Date(a.due_date).toLocaleDateString()}
                      </p>
                      <p style={{ color: '#374151', marginBottom: '1rem' }}>{a.description}</p>
                      {a.file_url && (
                        <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginRight: '0.5rem' }}>
                          View Reference 📘
                        </a>
                      )}
                    </div>
                    {submission && (
                      <span style={{
                        background: statusColor.bg,
                        color: statusColor.color,
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        marginLeft: '1rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {submission.status}
                      </span>
                    )}
                  </div>

                  {submission ? (
                    <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                      <p><strong>Submitted:</strong> {new Date(submission.submission_date).toLocaleDateString()}</p>
                      {submission.marks_obtained !== null && (
                        <p><strong>Marks:</strong> {submission.marks_obtained}/{submission.total_marks}</p>
                      )}
                      {submission.feedback && (
                        <p style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f3f4f6', borderRadius: '4px' }}>
                          <strong>Feedback:</strong> {submission.feedback}
                        </p>
                      )}
                      {submission.status !== 'APPROVED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmitClick(a)}
                          style={{ marginTop: '0.5rem' }}
                        >
                          Resubmit
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSubmitClick(a)}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Submit Assignment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📋 No Assignments</p>
          <p>No assignments have been posted for your courses yet.</p>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>Submit Assignment: {selectedAssignment?.title}</h2>
            <form onSubmit={handleSubmitAssignment}>
              <div className="form-group">
                <label>Submission File URL</label>
                <input
                  type="url"
                  name="submission_file_url"
                  value={formData.submission_file_url}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/file/... or GitHub link, etc."
                />
              </div>

              <div className="form-group">
                <label>Submission Text (or paste code/content here)</label>
                <textarea
                  name="submission_text"
                  value={formData.submission_text}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Paste your code, content, or explanation here..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
