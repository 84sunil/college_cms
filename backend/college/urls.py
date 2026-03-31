from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    home, user_register, login_view, logout_view, faculty_login, student_login, 
    admin_login, get_current_user, change_password, forgot_password, reset_password, 
    get_registration_options,
    get_departments_list, get_dashboard_stats, add_student_admin, attendance_by_semester,
    DepartmentViewSet, FacultyViewSet, CourseViewSet, StudentViewSet,
    CourseEnrollmentViewSet, AdmissionViewSet, AttendanceViewSet, GradeViewSet,
    FeeStructureViewSet, PaymentViewSet, BookViewSet, BookIssueViewSet,
    HostelViewSet, RoomViewSet, HostelAllocationViewSet, HostelFeeViewSet,
    AssignmentViewSet, AssignmentSubmissionViewSet, TimetableViewSet, NotificationViewSet
)

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'faculty', FacultyViewSet, basename='faculty')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'course-enrollments', CourseEnrollmentViewSet, basename='course-enrollment')
router.register(r'admissions', AdmissionViewSet, basename='admission')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'books', BookViewSet, basename='book')
router.register(r'book-issues', BookIssueViewSet, basename='book-issue')
router.register(r'hostels', HostelViewSet, basename='hostel')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'hostel-allocations', HostelAllocationViewSet, basename='hostel-allocation')
router.register(r'hostel-fees', HostelFeeViewSet, basename='hostel-fee')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'assignment-submissions', AssignmentSubmissionViewSet, basename='assignment-submission')
router.register(r'timetable', TimetableViewSet, basename='timetable')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [

    
    # Authentication Endpoints
    path('api/auth/register/', user_register, name='register'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/faculty-login/', faculty_login, name='faculty-login'),
    path('api/auth/student-login/', student_login, name='student-login'),
    path('api/auth/admin-login/', admin_login, name='admin-login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/current-user/', get_current_user, name='current-user'),
    path('api/auth/change-password/', change_password, name='change-password'),
    path('api/auth/forgot-password/', forgot_password, name='forgot-password'),
    path('api/auth/reset-password/', reset_password, name='reset-password'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Registration Options Endpoints
    path('api/auth/registration-options/', get_registration_options, name='registration-options'),
    path('api/auth/departments-list/', get_departments_list, name='departments-list'),
    
    # Dashboard Stats Endpoint
    path('api/stats/', get_dashboard_stats, name='dashboard-stats'),
    
    # Admin Student Management Endpoint
    path('api/students/add-student/', add_student_admin, name='add-student-admin'),
    
    # Attendance by Semester Endpoint
    path('api/attendance/by-semester/', attendance_by_semester, name='attendance-by-semester'),
    
    # API Routes
    path('api/', include(router.urls)),
]
