from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from django.shortcuts import render
from django.db import transaction
from django.utils import timezone
import razorpay
import hmac
import hashlib
import uuid
from datetime import date, timedelta
from .models import (
    Department, Faculty, Course, Student, CourseEnrollment,
    Admission, Attendance, Grade, FeeStructure, Payment,
    Book, BookIssue, Hostel, Room, HostelAllocation, HostelFee,
    Assignment, AssignmentSubmission, Timetable, Notification
)
from .serializers import (
    DepartmentSerializer, FacultySerializer, CourseSerializer, StudentSerializer,
    CourseEnrollmentSerializer, AdmissionSerializer, AttendanceSerializer,
    GradeSerializer, FeeStructureSerializer, PaymentSerializer,
    RazorpayOrderSerializer, PaymentVerifySerializer,
    BookSerializer, BookIssueSerializer, HostelSerializer, RoomSerializer,
    HostelAllocationSerializer, HostelFeeSerializer, UserCreateSerializer,
    LoginSerializer, LogoutSerializer, AssignmentSerializer, AssignmentSubmissionSerializer,
    TimetableSerializer, NotificationSerializer
)
from .permissions import IsAdmin, IsFaculty, IsStudent, IsAdminOrFacultyOrStudent


# ============= RAZORPAY CLIENT =============
def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


# ============= HELPER FUNCTIONS =============
def get_user_role(user):
    if user.is_staff and user.is_superuser:
        return 'admin'
    try:
        Faculty.objects.get(user=user)
        return 'faculty'
    except Faculty.DoesNotExist:
        pass
    try:
        Student.objects.get(user=user)
        return 'student'
    except Student.DoesNotExist:
        pass
    return 'user'


def get_user_response_data(user):
    role = get_user_role(user)
    response_data = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}".strip(),
        'role': role,
        'is_active': user.is_active,
    }
    if role == 'faculty':
        try:
            faculty = Faculty.objects.get(user=user)
            response_data.update({
                'faculty_id': faculty.id,
                'employee_id': faculty.employee_id,
                'department': faculty.department.name if faculty.department else None,
                'specialization': faculty.specialization,
            })
        except Faculty.DoesNotExist:
            pass
    elif role == 'student':
        try:
            student = Student.objects.get(user=user)
            response_data.update({
                'student_id': student.id,
                'roll_number': student.roll_number,
                'enrollment_number': student.enrollment_number,
                'department': student.department.name if student.department else None,
                'semester': student.semester,
                'status': student.status,
                'cgpa': float(student.cgpa),
            })
        except Student.DoesNotExist:
            pass
    return response_data


