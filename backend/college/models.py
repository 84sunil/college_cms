from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# ============= DEPARTMENT MODEL =============
class Department(models.Model):
    """Model for college departments"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    head_of_department = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ['name']


# ============= FACULTY MODEL =============
class Faculty(models.Model):
    """Model for faculty/teachers"""
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='faculty_members')
    specialization = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    qualification = models.CharField(max_length=100, null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='faculty_profiles/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

    class Meta:
        ordering = ['user__first_name']


# ============= COURSE MODEL =============
class Course(models.Model):
    """Model for courses/classes"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    credits = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(6)])
    instructor = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses_taught')
    description = models.TextField(blank=True, null=True)
    max_students = models.IntegerField(default=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ['department', 'semester', 'name']
        unique_together = ['code', 'department']


# ============= STUDENT MODEL =============
class Student(models.Model):
    """Model for students"""
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('GRADUATED', 'Graduated'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student')
    roll_number = models.CharField(max_length=20, unique=True)
    enrollment_number = models.CharField(max_length=30, unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='students')
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    father_name = models.CharField(max_length=100, null=True, blank=True)
    mother_name = models.CharField(max_length=100, null=True, blank=True)
    date_of_admission = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='student_profiles/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    cgpa = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.roll_number})"

    class Meta:
        ordering = ['roll_number']


# ============= COURSE ENROLLMENT MODEL =============
class CourseEnrollment(models.Model):
    """Model for student course enrollments"""
    STATUS_CHOICES = [
        ('ENROLLED', 'Enrolled'),
        ('COMPLETED', 'Completed'),
        ('DROPPED', 'Dropped'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='course_enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ENROLLED')
    grade = models.CharField(max_length=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course']
        ordering = ['-enrollment_date']

    def __str__(self):
        return f"{self.student.roll_number} - {self.course.code}"


# ============= ADMISSIONS MODEL =============
class Admission(models.Model):
    """Model for student admissions"""
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('WAITLISTED', 'Waitlisted'),
        ('ENROLLED', 'Enrolled'),
    ]
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='admission')
    application_date = models.DateField(auto_now_add=True)
    entrance_score = models.DecimalField(max_digits=6, decimal_places=2)
    eligibility = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    admission_date = models.DateField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admission - {self.student.roll_number} ({self.status})"

    class Meta:
        ordering = ['-application_date']


# ============= ATTENDANCE MODEL =============
class Attendance(models.Model):
    """Model for student attendance"""
    ATTENDANCE_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=ATTENDANCE_CHOICES)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.roll_number} - {self.course.code} - {self.date}"


# ============= GRADES/RESULTS MODEL =============
class Grade(models.Model):
    """Model for student grades and results"""
    EXAM_TYPE_CHOICES = [
        ('MIDTERM', 'Midterm'),
        ('FINAL', 'Final Exam'),
        ('PRACTICAL', 'Practical'),
        ('PROJECT', 'Project'),
        ('ASSIGNMENT', 'Assignment'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=2, blank=True, null=True)  # A+, A, B+, B, etc.
    exam_date = models.DateField()
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course', 'exam_type']
        ordering = ['-exam_date']

    def __str__(self):
        return f"{self.student.roll_number} - {self.course.code} - {self.exam_type}"


# ============= FEES/PAYMENTS MODEL =============
class FeeStructure(models.Model):
    """Model for fee structure per semester"""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='fee_structures')
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    tuition_fee = models.DecimalField(max_digits=10, decimal_places=2)
    lab_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    library_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    activity_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['department', 'semester']
        ordering = ['department', 'semester']

    def __str__(self):
        return f"{self.department.name} - Semester {self.semester}"


class Payment(models.Model):
    """Model for student fee payments"""
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('PARTIAL', 'Partial'),
        ('PROCESSING', 'Processing'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CARD', 'Card'),
        ('ONLINE', 'Online'),
        ('RAZORPAY', 'Razorpay'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_date = models.DateField(null=True, blank=True)  # Set when payment completes
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='ONLINE')
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    # Razorpay-specific fields
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.roll_number} - Rs.{self.amount_due} ({self.status})"

    @property
    def balance_due(self):
        return self.amount_due - self.amount_paid


