import { useEffect, useState } from 'react';
import { notifications as notificationsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const AdminNotifications = () => {
  const [notificationsList, setNotificationsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: 'ALL', // ALL, SEMESTER, DEPARTMENT, INDIVIDUAL
    semester: '',
    department: '',
    student: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  useEffect(() => {
    fetchNotifications();
    fetchStudents();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.list();
      setNotificationsList(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch notifications');
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

  const getStudentName = (studentId) => {
    const student = studentsList.find(s => s.id === studentId);
    return student ? `${student.user?.first_name} ${student.user?.last_name}` : 'Unknown Student';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'recipient_type' && { semester: '', department: '', student: '' })
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      recipient_type: 'ALL',
      semester: '',
      department: '',
      student: ''
    });
    setEditingId(null);
  };

  const handleEdit = (notification) => {
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      recipient_type: notification.recipient_type || 'ALL',
      semester: notification.semester || '',
      department: notification.department || '',
      student: notification.student || ''
    });
    setEditingId(notification.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await notificationsAPI.delete(id);
      setSuccess('Notification deleted successfully');
      fetchNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete notification');
      console.error(err);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setSending(true);
      
      // Create notification with recipient type
      const notificationData = {
        title: formData.title,
        message: formData.message,
        recipient_type: formData.recipient_type,
        is_global: formData.recipient_type === 'ALL'
      };

      // Add specific recipient based on type
      if (formData.recipient_type === 'SEMESTER' && formData.semester) {
        notificationData.semester = parseInt(formData.semester);
      } else if (formData.recipient_type === 'DEPARTMENT' && formData.department) {
        notificationData.department = formData.department;
      } else if (formData.recipient_type === 'INDIVIDUAL' && formData.student) {
        notificationData.student = parseInt(formData.student);
      }

      if (editingId) {
        // Update existing notification
        await notificationsAPI.update(editingId, notificationData);
        setSuccess(`Notification updated successfully`);
      } else {
        // Create new notification
        await notificationsAPI.create(notificationData);
        setSuccess(`Notification sent successfully to students`);
      }

      setShowCreateModal(false);
      resetForm();
      fetchNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to send notification');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredNotifications = notificationsList.filter(
    (notif) =>
      notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const read = filteredNotifications.filter(n => n.is_read);
  const unread = filteredNotifications.filter(n => !n.is_read);

  const getRecipientInfo = (notif) => {
    if (notif.recipient_type === 'INDIVIDUAL') {
      return getStudentName(notif.student);
    } else if (notif.recipient_type === 'SEMESTER') {
      return `Semester ${notif.semester} Students`;
    } else if (notif.recipient_type === 'DEPARTMENT') {
      return `${notif.department} Department`;
    }
    return 'All Students';
  };

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notifications Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          📧 Send New Notification
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Total Sent</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{filteredNotifications.length}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Unread</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{unread.length}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #34d399', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Read</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{read.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <input
          type="search"
          placeholder="Search by title or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Unread Notifications */}
      {unread.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #f59e0b' }}>
            📬 Unread Notifications ({unread.length})
          </h2>
          <div className="card">
            {unread.map((notif) => (
              <div key={notif.id} style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#fef9f3'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{notif.title}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563', fontSize: '0.95rem' }}>{notif.message}</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      📍 {getRecipientInfo(notif)} • {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexDirection: 'column', alignItems: 'flex-end', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: '#fbbf24',
                      color: '#92400e',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      NEW
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(notif)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(notif.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Read Notifications */}
      {read.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #34d399' }}>
            ✓ Read Notifications ({read.length})
          </h2>
          <div className="card">
            {read.map((notif) => (
              <div key={notif.id} style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                opacity: '0.8'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}>{notif.title}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.95rem' }}>{notif.message}</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>
                      📍 {getRecipientInfo(notif)} • {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexDirection: 'column', alignItems: 'flex-end', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      ✓ READ
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(notif)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(notif.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredNotifications.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>No notifications found</p>
        </div>
      )}

      {/* Create/Send Notification Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>{editingId ? 'Edit Notification' : 'Send Notification to Students'}</h2>
            <form onSubmit={handleSendNotification}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notification title"
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Notification message"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Send To *</label>
                <select name="recipient_type" value={formData.recipient_type} onChange={handleInputChange}>
                  <option value="ALL">All Students</option>
                  <option value="SEMESTER">Students by Semester</option>
                  <option value="DEPARTMENT">Students by Department</option>
                  <option value="INDIVIDUAL">Individual Student</option>
                </select>
              </div>

              {formData.recipient_type === 'SEMESTER' && (
                <div className="form-group">
                  <label>Select Semester *</label>
                  <select name="semester" value={formData.semester} onChange={handleInputChange} required>
                    <option value="">Choose semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.recipient_type === 'DEPARTMENT' && (
                <div className="form-group">
                  <label>Select Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Department name"
                    required
                  />
                </div>
              )}

              {formData.recipient_type === 'INDIVIDUAL' && (
                <div className="form-group">
                  <label>Select Student *</label>
                  <select name="student" value={formData.student} onChange={handleInputChange} required>
                    <option value="">Choose student</option>
                    {studentsList.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user?.first_name} {student.user?.last_name} ({student.roll_number})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? (editingId ? 'Updating...' : 'Sending...') : (editingId ? '✓ Update Notification' : '📧 Send Notification')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