# ============= AUTHENTICATION VIEWS =============
@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    """User registration with JWT tokens and role-specific profile creation"""
    role = request.data.get('role', 'user')
    if role not in ['user', 'student', 'faculty', 'admin']:
        return Response({'success': False, 'message': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        with transaction.atomic():
            user = serializer.save()
            if role == 'admin':
                user.is_staff = True
                user.is_superuser = True
                user.save()
            elif role == 'student':
                department_id = request.data.get('department')
                if not department_id:
                    raise ValueError('Department is required for student registration')
                if str(department_id).isdigit():
                    department = Department.objects.get(id=int(department_id))
                else:
                    department = Department.objects.filter(name__iexact=department_id).first()
                    if not department:
                        department = Department.objects.create(name=department_id, code=department_id[:10].upper())
                Student.objects.create(
                    user=user,
                    department=department,
                    roll_number=request.data.get('roll_number', ''),
                    enrollment_number=request.data.get('enrollment_number', ''),
                    semester=request.data.get('semester', 1),
                    status='ACTIVE'
                )
            elif role == 'faculty':
                department_id = request.data.get('department')
                if not department_id:
                    raise ValueError('Department is required for faculty registration')
                if str(department_id).isdigit():
                    department = Department.objects.get(id=int(department_id))
                else:
                    department = Department.objects.filter(name__iexact=department_id).first()
                    if not department:
                        department = Department.objects.create(name=department_id, code=department_id[:10].upper())
                Faculty.objects.create(
                    user=user,
                    department=department,
                    employee_id=request.data.get('employee_id', ''),
                    specialization=request.data.get('specialization', '')
                )
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': f'{role.title()} registered successfully',
            'user': get_user_response_data(user),
            'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)}
        }, status=status.HTTP_201_CREATED)

    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'success': False, 'message': 'Username and password are required'}, status=400)
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'success': False, 'message': 'Invalid username or password'}, status=401)
    if not user.is_active:
        return Response({'success': False, 'message': 'User account is disabled'}, status=403)
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True,
        'message': f'Login successful as {get_user_role(user)}',
        'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        'user': get_user_response_data(user)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def faculty_login(request):
    username, password = request.data.get('username'), request.data.get('password')
    if not username or not password:
        return Response({'success': False, 'message': 'Credentials required'}, status=400)
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'success': False, 'message': 'Invalid credentials'}, status=401)
    try:
        Faculty.objects.get(user=user)
    except Faculty.DoesNotExist:
        return Response({'success': False, 'message': 'Not a faculty member'}, status=403)
    if not user.is_active:
        return Response({'success': False, 'message': 'Account disabled'}, status=403)
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True, 'message': 'Faculty login successful',
        'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        'user': get_user_response_data(user)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def student_login(request):
    username, password = request.data.get('username'), request.data.get('password')
    if not username or not password:
        return Response({'success': False, 'message': 'Credentials required'}, status=400)
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'success': False, 'message': 'Invalid credentials'}, status=401)
    try:
        Student.objects.get(user=user)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Not a student'}, status=403)
    if not user.is_active:
        return Response({'success': False, 'message': 'Account disabled'}, status=403)
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True, 'message': 'Student login successful',
        'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        'user': get_user_response_data(user)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    username, password = request.data.get('username'), request.data.get('password')
    if not username or not password:
        return Response({'success': False, 'message': 'Credentials required'}, status=400)
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'success': False, 'message': 'Invalid credentials'}, status=401)
    if not user.is_staff:
        return Response({'success': False, 'message': 'Admin privileges required'}, status=403)
    if not user.is_active:
        return Response({'success': False, 'message': 'Account disabled'}, status=403)
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True, 'message': 'Admin login successful',
        'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        'user': get_user_response_data(user)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'success': True, 'message': 'Logout successful'})
    except Exception:
        return Response({'success': False, 'message': 'Logout failed'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    return Response({'success': True, 'user': get_user_response_data(request.user)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    old_pw = request.data.get('old_password')
    new_pw = request.data.get('new_password')
    new_pw2 = request.data.get('new_password2')
    if not all([old_pw, new_pw, new_pw2]):
        return Response({'success': False, 'message': 'All fields required'}, status=400)
    if new_pw != new_pw2:
        return Response({'success': False, 'message': 'New passwords do not match'}, status=400)
    if not request.user.check_password(old_pw):
        return Response({'success': False, 'message': 'Old password is incorrect'}, status=401)
    request.user.set_password(new_pw)
    request.user.save()
    return Response({'success': True, 'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'success': False, 'message': 'Email is required'}, status=400)
    try:
        user = User.objects.get(email=email)
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        return Response({
            'success': True,
            'message': 'Password reset link sent to your email',
            'token': token,
            'uid': uid
        })
    except User.DoesNotExist:
        return Response({'success': True, 'message': 'If an account exists, reset link was sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token')
    password = request.data.get('password')
    email = request.data.get('email')
    if not all([token, password, email]):
        return Response({'success': False, 'message': 'Token, email and password required'}, status=400)
    if len(password) < 8:
        return Response({'success': False, 'message': 'Password must be at least 8 characters'}, status=400)
    try:
        user = User.objects.get(email=email)
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'success': False, 'message': 'Invalid or expired token'}, status=400)
        user.set_password(password)
        user.save()
        return Response({'success': True, 'message': 'Password reset successfully'})
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'Invalid request'}, status=400)


def home(request):
    return render(request, 'home.html')


# ============= DEPARTMENT VIEWSET =============
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['code', 'name']
    search_fields = ['name', 'code', 'head_of_department']
    ordering_fields = ['name', 'code']


# ============= FACULTY VIEWSET =============
class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.select_related('user', 'department').all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'specialization']
    ordering_fields = ['joining_date', 'user__first_name']

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        try:
            faculty = Faculty.objects.get(user=request.user)
            return Response(self.get_serializer(faculty).data)
        except Faculty.DoesNotExist:
            return Response({'detail': 'Faculty profile not found'}, status=404)


# ============= COURSE VIEWSET =============
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('department', 'instructor__user').all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'semester', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'semester', 'department']


# ============= STUDENT VIEWSET =============
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user', 'department').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'semester', 'status', 'is_active']
    search_fields = ['roll_number', 'enrollment_number', 'user__first_name', 'user__last_name']
    ordering_fields = ['roll_number', 'date_of_admission', 'cgpa']

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        try:
            student = Student.objects.get(user=request.user)
            return Response(self.get_serializer(student).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)

    @action(detail=False, methods=['get'])
    def fee_summary(self, request):
        """Get fee summary for current student"""
        try:
            student = Student.objects.get(user=request.user)
            payments = Payment.objects.filter(student=student)
            total_due = sum(p.amount_due for p in payments)
            total_paid = sum(p.amount_paid for p in payments)
            pending_count = payments.filter(status='PENDING').count()
            return Response({
                'success': True,
                'summary': {
                    'total_due': float(total_due),
                    'total_paid': float(total_paid),
                    'balance': float(total_due - total_paid),
                    'pending_count': pending_count,
                }
            })
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)


