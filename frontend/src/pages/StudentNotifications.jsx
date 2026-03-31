import { useEffect, useState } from 'react';
import { notifications as notificationsAPI } from '../services/api';
import '../styles/global.css';

export const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.myNotifications();
      setNotifications(res.data.results || res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>Notifications & Updates</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{ 
                padding: '1.5rem', 
                borderLeft: n.is_global ? '4px solid #3b82f6' : '4px solid #10b981', 
                background: '#f9fafb',
                borderRadius: '0 8px 8px 0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{n.title}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                  {n.is_global ? (
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Global Announcement</span>
                  ) : (
                    <span><strong>Course:</strong> {n.course_name} (from Faculty: {n.faculty_name})</span>
                  )}
                </div>

                <p style={{ margin: 0, color: '#374151', lineHeight: '1.5' }}>
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>You have no notifications right now.</p>
        )}
      </div>
    </div>
  );
};
