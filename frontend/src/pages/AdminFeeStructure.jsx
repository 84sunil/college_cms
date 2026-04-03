import { useEffect, useState } from 'react';
import { departments as deptAPI, feeStructures as feeAPI } from '../services/api';
import '../styles/global.css';

const EMPTY_FORM = {
  department: '', semester: '', tuition_fee: '',
  lab_fee: '0', library_fee: '0', activity_fee: '0', other_fee: '0',
};

const calcTotal = (f) =>
  ['tuition_fee', 'lab_fee', 'library_fee', 'activity_fee', 'other_fee']
    .reduce((sum, k) => sum + parseFloat(f[k] || 0), 0);

export const AdminFeeStructure = () => {
  const [feeList, setFeeList]       = useState([]);
  const [deptList, setDeptList]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null); // null = create
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [deleteId, setDeleteId]     = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, dRes] = await Promise.all([feeAPI.list(), deptAPI.list()]);
      setFeeList(fRes.data.results || fRes.data || []);
      setDeptList(dRes.data.results || dRes.data || []);
      setError('');
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const f = (s) => setForm((prev) => ({ ...prev, ...s }));

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      department: item.department,
      semester: item.semester,
      tuition_fee: item.tuition_fee,
      lab_fee: item.lab_fee,
      library_fee: item.library_fee,
      activity_fee: item.activity_fee,
      other_fee: item.other_fee,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      department: parseInt(form.department),
      semester: parseInt(form.semester),
      tuition_fee: parseFloat(form.tuition_fee),
      lab_fee: parseFloat(form.lab_fee || 0),
      library_fee: parseFloat(form.library_fee || 0),
      activity_fee: parseFloat(form.activity_fee || 0),
      other_fee: parseFloat(form.other_fee || 0),
    };
    try {
      if (editItem) {
        await feeAPI.update(editItem.id, payload);
        showSuccess('Fee structure updated successfully');
      } else {
        await feeAPI.create(payload);
        showSuccess('Fee structure created successfully');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Operation failed. Check for duplicate semester/department combinations.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await feeAPI.delete(id);
      showSuccess('Fee structure deleted');
      setDeleteId(null);
      fetchAll();
    } catch {
      setError('Failed to delete fee structure');
    }
  };

  const filtered = feeList.filter(f => !filterDept || String(f.department) === filterDept);

  const FeeField = ({ label, name, icon }) => (
    <div className="form-group">
      <label>{icon} {label}</label>
      <input type="number" min="0" step="0.01" value={form[name]}
        onChange={e => f({ [name]: e.target.value })}
        placeholder="0.00" />
    </div>
  );

  if (loading) return <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}><div className="spinner" /></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Fee Structure Management</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
            Configure semester fees per department
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Fee Structure</button>
      </div>

      {error && <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{error}</span>
        <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="">All Departments</option>
            {deptList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Showing {filtered.length} of {feeList.length} structures
        </span>
      </div>

      {/* Fee Structure Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
          <h3 style={{ margin: '0 0 0.5rem' }}>No Fee Structures</h3>
          <p style={{ color: '#6b7280', margin: '0 0 1.5rem' }}>
            Create fee structures to start generating payment records for students.
          </p>
          <button className="btn btn-primary" onClick={openCreate}>+ Add First Fee Structure</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Department</th>
                <th>Semester</th>
                <th>Tuition</th>
                <th>Lab</th>
                <th>Library</th>
                <th>Activity</th>
                <th>Other</th>
                <th style={{ background: '#f0fdf4', color: '#166534' }}>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => a.semester - b.semester || (a.department_name || '').localeCompare(b.department_name || ''))
                .map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.department_name}</td>
                    <td>
                      <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.2rem 0.6rem',
                        borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                        Sem {item.semester}
                      </span>
                    </td>
                    <td>₹{parseFloat(item.tuition_fee).toLocaleString('en-IN')}</td>
                    <td>₹{parseFloat(item.lab_fee).toLocaleString('en-IN')}</td>
                    <td>₹{parseFloat(item.library_fee).toLocaleString('en-IN')}</td>
                    <td>₹{parseFloat(item.activity_fee).toLocaleString('en-IN')}</td>
                    <td>₹{parseFloat(item.other_fee).toLocaleString('en-IN')}</td>
                    <td style={{ background: '#f0fdf4', fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
                      ₹{parseFloat(item.total_fee).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '560px' }}>
            <h2 style={{ margin: '0 0 1.5rem' }}>
              {editItem ? '✏️ Edit Fee Structure' : '+ Create Fee Structure'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Department *</label>
                  <select value={form.department} onChange={e => f({ department: e.target.value })} required>
                    <option value="">-- Select --</option>
                    {deptList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester *</label>
                  <select value={form.semester} onChange={e => f({ semester: e.target.value })} required>
                    <option value="">-- Select --</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FeeField label="Tuition Fee (₹) *" name="tuition_fee" icon="🎓" />
                <FeeField label="Lab Fee (₹)" name="lab_fee" icon="🔬" />
                <FeeField label="Library Fee (₹)" name="library_fee" icon="📚" />
                <FeeField label="Activity Fee (₹)" name="activity_fee" icon="⚽" />
              </div>
              <FeeField label="Other Fees (₹)" name="other_fee" icon="📎" />

              {/* Live total */}
              {(form.tuition_fee > 0 || form.lab_fee > 0) && (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '1rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '1rem' }}>
                  <span style={{ color: '#166534', fontWeight: 600 }}>Total Fee</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#166534' }}>
                    ₹{calcTotal(form).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editItem ? '✏️ Update' : '+ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
            <h2 style={{ margin: '0 0 0.5rem' }}>Delete Fee Structure?</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              This will permanently remove this fee structure. Existing payment records will not be affected.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
