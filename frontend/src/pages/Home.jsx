import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '1rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'white' }}>
          📚 College Management System
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
          A comprehensive platform for managing students, faculty, courses, grades, and
          administrative tasks.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
            style={{ padding: '0.875rem 2rem' }}
          >
            Login
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/register')}
            style={{ padding: '0.875rem 2rem', background: 'white', color: '#667eea' }}
          >
            Register
          </button>
        </div>

        <div
          style={{
            marginTop: '4rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <h3 style={{ color: 'white' }}>Student Management</h3>
            <p style={{ opacity: 0.8 }}>Track and manage student records</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
            <h3 style={{ color: 'white' }}>Faculty & Courses</h3>
            <p style={{ opacity: 0.8 }}>Organize faculty and course information</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <h3 style={{ color: 'white' }}>Grades & Performance</h3>
            <p style={{ opacity: 0.8 }}>Monitor academic performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};
