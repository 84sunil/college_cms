# College Management System - Authentication & Authorization Guide

## Overview

The College Management System includes a comprehensive role-based authentication and authorization system with support for:
- **Admin** - System administrators and staff
- **Faculty** - Teachers and instructors
- **Students** - Enrolled students
- **General Users** - Unassigned registered users

## Authentication Flow

### 1. User Registration

Register a new user account in the system.

**Endpoint:** `POST /college/api/auth/register/`

**Required Fields:**
- `username` - Unique username
- `email` - Valid email address
- `first_name` - User's first name
- `last_name` - User's last name
- `password` - Password (minimum 8 characters recommended)
- `password2` - Password confirmation

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123!",
    "password2": "SecurePass123!"
  }'
```

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true
  },
  "token": "9944b09199c62bcf9418ad846dd0e4bbea6f3357"
}
```

---

## Login Endpoints

### 2. General Login (Auto-detect Role)

Login with automatic role detection. Returns role and profile information based on user type.

**Endpoint:** `POST /college/api/auth/login/`

**Required Fields:**
- `username` - Username
- `password` - Password

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

**Success Response (200 OK) - Student Login:**
```json
{
  "success": true,
  "message": "Login successful as student",
  "token": "9944b09199c62bcf9418ad846dd0e4bbea6f3357",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "role": "student",
    "is_active": true,
    "student_id": 5,
    "roll_number": "CSE001",
    "enrollment_number": "ENR001",
    "department": "Computer Science",
    "semester": 3,
    "status": "ACTIVE",
    "cgpa": 3.75
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

### 3. Faculty-Specific Login

Login endpoint restricted to faculty members only.

**Endpoint:** `POST /college/api/auth/faculty-login/`

**Required Fields:**
- `username` - Username
- `password` - Password

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/faculty-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_smith",
    "password": "FacultyPass123!"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Faculty login successful",
  "token": "8844b09199c62bcf9418ad846dd0e4bbea6f3357",
  "user": {
    "user_id": 2,
    "username": "prof_smith",
    "email": "smith@college.edu",
    "first_name": "Dr.",
    "last_name": "Smith",
    "full_name": "Dr. Smith",
    "role": "faculty",
    "is_active": true,
    "faculty_id": 3,
    "employee_id": "EMP001",
    "department": "Computer Science",
    "specialization": "Machine Learning"
  }
}
```

**Error Response (403 Forbidden) - Not Faculty:**
```json
{
  "success": false,
  "message": "User is not registered as faculty"
}
```

---

### 4. Student-Specific Login

Login endpoint restricted to students only.

**Endpoint:** `POST /college/api/auth/student-login/`

**Required Fields:**
- `username` - Username
- `password` - Password

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/student-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_johnson",
    "password": "StudentPass123!"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Student login successful",
  "token": "7744b09199c62bcf9418ad846dd0e4bbea6f3357",
  "user": {
    "user_id": 3,
    "username": "alice_johnson",
    "email": "alice@student.edu",
    "first_name": "Alice",
    "last_name": "Johnson",
    "full_name": "Alice Johnson",
    "role": "student",
    "is_active": true,
    "student_id": 10,
    "roll_number": "CS2022001",
    "enrollment_number": "ENR2022001",
    "department": "Computer Science",
    "semester": 4,
    "status": "ACTIVE",
    "cgpa": 3.85
  }
}
```

**Error Response (403 Forbidden) - Not Student:**
```json
{
  "success": false,
  "message": "User is not registered as student"
}
```

---

### 5. Admin-Specific Login

Login endpoint restricted to admin/staff users only.

**Endpoint:** `POST /college/api/auth/admin-login/`

**Required Fields:**
- `username` - Username
- `password` - Password

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/admin-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "AdminPass123!"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "6644b09199c62bcf9418ad846dd0e4bbea6f3357",
  "user": {
    "user_id": 4,
    "username": "admin",
    "email": "admin@college.edu",
    "first_name": "System",
    "last_name": "Administrator",
    "full_name": "System Administrator",
    "role": "admin",
    "is_active": true
  }
}
```

**Error Response (403 Forbidden) - No Admin Privileges:**
```json
{
  "success": false,
  "message": "User does not have admin privileges"
}
```

---

## User Account Management

### 6. Get Current User Profile

Retrieve the profile of the currently authenticated user.

**Endpoint:** `GET /college/api/auth/current-user/`

**Headers Required:**
- `Authorization: Token YOUR_TOKEN_HERE`

**Example Request:**
```bash
curl -X GET http://localhost:8000/college/api/auth/current-user/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f3357"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "role": "student",
    "is_active": true,
    "student_id": 5,
    "roll_number": "CSE001",
    "enrollment_number": "ENR001",
    "department": "Computer Science",
    "semester": 3,
    "status": "ACTIVE",
    "cgpa": 3.75
  }
}
```