# ============= COURSE ENROLLMENT VIEWSET =============
class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = CourseEnrollment.objects.select_related('student', 'course').all()
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'status']
    search_fields = ['student__roll_number', 'course__code', 'course__name']

    @action(detail=False, methods=['get'])
    def my_enrollments(self, request):
        try:
            student = Student.objects.get(user=request.user)
            enrollments = CourseEnrollment.objects.filter(student=student)
            return Response(self.get_serializer(enrollments, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)


# ============= ADMISSION VIEWSET =============
class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'eligibility']
    search_fields = ['student__roll_number', 'student__user__first_name']


# ============= ATTENDANCE VIEWSET =============
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student', 'course').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'status', 'date']
    search_fields = ['student__roll_number', 'course__code']
    ordering_fields = ['date', 'status']

    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        try:
            student = Student.objects.get(user=request.user)
            attendance = Attendance.objects.filter(student=student)
            return Response(self.get_serializer(attendance, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)


# ============= GRADE VIEWSET =============
class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related('student', 'course').all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'exam_type']
    search_fields = ['student__roll_number', 'course__code']

    @action(detail=False, methods=['get'])
    def my_grades(self, request):
        try:
            student = Student.objects.get(user=request.user)
            grades = Grade.objects.filter(student=student)
            return Response(self.get_serializer(grades, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)


# ============= FEE STRUCTURE VIEWSET =============
class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('department').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'semester']
    ordering_fields = ['department', 'semester']

    def get_permissions(self):
        """Only admins can create/update/delete fee structures"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


# ============= PAYMENT VIEWSET =============
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('student__user', 'fee_structure').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'status', 'payment_method']
    search_fields = ['student__roll_number', 'transaction_id', 'razorpay_order_id']
    ordering_fields = ['created_at', 'status', 'amount_due']

    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current student's payments"""
        try:
            student = Student.objects.get(user=request.user)
            payments = Payment.objects.filter(student=student).order_by('-created_at')
            return Response(self.get_serializer(payments, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)

    @action(detail=True, methods=['post'])
    def create_razorpay_order(self, request, pk=None):
        """Create a Razorpay order for this payment"""
        payment = self.get_object()

        if payment.status == 'COMPLETED':
            return Response({'success': False, 'message': 'Payment already completed'}, status=400)

        # Verify the student owns this payment (or is admin)
        if not request.user.is_staff:
            try:
                student = Student.objects.get(user=request.user)
                if payment.student != student:
                    return Response({'success': False, 'message': 'Unauthorized'}, status=403)
            except Student.DoesNotExist:
                return Response({'success': False, 'message': 'Student profile not found'}, status=404)

        # Amount in paise (Razorpay requires smallest currency unit)
        balance = payment.amount_due - payment.amount_paid
        amount_paise = int(balance * 100)

        if amount_paise <= 0:
            return Response({'success': False, 'message': 'No balance due'}, status=400)

        try:
            client = get_razorpay_client()
            order_data = {
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': f'pay_{payment.id}_{uuid.uuid4().hex[:8]}',
                'notes': {
                    'payment_id': str(payment.id),
                    'student_roll': payment.student.roll_number,
                    'student_name': payment.student.user.get_full_name(),
                }
            }
            razorpay_order = client.order.create(data=order_data)

            # Save order id
            payment.razorpay_order_id = razorpay_order['id']
            payment.status = 'PROCESSING'
            payment.save()

            return Response({
                'success': True,
                'order_id': razorpay_order['id'],
                'amount': amount_paise,
                'currency': 'INR',
                'key': settings.RAZORPAY_KEY_ID,
                'payment_id': payment.id,
                'student_name': payment.student.user.get_full_name(),
                'remarks': payment.remarks or f'Fee Payment #{payment.id}',
            })
        except Exception as e:
            return Response({'success': False, 'message': f'Failed to create order: {str(e)}'}, status=500)

    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        """Verify Razorpay payment signature and mark payment as completed"""
        payment = self.get_object()
        serializer = PaymentVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=400)

        razorpay_order_id = serializer.validated_data['razorpay_order_id']
        razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
        razorpay_signature = serializer.validated_data['razorpay_signature']

        # Verify signature using HMAC SHA256
        body = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, razorpay_signature):
            payment.status = 'FAILED'
            payment.save()
            return Response({'success': False, 'message': 'Payment verification failed — invalid signature'}, status=400)

        # Mark payment as completed
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.amount_paid = payment.amount_due
            payment.status = 'COMPLETED'
            payment.payment_method = 'RAZORPAY'
            payment.payment_date = date.today()
            payment.transaction_id = razorpay_payment_id
            payment.save()

            # Create notification for student
            Notification.objects.create(
                title='Payment Successful',
                message=f'Your payment of Rs. {payment.amount_due} has been received. Transaction ID: {razorpay_payment_id}',
                is_global=False,
                recipient_type='INDIVIDUAL',
                student=payment.student,
            )

        return Response({
            'success': True,
            'message': 'Payment verified and completed successfully',
            'transaction_id': razorpay_payment_id,
            'amount_paid': float(payment.amount_paid),
            'payment': self.get_serializer(payment).data,
        })

    @action(detail=True, methods=['post'])
    def send_notification(self, request, pk=None):
        """Send payment reminder notification to student"""
        try:
            payment = self.get_object()
            if not request.user.is_staff:
                return Response({'success': False, 'message': 'Admin access required'}, status=403)

            message = request.data.get(
                'message',
                f'Your fee payment of Rs. {payment.amount_due} is overdue. Please pay immediately.'
            )
            Notification.objects.create(
                title='Fee Payment Reminder',
                message=message,
                is_global=False,
                recipient_type='INDIVIDUAL',
                student=payment.student,
            )
            return Response({'success': True, 'message': 'Notification sent successfully'})
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found'}, status=404)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create payment records for all students in a semester"""
        if not request.user.is_staff:
            return Response({'success': False, 'message': 'Admin access required'}, status=403)

        semester = request.data.get('semester')
        department_id = request.data.get('department_id')
        due_date_str = request.data.get('due_date')
        custom_amount = request.data.get('amount')

        if not semester or not due_date_str:
            return Response({'success': False, 'message': 'semester and due_date are required'}, status=400)

        try:
            due_date = date.fromisoformat(due_date_str)
        except ValueError:
            return Response({'success': False, 'message': 'Invalid due_date format (use YYYY-MM-DD)'}, status=400)

        students_qs = Student.objects.filter(semester=semester, is_active=True, status='ACTIVE')
        if department_id:
            students_qs = students_qs.filter(department_id=department_id)

        created, skipped = 0, 0
        with transaction.atomic():
            for student in students_qs:
                # Get fee structure or use custom amount
                fee_structure = FeeStructure.objects.filter(
                    department=student.department, semester=semester
                ).first()

                amount = float(custom_amount) if custom_amount else (
                    float(fee_structure.tuition_fee + fee_structure.lab_fee +
                          fee_structure.library_fee + fee_structure.activity_fee +
                          fee_structure.other_fee) if fee_structure else 0
                )
                if amount <= 0:
                    skipped += 1
                    continue

                # Check if pending payment already exists for same semester
                exists = Payment.objects.filter(
                    student=student,
                    fee_structure=fee_structure,
                    status='PENDING'
                ).exists()
                if exists:
                    skipped += 1
                    continue

                Payment.objects.create(
                    student=student,
                    fee_structure=fee_structure,
                    amount_due=amount,
                    amount_paid=0,
                    due_date=due_date,
                    status='PENDING',
                    payment_method='ONLINE',
                    remarks=f'Semester {semester} fees'
                )
                created += 1

        return Response({
            'success': True,
            'message': f'Created {created} payment records, skipped {skipped}',
            'created': created,
            'skipped': skipped,
        })