# ============= LIBRARY MANAGEMENT MODEL =============
class Book(models.Model):
    """Model for library books"""
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True)
    publisher = models.CharField(max_length=100)
    publication_year = models.IntegerField()
    category = models.CharField(max_length=50)
    total_copies = models.IntegerField(validators=[MinValueValidator(1)])
    available_copies = models.IntegerField(validators=[MinValueValidator(0)])
    location = models.CharField(max_length=50, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.author}"

    class Meta:
        ordering = ['title']


class BookIssue(models.Model):
    """Model for book issuance to students"""
    STATUS_CHOICES = [
        ('ISSUED', 'Issued'),
        ('RETURNED', 'Returned'),
        ('OVERDUE', 'Overdue'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='book_issues')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='issue_records')
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ISSUED')
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.student.roll_number} - {self.book.title}"


# ============= HOSTEL MANAGEMENT MODEL =============
class Hostel(models.Model):
    """Model for hostel buildings"""
    name = models.CharField(max_length=100, unique=True)
    hostel_type = models.CharField(max_length=50)  # Boys/Girls/Mixed
    capacity = models.IntegerField(validators=[MinValueValidator(1)])
    location = models.CharField(max_length=100)
    warden_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Room(models.Model):
    """Model for hostel rooms"""
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=20)
    floor = models.IntegerField()
    capacity = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(6)])
    occupied_beds = models.IntegerField(default=0)
    amenities = models.TextField(blank=True, null=True)  # AC, Bathroom, etc.
    rent_per_month = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hostel', 'room_number']
        ordering = ['hostel', 'floor', 'room_number']

    def __str__(self):
        return f"{self.hostel.name} - Room {self.room_number}"


class HostelAllocation(models.Model):
    """Model for hostel room allocation to students"""
    STATUS_CHOICES = [
        ('ALLOCATED', 'Allocated'),
        ('VACATED', 'Vacated'),
        ('HOLD', 'Hold'),
    ]
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='hostel_allocation')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='allocations')
    allocation_date = models.DateField()
    vacate_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ALLOCATED')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.roll_number} - {self.room}"

    class Meta:
        ordering = ['-allocation_date']


class HostelFee(models.Model):
    """Model for hostel fee payments"""
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('PARTIAL', 'Partial'),
        ('OVERDUE', 'Overdue'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='hostel_fees')
    allocation = models.ForeignKey(HostelAllocation, on_delete=models.CASCADE, related_name='fees')
    month_year = models.CharField(max_length=7)  # YYYY-MM format
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'month_year']
        ordering = ['-month_year']

    def __str__(self):
        return f"{self.student.roll_number} - Hostel Fee ({self.month_year})"


# ============= ASSIGNMENT MODEL =============
class Assignment(models.Model):
    """Model for course assignments given by faculty"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField()
    file_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.title} - {self.course.code}"


# ============= ASSIGNMENT SUBMISSION MODEL =============
class AssignmentSubmission(models.Model):
    """Model for student assignment submissions"""
    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVIEWED', 'Reviewed'),
    ]
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions')
    submission_date = models.DateTimeField(auto_now_add=True)
    submission_file_url = models.URLField(max_length=500, blank=True, null=True)
    submission_text = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    feedback = models.TextField(blank=True, null=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    reviewed_by = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_submissions')
    reviewed_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['assignment', 'student']
        ordering = ['-submission_date']

    def __str__(self):
        return f"{self.student.roll_number} - {self.assignment.title}"


# ============= TIMETABLE MODEL =============
class Timetable(models.Model):
    """Model for course timetable/class schedule"""
    DAY_CHOICES = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
    ]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='timetable_entries')
    day_of_week = models.CharField(max_length=3, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    classroom = models.CharField(max_length=50, blank=True, null=True)
    building = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course', 'day_of_week', 'start_time']
        unique_together = ['course', 'day_of_week', 'start_time']

    def __str__(self):
        return f"{self.course.code} - {self.day_of_week} {self.start_time}-{self.end_time}"


# ============= NOTIFICATION MODEL =============
class Notification(models.Model):
    """Model for announcements and notifications"""
    RECIPIENT_TYPE_CHOICES = [
        ('ALL', 'All Students'),
        ('SEMESTER', 'By Semester'),
        ('DEPARTMENT', 'By Department'),
        ('INDIVIDUAL', 'Individual Student'),
        ('GLOBAL', 'Global'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    is_global = models.BooleanField(default=False)
    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_TYPE_CHOICES, default='GLOBAL')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='individual_notifications', null=True, blank=True)
    semester = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(8)])
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
