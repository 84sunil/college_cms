import { useEffect, useState } from 'react';
import { payments as paymentsAPI } from '../services/api';
import '../styles/global.css';

export const StudentFees = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await paymentsAPI.myPayments();
      setPayments(res.data.results || res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch fees details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (payment) => {
    try {
      setLoading(true);
      setError('');
      // Simulate real gateway delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Update payment status to COMPLETED and amount_paid to amount_due
      await paymentsAPI.update(payment.id, {
        student: payment.student,
        amount_due: payment.amount_due,
        amount_paid: payment.amount_due, // full payment
        payment_date: new Date().toISOString().split('T')[0],
        due_date: payment.due_date,
        status: 'COMPLETED',
        payment_method: 'ONLINE',
        transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`
      });

      setSuccess(`Payment of Rs. ${payment.amount_due} successful!`);
      fetchPayments();
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && payments.length === 0) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Fees & Payments</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      <div className="card">
        {payments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Due Date</th>
                <th>Amount Due</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.remarks || `Fee Payment #${p.id}`}</td>
                  <td>{p.due_date}</td>
                  <td>Rs. {p.amount_due}</td>
                  <td>Rs. {p.balance_due}</td>
                  <td>
                    <span
                      style={{
                        background: p.status === 'COMPLETED' ? '#dcfce7' : (p.status === 'PENDING' ? '#fef3c7' : '#fee2e2'),
                        color: p.status === 'COMPLETED' ? '#166534' : (p.status === 'PENDING' ? '#92400e' : '#991b1b'),
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.status === 'PENDING' || p.status === 'PARTIAL' ? (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handlePay(p)}
                        disabled={loading}
                      >
                        💳 Pay Now
                      </button>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '0.9rem' }}>Paid ✅</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🎉 No Pending Fees</p>
            <p>You have no fee records at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};