---

### 7. Change Password

Change the password for the currently authenticated user.

**Endpoint:** `POST /college/api/auth/change-password/`

**Headers Required:**
- `Authorization: Token YOUR_TOKEN_HERE`
- `Content-Type: application/json`

**Required Fields:**
- `old_password` - Current password
- `new_password` - New password
- `new_password2` - New password confirmation

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/change-password/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f3357" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "OldPass123!",
    "new_password": "NewPass456!",
    "new_password2": "NewPass456!"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (401 Unauthorized) - Wrong Old Password:**
```json
{
  "success": false,
  "message": "Old password is incorrect"
}
```

**Error Response (400 Bad Request) - Passwords Don't Match:**
```json
{
  "success": false,
  "message": "New passwords do not match"
}
```

---

### 8. Logout

Logout the currently authenticated user and invalidate their token.

**Endpoint:** `POST /college/api/auth/logout/`

**Headers Required:**
- `Authorization: Token YOUR_TOKEN_HERE`

**Example Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/logout/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f3357"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## User Roles

### Role Detection

The system automatically detects and assigns roles based on user profile:

| Role | Condition |
|------|-----------|
| `admin` | User has `is_staff=True` and `is_superuser=True` |
| `faculty` | User has associated Faculty profile |
| `student` | User has associated Student profile |
| `user` | Regular user without specific profile |

### Role Hierarchy

```
Admin (Full Access)
  ├── Faculty (Course & Student Management)
  └── Student (Personal Dashboard Access)
```

---

## Response Format

All authentication endpoints return structured responses:

### Success Response
```json
{
  "success": true,
  "message": "Descriptive message",
  "token": "Token string (if applicable)",
  "user": { /* User data object */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful operation |
| 201 | Created - Successful registration |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Access denied (not role) |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Internal error |

---

## Token Management

### Token Storage
Store tokens securely in your application:
- Mobile: Secure storage (Keychain/Keystore)
- Web: HttpOnly cookies or localStorage (with XSS protection)
- Backend: Secure session storage

### Token Usage
Include token in all subsequent requests:
```
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f3357
```

### Token Invalidation
Tokens are invalidated when:
- User logs out
- Password is changed
- Admin revokes token
- Token expires (configurable)

---

## Security Best Practices

1. **Password Requirements**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Never send passwords in URL or logs

2. **Token Security**
   - Never expose token in browser console
   - Always use HTTPS in production
   - Set token expiration time
   - Rotate tokens regularly

3. **Session Management**
   - Log out from all devices option
   - Track active sessions
   - Disable suspicious accounts
   - Monitor login attempts

4. **Access Control**
   - Role-based endpoints
   - Permission validation on each Request
   - Audit logging for sensitive operations

---

## Example Workflows

### Student Login Flow
```
1. Student opens app
2. POST /college/api/auth/student-login/
3. Receives token + profile data
4. Stores token locally
5. Includes token in Authorization header for all requests
6. POST /college/api/auth/logout/ when done
```

### Faculty Login Flow
```
1. Faculty opens admin panel
2. POST /college/api/auth/faculty-login/
3. Receives token + faculty profile
4. Can access course management endpoints
5. Token included in Authorization header
6. POST /college/api/auth/logout/ to end session
```

### Admin Login Flow
```
1. Admin opens system
2. POST /college/api/auth/admin-login/
3. Receives admin token
4. Full system access granted
5. Can create/manage all users and data
6. Logout invalidates token
```

---

## Troubleshooting

### "Invalid credentials" Error
- Check username/password spelling
- Verify user exists in system
- Check if account is active (is_active=True)

### "User is not registered as faculty/student" Error
- User account exists but not assigned to role
- Create Faculty or Student profile for user first
- Contact admin to assign role

### "Access Denied" Error
- Token may have expired
- User may have been logged out
- Login again to get new token

### Token Not Working
- Verify token format: `Authorization: Token <token>`
- Check if token is still valid
- Ensure user account is still active
- Try re-logging in

---

## Rate Limiting (Optional Future Enhancement)

Implement rate limiting to prevent brute-force attacks:
```
- Max 5 login attempts per 15 minutes
- Max 3 password attempts per request
- Progressive delays on failures
```

---

## API Testing with cURL

### Quick Test Script
```bash
#!/bin/bash

# Register
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","first_name":"Test","last_name":"User","password":"Test@123","password2":"Test@123"}'

# Login
TOKEN=$(curl -X POST http://localhost:8000/college/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test@123"}' | jq '.token')

# Get current user
curl -X GET http://localhost:8000/college/api/auth/current-user/ \
  -H "Authorization: Token $TOKEN"

# Logout
curl -X POST http://localhost:8000/college/api/auth/logout/ \
  -H "Authorization: Token $TOKEN"
```

---

**Last Updated:** March 27, 2026
