# College Management System - REST API

A comprehensive Django REST Framework-based college management system with complete feature set for managing students, faculty, courses, admissions, attendance, grades, payments, library, and hostel operations.

## Features

### Core Modules
- **Departments**: Manage college departments
- **Faculty/Teachers**: Faculty profiles and management
- **Students**: Student records and management
- **Courses**: Course creation and management
- **Admissions**: Student admission tracking
- **Attendance**: Student attendance management
- **Grades/Results**: Academic performance tracking
- **Fees/Payments**: Fee structure and payment tracking
- **Library Management**: Book inventory and issuance
- **Hostel Management**: Hostel rooms and allocations

## Technology Stack

- **Framework**: Django 6.0
- **API**: Django REST Framework
- **Authentication**: Token-based Authentication
- **Database**: SQLite3 (can be changed to PostgreSQL)
- **Python**: 3.12.1

## Installation & Setup

### 1. Clone or Navigate to Project
```bash
cd c:\college\backend
```

### 2. Activate Virtual Environment
```bash
# Windows
.venv\Scripts\activate

# Unix/Mac
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install django djangorestframework django-cors-headers
```

### 4. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Start Development Server
```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### Authentication Endpoints

#### Register User
```
POST /college/api/auth/register/
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "securepass123",
    "password2": "securepass123"
}

Response: 201 Created
{
    "message": "User registered successfully",
    "user_id": 1,
    "token": "abc123token..."
}
```

#### Login
```
POST /college/api/auth/login/
Content-Type: application/json

{
    "username": "john_doe",
    "password": "securepass123"
}

Response: 200 OK
{
    "message": "Login successful",
    "user_id": 1,
    "username": "john_doe",
    "token": "abc123token..."
}
```

#### Logout
```
POST /college/api/auth/logout/
Authorization: Token abc123token...

Response: 200 OK
{
    "message": "Logged out successfully"
}
```

### Department Endpoints

#### List Departments
```
GET /college/api/departments/
Authorization: Token abc123token...

Response: 200 OK
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Computer Science",
            "code": "CS",
            "head_of_department": "Dr. Smith",
            "description": "...",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

#### Create Department
```
POST /college/api/departments/
Authorization: Token abc123token...
Content-Type: application/json

{
    "name": "Computer Science",
    "code": "CS",
    "head_of_department": "Dr. Smith",
    "description": "Computer Science Department"
}
```

#### Retrieve Department
```
GET /college/api/departments/1/
Authorization: Token abc123token...
```

#### Update Department
```
PUT /college/api/departments/1/
Authorization: Token abc123token...
Content-Type: application/json

{
    "name": "Computer Science & Engineering",
    "code": "CSE"
}
```

#### Delete Department
```
DELETE /college/api/departments/1/
Authorization: Token abc123token...
```

### Student Endpoints

#### List All Students
```
GET /college/api/students/
Authorization: Token abc123token...
```

#### Get Current Student Profile
```
GET /college/api/students/my_profile/
Authorization: Token abc123token...
```

#### Create Student
```
POST /college/api/students/
Authorization: Token abc123token...
Content-Type: application/json

{
    "user": 1,
    "roll_number": "CS001",
    "enrollment_number": "ENR001",
    "department": 1,
    "semester": 1,
    "date_of_birth": "2000-01-15",
    "gender": "M",
    "phone": "9876543210",
    "address": "...",
    "father_name": "...",
    "mother_name": "...",
    "date_of_admission": "2022-09-01",
    "status": "ACTIVE"
}
```

### Faculty Endpoints

#### List Faculty
```
GET /college/api/faculty/
Authorization: Token abc123token...
```

#### Get Current Faculty Profile
```
GET /college/api/faculty/my_profile/
Authorization: Token abc123token...
```

#### Create Faculty
```
POST /college/api/faculty/
Authorization: Token abc123token...
Content-Type: application/json

{
    "user": 1,
    "employee_id": "EMP001",
    "department": 1,
    "specialization": "Machine Learning",
    "phone": "9876543210",
    "gender": "M",
    "date_of_birth": "1980-05-20",
    "address": "...",
    "qualification": "Ph.D. in Computer Science",
    "joining_date": "2015-08-01"
}
```

### Course Endpoints

#### List Courses
```
GET /college/api/courses/
Authorization: Token abc123token...

Query Parameters:
- department: Department ID
- semester: Semester number
- is_active: true/false
```

