import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AdminRoute, FacultyRoute, ProtectedRoute, StudentRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AdminAttendance } from './pages/AdminAttendance';
import { AdminFeeStructure } from './pages/AdminFeeStructure';
import { AdminNotifications } from './pages/AdminNotifications';
import { AdminPayments } from './pages/AdminPayments';
import { AttendanceManagement } from './pages/AttendanceManagement';
import { AttendanceTracker } from './pages/AttendanceTracker';
import { Courses } from './pages/Courses';
import { Dashboard } from './pages/Dashboard';
import { Faculty } from './pages/Faculty';
import { FacultyAssignments } from './pages/FacultyAssignments';
import { FacultyAttendance } from './pages/FacultyAttendance';
import { FacultyGrades } from './pages/FacultyGrades';
import { ForgotPassword } from './pages/ForgotPassword';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { StudentAssignments } from './pages/StudentAssignments';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentFees } from './pages/StudentFees';
import { StudentGrades } from './pages/StudentGrades';
import { StudentNotifications } from './pages/StudentNotifications';
import { Students } from './pages/Students';
import { Timetable } from './pages/Timetable';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/students"
            element={
              <AdminRoute>
                <Students />
              </AdminRoute>
            }
          />
          
          <Route
            path="/faculty"
            element={
              <AdminRoute>
                <Faculty />
              </AdminRoute>
            }
          />
          
          <Route
            path="/courses"
            element={
              <AdminRoute>
                <Courses />
              </AdminRoute>
            }
          />
          
          <Route
            path="/timetable"
            element={
              <AdminRoute>
                <Timetable />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-attendance"
            element={
              <AdminRoute>
                <AdminAttendance />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-payments"
            element={
              <AdminRoute>
                <AdminPayments />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-fee-structure"
            element={
              <AdminRoute>
                <AdminFeeStructure />
              </AdminRoute>
            }
          />

          <Route
            path="/admin-notifications"
            element={
              <AdminRoute>
                <AdminNotifications />
              </AdminRoute>
            }
          />

          {/* FACULTY ROUTES */}
          <Route
            path="/faculty-grades"
            element={
              <FacultyRoute>
                <FacultyGrades />
              </FacultyRoute>
            }
          />
          <Route
            path="/faculty-attendance"
            element={
              <FacultyRoute>
                <FacultyAttendance />
              </FacultyRoute>
            }
          />
          <Route
            path="/attendance-tracker"
            element={
              <ProtectedRoute>
                <AttendanceTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty-assignments"
            element={
              <FacultyRoute>
                <FacultyAssignments />
              </FacultyRoute>
            }
          />
          
          {/* UNIFIED FACULTY ATTENDANCE MANAGEMENT (CRUD) */}
          <Route
            path="/attendance-management"
            element={
              <FacultyRoute>
                <AttendanceManagement />
              </FacultyRoute>
            }
          />

          {/* STUDENT ROUTES */}
          <Route
            path="/student-attendance"
            element={
              <StudentRoute>
                <StudentAttendance />
              </StudentRoute>
            }
          />
          <Route
            path="/student-assignments"
            element={
              <StudentRoute>
                <StudentAssignments />
              </StudentRoute>
            }
          />
          <Route
            path="/student-grades"
            element={
              <StudentRoute>
                <StudentGrades />
              </StudentRoute>
            }
          />
          <Route
            path="/student-fees"
            element={
              <StudentRoute>
                <StudentFees />
              </StudentRoute>
            }
          />
          <Route
            path="/student-notifications"
            element={
              <StudentRoute>
                <StudentNotifications />
              </StudentRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
