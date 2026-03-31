import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import '../styles/global.css';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    role: '',
    department: '',
    // Student fields
    roll_number: '',
    enrollment_number: '',
    semester: 1,
    // Faculty fields
    employee_id: '',
    specialization: '',
  });
  const [departments, setDepartments] = useState([]);
  const [registrationOptions, setRegistrationOptions] = useState({
    roles: [],
    semesters: [],
    genders: [],
    student_statuses: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadRegistrationData = async () => {
      try {
        setOptionsLoading(true);
        const [optionsResponse, departmentsResponse] = await Promise.all([
          auth.getRegistrationOptions(),
          auth.getDepartmentsList()
        ]);

        if (optionsResponse.data.success) {
          setRegistrationOptions(optionsResponse.data.options);
        }

        if (departmentsResponse.data.success) {
          setDepartments(departmentsResponse.data.departments);
        }
      } catch (err) {
        // Fallback to default options if API fails
        setRegistrationOptions({
          roles: [
            { value: 'student', label: 'Student', description: 'Student account with academic features' },
            { value: 'faculty', label: 'Faculty', description: 'Faculty account with teaching features' },
            { value: 'admin', label: 'Administrator', description: 'Admin account with full system access' }
          ],
          semesters: Array.from({ length: 8 }, (_, i) => ({
            value: i + 1,
            label: `Semester ${i + 1}`
          }))
        });
        setDepartments([]);
      } finally {
        setOptionsLoading(false);
      }
    };
    loadRegistrationData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData({
      ...formData,
      role: newRole,
      department: '',
      roll_number: '',
      enrollment_number: '',
      semester: 1,
      employee_id: '',
      specialization: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.department) {
      setError('Department is required for registration');
      return;
    }

    if (formData.role === 'student') {
      if (!formData.roll_number.trim()) {
        setError('Roll number is required for student registration');
        return;
      }
      if (!formData.enrollment_number.trim()) {
        setError('Enrollment number is required for student registration');
        return;
      }
    } else if (formData.role === 'faculty') {
      if (!formData.employee_id.trim()) {
        setError('Employee ID is required for faculty registration');
        return;
      }
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    return (
      <>
        {/* Department field for all roles */}
        <div className="form-group">
          <label htmlFor="department">Department Name *</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g., Computer Science"
            required
          />
        </div>

        {formData.role === 'student' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="roll_number">Roll Number *</label>
                <input
                  type="text"
                  id="roll_number"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  placeholder="e.g., CSE001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="enrollment_number">Enrollment Number *</label>
                <input
                  type="text"
                  id="enrollment_number"
                  name="enrollment_number"
                  value={formData.enrollment_number}
                  onChange={handleChange}
                  placeholder="e.g., ENR001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="semester">Semester *</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
              >
                {optionsLoading ? (
                  <option>Loading...</option>
                ) : (
                  registrationOptions.semesters.map((sem) => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          </>
        )}

        {formData.role === 'faculty' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="employee_id">Employee ID *</label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                placeholder="e.g., EMP001"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g., Machine Learning"
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const isNoneSelected = formData.role === '';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Register</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role selector always visible */}
          <div className="form-group">
            <label htmlFor="role">Register As</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              disabled={optionsLoading}
            >
              <option value="">None</option>
              {optionsLoading ? null : (
                registrationOptions.roles
                  .filter((role) => role.value !== 'user')
                  .map((role) => (
                    <option key={role.value} value={role.value} title={role.description}>
                      {role.label}
                    </option>
                  ))
              )}
            </select>
          </div>

          {/* Rest of the form hidden when None is selected */}
          {!isNoneSelected && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {renderRoleSpecificFields()}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Enter password (min 6 characters)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password2">Confirm Password</label>
                <input
                  type="password"
                  id="password2"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Registering...' : `Register as ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}`}
              </button>
            </>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};