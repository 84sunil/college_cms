import { useEffect, useState } from 'react';
import { departments as departmentsAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const Students = () => {
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [formData, setFormData] = useState({
    username: '', password: '', first_name: '', last_name: '', email: '',
    department: '', roll_number: '', enrollment_number: '', semester: 1
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.list();
      setDepartmentsList(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load departments');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.list();
      setStudentsList(response.data.results || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      username: '', password: '', first_name: '', last_name: '', email: '',
      department: '', roll_number: '', enrollment_number: '', semester: 1
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      if (editingId) {
        // Update existing student
        await studentsAPI.update(editingId, {
          ...formData
        });
        setError('');
      } else {
        // Add new student via admin endpoint
        await studentsAPI.addStudent({
          ...formData,
          department: parseInt(formData.department)
        });
        setError('');
      }
      
      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.username?.[0] || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      username: student.user?.username || '',
      password: '',
      first_name: student.user?.first_name || '',
      last_name: student.user?.last_name || '',
      email: student.user?.email || '',
      department: student.department || '',
      roll_number: student.roll_number || '',
      enrollment_number: student.enrollment_number || '',
      semester: student.semester || 1
    });
    setEditingId(student.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsAPI.delete(id);
      setError('');
      fetchStudents();
    } catch (err) {
      setError('Failed to delete student');
    }
  };

  const filteredStudents = studentsList.filter(
    (student) =>
      (selectedSemester === '' || student.semester === parseInt(selectedSemester)) &&
      (student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group students by semester
  const studentsBySemester = {};
  filteredStudents.forEach(student => {
    if (!studentsBySemester[student.semester]) {
      studentsBySemester[student.semester] = [];
    }
    studentsBySemester[student.semester].push(student);
  });

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Students Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Student</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <input
            type="search"
            placeholder="Search by roll number or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label>Filter by Semester:</label>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Display students grouped by semester */}
      {Object.keys(studentsBySemester).sort((a, b) => a - b).map((semester) => (
        <div key={semester} style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>
            Semester {semester} ({studentsBySemester[semester].length} students)
          </h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Enrollment #</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsBySemester[semester].map((student) => (
                  <tr key={student.id}>
                    <td>{student.roll_number}</td>
                    <td>{student.user?.first_name} {student.user?.last_name}</td>
                    <td>{student.user?.username}</td>
                    <td>{student.user?.email}</td>
                    <td>{student.enrollment_number}</td>
                    <td>{student.department_name || student.department}</td>
                    <td>
                      <span
                        style={{
                          background: student.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                          color: student.status === 'ACTIVE' ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--border-radius)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(student)} style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(student.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {Object.keys(studentsBySemester).length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>No students found</p>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>{editingId ? 'Edit Student' : 'Create New Student'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select name="department" required value={formData.department} onChange={handleInputChange}>
                    <option value="">Select Department</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" name="username" required value={formData.username} onChange={handleInputChange} disabled={editingId} />
                </div>
                {!editingId && (
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleInputChange} />
                  </div>
                )}
                <div className="form-group">
                  <label>Roll Number</label>
                  <input type="text" name="roll_number" required value={formData.roll_number} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Enrollment Number</label>
                  <input type="text" name="enrollment_number" required value={formData.enrollment_number} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleInputChange}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
