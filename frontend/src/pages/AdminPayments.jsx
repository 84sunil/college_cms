import { useEffect, useState } from 'react';
import { payments as paymentsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const AdminPayments = () => {
  const [paymentsList, setPaymentsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.list();
      setPaymentsList(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch payments');
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

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const daysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = Math.abs(now - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return now > due ? diffDays : 0;
  };

  const filteredPayments = paymentsList.filter(
    (payment) =>
      (filterStatus === '' || payment.status === filterStatus) &&
      (getStudentName(payment.student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toString().includes(searchTerm))
  );

  const handleSelectPayment = (paymentId) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const overdue = filteredPayments.filter(p => p.status === 'PENDING' && isOverdue(p.due_date)).map(p => p.id);
      setSelectedPayments(new Set(overdue));
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleSendNotifications = async (e) => {
    e.preventDefault();
    if (selectedPayments.size === 0) {
      setError('Please select at least one payment');
      return;
    }

    try {
      setSending(true);
      
      // Send notification for each selected payment
      const selectedPaymentsList = filteredPayments.filter(p => selectedPayments.has(p.id));
      
      for (const payment of selectedPaymentsList) {
        // Call backend to send notification
        await paymentsAPI.sendNotification?.(payment.id, {
          message: notificationMessage || `Your fee payment of Rs. ${payment.amount} is overdue. Please pay immediately.`
        });
      }
      
      setSuccess(`Notifications sent for ${selectedPayments.size} late payments`);
      setShowNotificationModal(false);
      setNotificationMessage('');
      setSelectedPayments(new Set());
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to send notifications');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    if (!window.confirm('Mark this payment as received?')) return;

    try {
      setMarkingPaid(true);
      await paymentsAPI.update(paymentId, { status: 'PAID', paid_date: new Date().toISOString().split('T')[0] });
      setSuccess('Payment marked as received');
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update payment');
    } finally {
      setMarkingPaid(false);
    }
  };

  const overdue = filteredPayments.filter(p => p.status === 'PENDING' && isOverdue(p.due_date));
  const pending = filteredPayments.filter(p => p.status === 'PENDING' && !isOverdue(p.due_date));
  const paid = filteredPayments.filter(p => p.status === 'PAID');

  const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const overdueAmount = overdue.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const paidAmount = paid.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Payments Management</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #ff6b6b', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Overdue</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{overdue.length}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Rs. {overdueAmount.toLocaleString()}
          </p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #fbbf24', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Pending</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{pending.length}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Rs. {(totalAmount - overdueAmount - paidAmount).toLocaleString()}
          </p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #34d399', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Paid</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{paid.length}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Rs. {paidAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <input
            type="search"
            placeholder="Search by student name or payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        {overdue.length > 0 && (
          <button className="btn btn-warning" onClick={() => setShowNotificationModal(true)}>
            📧 Send Notifications ({overdue.length})
          </button>
        )}
      </div>

      {/* Overdue Payments */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #ff6b6b', color: '#991b1b' }}>
            ⚠️ Overdue Payments ({overdue.length})
          </h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={overdue.every(p => selectedPayments.has(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayments(new Set([...selectedPayments, ...overdue.map(p => p.id)]));
                        } else {
                          const newSelected = new Set(selectedPayments);
                          overdue.forEach(p => newSelected.delete(p.id));
                          setSelectedPayments(newSelected);
                        }
                      }}
                    />
                  </th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((payment) => (
                  <tr key={payment.id} style={{ backgroundColor: '#fef2f2' }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                      />
                    </td>
                    <td>{getStudentName(payment.student)}</td>
                    <td>Rs. {parseFloat(payment.amount).toLocaleString()}</td>
                    <td>{new Date(payment.due_date).toLocaleDateString()}</td>
                    <td>
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.75rem', borderRadius: 'var(--border-radius)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        {daysOverdue(payment.due_date)} days
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-success" onClick={() => handleMarkAsPaid(payment.id)} disabled={markingPaid}>✓ Mark Paid</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #fbbf24' }}>
            Pending Payments ({pending.length})
          </h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((payment) => (
                  <tr key={payment.id}>
                    <td>{getStudentName(payment.student)}</td>
                    <td>Rs. {parseFloat(payment.amount).toLocaleString()}</td>
                    <td>{new Date(payment.due_date).toLocaleDateString()}</td>
                    <td>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: 'var(--border-radius)', fontSize: '0.875rem' }}>PENDING</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-success" onClick={() => handleMarkAsPaid(payment.id)} disabled={markingPaid}>✓ Mark Paid</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Payments */}
      {paid.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #34d399', color: '#166534' }}>
            Paid Payments ({paid.length})
          </h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Paid Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((payment) => (
                  <tr key={payment.id}>
                    <td>{getStudentName(payment.student)}</td>
                    <td>Rs. {parseFloat(payment.amount).toLocaleString()}</td>
                    <td>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: 'var(--border-radius)', fontSize: '0.875rem' }}>PAID</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredPayments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>No payments found</p>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h2>Send Late Fee Notification</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Send payment reminder to {selectedPayments.size || overdue.length} student(s) with overdue payments
            </p>
            <form onSubmit={handleSendNotifications}>
              <div className="form-group">
                <label>Custom Message (Optional)</label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Default: Your fee payment is overdue. Please pay immediately."
                  rows="4"
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
                Recipients: {selectedPayments.size || overdue.length} students
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationMessage('');
                  }}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : '📧 Send Notifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