# ============= BOOK VIEWSET =============
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'is_active']
    search_fields = ['title', 'author', 'isbn', 'publisher']


# ============= BOOK ISSUE VIEWSET =============
class BookIssueViewSet(viewsets.ModelViewSet):
    queryset = BookIssue.objects.select_related('student', 'book').all()
    serializer_class = BookIssueSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'book', 'status']
    search_fields = ['student__roll_number', 'book__title']

    @action(detail=False, methods=['get'])
    def my_books(self, request):
        try:
            student = Student.objects.get(user=request.user)
            issues = BookIssue.objects.filter(student=student)
            return Response(self.get_serializer(issues, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


# ============= HOSTEL VIEWSETS =============
class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['hostel_type', 'is_active']
    search_fields = ['name', 'location', 'warden_name']


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hostel').all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['hostel', 'is_available']
    search_fields = ['hostel__name', 'room_number']


class HostelAllocationViewSet(viewsets.ModelViewSet):
    queryset = HostelAllocation.objects.select_related('student', 'room').all()
    serializer_class = HostelAllocationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'room', 'status']

    @action(detail=False, methods=['get'])
    def my_allocation(self, request):
        try:
            student = Student.objects.get(user=request.user)
            allocation = HostelAllocation.objects.get(student=student)
            return Response(self.get_serializer(allocation).data)
        except (Student.DoesNotExist, HostelAllocation.DoesNotExist):
            return Response({'detail': 'Not found'}, status=404)


class HostelFeeViewSet(viewsets.ModelViewSet):
    queryset = HostelFee.objects.all()
    serializer_class = HostelFeeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'status', 'month_year']

    @action(detail=False, methods=['get'])
    def my_hostel_fees(self, request):
        try:
            student = Student.objects.get(user=request.user)
            fees = HostelFee.objects.filter(student=student)
            return Response(self.get_serializer(fees, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


# ============= REGISTRATION OPTIONS =============
@api_view(['GET'])
@permission_classes([AllowAny])
def get_registration_options(request):
    return Response({
        'success': True,
        'options': {
            'roles': [
                {'value': 'user', 'label': 'General User'},
                {'value': 'student', 'label': 'Student'},
                {'value': 'faculty', 'label': 'Faculty'},
                {'value': 'admin', 'label': 'Administrator'},
            ],
            'semesters': [{'value': i, 'label': f'Semester {i}'} for i in range(1, 9)],
            'genders': [
                {'value': 'M', 'label': 'Male'},
                {'value': 'F', 'label': 'Female'},
                {'value': 'O', 'label': 'Other'}
            ],
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_departments_list(request):
    departments = Department.objects.all().order_by('name')
    return Response({
        'success': True,
        'departments': [{'id': d.id, 'name': d.name, 'code': d.code} for d in departments]
    })


# ============= ASSIGNMENT VIEWSET =============
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related('course', 'faculty__user').all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['course', 'faculty']
    search_fields = ['title', 'course__code']
    ordering_fields = ['due_date', 'created_at']

    @action(detail=False, methods=['get'])
    def my_course_assignments(self, request):
        """Get assignments for faculty's courses"""
        try:
            faculty = Faculty.objects.get(user=request.user)
            assignments = Assignment.objects.filter(faculty=faculty)
            return Response(self.get_serializer(assignments, many=True).data)
        except Faculty.DoesNotExist:
            return Response({'detail': 'Faculty profile not found'}, status=404)


# ============= ASSIGNMENT SUBMISSION VIEWSET =============
class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.select_related('assignment', 'student', 'reviewed_by').all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['assignment', 'student', 'status']
    search_fields = ['student__roll_number', 'assignment__title']

    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        try:
            student = Student.objects.get(user=request.user)
            subs = AssignmentSubmission.objects.filter(student=student)
            return Response(self.get_serializer(subs, many=True).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

    @action(detail=False, methods=['get'])
    def course_submissions(self, request):
        """All submissions for faculty's courses"""
        try:
            faculty = Faculty.objects.get(user=request.user)
            subs = AssignmentSubmission.objects.filter(assignment__faculty=faculty)
            return Response(self.get_serializer(subs, many=True).data)
        except Faculty.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

    @action(detail=True, methods=['post'])
    def approve_submission(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'APPROVED'
        sub.feedback = request.data.get('feedback', '')
        sub.marks_obtained = request.data.get('marks_obtained')
        sub.reviewed_date = timezone.now()
        try:
            sub.reviewed_by = Faculty.objects.get(user=request.user)
        except Faculty.DoesNotExist:
            pass
        sub.save()
        return Response({'success': True, 'message': 'Submission approved'})

    @action(detail=True, methods=['post'])
    def reject_submission(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'REJECTED'
        sub.feedback = request.data.get('feedback', '')
        sub.reviewed_date = timezone.now()
        try:
            sub.reviewed_by = Faculty.objects.get(user=request.user)
        except Faculty.DoesNotExist:
            pass
        sub.save()
        return Response({'success': True, 'message': 'Submission rejected'})


# ============= TIMETABLE VIEWSET =============
class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.select_related('course').all()
    serializer_class = TimetableSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['course', 'day_of_week', 'is_active']
    search_fields = ['course__name', 'course__code', 'classroom']


# ============= NOTIFICATION VIEWSET =============
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_global', 'recipient_type', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at']

    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        """Get notifications for current student"""
        try:
            student = Student.objects.get(user=request.user)
            notifications = Notification.objects.filter(
                recipient_type='INDIVIDUAL', student=student
            ) | Notification.objects.filter(
                recipient_type='ALL'
            ) | Notification.objects.filter(
                recipient_type='GLOBAL'
            ) | Notification.objects.filter(
                recipient_type='SEMESTER', semester=student.semester
            ) | Notification.objects.filter(
                recipient_type='DEPARTMENT', department=student.department
            )
            notifications = notifications.distinct().order_by('-created_at')
            return Response(self.get_serializer(notifications, many=True).data)
        except Student.DoesNotExist:
            # Return global notifs for non-students
            notifications = Notification.objects.filter(is_global=True).order_by('-created_at')
            return Response(self.get_serializer(notifications, many=True).data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'success': True})


# ============= DASHBOARD STATS =============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    return Response({
        'success': True,
        'stats': {
            'total_students': Student.objects.filter(is_active=True).count(),
            'total_faculty': Faculty.objects.filter(is_active=True).count(),
            'total_courses': Course.objects.filter(is_active=True).count(),
            'total_departments': Department.objects.count(),
            'pending_payments': Payment.objects.filter(status='PENDING').count(),
            'completed_payments': Payment.objects.filter(status='COMPLETED').count(),
            'total_revenue': float(sum(
                p.amount_paid for p in Payment.objects.filter(status='COMPLETED')
            )),
        }
    })


# ============= ADMIN: ADD STUDENT =============
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_student_admin(request):
    if not request.user.is_staff:
        return Response({'success': False, 'message': 'Admin access required'}, status=403)

    data = request.data
    required = ['username', 'email', 'first_name', 'last_name', 'password', 'roll_number',
                'enrollment_number', 'department', 'semester']
    for field in required:
        if not data.get(field):
            return Response({'success': False, 'message': f'{field} is required'}, status=400)

    if User.objects.filter(username=data['username']).exists():
        return Response({'success': False, 'message': 'Username already taken'}, status=400)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=data['username'], email=data['email'],
                first_name=data['first_name'], last_name=data['last_name'],
                password=data['password']
            )
            department_id = data.get('department')
            if str(department_id).isdigit():
                department = Department.objects.get(id=int(department_id))
            else:
                department = Department.objects.filter(name__iexact=department_id).first()
                if not department:
                    department = Department.objects.create(name=department_id, code=department_id[:10].upper())

            Student.objects.create(
                user=user,
                roll_number=data['roll_number'],
                enrollment_number=data['enrollment_number'],
                department=department,
                semester=data['semester'],
                phone=data.get('phone', ''),
                gender=data.get('gender', ''),
                father_name=data.get('father_name', ''),
                mother_name=data.get('mother_name', ''),
                status='ACTIVE',
            )
        return Response({'success': True, 'message': 'Student added successfully'}, status=201)
    except Department.DoesNotExist:
        return Response({'success': False, 'message': 'Invalid department'}, status=400)
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=400)


# ============= ATTENDANCE BY SEMESTER =============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_by_semester(request):
    semester = request.query_params.get('semester')
    if not semester:
        return Response({'success': False, 'message': 'semester parameter required'}, status=400)
    attendance = Attendance.objects.filter(course__semester=semester).select_related('student', 'course')
    serializer = AttendanceSerializer(attendance, many=True)
    return Response({'success': True, 'attendance': serializer.data})