#### Create Course
```
POST /college/api/courses/
Authorization: Token abc123token...
Content-Type: application/json

{
    "name": "Data Structures",
    "code": "CS201",
    "department": 1,
    "semester": 2,
    "credits": 4,
    "instructor": 1,
    "description": "...",
    "max_students": 50
}
```

### Course Enrollment Endpoints

#### List Enrollments
```
GET /college/api/course-enrollments/
Authorization: Token abc123token...
```

#### Get Current Student Enrollments
```
GET /college/api/course-enrollments/my_enrollments/
Authorization: Token abc123token...
```

#### Enroll Student in Course
```
POST /college/api/course-enrollments/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "course": 1
}
```

### Attendance Endpoints

#### List Attendance
```
GET /college/api/attendance/
Authorization: Token abc123token...

Query Parameters:
- student: Student ID
- course: Course ID
- status: PRESENT/ABSENT/LATE/EXCUSED
- date: Date in YYYY-MM-DD format
```

#### Get Current Student Attendance
```
GET /college/api/attendance/my_attendance/
Authorization: Token abc123token...
```

#### Mark Attendance
```
POST /college/api/attendance/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "course": 1,
    "date": "2024-01-15",
    "status": "PRESENT",
    "remarks": "..."
}
```

### Grades Endpoints

#### List Grades
```
GET /college/api/grades/
Authorization: Token abc123token...

Query Parameters:
- student: Student ID
- course: Course ID
- exam_type: MIDTERM/FINAL/PRACTICAL/PROJECT/ASSIGNMENT
```

#### Get Current Student Grades
```
GET /college/api/grades/my_grades/
Authorization: Token abc123token...
```

#### Record Grade
```
POST /college/api/grades/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "course": 1,
    "exam_type": "FINAL",
    "marks_obtained": 85.5,
    "total_marks": 100,
    "percentage": 85.5,
    "grade": "A",
    "exam_date": "2024-01-20"
}
```

### Payment Endpoints

#### List Payments
```
GET /college/api/payments/
Authorization: Token abc123token...

Query Parameters:
- student: Student ID
- status: PENDING/COMPLETED/FAILED/PARTIAL
- payment_method: CASH/CHEQUE/BANK_TRANSFER/CARD/ONLINE
```

#### Get Current Student Payments
```
GET /college/api/payments/my_payments/
Authorization: Token abc123token...
```

#### Record Payment
```
POST /college/api/payments/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "fee_structure": 1,
    "amount_due": 50000,
    "amount_paid": 50000,
    "payment_date": "2024-01-15",
    "due_date": "2024-01-31",
    "status": "COMPLETED",
    "payment_method": "BANK_TRANSFER",
    "transaction_id": "TXN001"
}
```

### Library Endpoints

#### List Books
```
GET /college/api/books/
Authorization: Token abc123token...

Query Parameters:
- category: Book category
- is_active: true/false
```

#### Issue Book
```
POST /college/api/book-issues/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "book": 1,
    "due_date": "2024-02-15"
}
```

#### Get Current Student Book Issues
```
GET /college/api/book-issues/my_books/
Authorization: Token abc123token...
```

### Hostel Endpoints

#### List Hostels
```
GET /college/api/hostels/
Authorization: Token abc123token...
```

#### Create Hostel
```
POST /college/api/hostels/
Authorization: Token abc123token...
Content-Type: application/json

{
    "name": "Boys Hostel A",
    "hostel_type": "Boys",
    "capacity": 100,
    "location": "Campus Area 1",
    "warden_name": "Mr. Kumar",
    "contact_number": "9876543210"
}
```

### Hostel Room Endpoints

#### List Rooms
```
GET /college/api/rooms/
Authorization: Token abc123token...

Query Parameters:
- hostel: Hostel ID
- is_available: true/false
```

#### Create Room
```
POST /college/api/rooms/
Authorization: Token abc123token...
Content-Type: application/json

{
    "hostel": 1,
    "room_number": "101",
    "floor": 1,
    "capacity": 2,
    "amenities": "AC, Bathroom, Balcony",
    "rent_per_month": 5000
}
```

### Hostel Allocation Endpoints

#### Get Current Student Hostel Allocation
```
GET /college/api/hostel-allocations/my_allocation/
Authorization: Token abc123token...
```

