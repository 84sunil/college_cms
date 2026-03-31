# College Management System - JWT Authentication Guide

## Overview

The College Management System uses **JWT (JSON Web Token)** authentication with **djangorestframework-simplejwt** for secure, stateless authentication. JWT is more flexible than token-based auth and supports token refresh without re-authentication.

**Key Features:**
- ✅ Access tokens (1-hour expiry) - Used for API requests
- ✅ Refresh tokens (7-day expiry) - Used to get new access tokens
- ✅ Role-based login (Admin, Faculty, Student)
- ✅ Token blacklisting on logout
- ✅ No session storage required

---

## Authentication Flow

### 1. User Registration

Register a new user account with role-specific profile creation. The registration endpoint now supports role-based registration that automatically creates the appropriate profile (Student, Faculty) and sets admin privileges.

**Endpoint:** `POST /college/api/auth/register/`

**Supported Roles:**
- `user` - General user (no special profile)
- `student` - Creates Student profile with department, roll_number, etc.
- `faculty` - Creates Faculty profile with department, employee_id, etc.
- `admin` - Sets Django admin privileges (is_staff=True, is_superuser=True)

**Request - General User:**
```bash
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "role": "user"
  }'
```

**Request - Student Registration:**
```bash
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_student",
    "email": "alice@student.edu",
    "first_name": "Alice",
    "last_name": "Johnson",
    "password": "StudentPass123!",
    "password2": "StudentPass123!",
    "role": "student",
    "department": 1,
    "roll_number": "CSE001",
    "enrollment_number": "ENR2023001",
    "semester": 3
  }'
```

**Request - Faculty Registration:**
```bash
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_smith",
    "email": "smith@college.edu",
    "first_name": "Dr.",
    "last_name": "Smith",
    "password": "FacultyPass123!",
    "password2": "FacultyPass123!",
    "role": "faculty",
    "department": 1,
    "employee_id": "EMP001",
    "specialization": "Computer Science"
  }'
```

**Request - Admin Registration:**
```bash
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@college.edu",
    "first_name": "Admin",
    "last_name": "User",
    "password": "AdminPass123!",
    "password2": "AdminPass123!",
    "role": "admin"
  }'
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true
  }
}
```

**Student Registration Response:**
```json
{
  "message": "Student registered successfully",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "user_id": 2,
    "username": "alice_student",
    "email": "alice@student.edu",
    "first_name": "Alice",
    "last_name": "Johnson",
    "full_name": "Alice Johnson",
    "role": "student",
    "is_active": true,
    "student_id": 1,
    "roll_number": "CSE001",
    "enrollment_number": "ENR2023001",
    "semester": 3
  }
}
```

**Faculty Registration Response:**
```json
{
  "message": "Faculty registered successfully",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "user_id": 3,
    "username": "prof_smith",
    "email": "smith@college.edu",
    "first_name": "Dr.",
    "last_name": "Smith",
    "full_name": "Dr. Smith",
    "role": "faculty",
    "is_active": true,
    "faculty_id": 1,
    "employee_id": "EMP001",
    "specialization": "Computer Science"
  }
}
```

**Admin Registration Response:**
```json
{
  "message": "Admin registered successfully",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "user_id": 4,
    "username": "admin_user",
    "email": "admin@college.edu",
    "first_name": "Admin",
    "last_name": "Admin",
    "full_name": "Admin Admin",
    "role": "admin",
    "is_active": true,
    "is_staff": true,
    "is_superuser": true
  }
}
```

**Required Fields by Role:**

| Role | Required Fields | Optional Fields |
|------|-----------------|-----------------|
| `user` | username, email, first_name, last_name, password, password2, role | - |
| `student` | All user fields + department, roll_number, enrollment_number, semester | - |
| `faculty` | All user fields + department, employee_id, specialization | - |
| `admin` | All user fields + role | - |

**Error Response (400 Bad Request) - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Registration failed",
  "errors": {
    "department": ["This field is required for student registration."],
    "roll_number": ["This field is required for student registration."]
  }
}
```

**Error Response (400 Bad Request) - Invalid Role:**
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: user, student, faculty, admin"
}
```

---

## Login Endpoints

### 2. General Login (Auto-detect Role)

Login with automatic role detection.

**Endpoint:** `POST /college/api/auth/login/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful as student",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
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
    "roll_number": "CSE001"
  }
}
```

---

### 3. Faculty Login

**Endpoint:** `POST /college/api/auth/faculty-login/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/faculty-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_smith",
    "password": "FacultyPass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Faculty login successful",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
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
    "employee_id": "EMP001"
  }
}
```

---

### 4. Student Login

**Endpoint:** `POST /college/api/auth/student-login/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/student-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_johnson",
    "password": "StudentPass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Student login successful",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "user_id": 3,
    "username": "alice_johnson",
    "email": "alice@student.edu",
    "first_name": "Alice",
    "last_name": "Johnson",
    "role": "student",
    "is_active": true,
    "student_id": 5,
    "roll_number": "CSE001",
    "department": "Computer Science",
    "semester": 3
  }
}
```

---

### 5. Admin Login

**Endpoint:** `POST /college/api/auth/admin-login/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/admin-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "AdminPass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "user_id": 4,
    "username": "admin_user",
    "email": "admin@college.edu",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "is_active": true,
    "is_staff": true,
    "is_superuser": true
  }
}
```

---

## Using Access Tokens

### Make Protected API Requests

Include the **access token** in the `Authorization` header using Bearer scheme.

