from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.shortcuts import render
from django.http import HttpResponse
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
    BookSerializer, BookIssueSerializer, HostelSerializer, RoomSerializer,
    HostelAllocationSerializer, HostelFeeSerializer, UserCreateSerializer,
    LoginSerializer, LogoutSerializer, AssignmentSerializer, AssignmentSubmissionSerializer,
    TimetableSerializer, NotificationSerializer
)
from .permissions import IsAdmin, IsFaculty, IsStudent, IsAdminOrFacultyOrStudent


# ============= HELPER FUNCTION =============
def get_user_role(user):
    """
    Determine user role based on profiles
    Returns: 'admin', 'faculty', 'student', or 'user'
    """
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
    """
    Get comprehensive user response data including role and profile info
    """
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
    
    # Add role-specific data
    if role == 'faculty':
        try:
            faculty = Faculty.objects.get(user=user)
            response_data['faculty_id'] = faculty.id
            response_data['employee_id'] = faculty.employee_id
            response_data['department'] = faculty.department.name if faculty.department else None
            response_data['specialization'] = faculty.specialization
        except Faculty.DoesNotExist:
            pass
    
    elif role == 'student':
        try:
            student = Student.objects.get(user=user)
            response_data['student_id'] = student.id
            response_data['roll_number'] = student.roll_number
            response_data['enrollment_number'] = student.enrollment_number
            response_data['department'] = student.department.name if student.department else None
            response_data['semester'] = student.semester
            response_data['status'] = student.status
            response_data['cgpa'] = float(student.cgpa)
        except Student.DoesNotExist:
            pass
    
    return response_data


