# Quick Authentication Guide

## Login Endpoints Quick Reference

### 1. **General Login** (Auto-detect role)
```
POST /college/api/auth/login/
{
  "username": "your_username",
  "password": "your_password"
}
```
✅ Use this for: Normal login - system detects if you're Admin/Faculty/Student

---

### 2. **Faculty Login** (Faculty Only)
```
POST /college/api/auth/faculty-login/
{
  "username": "prof_username",
  "password": "prof_password"
}
```
✅ Use this for: Faculty members - redirects to faculty-specific dashboard
❌ Returns error if user is not a faculty member

---

### 3. **Student Login** (Student Only)
```
POST /college/api/auth/student-login/
{
  "username": "student_username",
  "password": "student_password"
}
```
✅ Use this for: Students - redirects to student portal
❌ Returns error if user is not a student

---

### 4. **Admin Login** (Admin Only)
```
POST /college/api/auth/admin-login/
{
  "username": "admin_username",
  "password": "admin_password"
}
```
✅ Use this for: Administrators and system staff
❌ Returns error if user doesn't have admin privileges

---

## Login Response Format

### Success Response (All Roles)
```json
{
  "success": true,
  "message": "Login successful as [role]",
  "token": "token_string_here",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "student|faculty|admin",
    "is_active": true,
    /* Role-specific data below */
    "roll_number": "CS2022001",  // For students
    "department": "Computer Science",
    "semester": 3,
    "cgpa": 3.75,
    "status": "ACTIVE"
  }
}
```

### Error Responses

**Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

**Account Disabled:**
```json
{
  "success": false,
  "message": "User account is disabled"
}
```

**Wrong Role (e.g., student trying faculty-login):**
```json
{
  "success": false,
  "message": "User is not registered as faculty"
}
```

---

## After Login - Using Token

### Include token in all authenticated requests:

```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
     http://localhost:8000/college/api/endpoint/
```

---

## Other Auth Endpoints

### Get Current User Info
```
GET /college/api/auth/current-user/
Header: Authorization: Token YOUR_TOKEN
```

### Change Password
```
POST /college/api/auth/change-password/
Header: Authorization: Token YOUR_TOKEN
Data:
{
  "old_password": "current_password",
  "new_password": "new_password",
  "new_password2": "new_password"
}
```

### Logout
```
POST /college/api/auth/logout/
Header: Authorization: Token YOUR_TOKEN
```

---

## User Roles & Access

| Role | Who | Access | Login Endpoint |
|------|-----|--------|---------|
| **Admin** | System administrators | Full system access | `/admin-login/` |
| **Faculty** | Teachers/Instructors | Course management, grade entry, attendance | `/faculty-login/` |
| **Student** | Enrolled students | View grades, enrollment, attendance | `/student-login/` |
| **User** | Unassigned | Limited access | `/login/` |

---

## Complete Login Workflow

### Step 1: Login
```bash
curl -X POST http://localhost:8000/college/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "YourPassword123"
  }'
```

**Response contains: `token`**

### Step 2: Use Token for Protected Endpoints
```bash
curl http://localhost:8000/college/api/auth/current-user/ \
  -H "Authorization: Token THE_TOKEN_FROM_STEP1"
```

### Step 3: Logout
```bash
curl -X POST http://localhost:8000/college/api/auth/logout/ \
  -H "Authorization: Token THE_TOKEN_FROM_STEP1"
```

---

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Check username & password spelling |
| "User is not registered as faculty" | Use `/login/` or create faculty profile first |
| "Token not working" | Token may have expired - login again |
| "Access denied" | Check Authorization header format |

---

## Frontend Integration Example

### JavaScript/React
```javascript
// Login
const response = await fetch('/college/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: 'YourPassword123'
  })
});

const data = await response.json();
const token = data.token;

// Store token
localStorage.setItem('token', token);

// Use in requests
fetch('/college/api/students/', {
  headers: { 'Authorization': `Token ${token}` }
});
```

---

## Security Reminders

🔒 **Always:**
- Use HTTPS in production
- Store tokens securely (not in localStorage for sensitive apps)
- Never log or display tokens
- Logout before closing the app

🚫 **Never:**
- Hardcode passwords
- Send tokens in URL
- Share tokens with others
- Use weak passwords

---

For detailed documentation, see: [AUTHENTICATION.md](AUTHENTICATION.md)
