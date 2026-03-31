import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { faculty as facultyAPI, students as studentsAPI } from '../services/api';
import '../styles/global.css';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
  });
  const [additionalData, setAdditionalData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let profileData = null;

        if (user?.role === 'student') {
          const res = await studentsAPI.list();
          const studentProfile = res.data.results?.find(s => s.user?.id === user?.id);
          profileData = studentProfile;
        } else if (user?.role === 'faculty') {
          const res = await facultyAPI.list();
          const facultyProfile = res.data.results?.find(f => f.user?.id === user?.id);
          profileData = facultyProfile;
        }

        if (profileData) {
          setFormData({
            first_name: profileData.user?.first_name || '',
            last_name: profileData.user?.last_name || '',
            email: profileData.user?.email || '',
            phone: profileData.phone || '',
            gender: profileData.gender || '',
            date_of_birth: profileData.date_of_birth || '',
            address: profileData.address || '',
          });

          if (user?.role === 'student') {
            setAdditionalData({
              roll_number: profileData.roll_number || '',
              enrollment_number: profileData.enrollment_number || '',
              semester: profileData.semester || 1,
              father_name: profileData.father_name || '',
              mother_name: profileData.mother_name || '',
            });
          } else if (user?.role === 'faculty') {
            setAdditionalData({
              employee_id: profileData.employee_id || '',
              specialization: profileData.specialization || '',
              qualification: profileData.qualification || '',
            });
          }

          // Build full URL for profile picture if it exists
          if (profileData.profile_picture) {
            const picUrl = profileData.profile_picture.startsWith('http')
              ? profileData.profile_picture
              : `http://localhost:8000${profileData.profile_picture}`;
            setPreviewImage(picUrl);
          }
        }
        setError('');
      } catch (err) {
        setError('Failed to load profile');

      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const updateData = {
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
      };

      // Add role-specific fields
      if (user?.role === 'student') {
        updateData.father_name = additionalData.father_name || '';
        updateData.mother_name = additionalData.mother_name || '';
        // Get student profile ID from API
        const res = await studentsAPI.list();
        const studentProfile = res.data.results?.find(s => s.user?.id === user?.id);
        if (studentProfile) {
          // Create FormData for multipart upload if profile picture exists
          if (profilePicture) {
            const formDataWithFile = new FormData();
            Object.keys(updateData).forEach(key => {
              formDataWithFile.append(key, updateData[key]);
            });
            formDataWithFile.append('profile_picture', profilePicture);
            await studentsAPI.updateWithFile(studentProfile.id, formDataWithFile);
          } else {
            await studentsAPI.update(studentProfile.id, updateData);
          }
        }
      } else if (user?.role === 'faculty') {
        updateData.specialization = additionalData.specialization || '';
        // Get faculty profile ID from API
        const res = await facultyAPI.list();
        const facultyProfile = res.data.results?.find(f => f.user?.id === user?.id);
        if (facultyProfile) {
          // Create FormData for multipart upload if profile picture exists
          if (profilePicture) {
            const formDataWithFile = new FormData();
            Object.keys(updateData).forEach(key => {
              formDataWithFile.append(key, updateData[key]);
            });
            formDataWithFile.append('profile_picture', profilePicture);
            await facultyAPI.updateWithFile(facultyProfile.id, formDataWithFile);
          } else {
            await facultyAPI.update(facultyProfile.id, updateData);
          }
        }
      }

      setSuccess('Profile updated successfully');
      setEditing(false);
      setProfilePicture(null);
      
      // Reload page after a brief delay to ensure navbar displays updated picture
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Profile</h1>
        <button
          className={`btn ${editing ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
          {/* Profile Picture Section */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '3px solid #3b82f6',
              }}
            >
              {previewImage ? (
                <img
                  key={previewImage}
                  src={previewImage}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ fontSize: '3rem' }}>📷</div>
              )}
            </div>

            {editing && (
              <div>
                <input
                  type="file"
                  id="photo-upload"
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="photo-upload"
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer', marginTop: '1rem' }}
                >
                  📤 Change Photo
                </label>
              </div>
            )}
          </div>

        {/* User Info */}
        <div className="grid grid-2">
          <div>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>First Name</label>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {!editing ? formData.first_name : (
                <span style={{ opacity: 0.7 }}>Read-only: {formData.first_name}</span>
              )}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Last Name</label>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {!editing ? formData.last_name : (
                <span style={{ opacity: 0.7 }}>Read-only: {formData.last_name}</span>
              )}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Email</label>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {!editing ? formData.email : (
                <span style={{ opacity: 0.7 }}>Read-only: {formData.email}</span>
              )}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Phone</label>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {!editing ? (formData.phone || '-') : (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                />
              )}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Gender</label>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {!editing ? (
                <span style={{
                  background: '#f3f4f6',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--border-radius)',
                  display: 'inline-block'
                }}>
                  {formData.gender ? (formData.gender === 'M' ? '👨 Male' : formData.gender === 'F' ? '👩 Female' : 'Other') : '-'}
                </span>
              ) : (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              )}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Date of Birth</label>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {!editing ? (formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : '-') : (
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                />
              )}
            </p>
          </div>
        </div>

        {/* Address */}
        <div style={{ marginTop: '1.5rem' }}>
          <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Address</label>
          <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
            {!editing ? (formData.address || '-') : (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                rows="3"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
              />
            )}
          </p>
        </div>

        {/* Role-Specific Fields */}
        {user?.role === 'student' && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0 }}>Student Information</h3>
            <div className="grid grid-2">
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Roll Number</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>{additionalData.roll_number}</p>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Enrollment Number</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>{additionalData.enrollment_number}</p>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Semester</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>Semester {additionalData.semester}</p>
              </div>
              <div></div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Father Name</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
                  {!editing ? (additionalData.father_name || '-') : (
                    <input
                      type="text"
                      value={additionalData.father_name || ''}
                      onChange={(e) => setAdditionalData(prev => ({ ...prev, father_name: e.target.value }))}
                      placeholder="Father's name"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                    />
                  )}
                </p>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Mother Name</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
                  {!editing ? (additionalData.mother_name || '-') : (
                    <input
                      type="text"
                      value={additionalData.mother_name || ''}
                      onChange={(e) => setAdditionalData(prev => ({ ...prev, mother_name: e.target.value }))}
                      placeholder="Mother's name"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                    />
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'faculty' && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0 }}>Faculty Information</h3>
            <div className="grid grid-2">
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Employee ID</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>{additionalData.employee_id}</p>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Specialization</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
                  {!editing ? (additionalData.specialization || '-') : (
                    <input
                      type="text"
                      value={additionalData.specialization || ''}
                      onChange={(e) => setAdditionalData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="Specialization"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                    />
                  )}
                </p>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#6b7280' }}>Qualification</label>
                <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
                  {!editing ? (additionalData.qualification || '-') : (
                    <input
                      type="text"
                      value={additionalData.qualification || ''}
                      onChange={(e) => setAdditionalData(prev => ({ ...prev, qualification: e.target.value }))}
                      placeholder="Qualification"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 'var(--border-radius)' }}
                    />
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {editing && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
