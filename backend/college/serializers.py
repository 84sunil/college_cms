from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Department, Faculty, Course, Student, CourseEnrollment,
    Admission, Attendance, Grade, FeeStructure, Payment,
    Book, BookIssue, Hostel, Room, HostelAllocation, HostelFee,
    Assignment, AssignmentSubmission, Timetable, Notification
)


# ============= USER SERIALIZER =============
class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active']
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    class Meta:
        fields = ['username', 'password']


class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout"""
    pass


# ============= DEPARTMENT SERIALIZER =============
class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    student_count = serializers.SerializerMethodField()
    faculty_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'head_of_department', 'description',
                  'student_count', 'faculty_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_count(self, obj):
        return obj.students.filter(is_active=True).count()

    def get_faculty_count(self, obj):
        return obj.faculty_members.filter(is_active=True).count()


# ============= FACULTY SERIALIZER =============
class FacultySerializer(serializers.ModelSerializer):
    """Serializer for Faculty model"""
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Faculty
        fields = [
            'id', 'user', 'employee_id', 'department', 'department_name',
            'specialization', 'phone', 'gender', 'date_of_birth', 'address',
            'qualification', 'joining_date', 'profile_picture', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= COURSE SERIALIZER =============
class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    instructor_name = serializers.CharField(source='instructor.user.get_full_name', read_only=True)
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'department', 'department_name', 'semester',
            'credits', 'instructor', 'instructor_name', 'description', 'max_students',
            'enrolled_count', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status='ENROLLED').count()


# ============= STUDENT SERIALIZER =============
class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model"""
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'roll_number', 'enrollment_number', 'department', 'department_name',
            'semester', 'date_of_birth', 'gender', 'phone', 'address', 'father_name',
            'mother_name', 'date_of_admission', 'profile_picture', 'status', 'cgpa', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= COURSE ENROLLMENT SERIALIZER =============
class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for CourseEnrollment model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = [
            'id', 'student', 'student_name', 'course', 'course_code', 'course_name',
            'enrollment_date', 'status', 'grade', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'enrollment_date']


# ============= ADMISSION SERIALIZER =============
class AdmissionSerializer(serializers.ModelSerializer):
    """Serializer for Admission model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)

    class Meta:
        model = Admission
        fields = [
            'id', 'student', 'student_name', 'student_roll', 'application_date',
            'entrance_score', 'eligibility', 'status', 'admission_date', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'application_date']


# ============= ATTENDANCE SERIALIZER =============
class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'course', 'course_code', 'course_name',
            'date', 'status', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= GRADE SERIALIZER =============
class GradeSerializer(serializers.ModelSerializer):
    """Serializer for Grade model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'course', 'course_code', 'course_name',
            'exam_type', 'marks_obtained', 'total_marks', 'percentage', 'grade',
            'exam_date', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= FEE STRUCTURE SERIALIZER =============
class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure model"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    total_fee = serializers.SerializerMethodField()

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'department', 'department_name', 'semester', 'tuition_fee',
            'lab_fee', 'library_fee', 'activity_fee', 'other_fee', 'total_fee',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_fee(self, obj):
        return float(obj.tuition_fee + obj.lab_fee + obj.library_fee + obj.activity_fee + obj.other_fee)


# ============= PAYMENT SERIALIZER =============
class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'student_roll', 'fee_structure',
            'amount_due', 'amount_paid', 'balance_due',
            'payment_date', 'due_date', 'status', 'payment_method',
            'transaction_id', 'remarks',
            'razorpay_order_id', 'razorpay_payment_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'razorpay_order_id',
                            'razorpay_payment_id', 'razorpay_signature']

    def get_balance_due(self, obj):
        return float(obj.amount_due - obj.amount_paid)


class RazorpayOrderSerializer(serializers.Serializer):
    """Serializer for Razorpay order creation response"""
    order_id = serializers.CharField()
    amount = serializers.IntegerField()  # in paise
    currency = serializers.CharField()
    key = serializers.CharField()
    payment_id = serializers.IntegerField()
    student_name = serializers.CharField()
    remarks = serializers.CharField(allow_blank=True)