# ============= AUTHENTICATION VIEWS =============
@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    """User registration endpoint with JWT tokens and role-specific profile creation"""
    if request.method == 'POST':
        role = request.data.get('role', 'user')
        
        # Validate role
        if role not in ['user', 'student', 'faculty', 'admin']:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid role. Must be: user, student, faculty, or admin'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Set admin privileges
            if role == 'admin':
                user.is_staff = True
                user.is_superuser = True
                user.save()
            
            # Create role-specific profile
            elif role == 'student':
                # Get required student fields
                department_id = request.data.get('department')
                if not department_id:
                    user.delete()  # Clean up user if profile creation fails
                    return Response(
                        {
                            'success': False,
                            'message': 'Department is required for student registration'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    if str(department_id).isdigit():
                        department = Department.objects.get(id=int(department_id))
                    else:
                        department = Department.objects.filter(name__iexact=department_id).first()
                        if not department:
                            department = Department.objects.create(
                                name=department_id,
                                code=department_id[:10].upper()
                            )
                            
                    Student.objects.create(
                        user=user,
                        department=department,
                        roll_number=request.data.get('roll_number', ''),
                        enrollment_number=request.data.get('enrollment_number', ''),
                        semester=request.data.get('semester', 1),
                        status='ACTIVE'
                    )
                except Department.DoesNotExist:
                    user.delete()
                    return Response(
                        {
                            'success': False,
                            'message': 'Invalid department selected'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    user.delete()
                    return Response(
                        {
                            'success': False,
                            'message': f'Failed to create student profile: {str(e)}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            elif role == 'faculty':
                # Get required faculty fields
                department_id = request.data.get('department')
                if not department_id:
                    user.delete()
                    return Response(
                        {
                            'success': False,
                            'message': 'Department is required for faculty registration'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    if str(department_id).isdigit():
                        department = Department.objects.get(id=int(department_id))
                    else:
                        department = Department.objects.filter(name__iexact=department_id).first()
                        if not department:
                            department = Department.objects.create(
                                name=department_id,
                                code=department_id[:10].upper()
                            )
                            
                    Faculty.objects.create(
                        user=user,
                        department=department,
                        employee_id=request.data.get('employee_id', ''),
                        specialization=request.data.get('specialization', '')
                    )
                except Department.DoesNotExist:
                    user.delete()
                    return Response(
                        {
                            'success': False,
                            'message': 'Invalid department selected'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    user.delete()
                    return Response(
                        {
                            'success': False,
                            'message': f'Failed to create faculty profile: {str(e)}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    'success': True,
                    'message': f'{role.title()} registered successfully',
                    'user': get_user_response_data(user),
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint for all users (Admin, Faculty, Students)
    Returns user role and profile information
    """
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {
                    'success': False,
                    'message': 'Username and password are required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid username or password'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {
                    'success': False,
                    'message': 'User account is disabled'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                'success': True,
                'message': f'Login successful as {get_user_role(user)}',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': get_user_response_data(user)
            },
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def faculty_login(request):
    """
    Login endpoint specifically for faculty members
    """
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {
                    'success': False,
                    'message': 'Username and password are required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid credentials'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if user is faculty
        try:
            faculty = Faculty.objects.get(user=user)
        except Faculty.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'User is not registered as faculty'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {
                    'success': False,
                    'message': 'User account is disabled'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'success': True,
                'message': 'Faculty login successful',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': get_user_response_data(user)
            },
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def student_login(request):
    """
    Login endpoint specifically for students
    """
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {
                    'success': False,
                    'message': 'Username and password are required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid credentials'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if user is student
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'User is not registered as student'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {
                    'success': False,
                    'message': 'User account is disabled'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'success': True,
                'message': 'Student login successful',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': get_user_response_data(user)
            },
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Login endpoint specifically for admin/staff members
    """
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {
                    'success': False,
                    'message': 'Username and password are required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid credentials'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if user is admin/staff
        if not user.is_staff:
            return Response(
                {
                    'success': False,
                    'message': 'User does not have admin privileges'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {
                    'success': False,
                    'message': 'User account is disabled'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'success': True,
                'message': 'Admin login successful',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': get_user_response_data(user)
            },
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint for all authenticated users.
    JWT tokens are stateless, so logout is handled by client removing the token.
    With token blacklist enabled in settings, expired tokens are automatically managed.
    """
    try:
        # Extract refresh token from request
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response(
            {
                'success': True,
                'message': 'Logout successful'
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'Logout failed or token already invalid'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user profile
    """
    return Response(
        {
            'success': True,
            'user': get_user_response_data(request.user)
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change password for authenticated user
    """
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    new_password2 = request.data.get('new_password2')

    if not old_password or not new_password or not new_password2:
        return Response(
            {
                'success': False,
                'message': 'All fields are required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_password != new_password2:
        return Response(
            {
                'success': False,
                'message': 'New passwords do not match'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not request.user.check_password(old_password):
        return Response(
            {
                'success': False,
                'message': 'Old password is incorrect'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    request.user.set_password(new_password)
    request.user.save()

    return Response(
        {
            'success': True,
            'message': 'Password changed successfully'
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Forgot password endpoint. Sends a password reset link to the user's email.
    """
    email = request.data.get('email')
    
    if not email:
        return Response(
            {
                'success': False,
                'message': 'Email is required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists in the system for security
        return Response(
            {
                'success': True,
                'message': 'If an account with this email exists, a password reset link has been sent.'
            },
            status=status.HTTP_200_OK
        )
    
    # Generate password reset token
    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # In production, send email with reset link
    # For now, we'll return the token and uid for demonstration
    # Email should be sent like: 
    # reset_link = f"http://yourfrontend.com/reset-password/{token}?uid={uid}"
    
    return Response(
        {
            'success': True,
            'message': 'Password reset link sent to your email',
            'token': token,  # You can remove this in production
            'uid': uid  # You can remove this in production
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password endpoint. Validates the token and updates the password.
    """
    token = request.data.get('token')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if not token or not password or not email:
        return Response(
            {
                'success': False,
                'message': 'Token, email, and password are required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(password) < 8:
        return Response(
            {
                'success': False,
                'message': 'Password must be at least 8 characters long'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get user by email
        user = User.objects.get(email=email)
        
        # Validate token
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {
                    'success': False,
                    'message': 'Invalid or expired reset token'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update password
        user.set_password(password)
        user.save()
        
        return Response(
            {
                'success': True,
                'message': 'Password reset successfully. You can now login with your new password.'
            },
            status=status.HTTP_200_OK
        )
    
    except User.DoesNotExist:
        # Don't reveal if email exists in the system
        return Response(
            {
                'success': False,
                'message': 'Invalid or expired reset token'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': f'Failed to reset password: {str(e)}'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


# ============= WEB VIEW =============
def home(request):
    """Home page view"""
    return render(request, 'home.html')


# ============= DEPARTMENT VIEWSET =============
class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Department model"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['code', 'name']
    search_fields = ['name', 'code', 'head_of_department']
    ordering_fields = ['name', 'code']


# ============= FACULTY VIEWSET =============
class FacultyViewSet(viewsets.ModelViewSet):
    """ViewSet for Faculty model"""
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'specialization']
    ordering_fields = ['joining_date', 'user__first_name']

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current faculty's profile"""
        try:
            faculty = Faculty.objects.get(user=request.user)
            serializer = self.get_serializer(faculty)
            return Response(serializer.data)
        except Faculty.DoesNotExist:
            return Response({'detail': 'Faculty profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= COURSE VIEWSET =============
class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for Course model"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'semester', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'semester', 'department']


# ============= STUDENT VIEWSET =============
class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student model"""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'semester', 'status', 'is_active']
    search_fields = ['roll_number', 'enrollment_number', 'user__first_name', 'user__last_name']
    ordering_fields = ['roll_number', 'date_of_admission', 'cgpa']

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current student's profile"""
        try:
            student = Student.objects.get(user=request.user)
            serializer = self.get_serializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= COURSE ENROLLMENT VIEWSET =============
class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for CourseEnrollment model"""
    queryset = CourseEnrollment.objects.all()
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'status']
    search_fields = ['student__roll_number', 'course__code', 'course__name']
    ordering_fields = ['enrollment_date', 'status']

    @action(detail=False, methods=['get'])
    def my_enrollments(self, request):
        """Get current student's course enrollments"""
        try:
            student = Student.objects.get(user=request.user)
            enrollments = CourseEnrollment.objects.filter(student=student)
            serializer = self.get_serializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= ADMISSION VIEWSET =============
class AdmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Admission model"""
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'eligibility']
    search_fields = ['student__roll_number', 'student__user__first_name', 'student__user__last_name']
    ordering_fields = ['application_date', 'entrance_score', 'status']


# ============= ATTENDANCE VIEWSET =============
class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance model"""
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'status', 'date']
    search_fields = ['student__roll_number', 'course__code']
    ordering_fields = ['date', 'status']

    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        """Get current student's attendance"""
        try:
            student = Student.objects.get(user=request.user)
            attendance = Attendance.objects.filter(student=student)
            serializer = self.get_serializer(attendance, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= GRADE VIEWSET =============
class GradeViewSet(viewsets.ModelViewSet):
    """ViewSet for Grade model"""
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'course', 'exam_type']
    search_fields = ['student__roll_number', 'course__code']
    ordering_fields = ['exam_date', 'marks_obtained', 'percentage']

    @action(detail=False, methods=['get'])
    def my_grades(self, request):
        """Get current student's grades"""
        try:
            student = Student.objects.get(user=request.user)
            grades = Grade.objects.filter(student=student)
            serializer = self.get_serializer(grades, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= FEE STRUCTURE VIEWSET =============
class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeStructure model"""
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'semester']
    ordering_fields = ['department', 'semester']


# ============= PAYMENT VIEWSET =============
class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment model"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'status', 'payment_method', 'payment_date']
    search_fields = ['student__roll_number', 'transaction_id']
    ordering_fields = ['payment_date', 'status', 'amount_paid']

    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current student's payments"""
        try:
            student = Student.objects.get(user=request.user)
            payments = Payment.objects.filter(student=student)
            serializer = self.get_serializer(payments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def send_notification(self, request, pk=None):
        """Send payment notification to student"""
        try:
            payment = self.get_object()
            message = request.data.get('message', f'Your fee payment of Rs. {payment.amount_paid} is overdue. Please pay immediately.')
            
            # Create notification
            notification = Notification.objects.create(
                title='Payment Reminder',
                message=message,
                is_global=False,
                recipient_type='INDIVIDUAL'
            )
            
            # Link to student if available
            if hasattr(payment, 'student') and payment.student:
                # Create student notification entry if needed
                pass
            
            return Response(
                {'success': True, 'message': 'Notification sent successfully'},
                status=status.HTTP_200_OK
            )
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= BOOK VIEWSET =============
class BookViewSet(viewsets.ModelViewSet):
    """ViewSet for Book model"""
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'is_active']
    search_fields = ['title', 'author', 'isbn', 'publisher']
    ordering_fields = ['title', 'author', 'publication_year']


# ============= BOOK ISSUE VIEWSET =============
class BookIssueViewSet(viewsets.ModelViewSet):
    """ViewSet for BookIssue model"""
    queryset = BookIssue.objects.all()
    serializer_class = BookIssueSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'book', 'status']
    search_fields = ['student__roll_number', 'book__title']
    ordering_fields = ['issue_date', 'due_date', 'status']

    @action(detail=False, methods=['get'])
    def my_books(self, request):
        """Get current student's issued books"""
        try:
            student = Student.objects.get(user=request.user)
            issues = BookIssue.objects.filter(student=student)
            serializer = self.get_serializer(issues, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= HOSTEL VIEWSET =============
class HostelViewSet(viewsets.ModelViewSet):
    """ViewSet for Hostel model"""
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['hostel_type', 'is_active']
    search_fields = ['name', 'location', 'warden_name']
    ordering_fields = ['name', 'capacity']


# ============= ROOM VIEWSET =============
class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for Room model"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['hostel', 'is_available']
    search_fields = ['hostel__name', 'room_number']
    ordering_fields = ['hostel', 'floor', 'room_number']


# ============= HOSTEL ALLOCATION VIEWSET =============
class HostelAllocationViewSet(viewsets.ModelViewSet):
    """ViewSet for HostelAllocation model"""
    queryset = HostelAllocation.objects.all()
    serializer_class = HostelAllocationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'room', 'status']
    search_fields = ['student__roll_number']
    ordering_fields = ['allocation_date', 'status']

    @action(detail=False, methods=['get'])
    def my_allocation(self, request):
        """Get current student's hostel allocation"""
        try:
            student = Student.objects.get(user=request.user)
            allocation = HostelAllocation.objects.get(student=student)
            serializer = self.get_serializer(allocation)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except HostelAllocation.DoesNotExist:
            return Response({'detail': 'Hostel allocation not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= HOSTEL FEE VIEWSET =============
class HostelFeeViewSet(viewsets.ModelViewSet):
    """ViewSet for HostelFee model"""
    queryset = HostelFee.objects.all()
    serializer_class = HostelFeeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['student', 'status', 'month_year']
    search_fields = ['student__roll_number']
    ordering_fields = ['month_year', 'status']

    @action(detail=False, methods=['get'])
    def my_hostel_fees(self, request):
        """Get current student's hostel fees"""
        try:
            student = Student.objects.get(user=request.user)
            fees = HostelFee.objects.filter(student=student)
            serializer = self.get_serializer(fees, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= REGISTRATION OPTIONS ENDPOINTS =============

@api_view(['GET'])
@permission_classes([AllowAny])
def get_registration_options(request):
    """
    Get dynamic options for registration form
    Returns available roles, semesters, and other configurable options
    """
    options = {
        'roles': [
            {'value': 'user', 'label': 'General User', 'description': 'Basic user account'},
            {'value': 'student', 'label': 'Student', 'description': 'Student account with academic features'},
            {'value': 'faculty', 'label': 'Faculty', 'description': 'Faculty account with teaching features'},
            {'value': 'admin', 'label': 'Administrator', 'description': 'Admin account with full system access'}
        ],
        'semesters': [
            {'value': 1, 'label': 'Semester 1'},
            {'value': 2, 'label': 'Semester 2'},
            {'value': 3, 'label': 'Semester 3'},
            {'value': 4, 'label': 'Semester 4'},
            {'value': 5, 'label': 'Semester 5'},
            {'value': 6, 'label': 'Semester 6'},
            {'value': 7, 'label': 'Semester 7'},
            {'value': 8, 'label': 'Semester 8'}
        ],
        'genders': [
            {'value': 'M', 'label': 'Male'},
            {'value': 'F', 'label': 'Female'},
            {'value': 'O', 'label': 'Other'}
        ],
        'student_statuses': [
            {'value': 'ACTIVE', 'label': 'Active'},
            {'value': 'INACTIVE', 'label': 'Inactive'},
            {'value': 'GRADUATED', 'label': 'Graduated'},
            {'value': 'SUSPENDED', 'label': 'Suspended'}
        ]
    }

    return Response({
        'success': True,
        'options': options
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_departments_list(request):
    """
    Get list of departments for registration dropdown
    """
    departments = Department.objects.all().order_by('name')
    data = [
        {'id': dept.id, 'name': dept.name, 'code': dept.code}
        for dept in departments
    ]

    return Response({
        'success': True,
        'departments': data
    }, status=status.HTTP_200_OK)


# ============= ASSIGNMENT VIEWSET =============
class AssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Assignment model"""
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['course', 'faculty']
    search_fields = ['title', 'course__code']
    ordering_fields = ['due_date', 'created_at']

    @action(detail=False, methods=['get'])
    def my_course_assignments(self, request):
        role = get_user_role(request.user)
        if role == 'student':
            try:
                student = Student.objects.get(user=request.user)
                enrollments = CourseEnrollment.objects.filter(student=student).values_list('course_id', flat=True)
                assignments = Assignment.objects.filter(course_id__in=enrollments)
                serializer = self.get_serializer(assignments, many=True)
                return Response(serializer.data)
            except Student.DoesNotExist:
                return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        elif role == 'faculty':
            try:
                faculty = Faculty.objects.get(user=request.user)
                assignments = Assignment.objects.filter(faculty=faculty)
                serializer = self.get_serializer(assignments, many=True)
                return Response(serializer.data)
            except Faculty.DoesNotExist:
                return Response({'detail': 'Faculty not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)


# ============= ASSIGNMENT SUBMISSION VIEWSET =============
class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for AssignmentSubmission model"""
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['assignment', 'student', 'status']
    search_fields = ['student__roll_number', 'assignment__title']
    ordering_fields = ['submission_date', 'status']

    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        """Get current student's submissions"""
        try:
            student = Student.objects.get(user=request.user)
            submissions = AssignmentSubmission.objects.filter(student=student)
            serializer = self.get_serializer(submissions, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def course_submissions(self, request):
        """Get all submissions for faculty's assignments"""
        role = get_user_role(request.user)
        if role == 'faculty':
            try:
                faculty = Faculty.objects.get(user=request.user)
                assignments = Assignment.objects.filter(faculty=faculty)
                submissions = AssignmentSubmission.objects.filter(assignment__in=assignments)
                serializer = self.get_serializer(submissions, many=True)
                return Response(serializer.data)
            except Faculty.DoesNotExist:
                return Response({'detail': 'Faculty not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def approve_submission(self, request, pk=None):
        """Approve an assignment submission with marks"""
        from django.utils.timezone import now
        
        submission = self.get_object()
        role = get_user_role(request.user)
        
        if role != 'faculty':
            return Response({'detail': 'Only faculty can approve submissions'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            faculty = Faculty.objects.get(user=request.user)
            marks = request.data.get('marks_obtained')
            feedback = request.data.get('feedback', '')
            
            if marks is None:
                return Response({'error': 'marks_obtained is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            submission.status = 'APPROVED'
            submission.marks_obtained = marks
            submission.feedback = feedback
            submission.reviewed_by = faculty
            submission.reviewed_date = now()
            submission.save()
            
            serializer = self.get_serializer(submission)
            return Response(serializer.data)
        except Faculty.DoesNotExist:
            return Response({'detail': 'Faculty profile not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def reject_submission(self, request, pk=None):
        """Reject an assignment submission with feedback"""
        from django.utils.timezone import now
        
        submission = self.get_object()
        role = get_user_role(request.user)
        
        if role != 'faculty':
            return Response({'detail': 'Only faculty can reject submissions'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            faculty = Faculty.objects.get(user=request.user)
            feedback = request.data.get('feedback', 'Please resubmit with corrections.')
            
            submission.status = 'REJECTED'
            submission.feedback = feedback
            submission.reviewed_by = faculty
            submission.reviewed_date = now()
            submission.save()
            
            serializer = self.get_serializer(submission)
            return Response(serializer.data)
        except Faculty.DoesNotExist:
            return Response({'detail': 'Faculty profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ============= NOTIFICATION VIEWSET =============
class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notification model"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['course', 'faculty', 'is_global']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at']
    
    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        role = get_user_role(request.user)
        if role == 'student':
            try:
                student = Student.objects.get(user=request.user)
                # Get notifications for courses, global, individual, semester-based, or department-based
                enrollments = CourseEnrollment.objects.filter(student=student).values_list('course_id', flat=True)
                notifications = (
                    Notification.objects.filter(course_id__in=enrollments) |
                    Notification.objects.filter(is_global=True) |
                    Notification.objects.filter(recipient_type='ALL') |
                    Notification.objects.filter(recipient_type='INDIVIDUAL', student=student) |
                    Notification.objects.filter(recipient_type='SEMESTER', semester=student.semester) |
                    Notification.objects.filter(recipient_type='DEPARTMENT', department=student.department)
                )
                serializer = self.get_serializer(notifications.distinct(), many=True)
                return Response(serializer.data)
            except Student.DoesNotExist:
                return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        elif role == 'faculty':
            try:
                faculty = Faculty.objects.get(user=request.user)
                notifications = Notification.objects.filter(faculty=faculty) | Notification.objects.filter(is_global=True) | Notification.objects.filter(recipient_type='ALL')
                serializer = self.get_serializer(notifications.distinct(), many=True)
                return Response(serializer.data)
            except Faculty.DoesNotExist:
                return Response({'detail': 'Faculty not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(Notification.objects.filter(is_global=True), many=True).data)


# ============= DASHBOARD STATS ENDPOINT =============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    """
    Get dashboard statistics: total students, faculty, courses, and departments
    """
    try:
        stats_data = {
            'students': Student.objects.count(),
            'faculty': Faculty.objects.count(),
            'courses': Course.objects.filter(is_active=True).count(),
            'departments': Department.objects.count(),
        }
        
        return Response(
            {
                'success': True,
                'data': stats_data
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': f'Error fetching dashboard stats: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============= TIMETABLE VIEWSET =============
class TimetableViewSet(viewsets.ModelViewSet):
    """ViewSet for Timetable model"""
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['course', 'day_of_week', 'is_active']
    search_fields = ['course__code', 'course__name', 'classroom']
    ordering_fields = ['day_of_week', 'start_time', 'course__name']


# ============= ADMIN STUDENT ADD ENDPOINT =============
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_student_admin(request):
    """
    Admin endpoint to add students directly without going through registration
    """
    if not request.user.is_staff:
        return Response(
            {
                'success': False,
                'message': 'Only admin users can add students'
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Create user
        user_data = {
            'username': request.data.get('username'),
            'email': request.data.get('email'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'password': request.data.get('password'),
            'password2': request.data.get('password'),
        }
        
        user_serializer = UserCreateSerializer(data=user_data)
        if not user_serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'errors': user_serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = user_serializer.save()
        
        # Create student profile
        department_id = request.data.get('department')
        if not department_id:
            user.delete()
            return Response(
                {
                    'success': False,
                    'message': 'Department is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            department = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            user.delete()
            return Response(
                {
                    'success': False,
                    'message': 'Invalid department'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        student = Student.objects.create(
            user=user,
            department=department,
            roll_number=request.data.get('roll_number'),
            enrollment_number=request.data.get('enrollment_number'),
            semester=request.data.get('semester', 1),
            status='ACTIVE'
        )
        
        student_serializer = StudentSerializer(student)
        return Response(
            {
                'success': True,
                'message': 'Student added successfully',
                'data': student_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': f'Error adding student: {str(e)}'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


# ============= ATTENDANCE BY SEMESTER ENDPOINT =============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_by_semester(request):
    """
    Get attendance records filtered by semester
    Admin can see all students' attendance for a semester
    Faculty can see their course students' attendance
    Students can see their own attendance
    """
    try:
        semester = request.query_params.get('semester')
        if not semester:
            return Response(
                {
                    'success': False,
                    'message': 'Semester parameter is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            semester = int(semester)
            if semester < 1 or semester > 8:
                raise ValueError("Invalid semester")
        except ValueError:
            return Response(
                {
                    'success': False,
                    'message': 'Semester must be between 1 and 8'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get attendance data based on user role
        role = get_user_role(request.user)
        
        if role == 'admin':
            # Admin can see all attendance for the semester
            students = Student.objects.filter(semester=semester)
            attendance_records = Attendance.objects.filter(
                student__semester=semester
            ).select_related('student', 'course')
        
        elif role == 'faculty':
            # Faculty can see attendance for their courses
            try:
                faculty = Faculty.objects.get(user=request.user)
                courses = Course.objects.filter(instructor=faculty, semester=semester)
                attendance_records = Attendance.objects.filter(
                    course__in=courses
                ).select_related('student', 'course')
            except Faculty.DoesNotExist:
                return Response(
                    {
                        'success': False,
                        'message': 'Faculty profile not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        
        else:  # student
            # Students can only see their own attendance
            try:
                student = Student.objects.get(user=request.user)
                if student.semester != semester:
                    return Response(
                        {
                            'success': False,
                            'message': 'You can only view your own semester attendance'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                attendance_records = Attendance.objects.filter(
                    student=student
                ).select_related('student', 'course')
            except Student.DoesNotExist:
                return Response(
                    {
                        'success': False,
                        'message': 'Student profile not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = AttendanceSerializer(attendance_records, many=True)
        return Response(
            {
                'success': True,
                'semester': semester,
                'count': attendance_records.count(),
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': f'Error fetching attendance: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
