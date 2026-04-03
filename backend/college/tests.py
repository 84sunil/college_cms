"""
College CMS — Comprehensive Test Suite
Covers: Auth, CRUD (Students/Faculty/Courses/Departments/Payments), 
        Payment flow, Permissions, Razorpay flow (mocked)
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
import hmac
import hashlib
from django.conf import settings

from .models import (
    Department, Faculty, Course, Student, Payment,
    FeeStructure, Attendance, Grade, Assignment, Notification
)


# ============= BASE TEST MIXIN =============
class BaseTestMixin:
    """Shared setup helpers"""

    def create_admin(self, username='admin_test', password='Admin@123'):
        user = User.objects.create_superuser(
            username=username, email=f'{username}@test.com',
            password=password, first_name='Admin', last_name='User'
        )
        return user

    def create_faculty_user(self, username='faculty_test', password='Faculty@123'):
        user = User.objects.create_user(
            username=username, email=f'{username}@test.com',
            password=password, first_name='Test', last_name='Faculty'
        )
        dept, _ = Department.objects.get_or_create(
            name='Computer Science', defaults={'code': 'CS'}
        )
        faculty = Faculty.objects.create(
            user=user, employee_id=f'EMP{username[:5].upper()}',
            department=dept, specialization='Software Engineering'
        )
        return user, faculty

    def create_student_user(self, username='student_test', password='Student@123', semester=1):
        user = User.objects.create_user(
            username=username, email=f'{username}@test.com',
            password=password, first_name='Test', last_name='Student'
        )
        dept, _ = Department.objects.get_or_create(
            name='Computer Science', defaults={'code': 'CS'}
        )
        student = Student.objects.create(
            user=user,
            roll_number=f'ROLL{username[:6].upper()}',
            enrollment_number=f'EN{username[:6].upper()}',
            department=dept,
            semester=semester,
            status='ACTIVE'
        )
        return user, student

    def get_tokens(self, username, password):
        """Login and return JWT tokens"""
        response = self.client.post('/college/api/auth/login/', {
            'username': username, 'password': password
        }, format='json')
        return response.data.get('tokens', {})

    def auth_client(self, username, password):
        """Return authenticated client"""
        tokens = self.get_tokens(username, password)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens.get('access', '')}")
        return client


# ============= AUTHENTICATION TESTS =============
class AuthenticationTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='Engineering', code='ENG')

    def test_register_student(self):
        response = self.client.post('/college/api/auth/register/', {
            'username': 'newstudent',
            'email': 'newstudent@test.com',
            'first_name': 'New',
            'last_name': 'Student',
            'password': 'TestPass@123',
            'password2': 'TestPass@123',
            'role': 'student',
            'department': self.dept.id,
            'roll_number': 'ROLL001',
            'enrollment_number': 'EN001',
            'semester': 1,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['role'], 'student')
        self.assertIn('access', response.data['tokens'])

    def test_register_faculty(self):
        response = self.client.post('/college/api/auth/register/', {
            'username': 'newfaculty',
            'email': 'newfaculty@test.com',
            'first_name': 'New',
            'last_name': 'Faculty',
            'password': 'TestPass@123',
            'password2': 'TestPass@123',
            'role': 'faculty',
            'department': self.dept.id,
            'employee_id': 'EMP001',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'faculty')

    def test_register_password_mismatch(self):
        response = self.client.post('/college/api/auth/register/', {
            'username': 'baduser',
            'email': 'bad@test.com',
            'password': 'Pass@123',
            'password2': 'Different@123',
            'role': 'student',
            'department': self.dept.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        user, _ = self.create_student_user('loginstudent', 'Login@123')
        response = self.client.post('/college/api/auth/login/', {
            'username': 'loginstudent', 'password': 'Login@123'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['tokens'])

    def test_login_wrong_credentials(self):
        response = self.client.post('/college/api/auth/login/', {
            'username': 'nonexistent', 'password': 'wrong'
        }, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data['success'])

    def test_admin_login(self):
        self.create_admin('adminlogin', 'Admin@123')
        response = self.client.post('/college/api/auth/admin-login/', {
            'username': 'adminlogin', 'password': 'Admin@123'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'admin')

    def test_student_cannot_login_as_admin(self):
        user, _ = self.create_student_user('stuadmin', 'Stu@123')
        response = self.client.post('/college/api/auth/admin-login/', {
            'username': 'stuadmin', 'password': 'Stu@123'
        }, format='json')
        self.assertEqual(response.status_code, 403)

    def test_logout(self):
        user, _ = self.create_student_user('logouttest', 'Logout@123')
        tokens = self.get_tokens('logouttest', 'Logout@123')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = client.post('/college/api/auth/logout/', {'refresh': tokens['refresh']}, format='json')
        self.assertEqual(response.status_code, 200)

    def test_get_current_user_authenticated(self):
        user, _ = self.create_student_user('currentuser', 'Current@123')
        client = self.auth_client('currentuser', 'Current@123')
        response = client.get('/college/api/auth/current-user/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['username'], 'currentuser')

    def test_get_current_user_unauthenticated(self):
        response = self.client.get('/college/api/auth/current-user/')
        self.assertEqual(response.status_code, 401)

    def test_change_password(self):
        user, _ = self.create_student_user('changepass', 'OldPass@123')
        client = self.auth_client('changepass', 'OldPass@123')
        response = client.post('/college/api/auth/change-password/', {
            'old_password': 'OldPass@123',
            'new_password': 'NewPass@456',
            'new_password2': 'NewPass@456',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])


# ============= DEPARTMENT CRUD TESTS =============
class DepartmentCRUDTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.admin = self.create_admin('deptadmin', 'Admin@123')
        self.admin_client = self.auth_client('deptadmin', 'Admin@123')

    def test_create_department(self):
        response = self.admin_client.post('/college/api/departments/', {
            'name': 'Mathematics', 'code': 'MATH',
            'head_of_department': 'Dr. Smith'
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Mathematics')

    def test_list_departments(self):
        Department.objects.create(name='Physics', code='PHY')
        response = self.admin_client.get('/college/api/departments/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_update_department(self):
        dept = Department.objects.create(name='Chemistry', code='CHEM')
        response = self.admin_client.put(f'/college/api/departments/{dept.id}/', {
            'name': 'Applied Chemistry', 'code': 'ACHEM',
            'head_of_department': 'Dr. Jones'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Applied Chemistry')

    def test_delete_department(self):
        dept = Department.objects.create(name='History', code='HIST')
        response = self.admin_client.delete(f'/college/api/departments/{dept.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Department.objects.filter(id=dept.id).exists())

    def test_unauthenticated_cannot_access(self):
        response = self.client.get('/college/api/departments/')
        self.assertEqual(response.status_code, 401)


# ============= STUDENT CRUD TESTS =============
class StudentCRUDTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='CS', code='CS')
        self.admin = self.create_admin('studadmin', 'Admin@123')
        self.admin_client = self.auth_client('studadmin', 'Admin@123')
        self.student_user, self.student = self.create_student_user('teststudent', 'Student@123')
        self.student_client = self.auth_client('teststudent', 'Student@123')

    def test_list_students_as_admin(self):
        response = self.admin_client.get('/college/api/students/')
        self.assertEqual(response.status_code, 200)

    def test_student_can_view_own_profile(self):
        response = self.student_client.get('/college/api/students/my_profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['roll_number'], self.student.roll_number)

    def test_add_student_admin_endpoint(self):
        response = self.admin_client.post('/college/api/students/add-student/', {
            'username': 'newstuofficin',
            'email': 'newstuoffic@test.com',
            'first_name': 'New',
            'last_name': 'Official',
            'password': 'NewStu@123',
            'roll_number': 'ROLL999',
            'enrollment_number': 'EN999',
            'department': self.dept.id,
            'semester': 2,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Student.objects.filter(roll_number='ROLL999').exists())

    def test_student_fee_summary(self):
        # Create a payment for the student
        Payment.objects.create(
            student=self.student,
            amount_due=10000,
            amount_paid=0,
            due_date=date.today() + timedelta(days=30),
            status='PENDING',
        )
        response = self.student_client.get('/college/api/students/fee_summary/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['total_due'], 10000.0)
        self.assertEqual(response.data['summary']['pending_count'], 1)


# ============= FACULTY CRUD TESTS =============
class FacultyCRUDTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='ECE', code='ECE')
        self.admin = self.create_admin('facadmin', 'Admin@123')
        self.admin_client = self.auth_client('facadmin', 'Admin@123')
        self.faculty_user, self.faculty = self.create_faculty_user('testfaculty', 'Faculty@123')
        self.faculty_client = self.auth_client('testfaculty', 'Faculty@123')

    def test_list_faculty(self):
        response = self.admin_client.get('/college/api/faculty/')
        self.assertEqual(response.status_code, 200)

    def test_faculty_my_profile(self):
        response = self.faculty_client.get('/college/api/faculty/my_profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['employee_id'], self.faculty.employee_id)


# ============= COURSE CRUD TESTS =============
class CourseCRUDTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='IT', code='IT')
        self.admin = self.create_admin('courseadmin', 'Admin@123')
        self.admin_client = self.auth_client('courseadmin', 'Admin@123')

    def test_create_course(self):
        response = self.admin_client.post('/college/api/courses/', {
            'name': 'Data Structures',
            'code': 'DS101',
            'department': self.dept.id,
            'semester': 2,
            'credits': 4,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Data Structures')

    def test_list_courses(self):
        Course.objects.create(name='Algorithms', code='AL101',
                              department=self.dept, semester=3, credits=3)
        response = self.admin_client.get('/college/api/courses/')
        self.assertEqual(response.status_code, 200)

    def test_update_course(self):
        course = Course.objects.create(name='Networks', code='NET101',
                                       department=self.dept, semester=4, credits=3)
        response = self.admin_client.put(f'/college/api/courses/{course.id}/', {
            'name': 'Computer Networks',
            'code': 'NET101',
            'department': self.dept.id,
            'semester': 4,
            'credits': 4,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['credits'], 4)

    def test_delete_course(self):
        course = Course.objects.create(name='OS', code='OS101',
                                       department=self.dept, semester=5, credits=3)
        response = self.admin_client.delete(f'/college/api/courses/{course.id}/')
        self.assertEqual(response.status_code, 204)


# ============= FEE STRUCTURE CRUD TESTS =============
class FeeStructureCRUDTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='MBA', code='MBA')
        self.admin = self.create_admin('feeadmin', 'Admin@123')
        self.admin_client = self.auth_client('feeadmin', 'Admin@123')
        self.student_user, self.student = self.create_student_user('feestudent', 'Stu@123')
        self.student_client = self.auth_client('feestudent', 'Stu@123')

    def test_admin_create_fee_structure(self):
        response = self.admin_client.post('/college/api/fee-structures/', {
            'department': self.dept.id,
            'semester': 1,
            'tuition_fee': '50000.00',
            'lab_fee': '5000.00',
            'library_fee': '2000.00',
            'activity_fee': '1000.00',
            'other_fee': '500.00',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(float(response.data['total_fee']), 58500.0)

    def test_student_cannot_create_fee_structure(self):
        response = self.student_client.post('/college/api/fee-structures/', {
            'department': self.dept.id,
            'semester': 1,
            'tuition_fee': '50000.00',
        }, format='json')
        self.assertEqual(response.status_code, 403)

    def test_student_can_list_fee_structures(self):
        FeeStructure.objects.create(
            department=self.dept, semester=1,
            tuition_fee=40000, lab_fee=3000,
            library_fee=1000, activity_fee=500, other_fee=0
        )
        response = self.student_client.get('/college/api/fee-structures/')
        self.assertEqual(response.status_code, 200)


# ============= PAYMENT & RAZORPAY TESTS =============
class PaymentTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='Science', code='SCI')
        self.admin = self.create_admin('payadmin', 'Admin@123')
        self.admin_client = self.auth_client('payadmin', 'Admin@123')
        self.student_user, self.student = self.create_student_user('paystudent', 'Pay@123')
        self.student_client = self.auth_client('paystudent', 'Pay@123')
        self.payment = Payment.objects.create(
            student=self.student,
            amount_due=25000,
            amount_paid=0,
            due_date=date.today() + timedelta(days=30),
            status='PENDING',
        )

    def test_student_can_view_own_payments(self):
        response = self.student_client.get('/college/api/payments/my_payments/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(float(response.data[0]['amount_due']), 25000.0)

    def test_admin_can_list_all_payments(self):
        response = self.admin_client.get('/college/api/payments/')
        self.assertEqual(response.status_code, 200)

    @patch('college.views.get_razorpay_client')
    def test_create_razorpay_order(self, mock_client):
        """Test Razorpay order creation (mocked)"""
        mock_razorpay = MagicMock()
        mock_razorpay.order.create.return_value = {
            'id': 'order_test123456',
            'amount': 2500000,
            'currency': 'INR',
        }
        mock_client.return_value = mock_razorpay

        response = self.student_client.post(
            f'/college/api/payments/{self.payment.id}/create_razorpay_order/',
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['order_id'], 'order_test123456')
        self.assertEqual(response.data['amount'], 2500000)

        # Verify order id saved to DB
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.razorpay_order_id, 'order_test123456')
        self.assertEqual(self.payment.status, 'PROCESSING')

    @patch('college.views.get_razorpay_client')
    def test_verify_payment_valid_signature(self, mock_client):
        """Test payment verification with valid HMAC signature"""
        # Set up order
        self.payment.razorpay_order_id = 'order_verifytest'
        self.payment.status = 'PROCESSING'
        self.payment.save()

        order_id = 'order_verifytest'
        payment_id = 'pay_verifytest123'

        # Generate correct signature
        body = f"{order_id}|{payment_id}"
        signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        response = self.student_client.post(
            f'/college/api/payments/{self.payment.id}/verify_payment/',
            {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature,
            },
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'COMPLETED')
        self.assertEqual(float(self.payment.amount_paid), 25000.0)

    def test_verify_payment_invalid_signature(self):
        """Test that tampered signature is rejected"""
        self.payment.razorpay_order_id = 'order_tampered'
        self.payment.status = 'PROCESSING'
        self.payment.save()

        response = self.student_client.post(
            f'/college/api/payments/{self.payment.id}/verify_payment/',
            {
                'razorpay_order_id': 'order_tampered',
                'razorpay_payment_id': 'pay_fakeid',
                'razorpay_signature': 'invalid_signature_here',
            },
            format='json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'FAILED')

    def test_bulk_create_payments(self):
        """Admin can bulk create payments for a semester"""
        dept = Department.objects.create(name='BulkTest', code='BLK')
        fs = FeeStructure.objects.create(
            department=dept, semester=3,
            tuition_fee=30000, lab_fee=2000,
            library_fee=1000, activity_fee=500, other_fee=0
        )
        # Create 2 active students in semester 3
        for i in range(2):
            u = User.objects.create_user(
                username=f'bulkstu{i}', password='Bulk@123',
                email=f'bulkstu{i}@test.com'
            )
            Student.objects.create(
                user=u, roll_number=f'BULK{i:03d}',
                enrollment_number=f'ENBULK{i}',
                department=dept, semester=3, status='ACTIVE'
            )

        response = self.admin_client.post('/college/api/payments/bulk_create/', {
            'semester': 3,
            'department_id': dept.id,
            'due_date': (date.today() + timedelta(days=30)).isoformat(),
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['created'], 2)

    def test_send_notification(self):
        response = self.admin_client.post(
            f'/college/api/payments/{self.payment.id}/send_notification/',
            {'message': 'Test payment reminder'},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Notification.objects.filter(
            student=self.student, title='Fee Payment Reminder'
        ).exists())

    def test_student_cannot_send_notification(self):
        response = self.student_client.post(
            f'/college/api/payments/{self.payment.id}/send_notification/',
            {'message': 'Hack'},
            format='json'
        )
        self.assertEqual(response.status_code, 403)


# ============= PERMISSION TESTS =============
class PermissionTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='PermTest', code='PERM')
        self.student_user, self.student = self.create_student_user('permstu', 'Perm@123')
        self.student_client = self.auth_client('permstu', 'Perm@123')
        self.faculty_user, self.faculty = self.create_faculty_user('permfac', 'Perm@123')
        self.faculty_client = self.auth_client('permfac', 'Perm@123')

    def test_unauthenticated_blocked_from_api(self):
        endpoints = [
            '/college/api/students/',
            '/college/api/faculty/',
            '/college/api/courses/',
            '/college/api/payments/',
        ]
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, 401, f"Expected 401 for {endpoint}")

    def test_faculty_can_view_students(self):
        response = self.faculty_client.get('/college/api/students/')
        self.assertEqual(response.status_code, 200)

    def test_student_can_view_courses(self):
        response = self.student_client.get('/college/api/courses/')
        self.assertEqual(response.status_code, 200)

    def test_student_cannot_create_fee_structure(self):
        response = self.student_client.post('/college/api/fee-structures/', {
            'department': self.dept.id, 'semester': 1, 'tuition_fee': '1000'
        }, format='json')
        self.assertEqual(response.status_code, 403)


# ============= DASHBOARD STATS TESTS =============
class DashboardStatsTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.admin = self.create_admin('statsadmin', 'Admin@123')
        self.admin_client = self.auth_client('statsadmin', 'Admin@123')

    def test_dashboard_stats(self):
        response = self.admin_client.get('/college/api/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        stats = response.data['stats']
        expected_keys = ['total_students', 'total_faculty', 'total_courses',
                         'total_departments', 'pending_payments', 'completed_payments',
                         'total_revenue']
        for key in expected_keys:
            self.assertIn(key, stats)

    def test_unauthenticated_cannot_access_stats(self):
        response = self.client.get('/college/api/stats/')
        self.assertEqual(response.status_code, 401)


# ============= NOTIFICATION TESTS =============
class NotificationTests(BaseTestMixin, APITestCase):

    def setUp(self):
        self.dept = Department.objects.create(name='Notif', code='NTF')
        self.student_user, self.student = self.create_student_user('notifstu', 'Notif@123')
        self.student_client = self.auth_client('notifstu', 'Notif@123')

    def test_student_gets_own_notifications(self):
        Notification.objects.create(
            title='Test Notification',
            message='Test message',
            recipient_type='INDIVIDUAL',
            student=self.student,
        )
        response = self.student_client.get('/college/api/notifications/my_notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_global_notifications_visible_to_all(self):
        Notification.objects.create(
            title='Global Notice',
            message='For everyone',
            recipient_type='GLOBAL',
            is_global=True,
        )
        response = self.student_client.get('/college/api/notifications/my_notifications/')
        self.assertEqual(response.status_code, 200)
        titles = [n['title'] for n in response.data]
        self.assertIn('Global Notice', titles)
