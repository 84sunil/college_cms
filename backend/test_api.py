import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000/college/api"

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    try:
        response = urllib.request.urlopen(req, data=data)
        return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

print("Starting API Tests...")

# 1. Test Student Registration
print("\n1. Testing Student Registration...")
student_data = {
    "role": "student",
    "department": "Computer Science",
    "first_name": "Test",
    "last_name": "Student",
    "username": "teststudent123",
    "email": "student123@test.com",
    "password": "Password123!",
    "password2": "Password123!",
    "roll_number": "CS001",
    "enrollment_number": "EN001",
    "semester": 1
}
status, res = make_request("POST", "/auth/register/", student_data)
print(f"Status: {status}, Response: {res}")

# 2. Test Login
print("\n2. Testing Login...")
login_data = {
    "username": "teststudent123",
    "password": "Password123!"
}
status, login_res = make_request("POST", "/auth/login/", login_data)
print(f"Status: {status}, Response: {login_res}")

token = None
if type(login_res) is dict and "access" in login_res:
    token = login_res["access"]

# 3. Test Current User Profiling
if token:
    print("\n3. Testing Current User Fetch...")
    status, user_res = make_request("GET", "/auth/current-user/", token=token)
    print(f"Status: {status}, Response: {user_res}")
else:
    print("Skipping user fetch (no token)")

print("\nFinished Testing.")
