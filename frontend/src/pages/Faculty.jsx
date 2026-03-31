import { useEffect, useState } from 'react';
import { departments as departmentsAPI, faculty as facultyAPI, auth } from '../services/api';
import '../styles/global.css';

const EMPTY_FORM = {
  employee_id: '',
  specialization: '',
  department: '',
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
};

export const Faculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  // ── API calls ────────────────────────────────────────────────

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await facultyAPI.list();
      setFacultyList(res.data.results || res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch faculty list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.list();
      setDepartments(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const handleAdd = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await auth.register({
        role: 'faculty',
        employee_id: formData.employee_id,
        specialization: formData.specialization,
        department: formData.department,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        password2: formData.password // the backend expects this to match
      });
      await fetchFaculty();
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to add faculty.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await facultyAPI.update(selectedFaculty.id, {
        employee_id: formData.employee_id,
        specialization: formData.specialization,
        department: formData.department,
        user: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {}),
        },
      });
      await fetchFaculty();
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update faculty.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await facultyAPI.delete(deleteTarget.id);
      await fetchFaculty();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      setError('Failed to delete faculty.');
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Modal helpers ────────────────────────────────────────────

  const openAddModal = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setModalMode('add');
    setSelectedFaculty(null);
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setFormData({
      employee_id: member.employee_id || '',
      specialization: member.specialization || '',
      department: member.department || '',
      first_name: member.user?.first_name || '',
      last_name: member.user?.last_name || '',
      email: member.user?.email || '',
      username: member.user?.username || '',
      password: '',
    });
    setFormError('');
    setModalMode('edit');
    setSelectedFaculty(member);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFaculty(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'add') handleAdd();
    else handleEdit();
  };

  // ── Filter ───────────────────────────────────────────────────

  const filteredFaculty = facultyList.filter(
    (m) =>
      m.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Faculty Management</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Faculty
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <input
          type="search"
          placeholder="Search by name, employee ID, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div className="card">
        {filteredFaculty.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map((member) => (
                <tr key={member.id}>
                  <td>{member.employee_id}</td>
                  <td>{member.user?.first_name} {member.user?.last_name}</td>
                  <td>{member.department_name || member.department}</td>
                  <td>{member.specialization || '—'}</td>
                  <td>{member.user?.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => openEditModal(member)}
                      >
                        Edit
                      </button>
                      <button
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => { setDeleteTarget(member); setShowDeleteConfirm(true); }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No faculty found</p>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div style={overlayStyle}>
          <div className="card" style={modalStyle}>
            <h2 style={{ marginBottom: '1.5rem' }}>{modalMode === 'add' ? 'Add Faculty' : 'Edit Faculty'}</h2>

            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>First Name *</label>
                  <input name="first_name" value={formData.first_name} onChange={handleFormChange} required placeholder="e.g., John" />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input name="last_name" value={formData.last_name} onChange={handleFormChange} required placeholder="e.g., Doe" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleFormChange} required placeholder="e.g., john@example.com" />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input type="text" name="username" value={formData.username} onChange={handleFormChange} required={modalMode === 'add'} disabled={modalMode === 'edit'} placeholder="e.g., jdoe" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input name="employee_id" value={formData.employee_id} onChange={handleFormChange} required placeholder="e.g., EMP001" />
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input name="specialization" value={formData.specialization} onChange={handleFormChange} placeholder="e.g., Machine Learning" />
                </div>
              </div>

              <div className="form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>

              <div className="form-group">
                <label>{modalMode === 'add' ? 'Password *' : 'New Password (leave blank to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={modalMode === 'add'}
                  placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Enter password'}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Saving...' : modalMode === 'add' ? 'Add Faculty' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal} disabled={formLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && deleteTarget && (
        <div style={overlayStyle}>
          <div className="card" style={{ ...modalStyle, maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Confirm Delete</h3>
            <p>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget.user?.first_name} {deleteTarget.user?.last_name}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.6rem' }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000, padding: '1rem',
};

const modalStyle = {
  width: '100%', maxWidth: '560px',
  maxHeight: '90vh', overflowY: 'auto',
};