#### Allocate Hostel Room
```
POST /college/api/hostel-allocations/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "room": 1,
    "allocation_date": "2024-01-15"
}
```

### Hostel Fee Endpoints

#### Get Current Student Hostel Fees
```
GET /college/api/hostel-fees/my_hostel_fees/
Authorization: Token abc123token...
```

#### Record Hostel Fee Payment
```
POST /college/api/hostel-fees/
Authorization: Token abc123token...
Content-Type: application/json

{
    "student": 1,
    "allocation": 1,
    "month_year": "2024-01",
    "amount_due": 5000,
    "amount_paid": 5000,
    "due_date": "2024-01-31",
    "status": "PAID"
}
```

## Authentication

The API uses **Token-based Authentication**. Include the token in the header of all authenticated requests:

```
Authorization: Token your_token_here
```

## Filtering, Searching & Ordering

### Filtering
Most endpoints support filtering. Example:
```
GET /college/api/students/?department=1&semester=2
```

### Searching
Most endpoints support searching on relevant fields:
```
GET /college/api/students/?search=john
```

### Ordering
Most endpoints support ordering:
```
GET /college/api/students/?ordering=-cgpa
```

## Pagination

By default, the API returns 10 items per page. Modify with:
```
GET /college/api/students/?page=2
```

## CORS Configuration

CORS is enabled for the following origins:
- `http://localhost:3000`
- `http://localhost:8000`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8000`

Modify `CORS_ALLOWED_ORIGINS` in `settings.py` as needed.

## Django Admin Panel

Access the Django admin panel at: `http://localhost:8000/admin/`

Use your superuser credentials to manage all models directly.

## Database Models

### Student
- Roll Number, Enrollment Number
- Department, Semester
- Personal Details (DOB, Gender, Phone, Address)
- Family Details (Parent Names)
- CGPA, Status (Active/Inactive/Graduated/Suspended)

### Faculty
- Employee ID
- Department, Specialization
- Qualifications, Joining Date
- Personal Details

### Course
- Course Code, Name
- Department, Semester, Credits
- Instructor Assignment
- Max Students Capacity

### Grades
- Student, Course
- Exam Type (Midterm/Final/Practical/Project)
- Marks, Percentage, Grade Letter

### Attendance
- Student, Course, Date
- Status (Present/Absent/Late/Excused)

### Payments
- Student, Fee Structure
- Amount Paid, Due Date
- Payment Method, Transaction ID

### Library
- Books with ISBN, Category, Copies
- Book Issues with Due Dates and Fines

### Hostel
- Hostels with Warden Info
- Rooms with Capacity, Amenities, Rent
- Allocations and Monthly Fees

## Development

### Adding New Models
1. Define model in `models.py`
2. Create serializer in `serializers.py`
3. Create viewset in `views.py`
4. Register router in `urls.py`
5. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Running Tests
```bash
python manage.py test
```

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Successful GET, PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Performance Optimization

- Pagination is enabled to limit query results
- Database queries are optimized with select_related and prefetch_related
- Token caching is implemented
- CORS headers are optimized

## Security Considerations

1. **Never expose SECRET_KEY** - Change it in production
2. **Set DEBUG=False** in production
3. **Use environment variables** for sensitive data
4. **Enable HTTPS** in production
5. **Use strong passwords** for superuser account
6. **Regularly update** Django and dependencies
7. **Implement rate limiting** for production
8. **Use database-level constraints** for data integrity

## Deployment

For production deployment:
1. Set `DEBUG = False` in settings
2. Use PostgreSQL instead of SQLite
3. Set up proper CORS origins
4. Use environment variables for secrets
5. Set `ALLOWED_HOSTS` properly
6. Configure static files
7. Use gunicorn or uwsgi as WSGI server
8. Set up reverse proxy (nginx)
9. Enable SSL/TLS

## Troubleshooting

### Import Errors
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Database Errors
Reset database and run migrations:
```bash
python manage.py migrate --run-syncdb
```

### Authentication Failures
Verify token is included in Authorization header correctly.

## Support & Documentation

For more information on Django REST Framework, visit:
- [DRF Documentation](https://www.django-rest-framework.org/)
- [Django Documentation](https://docs.djangoproject.com/)

## License

This project is provided as-is for educational purposes.

## Contributors

College Management System Development Team

---

**Last Updated**: March 27, 2026