class PaymentVerifySerializer(serializers.Serializer):
    """Serializer for Razorpay payment verification"""
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)


# ============= BOOK SERIALIZER =============
class BookSerializer(serializers.ModelSerializer):
    """Serializer for Book model"""
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'isbn', 'publisher', 'publication_year',
            'category', 'total_copies', 'available_copies', 'location', 'price',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= BOOK ISSUE SERIALIZER =============
class BookIssueSerializer(serializers.ModelSerializer):
    """Serializer for BookIssue model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = BookIssue
        fields = [
            'id', 'student', 'student_name', 'book', 'book_title',
            'issue_date', 'due_date', 'return_date', 'status', 'fine_amount',
            'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'issue_date']


# ============= HOSTEL SERIALIZER =============
class HostelSerializer(serializers.ModelSerializer):
    """Serializer for Hostel model"""
    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'hostel_type', 'capacity', 'location', 'warden_name',
            'contact_number', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= ROOM SERIALIZER =============
class RoomSerializer(serializers.ModelSerializer):
    """Serializer for Room model"""
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    available_beds = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hostel', 'hostel_name', 'room_number', 'floor', 'capacity',
            'occupied_beds', 'available_beds', 'amenities', 'rent_per_month',
            'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_available_beds(self, obj):
        return obj.capacity - obj.occupied_beds


# ============= HOSTEL ALLOCATION SERIALIZER =============
class HostelAllocationSerializer(serializers.ModelSerializer):
    """Serializer for HostelAllocation model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)

    class Meta:
        model = HostelAllocation
        fields = [
            'id', 'student', 'student_name', 'room', 'room_details', 'allocation_date',
            'vacate_date', 'status', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= HOSTEL FEE SERIALIZER =============
class HostelFeeSerializer(serializers.ModelSerializer):
    """Serializer for HostelFee model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = HostelFee
        fields = [
            'id', 'student', 'student_name', 'allocation', 'month_year', 'amount_due',
            'amount_paid', 'balance_due', 'due_date', 'payment_date', 'status',
            'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_balance_due(self, obj):
        return float(obj.amount_due - obj.amount_paid)


# ============= ASSIGNMENT SERIALIZER =============
class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model"""
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    faculty_name = serializers.CharField(source='faculty.user.get_full_name', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'course', 'course_name', 'course_code', 'faculty', 'faculty_name',
            'title', 'description', 'due_date', 'file_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= ASSIGNMENT SUBMISSION SERIALIZER =============
class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for AssignmentSubmission model"""
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    faculty_name = serializers.CharField(source='reviewed_by.user.get_full_name', read_only=True, allow_null=True)
    course_name = serializers.CharField(source='assignment.course.name', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'student', 'student_name',
            'student_roll_number', 'course_name', 'submission_date', 'submission_file_url',
            'submission_text', 'status', 'feedback', 'marks_obtained', 'total_marks',
            'reviewed_by', 'faculty_name', 'reviewed_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'submission_date', 'created_at', 'updated_at']


# ============= TIMETABLE SERIALIZER =============
class TimetableSerializer(serializers.ModelSerializer):
    """Serializer for Timetable model"""
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    instructor_name = serializers.CharField(source='course.instructor.user.get_full_name', read_only=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'course', 'course_name', 'course_code', 'instructor_name',
            'day_of_week', 'start_time', 'end_time', 'classroom', 'building', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============= NOTIFICATION SERIALIZER =============
class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    course_name = serializers.CharField(source='course.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.user.get_full_name', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'faculty', 'faculty_name',
            'course', 'course_name', 'is_global', 'recipient_type',
            'student', 'student_name', 'semester', 'department',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_student_name(self, obj):
        if obj.student:
            return f"{obj.student.user.first_name} {obj.student.user.last_name}"
        return None
