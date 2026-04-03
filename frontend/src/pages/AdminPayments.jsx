import { useEffect, useState } from 'react';
import { departments as deptAPI, feeStructures as feeAPI, payments as paymentsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

const StatusBadge = ({ status }) => {
  const config = {
    COMPLETED:  { bg: '#dcfce7', color: '#166534', label: 'Completed' },
    PENDING:    { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    FAILED:     { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
    PARTIAL:    { bg: '#dbeafe', color: '#1e40af', label: 'Partial' },
    PROCESSING: { bg: '#f3e8ff', color: '#6b21a8', label: 'Processing' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span style={{ background: c.bg, color: c.color, padding: '0.25rem 0.75rem',
      borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
      {c.label}
    </span>
  );
};

const EMPTY_FORM = {
  student: '', amount_due: '', due_date: '', remarks: '', payment_method: 'ONLINE',
  fee_structure: '',
};

export const AdminPayments = () => {
  const [paymentsList, setPaymentsList]     = useState([]);
  const [studentsList, setStudentsList]     = useState([]);
  const [deptList, setDeptList]             = useState([]);
  const [feeStructList, setFeeStructList]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [searchTerm, setSearchTerm]         = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal]   = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [notifMsg, setNotifMsg]             = useState('');
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [bulkForm, setBulkForm]             = useState({ semester: '', department_id: '', due_date: '', amount: '' });
  const [saving, setSaving]                 = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, dRes, fRes] = await Promise.all([
        paymentsAPI.list({ page_size: 200 }),
        studentsAPI.list({ page_size: 500 }),
        deptAPI.list(),
        feeAPI.list(),
      ]);
      setPaymentsList(pRes.data.results || pRes.data || []);
      setStudentsList(sRes.data.results || sRes.data || []);
      setDeptList(dRes.data.results || dRes.data || []);
      setFeeStructList(fRes.data.results || fRes.data || []);
      setError('');
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const getStudentName = (id) => {
    const s = studentsList.find((s) => s.id === id);
    return s ? `${s.user?.first_name} ${s.user?.last_name} (${s.roll_number})` : `Student #${id}`;
  };

  const isOverdue = (p) => p.status === 'PENDING' && new Date(p.due_date) < new Date();

  const filteredPayments = paymentsList.filter((p) => {
    const nameMatch = getStudentName(p.student).toLowerCase().includes(searchTerm.toLowerCase())
      || String(p.id).includes(searchTerm)
      || (p.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = !filterStatus || p.status === filterStatus;
    return nameMatch && statusMatch;
  });

  const overdue   = filteredPayments.filter(isOverdue);
  const pending   = filteredPayments.filter(p => p.status === 'PENDING' && !isOverdue(p));
  const completed = filteredPayments.filter(p => p.status === 'COMPLETED');
  const other     = filteredPayments.filter(p => !['PENDING', 'COMPLETED'].includes(p.status));

  const totalRevenue   = paymentsList.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
  const totalPending   = paymentsList.filter(p => p.status === 'PENDING').reduce((s, p) => s + parseFloat(p.amount_due || 0), 0);
  const totalOverdue   = overdue.reduce((s, p) => s + parseFloat(p.amount_due || 0), 0);

  // ── Create single payment ──
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentsAPI.create({
        student: parseInt(form.student),
        amount_due: parseFloat(form.amount_due),
        amount_paid: 0,
        due_date: form.due_date,
        remarks: form.remarks,
        payment_method: form.payment_method,
        fee_structure: form.fee_structure || null,
        status: 'PENDING',
      });
      showSuccess('Payment record created successfully');
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create payment');
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk create payments ──
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await paymentsAPI.bulkCreate({
        semester: parseInt(bulkForm.semester),
        department_id: bulkForm.department_id ? parseInt(bulkForm.department_id) : undefined,
        due_date: bulkForm.due_date,
        amount: bulkForm.amount ? parseFloat(bulkForm.amount) : undefined,
      });
      showSuccess(`${res.data.message}`);
      setShowBulkModal(false);
      setBulkForm({ semester: '', department_id: '', due_date: '', amount: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk create failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Mark as COMPLETED ──
  const handleMarkPaid = async (id) => {
    if (!window.confirm('Mark this payment as completed?')) return;
    try {
      await paymentsAPI.patch(id, {
        status: 'COMPLETED',
        amount_paid: paymentsList.find(p => p.id === id)?.amount_due,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
      });
      showSuccess('Payment marked as completed');
      fetchAll();
    } catch {
      setError('Failed to update payment');
    }
  };

  // ── Send notifications ──
  const handleSendNotifications = async (e) => {
    e.preventDefault();
    if (selectedPayments.size === 0) { setError('Select at least one payment'); return; }
    setSaving(true);
    try {
      for (const id of selectedPayments) {
        await paymentsAPI.sendNotification(id, { message: notifMsg });
      }
      showSuccess(`Reminders sent to ${selectedPayments.size} student(s)`);
      setShowNotifModal(false);
      setSelectedPayments(new Set());
      setNotifMsg('');
    } catch {
      setError('Failed to send notifications');
    } finally {
      setSaving(false);
    }
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const headers = ['ID', 'Student', 'Amount Due', 'Amount Paid', 'Due Date', 'Payment Date', 'Status', 'Method', 'Transaction ID'];
    const rows = filteredPayments.map(p => [
      p.id, getStudentName(p.student),
      p.amount_due, p.amount_paid,
      p.due_date, p.payment_date || '',
      p.status, p.payment_method || '', p.transaction_id || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const PaymentsTable = ({ items, showCheckbox = false, emptyMsg = 'No payments' }) => (
    items.length === 0 ? <p style={{ color: '#6b7280', padding: '1rem' }}>{emptyMsg}</p> : (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ margin: 0 }}>
          <thead>
            <tr>
              {showCheckbox && <th style={{ width: 40 }}>
                <input type="checkbox"
                  checked={items.every(p => selectedPayments.has(p.id))}
                  onChange={e => {
                    const newSel = new Set(selectedPayments);
                    items.forEach(p => e.target.checked ? newSel.add(p.id) : newSel.delete(p.id));
                    setSelectedPayments(newSel);
                  }} />
              </th>}
              <th>Student</th><th>Amount Due</th><th>Balance</th>
              <th>Due Date</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} style={{ background: isOverdue(p) ? '#fef2f2' : undefined }}>
                {showCheckbox && (
                  <td>
                    <input type="checkbox"
                      checked={selectedPayments.has(p.id)}
                      onChange={() => {
                        const ns = new Set(selectedPayments);
                        ns.has(p.id) ? ns.delete(p.id) : ns.add(p.id);
                        setSelectedPayments(ns);
                      }} />
                  </td>
                )}
                <td style={{ fontWeight: 500 }}>{getStudentName(p.student)}</td>
                <td>₹{parseFloat(p.amount_due).toLocaleString('en-IN')}</td>
                <td style={{ color: '#ef4444', fontWeight: 600 }}>
                  ₹{parseFloat(p.balance_due || (p.amount_due - p.amount_paid)).toLocaleString('en-IN')}
                </td>
                <td style={{ color: isOverdue(p) ? '#ef4444' : undefined }}>
                  {new Date(p.due_date).toLocaleDateString('en-IN')}
                  {isOverdue(p) && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>⚠️</span>}
                </td>
                <td><StatusBadge status={p.status} /></td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  {p.status === 'PENDING' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(p.id)}>
                      ✓ Mark Paid
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => { setSelectedPayments(new Set([p.id])); setShowNotifModal(true); }}>
                    📧
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  if (loading) return <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}><div className="spinner" /></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Payments Management</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>Manage and track all student fee payments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={exportCSV}>⬇️ Export CSV</button>
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>⚡ Bulk Generate</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Fee Record</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{error}</span><button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats */}
      <div className="grid grid-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#10b981', icon: '💰', sub: `${completed.length} payments` },
          { label: 'Pending Amount', value: `₹${totalPending.toLocaleString('en-IN')}`, color: '#f59e0b', icon: '⏳', sub: `${pending.length} pending` },
          { label: 'Overdue Amount', value: `₹${totalOverdue.toLocaleString('en-IN')}`, color: '#ef4444', icon: '⚠️', sub: `${overdue.length} overdue` },
        ].map(c => (
          <div key={c.label} className="card" style={{ borderLeft: `4px solid ${c.color}`, padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{c.icon}</div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</p>
            <p style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{c.value}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <input type="search" placeholder="Search by student, ID, or transaction..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px', marginBottom: 0 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '160px' }}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="PARTIAL">Partial</option>
          <option value="PROCESSING">Processing</option>
        </select>
        {overdue.length > 0 && (
          <button className="btn btn-warning" onClick={() => {
            setSelectedPayments(new Set(overdue.map(p => p.id)));
            setShowNotifModal(true);
          }}>
            📧 Notify Overdue ({overdue.length})
          </button>
        )}
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #ef4444', color: '#991b1b' }}>
            ⚠️ Overdue Payments ({overdue.length})
          </h2>
          <PaymentsTable items={overdue} showCheckbox={true} />
        </div>
      )}

      {/* Pending Section */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #f59e0b' }}>
            ⏳ Pending Payments ({pending.length})
          </h2>
          <PaymentsTable items={pending} />
        </div>
      )}

      {/* Other statuses (Failed/Partial/Processing) */}
      {other.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #8b5cf6' }}>
            🔵 Other ({other.length})
          </h2>
          <PaymentsTable items={other} />
        </div>
      )}

      {/* Completed Section */}
      {completed.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #10b981', color: '#166534' }}>
            ✅ Completed Payments ({completed.length})
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Student</th><th>Amount</th><th>Paid On</th><th>Method</th>
                  <th>Transaction ID</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{getStudentName(p.student)}</td>
                    <td style={{ color: '#166534', fontWeight: 600 }}>₹{parseFloat(p.amount_paid).toLocaleString('en-IN')}</td>
                    <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{p.payment_method || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#4f46e5' }}>
                      {p.transaction_id || p.razorpay_payment_id || '—'}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredPayments.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontSize: '1.2rem' }}>No payments found</p>
        </div>
      )}

      {/* ── Create Fee Record Modal ── */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '550px' }}>
            <h2 style={{ margin: '0 0 1.5rem' }}>Create Fee Record</h2>
            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Student *</label>
                <select value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} required>
                  <option value="">-- Select Student --</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.user?.first_name} {s.user?.last_name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" min="1" step="0.01" value={form.amount_due}
                    onChange={e => setForm({ ...form, amount_due: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input type="date" value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="ONLINE">Online</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fee Structure</label>
                  <select value={form.fee_structure} onChange={e => setForm({ ...form, fee_structure: e.target.value })}>
                    <option value="">-- None --</option>
                    {feeStructList.map(f => (
                      <option key={f.id} value={f.id}>Sem {f.semester} – {f.department_name} (₹{f.total_fee})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input type="text" value={form.remarks} placeholder="e.g. Semester 3 Tuition Fee"
                  onChange={e => setForm({ ...form, remarks: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => { setShowCreateModal(false); setForm(EMPTY_FORM); }} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : '+ Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Generate Modal ── */}
      {showBulkModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <h2 style={{ margin: '0 0 0.5rem' }}>⚡ Bulk Generate Fee Records</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Creates pending payment records for all active students in the selected semester.
              Uses fee structure amounts or a custom amount if provided.
            </p>
            <form onSubmit={handleBulkCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Semester *</label>
                  <select value={bulkForm.semester} onChange={e => setBulkForm({ ...bulkForm, semester: e.target.value })} required>
                    <option value="">-- Select --</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department (optional)</label>
                  <select value={bulkForm.department_id} onChange={e => setBulkForm({ ...bulkForm, department_id: e.target.value })}>
                    <option value="">-- All Departments --</option>
                    {deptList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input type="date" value={bulkForm.due_date}
                    onChange={e => setBulkForm({ ...bulkForm, due_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Custom Amount (₹, optional)</label>
                  <input type="number" min="1" value={bulkForm.amount}
                    placeholder="From fee structure"
                    onChange={e => setBulkForm({ ...bulkForm, amount: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => setShowBulkModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Generating…' : '⚡ Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Send Notifications Modal ── */}
      {showNotifModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <h2 style={{ margin: '0 0 0.5rem' }}>📧 Send Payment Reminder</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Sending reminder to <strong>{selectedPayments.size}</strong> student(s)
            </p>
            <form onSubmit={handleSendNotifications}>
              <div className="form-group">
                <label>Custom Message (Optional)</label>
                <textarea value={notifMsg} rows={4}
                  onChange={e => setNotifMsg(e.target.value)}
                  placeholder="Default: Your fee payment is overdue. Please pay immediately." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => { setShowNotifModal(false); setNotifMsg(''); }} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Sending…' : '📧 Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
