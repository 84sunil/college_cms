from django.contrib import admin
from .models import (
    Department, Faculty, Course, Student, CourseEnrollment,
    Admission, Attendance, Grade, FeeStructure, Payment,
    Book, BookIssue, Hostel, Room, HostelAllocation, HostelFee
)


# ============= DEPARTMENT ADMIN =============
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'head_of_department', 'created_at']
    search_fields = ['name', 'code']
    list_filter = ['created_at']
    ordering = ['name']


# ============= FACULTY ADMIN =============
@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'department', 'specialization', 'is_active']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'specialization']
    list_filter = ['department', 'is_active', 'joining_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= COURSE ADMIN =============
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'semester', 'instructor', 'credits']
    search_fields = ['code', 'name']
    list_filter = ['department', 'semester', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


# ============= STUDENT ADMIN =============
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['roll_number', 'user', 'department', 'semester', 'status', 'cgpa']
    search_fields = ['roll_number', 'enrollment_number', 'user__first_name', 'user__last_name']
    list_filter = ['department', 'semester', 'status', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


# ============= COURSE ENROLLMENT ADMIN =============
@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'grade', 'enrollment_date']
    search_fields = ['student__roll_number', 'course__code']
    list_filter = ['status', 'enrollment_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= ADMISSION ADMIN =============
@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'entrance_score', 'status', 'eligibility', 'application_date']
    search_fields = ['student__roll_number', 'student__user__first_name']
    list_filter = ['status', 'eligibility', 'application_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= ATTENDANCE ADMIN =============
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'date', 'status']
    search_fields = ['student__roll_number', 'course__code']
    list_filter = ['status', 'date', 'course']
    readonly_fields = ['created_at', 'updated_at']


# ============= GRADE ADMIN =============
@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'exam_type', 'marks_obtained', 'grade', 'exam_date']
    search_fields = ['student__roll_number', 'course__code']
    list_filter = ['exam_type', 'exam_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= FEE STRUCTURE ADMIN =============
@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['department', 'semester', 'tuition_fee', 'lab_fee', 'library_fee']
    search_fields = ['department__name']
    list_filter = ['department', 'semester']
    readonly_fields = ['created_at', 'updated_at']


# ============= PAYMENT ADMIN =============
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['student', 'amount_paid', 'amount_due', 'status', 'payment_date']
    search_fields = ['student__roll_number', 'transaction_id']
    list_filter = ['status', 'payment_method', 'payment_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= BOOK ADMIN =============
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'isbn', 'category', 'available_copies', 'total_copies']
    search_fields = ['title', 'author', 'isbn']
    list_filter = ['category', 'publication_year', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


# ============= BOOK ISSUE ADMIN =============
@admin.register(BookIssue)
class BookIssueAdmin(admin.ModelAdmin):
    list_display = ['student', 'book', 'issue_date', 'due_date', 'status', 'fine_amount']
    search_fields = ['student__roll_number', 'book__title']
    list_filter = ['status', 'issue_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= HOSTEL ADMIN =============
@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['name', 'hostel_type', 'capacity', 'location', 'warden_name', 'is_active']
    search_fields = ['name', 'location', 'warden_name']
    list_filter = ['hostel_type', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


# ============= ROOM ADMIN =============
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'room_number', 'floor', 'capacity', 'occupied_beds', 'rent_per_month', 'is_available']
    search_fields = ['hostel__name', 'room_number']
    list_filter = ['hostel', 'floor', 'is_available']
    readonly_fields = ['created_at', 'updated_at']


# ============= HOSTEL ALLOCATION ADMIN =============
@admin.register(HostelAllocation)
class HostelAllocationAdmin(admin.ModelAdmin):
    list_display = ['student', 'room', 'allocation_date', 'status']
    search_fields = ['student__roll_number']
    list_filter = ['status', 'allocation_date']
    readonly_fields = ['created_at', 'updated_at']


# ============= HOSTEL FEE ADMIN =============
@admin.register(HostelFee)
class HostelFeeAdmin(admin.ModelAdmin):
    list_display = ['student', 'month_year', 'amount_paid', 'amount_due', 'status', 'due_date']
    search_fields = ['student__roll_number']
    list_filter = ['status', 'month_year']
    readonly_fields = ['created_at', 'updated_at']
