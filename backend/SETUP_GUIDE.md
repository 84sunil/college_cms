# College Management System - Setup Guide

## Quick Start

### 1. Database Migration

After updating the models (we added `AssignmentSubmission`), you need to create and apply migrations:

```bash
# From the backend directory
cd backend

# Create migrations for new models
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate
```

### 2. Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account with:
- Username
- Email
- Password

### 3. Run Backend Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/college/api/`

### 4. Run Frontend Server

In a separate terminal:

```bash
cd frontend
npm install  # If not done yet
npm run dev
```

Frontend will be available at `http://localhost:5173/`

---

## Features Implemented

### ✅ Complete Features

#### 1. **Authentication System**
- User registration (Student, Faculty, Admin)
- Login with role-based access
- JWT-based token authentication
- Password reset functionality
- Role-specific login endpoints

#### 2. **Student Features**
- **View Courses & Faculty**
  - See assigned courses per semester
  - View faculty for each course
  - View classmates in courses

- **Assignment Management**
  - View assignments (subject-wise)
  - Submit assignments with file URL or text
  - Resubmit rejected assignments
  - View submission status & feedback
  - Track submitted assignments vs. pending

- **Attendance Tracking**
  - View semester-wise attendance
  - Course-specific attendance percentages
  - Attendance indicators:
    - 🟢 90%+ → Excellent
    - 🟢 75–90% → Good
    - 🟡 60–75% → Average
    - 🔴 < 60% → Red Zone

- **Fee Management**
  - View payment status (Paid / Partial / Pending)
  - Pay fees online
  - View payment history
  - Track due dates

- **Profile Management**
  - Update personal details
  - View profile information

#### 3. **Faculty Features**
- **View Timetable**
  - Semester-wise class schedule
  - Course schedule details

- **Attendance Management**
  - Mark student attendance (Present/Absent/Late/Excused)
  - Batch mark all students at once
  - View attendance history
  - Quick selection buttons for rapid marking

- **Assignment Management**
  - Upload assignments (subject-wise)
  - View all assignments posted
  - Grade/Review student submissions
  - Approve assignments with marks
  - Reject assignments with feedback
  - View submission status dashboard
  - Filter submissions by course

- **Profile Management**
  - Update personal details

#### 4. **Admin Features**
- **Student Management**
  - Add new students with personal details
  - Edit student information
  - Delete student accounts
  - Filter students by semester
  - Search students by name/roll number

- **Payment Management**
  - Update fee status (Full Paid / Half Paid / Pending)
  - Send payment reminders to students
  - Track overdue payments
  - View payment statistics

- **Notification System**
  - Send notifications to all students
  - Send semester-wise notifications
  - Send department-wise notifications
  - Send individual notifications
  - View notification history

- **Profile Management**
  - Update admin profile details

#### 5. **Shared Features**
- **Notifications**
  - Global announcements
  - Semester-specific notifications
  - Department-specific notifications
  - Individual notifications
  - Unread notification tracking

- **Timetable Viewing**
  - Course schedule viewing
  - Semester-wise timetables

---

## API Endpoints Overview

### Authentication
```
POST /api/auth/register/     - Register new user
POST /api/auth/login/        - Login
POST /api/auth/logout/       - Logout
GET  /api/auth/current-user/ - Get current user info
POST /api/auth/change-password/    - Change password
POST /api/auth/forgot-password/    - Request password reset
POST /api/auth/reset-password/     - Reset password with token
```

### Students
```
GET  /students/              - List all students
GET  /students/{id}/         - Get student details
POST /students/              - Create student
PUT  /students/{id}/         - Update student
DELETE /students/{id}/       - Delete student
POST /students/add-student/  - Add student (admin)
```

### Assignments & Submissions
```
GET  /assignments/                          - List assignments
GET  /assignments/my_course_assignments/    - Get my assignments
POST /assignment-submissions/               - Submit assignment
GET  /assignment-submissions/my_submissions/ - Get my submissions
POST /assignment-submissions/{id}/approve_submission/  - Grade assignment
POST /assignment-submissions/{id}/reject_submission/   - Reject assignment
GET  /assignment-submissions/course_submissions/       - View submissions (faculty)
```

### Attendance
```
GET  /attendance/           - List attendance records
POST /attendance/           - Mark attendance
GET  /attendance/my_attendance/ - Get my attendance
```

### Grades
```
GET  /grades/               - List grades
POST /grades/               - Add grade
GET  /grades/my_grades/     - Get my grades
```

### Payments
```
GET  /payments/             - List payments
GET  /payments/my_payments/ - Get my payments
POST /payments/             - Create payment record
PUT  /payments/{id}/        - Update payment
```

### Notifications
```
GET  /notifications/             - List notifications
POST /notifications/             - Create notification
DELETE /notifications/{id}/      - Delete notification
GET  /notifications/my_notifications/ - Get my notifications
```

### Timetable
```
GET  /timetable/                 - List timetable
POST /timetable/                 - Create timetable entry
GET  /timetable/?course={id}     - Get course timetable
```

---

## Database Models

### New Model Added
- **AssignmentSubmission** - Tracks student assignment submissions and grading

### Existing Models
- User (Django built-in)
- Student
- Faculty
- Course
- Department
- Assignment
- Attendance
- Grade
- Payment
- Notification
- Timetable
- And more...

---

## Frontend Components

### Student Pages
- **StudentAssignments.jsx** - View and submit assignments
- **StudentAttendance.jsx** - View attendance with statistics
- **StudentFees.jsx** - Pay fees online
- **StudentGrades.jsx** - View grades
- **StudentNotifications.jsx** - View notifications
- **Courses.jsx** - View enrolled courses
- **Students.jsx** - View classmates

### Faculty Pages
- **FacultyAssignments.jsx** - Post & grade assignments
- **FacultyAttendance.jsx** - Mark student attendance
- **FacultyGrades.jsx** - Manage performance
- **Faculty.jsx** - View all faculty

### Admin Pages
- **Students.jsx** - Manage students (add/edit/delete)
- **AdminPayments.jsx** - Manage fee payments
- **AdminNotifications.jsx** - Send notifications
- **AdminAttendance.jsx** - View attendance overview

---

## Running Tests

```bash
# Run Django tests
python manage.py test college

# Run specific test
python manage.py test college.tests.TestClassName
```

---

## Troubleshooting

### Models not appearing in database
```bash
python manage.py makemigrations
python manage.py migrate
```

### Port already in use (frontend)
```bash
npm run dev -- --port 5174
```

### Backend API not responding
```bash
# Check if server is running
# Check CORS settings in settings.py
# Ensure database is properly migrated
```

### CORS Issues
The backend should have CORS configured to allow frontend requests. Check `backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    # Add more origins as needed
]
```

---

## Next Steps / Remaining Features

- [ ] Profile picture upload functionality
- [ ] Real payment gateway integration (Razorpay, Stripe)
- [ ] Timetable auto-generation
- [ ] AI-based plagiarism detection for assignments
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Chatbot for student queries
- [ ] Risk prediction based on attendance
- [ ] Student performance analytics
- [ ] Book issuance management
- [ ] Hostel management features

---

## Support

For issues or questions, refer to:
1. Django Documentation: https://docs.djangoproject.com/
2. DRF Documentation: https://www.django-rest-framework.org/
3. React Documentation: https://react.dev/
