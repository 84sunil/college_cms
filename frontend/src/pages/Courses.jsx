import { useEffect, useState } from 'react';
import { courses as coursesAPI, departments as departmentsAPI, faculty as facultyAPI } from '../services/api';
import '../styles/global.css';

export const Courses = () => {
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    semester: 1,
    credits: 3,
    instructor: '',
    description: '',
    max_students: 50,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
    fetchFaculty();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.list();
      setCoursesList(response.data.results || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.list();
      setDepartmentsList(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load departments');
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await facultyAPI.list();
      setFacultyList(res.data.results || []);
    } catch (err) {
      console.error('Failed to load faculty');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'credits' || name === 'semester' || name === 'max_students' ? parseInt(value) : value)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      semester: 1,
      credits: 3,
      instructor: '',
      description: '',
      max_students: 50,
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = {
        ...formData,
        department: parseInt(formData.department),
        instructor: formData.instructor || null
      };
      
      if (editingId) {
        await coursesAPI.update(editingId, data);
        setError('');
      } else {
        await coursesAPI.create(data);
        setError('');
      }
      
      setShowModal(false);
      resetForm();
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name || '',
      code: course.code || '',
      department: course.department || '',
      semester: course.semester || 1,
      credits: course.credits || 3,
      instructor: course.instructor || '',
      description: course.description || '',
      max_students: course.max_students || 50,
      is_active: course.is_active !== false
    });
    setEditingId(course.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await coursesAPI.delete(id);
      setError('');
      fetchCourses();
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const filteredCourses = coursesList.filter((course) =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Courses Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Course</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <input
          type="search"
          placeholder="Search by course name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div className="card">
        {filteredCourses.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Name</th>
                <th>Credits</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Instructor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.credits}</td>
                  <td>{course.department_name || course.department}</td>
                  <td>{course.semester}</td>
                  <td>{course.instructor_name || 'Unassigned'}</td>
                  <td>
                    <span
                      style={{
                        background: course.is_active ? '#dcfce7' : '#fee2e2',
                        color: course.is_active ? '#166534' : '#991b1b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(course)} style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(course.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No courses found</p>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>{editingId ? 'Edit Course' : 'Create New Course'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Course Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Course Code</label>
                  <input type="text" name="code" required value={formData.code} onChange={handleInputChange} disabled={editingId} />
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
                  <label>Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleInputChange}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <select name="credits" value={formData.credits} onChange={handleInputChange}>
                    {[1, 2, 3, 4, 5, 6].map((cred) => (
                      <option key={cred} value={cred}>{cred}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Instructor</label>
                  <select name="instructor" value={formData.instructor} onChange={handleInputChange}>
                    <option value="">Select Instructor</option>
                    {facultyList.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.user?.first_name} {fac.user?.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Students</label>
                  <input type="number" name="max_students" min="1" value={formData.max_students} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active" style={{ marginLeft: '0.5rem', marginBottom: 0 }}>Active</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