**Example - Get Current User:**
```bash
curl -X GET http://localhost:8000/college/api/auth/current-user/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example - Get All Students:**
```bash
curl -X GET http://localhost:8000/college/api/students/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "count": 50,
  "next": "http://localhost:8000/college/api/students/?page=2",
  "previous": null,
  "results": [
    {
      "student_id": 1,
      "user": 1,
      "roll_number": "CSE001",
      "enrollment_number": "ENR001",
      "admission_date": "2023-07-01",
      "status": "ACTIVE"
    }
  ]
}
```

---

## Token Refresh

### Refresh Access Token

When your access token expires (after 1 hour), use the **refresh token** to get a new access token without re-authenticating.

**Endpoint:** `POST /college/api/auth/token/refresh/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized) - Invalid or Expired Refresh Token:**
```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

## Logout

### Logout and Blacklist Tokens

Blacklist the refresh token to prevent further use (especially important for the refresh token).

**Endpoint:** `POST /college/api/auth/logout/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/logout/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Client-side logout:** Even if the logout endpoint fails or isn't called, simply delete the access and refresh tokens from client storage (localStorage, sessionStorage, cookies) to prevent further API requests.

---

## Change Password

### Update User Password

Requires authentication with valid access token.

**Endpoint:** `POST /college/api/auth/change-password/`

**Request:**
```bash
curl -X POST http://localhost:8000/college/api/auth/change-password/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "SecurePass123!",
    "new_password": "NewSecurePass456!",
    "new_password2": "NewSecurePass456!"
  }'
```

**Response (200 OK):**
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

---

## Get Current User

### Retrieve Authenticated User Info

**Endpoint:** `GET /college/api/auth/current-user/`

**Request:**
```bash
curl -X GET http://localhost:8000/college/api/auth/current-user/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
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
    "department": "Computer Science",
    "semester": 3,
    "cgpa": 3.75
  }
}
```

---

## Token Details

### Access Token
- **Lifetime:** 1 hour
- **Usage:** Include in `Authorization: Bearer {token}` header for all API requests
- **Scope:** Full API access according to user role

### Refresh Token
- **Lifetime:** 7 days
- **Usage:** Send to `/api/auth/token/refresh/` to get new access token
- **Scope:** Can only be used to refresh access tokens
- **Security:** Should be stored securely (HttpOnly cookie preferred)

### Token Algorithm
- **Algorithm:** HS256 (HMAC SHA-256)
- **Signature:** Digitally signed by server using Django secret key
- **Verification:** Automatically verified on each API request

---

## Common Errors

### 401 Unauthorized - Invalid Token
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid"
}
```
**Solution:** 
- Check token is not expired
- Use `/api/auth/token/refresh/` with refresh token to get new access token
- Or login again

### 401 Unauthorized - Missing Token
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solution:** Add `Authorization: Bearer {token}` header to request

### 401 Unauthorized - Malformed Token
```json
{
  "detail": "Invalid token header. No credentials provided."
}
```
**Solution:** Ensure header format is exactly `Bearer {token}` (space between Bearer and token)

### 403 Forbidden - Insufficient Permissions
```json
{
  "detail": "You do not have permission to perform this action."
}
```
**Solution:** 
- Verify user role matches endpoint requirements
- Admin endpoints require is_staff=true
- Faculty endpoints require Faculty model linked to user
- Student endpoints require Student model linked to user

---

## Client Implementation Examples

### JavaScript/React
```javascript
// Store tokens after login
const response = await fetch('http://localhost:8000/college/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const data = await response.json();
localStorage.setItem('access_token', data.tokens.access);
localStorage.setItem('refresh_token', data.tokens.refresh);

// Use token in requests
const apiResponse = await fetch('http://localhost:8000/college/api/students/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// Refresh token when expired
const refreshResponse = await fetch('http://localhost:8000/college/api/auth/token/refresh/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh: localStorage.getItem('refresh_token') })
});

const newData = await refreshResponse.json();
localStorage.setItem('access_token', newData.access);
```

### Python/Requests
```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/college/api/auth/login/',
    json={'username': 'john_doe', 'password': 'SecurePass123!'}
)
tokens = response.json()['tokens']

# Use token in headers
headers = {'Authorization': f'Bearer {tokens["access"]}'}
api_response = requests.get(
    'http://localhost:8000/college/api/students/',
    headers=headers
)

# Refresh token
refresh_response = requests.post(
    'http://localhost:8000/college/api/auth/token/refresh/',
    json={'refresh': tokens['refresh']}
)
new_access_token = refresh_response.json()['access']
```

---

## Security Best Practices

### ✅ Do
- Store refresh tokens in **HttpOnly, Secure cookies** (not localStorage)
- Store access tokens in **memory or secure session storage**
- Use **HTTPS** in production
- Set reasonable token expiration times
- Implement **CORS** restrictions to your frontend domain only
- Validate and sanitize all user inputs
- Use strong passwords (minimum 8 characters recommended)

### ❌ Don't
- Store tokens in **plain localStorage** (XSS vulnerable)
- Send tokens in **query parameters** or URLs
- Log tokens in error messages or debug output
- Use client-side tokens to verify identity (always verify server-side)
- Hardcode credentials in client code
- Share tokens between users or devices
- Disable HTTPS in production

---

## Summary of Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/register/` | Register new user | ❌ |
| POST | `/api/auth/login/` | General login (auto-role) | ❌ |
| POST | `/api/auth/faculty-login/` | Faculty login | ❌ |
| POST | `/api/auth/student-login/` | Student login | ❌ |
| POST | `/api/auth/admin-login/` | Admin login | ❌ |
| POST | `/api/auth/logout/` | Logout & blacklist token | ✅ |
| POST | `/api/auth/token/refresh/` | Refresh access token | ❌ |
| GET | `/api/auth/current-user/` | Get authenticated user info | ✅ |
| POST | `/api/auth/change-password/` | Change user password | ✅ |

