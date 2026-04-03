# Faculty Module - Backend API Documentation

## Overview
This document describes the backend API endpoints required for the Faculty Module to function with all its features.

---

## Authentication
All endpoints require JWT authentication via the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Base URL
```
http://localhost:8000/api/
```

---

## Endpoints

### 1. Courses

#### List Courses
```
GET /courses/
```

**Query Parameters:**
- `semester`: Filter by semester (1-8)
- `instructor`: Filter by faculty ID
- `department`: Filter by department ID

**Example Request:**
```bash
GET /api/courses/?semester=3&instructor=1
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Data Structures",
      "code": "CS201",
      "semester": 3,
      "credits": 4,
      "instructor": 1,
      "department": 1,
      "max_students": 50,
      "is_active": true
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Courses retrieved successfully
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions

---

### 2. Students

#### List Students
```
GET /students/
```

**Query Parameters:**
- `semester`: Filter by semester
- `department`: Filter by department
- `enrollment_number`: Search by enrollment

**Response:**
```json
{
  "count": 30,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe",
        "username": "john.doe"
      },
      "roll_number": "21001",
      "enrollment_number": "ENR/21/001",
      "semester": 3,
      "department": 1
    }
  ]
}
```

---

### 3. Enrollments

#### List Enrollments
```
GET /enrollments/
```

**Query Parameters:**
- `course`: Filter by course ID
- `student`: Filter by student ID
- `semester`: Filter by semester

**Response:**
```json
{
  "count": 45,
  "results": [
    {
      "id": 1,
      "student": 1,
      "course": 1,
      "enrollment_date": "2026-01-15",
      "grade": null
    }
  ]
}
```

---

### 4. Attendance

#### List Attendance Records ✅ (Existing)
```
GET /attendance/
```

**Query Parameters:**
- `student`: Filter by student ID
- `course`: Filter by course ID
- `date`: Filter by specific date (format: YYYY-MM-DD)
- `status`: Filter by status (PRESENT, ABSENT, LATE, EXCUSED)

**Response:**
```json
{
  "count": 120,
  "results": [
    {
      "id": 1,
      "student": 1,
      "student_roll_number": "21001",
      "course": 1,
      "course_name": "Data Structures",
      "date": "2026-04-01",
      "status": "PRESENT",
      "lecture_type": "Lecture 1",
      "semester": "3",
      "remarks": null,
      "created_at": "2026-04-01T09:00:00Z",
      "updated_at": "2026-04-01T09:00:00Z"
    }
  ]
}
```

---

#### Create Attendance Record ✅ (Existing)
```
POST /attendance/
```

**Request Body:**
```json
{
  "student": 1,
  "course": 1,
  "date": "2026-04-03",
  "status": "PRESENT",
  "lecture_type": "Lecture 1",
  "semester": "3",
  "remarks": ""
}
```

**Response (201 Created):**
```json
{
  "id": 121,
  "student": 1,
  "course": 1,
  "date": "2026-04-03",
  "status": "PRESENT",
  "lecture_type": "Lecture 1",
  "created_at": "2026-04-03T10:30:00Z"
}
```

**Status Codes:**
- `201 Created` - Attendance created successfully
- `400 Bad Request` - Invalid data
- `409 Conflict` - Duplicate entry (student, course, date already exists)

---

#### Update Attendance Record ❌ (To Implement)
```
PATCH /attendance/{id}/
```

**Request Body:**
```json
{
  "status": "ABSENT",
  "remarks": "Leave approved"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "student": 1,
  "course": 1,
  "date": "2026-04-01",
  "status": "ABSENT",
  "lecture_type": "Lecture 1",
  "remarks": "Leave approved",
  "updated_at": "2026-04-03T10:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `400 Bad Request` - Invalid data
- `404 Not Found` - Attendance record not found
- `403 Forbidden` - Only faculty who marked attendance can update

---

#### Delete Attendance Record ❌ (To Implement)
```
DELETE /attendance/{id}/
```

**Response (204 No Content):**
No response body

**Status Codes:**
- `204 No Content` - Deleted successfully
- `404 Not Found` - Record not found
- `403 Forbidden` - Insufficient permissions

---

#### Get Daily Report ❌ (To Implement)
```
GET /attendance/report/daily/
```

**Query Parameters:**
- `date`: Specific date (format: YYYY-MM-DD)
- `course`: Course ID
- `semester`: Semester number

**Response:**
```json
{
  "date": "2026-04-03",
  "course": 1,
  "course_name": "Data Structures",
  "total_students": 30,
  "present": 28,
  "absent": 1,
  "late": 1,
  "excused": 0,
  "attendance_percentage": 93.33,
  "records": [
    {
      "student": 1,
      "roll_number": "21001",
      "student_name": "John Doe",
      "status": "PRESENT"
    }
  ]
}
```

---

#### Get Monthly Report ❌ (To Implement)
```
GET /attendance/report/monthly/
```

**Query Parameters:**
- `month`: Month in format YYYY-MM
- `course`: Course ID (optional)
- `semester`: Semester number (optional)

**Response:**
```json
{
  "month": "2026-04",
  "course": 1,
  "total_records": 120,
  "student_summaries": [
    {
      "student": 1,
      "roll_number": "21001",
      "student_name": "John Doe",
      "present_count": 18,
      "absent_count": 2,
      "late_count": 0,
      "excused_count": 0,
      "total_classes": 20,
      "attendance_percentage": 90
    }
  ]
}
```

---

#### Get Class Statistics ❌ (To Implement)
```
GET /attendance/report/class-stats/
```

**Query Parameters:**
- `course`: Course ID (required)
- `month`: Month in format YYYY-MM (optional)

**Response:**
```json
{
  "course": 1,
  "course_name": "Data Structures",
  "semester": 3,
  "period": "2026-04",
  "daily_stats": [
    {
      "date": "2026-04-03",
      "total_students": 30,
      "present": 28,
      "absent": 1,
      "late": 1,
      "attendance_percentage": 93.33
    }
  ]
}
```

---

#### Get Overall Summary ❌ (To Implement)
```
GET /attendance/report/summary/
```

**Query Parameters:**
- `semester`: Semester number (optional)
- `course`: Course ID (optional)
- `from_date`: Start date in YYYY-MM-DD format (optional)
- `to_date`: End date in YYYY-MM-DD format (optional)

**Response:**
```json
{
  "overall_stats": {
    "total_records": 500,
    "total_present": 450,
    "total_absent": 30,
    "total_late": 15,
    "total_excused": 5,
    "overall_percentage": 90
  },
  "by_course": [
    {
      "course": 1,
      "course_name": "Data Structures",
      "code": "CS201",
      "semester": 3,
      "present": 150,
      "absent": 10,
      "late": 5,
      "excused": 2,
      "percentage": 92.3
    }
  ],
  "by_status": {
    "PRESENT": 450,
    "ABSENT": 30,
    "LATE": 15,
    "EXCUSED": 5
  }
}
```

---

## Implementation Checklist

### Phase 1: Core (✅ Completed)
- [x] GET /courses/ - List courses
- [x] GET /students/ - List students
- [x] GET /enrollments/ - List enrollments
- [x] GET /attendance/ - List attendance
- [x] POST /attendance/ - Create attendance

### Phase 2: Update & Delete (❌ To Implement)
- [ ] PATCH /attendance/{id}/ - Update attendance
- [ ] DELETE /attendance/{id}/ - Delete attendance
- [ ] Add access control (only faculty who marked can update)

### Phase 3: Reports (❌ To Implement)
- [ ] GET /attendance/report/daily/ - Daily report
- [ ] GET /attendance/report/monthly/ - Monthly report
- [ ] GET /attendance/report/class-stats/ - Class statistics
- [ ] GET /attendance/report/summary/ - Overall summary

### Phase 4: Advanced (❌ Future)
- [ ] Export reports to PDF
- [ ] Export reports to Excel
- [ ] Email reports
- [ ] Batch operations (mark all present, etc.)
- [ ] Attendance trends/analytics

---

## Backend Implementation Guide

### 1. Update Attendance - Views.py

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import Attendance, Course, Student
from .serializers import AttendanceSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    
    def update(self, request, *args, **kwargs):
        """Update attendance record"""
        attendance = self.get_object()
        faculty = request.user.faculty
        course = attendance.course
        
        # Verify faculty is the instructor of this course
        if course.instructor != faculty:
            return Response(
                {"detail": "You can only update attendance for your courses"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Allow updating status and remarks only
        allowed_fields = {'status', 'remarks'}
        for field in request.data:
            if field not in allowed_fields:
                return Response(
                    {"detail": f"Cannot update field: {field}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete attendance record"""
        attendance = self.get_object()
        faculty = request.user.faculty
        
        # Only faculty instructor can delete
        if attendance.course.instructor != faculty:
            return Response(
                {"detail": "You can only delete attendance for your courses"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def report_daily(self, request):
        """Generate daily attendance report"""
        date = request.query_params.get('date')
        course_id = request.query_params.get('course')
        
        if not date:
            return Response(
                {"detail": "date parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        records = Attendance.objects.filter(date=date)
        
        if course_id:
            records = records.filter(course_id=course_id)
        
        total = records.count()
        present = records.filter(status='PRESENT').count()
        absent = records.filter(status='ABSENT').count()
        late = records.filter(status='LATE').count()
        excused = records.filter(status='EXCUSED').count()
        
        return Response({
            'date': date,
            'total': total,
            'present': present,
            'absent': absent,
            'late': late,
            'excused': excused,
            'percentage': (present / total * 100) if total > 0 else 0,
            'records': AttendanceSerializer(records, many=True).data
        })
```

### 2. Serializers.py Updates

```python
class AttendanceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['status', 'remarks']
        
    def validate_status(self, value):
        if value not in ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']:
            raise serializers.ValidationError("Invalid status")
        return value
```

### 3. Permissions.py

```python
from rest_framework import permissions

class IsAttendanceOwner(permissions.BasePermission):
    """Only faculty instructor can modify attendance"""
    
    def has_object_permission(self, request, view, obj):
        if request.method == 'GET':
            return True
        
        return obj.course.instructor == request.user.faculty
```

### 4. URLs.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "detail": "Invalid data",
  "errors": {
    "status": ["Invalid choice"]
  }
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You don't have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

**409 Conflict:**
```json
{
  "detail": "Attendance record for this student, course on this date already exists."
}
```

---

## Rate Limiting

- Requests: 100 per minute per user
- Burst: 10 concurrent requests

---

## Testing

### Test Cases

1. **Positive Tests**
   - [x] Create attendance for single student
   - [x] Create batch attendance
   - [ ] Update existing attendance
   - [ ] Delete attendance
   - [ ] Generate daily report
   - [ ] Generate monthly report

2. **Negative Tests**
   - [ ] Try to update attendance from different faculty (should fail)
   - [ ] Try to update with invalid status (should fail)
   - [ ] Try to create duplicate (should fail)
   - [ ] Try without authentication (should fail)

### Sample cURL Commands

**Create Attendance:**
```bash
curl -X POST http://localhost:8000/api/attendance/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student": 1,
    "course": 1,
    "date": "2026-04-03",
    "status": "PRESENT",
    "semester": "3"
  }'
```

**Update Attendance:**
```bash
curl -X PATCH http://localhost:8000/api/attendance/1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ABSENT",
    "remarks": "Leave approved"
  }'
```

**Get Daily Report:**
```bash
curl -X GET "http://localhost:8000/api/attendance/report/daily/?date=2026-04-03&course=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Performance Considerations

1. **Pagination**: List endpoints support pagination
   ```
   ?page=1&page_size=50
   ```

2. **Filtering**: Use query parameters to reduce data
   ```
   ?course=1&status=ABSENT
   ```

3. **Batch Operations**: Consider implementing bulk_create for large datasets
   ```
   POST /attendance/batch/
   ```

4. **Caching**: Cache course and semester lists
   ```python
   @cache_page(60 * 5)  # Cache for 5 minutes
   ```

---

## Deployment Notes

- Ensure database indexes on frequently queried fields (date, course, student)
- Use database connection pooling for better performance
- Implement CORS for frontend integration
- Set appropriate timeout values for long-running reports
- Monitor API response times with APM tools
