# JWT Authentication - Quick Reference

## Quick Start

### 1. Register & Get Tokens
```bash
curl -X POST http://localhost:8000/college/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@email.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123!",
    "password2": "SecurePass123!"
  }'
```

**Response:** `tokens.access` and `tokens.refresh`

---

### 2. Login & Get Tokens
```bash
curl -X POST http://localhost:8000/college/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "SecurePass123!"}'
```

**Also available:**
- `/api/auth/faculty-login/` - Faculty only
- `/api/auth/student-login/` - Students only
- `/api/auth/admin-login/` - Admins only

---

### 3. Use Access Token for API Calls
```bash
curl -X GET http://localhost:8000/college/api/students/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

### 4. Refresh Access Token (After 1 Hour)
```bash
curl -X POST http://localhost:8000/college/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "YOUR_REFRESH_TOKEN_HERE"}'
```

**Response:** New `access` token

---

### 5. Logout
```bash
curl -X POST http://localhost:8000/college/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refresh": "YOUR_REFRESH_TOKEN_HERE"}'
```

---

## Token Expiry

| Token Type | Lifetime | Use Case |
|-----------|----------|----------|
| **Access** | 1 hour | API requests - Include in `Authorization: Bearer` header |
| **Refresh** | 7 days | Get new access token from refresh endpoint |

---

## Headers for All Protected Endpoints

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Token expired | Use refresh token to get new access token |
| 401 Unauthorized | No token sent | Add `Authorization: Bearer {token}` header |
| 401 Unauthorized | Wrong format | Use `Bearer {token}`, not `Token {token}` |
| 403 Forbidden | Wrong role | Use role-specific login endpoint |

---

## Frontend Storage (React/JS)

**Access Token:** Store in memory/state (most secure)
```javascript
const [accessToken, setAccessToken] = useState(null);
```

**Refresh Token:** Store in HttpOnly cookie (most secure)
```javascript
// Backend sets: Set-Cookie: refresh_token={token}; HttpOnly; Secure
```

---

## All Endpoints

```
POST   /api/auth/register/           - Register (no auth)
POST   /api/auth/login/              - Login (no auth)
POST   /api/auth/faculty-login/      - Faculty login (no auth)
POST   /api/auth/student-login/      - Student login (no auth)
POST   /api/auth/admin-login/        - Admin login (no auth)
POST   /api/auth/token/refresh/      - Refresh token (no auth)
POST   /api/auth/logout/             - Logout (requires token)
GET    /api/auth/current-user/       - Get user info (requires token)
POST   /api/auth/change-password/    - Change password (requires token)
```

