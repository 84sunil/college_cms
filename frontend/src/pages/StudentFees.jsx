import { useEffect, useRef, useState } from 'react';
import { payments as paymentsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const StatusBadge = ({ status }) => {
  const config = {
    COMPLETED: { bg: '#dcfce7', color: '#166534', label: '✅ Completed' },
    PENDING:   { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
    FAILED:    { bg: '#fee2e2', color: '#991b1b', label: '❌ Failed' },
    PARTIAL:   { bg: '#dbeafe', color: '#1e40af', label: '🔵 Partial' },
    PROCESSING:{ bg: '#f3e8ff', color: '#6b21a8', label: '🔄 Processing' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span style={{ background: c.bg, color: c.color, padding: '0.3rem 0.75rem',
      borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
      {c.label}
    </span>
  );
};

export const StudentFees = () => {
  const [payments, setPayments]     = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [payingId, setPayingId]     = useState(null);
  const [error, setError]           = useState('');
  const [receipt, setReceipt]       = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const rzpRef                      = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, sumRes] = await Promise.all([
        paymentsAPI.myPayments(),
        studentsAPI.feeSummary(),
      ]);
      setPayments(payRes.data || []);
      setSummary(sumRes.data?.summary || null);
      setError('');
    } catch {
      setError('Failed to load fee details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (payment) => {
    setError('');
    setPayingId(payment.id);

    try {
      // 1. Load Razorpay SDK
      const sdkReady = await loadRazorpay();
      if (!sdkReady) throw new Error('Failed to load payment gateway. Check your internet connection.');

      // 2. Create order on backend
      const { data: orderData } = await paymentsAPI.createOrder(payment.id);
      if (!orderData.success) throw new Error(orderData.message || 'Could not initiate payment');

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'College Management System',
        description: orderData.remarks || `Fee Payment #${payment.id}`,
        order_id: orderData.order_id,
        prefill: { name: orderData.student_name },
        theme: { color: '#4f46e5' },
        modal: { ondismiss: () => setPayingId(null) },
        handler: async (response) => {
          try {
            // 4. Verify on backend
            const verifyRes = await paymentsAPI.verifyPayment(payment.id, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              setReceipt({
                txnId: verifyRes.data.transaction_id,
                amount: verifyRes.data.amount_paid,
                date: new Date().toLocaleString('en-IN'),
                paymentId: payment.id,
              });
              await fetchData();
            } else {
              setError('Payment verification failed. Contact support if money was deducted.');
            }
          } catch {
            setError('Verification error. Contact support with your Razorpay payment ID.');
          } finally {
            setPayingId(null);
          }
        },
      };

      rzpRef.current = new window.Razorpay(options);
      rzpRef.current.on('payment.failed', (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setPayingId(null);
      });
      rzpRef.current.open();

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setPayingId(null);
    }
  };

  const pendingPayments = payments.filter(p => ['PENDING', 'PARTIAL', 'FAILED'].includes(p.status));
  const completedPayments = payments.filter(p => p.status === 'COMPLETED');

  if (loading && payments.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading fee details…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Fees &amp; Payments</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
          Manage your semester fee payments securely
        </p>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* ── Payment Receipt Modal ── */}
      {receipt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ color: '#166534', margin: '0 0 0.5rem' }}>Payment Successful!</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Your payment has been processed successfully.
            </p>
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1.5rem',
              textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Transaction ID</span>
                  <strong style={{ color: '#111', fontFamily: 'monospace', fontSize: '0.85rem' }}>{receipt.txnId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Amount Paid</span>
                  <strong style={{ color: '#166534', fontSize: '1.1rem' }}>₹{parseFloat(receipt.amount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Date &amp; Time</span>
                  <strong>{receipt.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Status</span>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.8rem' }}>
                    ✅ Completed
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => window.print()} style={{ flex: 1 }}>
                🖨️ Print Receipt
              </button>
              <button className="btn btn-primary" onClick={() => setReceipt(null)} style={{ flex: 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Cards ── */}
      {summary && (
        <>
          <div className="grid grid-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Fees', value: summary.total_due, color: '#4f46e5', icon: '📋' },
              { label: 'Amount Paid', value: summary.total_paid, color: '#10b981', icon: '✅' },
              { label: 'Balance Due', value: summary.balance, color: summary.balance > 0 ? '#ef4444' : '#10b981', icon: '💰' },
            ].map((card) => (
              <div key={card.label} className="card" style={{ borderLeft: `4px solid ${card.color}`, padding: '1.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  {card.label}
                </p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: card.color }}>
                  ₹{parseFloat(card.value || 0).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Fee Breakdown (if available) */}
          {summary.breakdown && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0 }}>📊 Fee Breakdown</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <tbody>
                  {Object.entries(summary.breakdown).map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 0', color: '#6b7280', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600, color: '#111' }}>₹{parseFloat(value || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Payment Tabs ── */}
      {payments.length > 0 && (
        <div>
          <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '0', padding: 0, borderRadius: 0 }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'pending' ? '#f59b0b' : '#f3f4f6',
                color: activeTab === 'pending' ? 'white' : '#374151',
                cursor: 'pointer',
                borderRadius: '0',
                fontWeight: activeTab === 'pending' ? 600 : 'normal',
                fontSize: '1rem',
              }}
            >
              ⏳ Pending ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'completed' ? '#10b981' : '#f3f4f6',
                color: activeTab === 'completed' ? 'white' : '#374151',
                cursor: 'pointer',
                borderRadius: '0',
                fontWeight: activeTab === 'completed' ? 600 : 'normal',
                fontSize: '1rem',
              }}
            >
              ✅ Completed ({completedPayments.length})
            </button>
          </div>

          {/* ── Pending Payments ── */}
          {activeTab === 'pending' && pendingPayments.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Due Date</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p) => {
                    const isOverdue = new Date(p.due_date) < new Date() && p.status === 'PENDING';
                    return (
                      <tr key={p.id} style={{ background: isOverdue ? '#fff7ed' : undefined }}>
                        <td>{p.remarks || `Semester Fee #${p.id}`}</td>
                        <td>
                          <span style={{ color: isOverdue ? '#ef4444' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
                            {new Date(p.due_date).toLocaleDateString('en-IN')}
                            {isOverdue && <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>⚠️ Overdue</span>}
                          </span>
                        </td>
                        <td>₹{parseFloat(p.amount_due).toLocaleString('en-IN')}</td>
                        <td>₹{parseFloat(p.amount_paid || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600, color: '#ef4444' }}>
                          ₹{parseFloat(p.balance_due || p.amount_due).toLocaleString('en-IN')}
                        </td>
                        <td><StatusBadge status={p.status} /></td>
                        <td>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                            onClick={() => handlePay(p)}
                            disabled={payingId === p.id}
                          >
                            {payingId === p.id ? '⏳ Processing…' : '💳 Pay Now'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Completed Payments ── */}
          {activeTab === 'completed' && completedPayments.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Paid On</th>
                    <th>Amount</th>
                    <th>Transaction ID</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.remarks || `Fee #${p.id}`}</td>
                      <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ fontWeight: 600, color: '#166534' }}>
                        ₹{parseFloat(p.amount_paid).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#4f46e5' }}>
                        {p.transaction_id || p.razorpay_payment_id || '—'}
                      </td>
                      <td>{p.payment_method || 'Razorpay'}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Empty State for Pending ── */}
          {activeTab === 'pending' && pendingPayments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
              <p style={{ color: '#6b7280', margin: 0 }}>You have no pending payments!</p>
            </div>
          )}

          {/* ── Empty State for Completed ── */}
          {activeTab === 'completed' && completedPayments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
              <p style={{ color: '#6b7280', margin: 0 }}>No payment history yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Empty State ── */}
      {payments.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ margin: '0 0 0.5rem' }}>No Fee Records</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>You have no fee records at this time.</p>
        </div>
      )}
    </div>
  );
};
