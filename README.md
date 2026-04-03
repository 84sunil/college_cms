# College Management System - Frontend

A responsive React + Vite frontend for the College Management System.

## Features

- ✅ **Responsive Design** - Mobile-first design that works on all devices
- ✅ **JWT Authentication** - Secure login/register with JWT tokens
- ✅ **Role-Based Access** - Different views for Admin, Faculty, and Students
- ✅ **Real-time API Integration** - Connected to Django backend
- ✅ **Modern UI** - Clean and intuitive interface
- ✅ **Fast Build** - Vite provides instant HMR and fast builds

## Quick Start

### Install Dependencies
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── Faculty.jsx
│   │   └── Courses.jsx
│   ├── services/           # API services
│   │   └── api.js
│   ├── context/            # React context
│   │   └── AuthContext.jsx
│   ├── styles/             # Global styles
│   │   ├── global.css
│   │   └── layout.css
│   ├── App.jsx
│   └── main.jsx
├── public/                 # Static assets
├── index.html             # HTML entry point
├── vite.config.js        # Vite configuration
├── package.json
└── .gitignore
```

## Features

### Authentication
- Register new account
- Login with role selection (General, Student, Faculty, Admin)
- JWT token management with auto-refresh
- Logout and token blacklisting

### Admin Panel
- View and search students
- View and search faculty
- View and search courses
- Dashboard with statistics

### Role-Based Views
- **Admin**: Full access to all management features
- **Faculty**: Access to grades and attendance
- **Student**: View courses and grades
- **General**: Basic dashboard access

## API Integration

The frontend connects to the Django backend at `http://localhost:8000/college/api/`

### Endpoints Used
- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/faculty-login/`
- `POST /auth/student-login/`
- `POST /auth/admin-login/`
- `POST /auth/logout/`
- `POST /auth/token/refresh/`
- `GET /auth/current-user/`
- `GET /students/`
- `GET /faculty/`
- `GET /courses/`

## Responsive Design

The application is fully responsive with breakpoints:
- **Desktop** (1024px+): Full layout with sidebar
- **Tablet** (768px - 1023px): Optimized grid layouts
- **Mobile** (< 768px): Stacked layouts and hamburger menu

## Environment Setup

Make sure your Django backend is running on `http://localhost:8000` and CORS is configured properly.

### CORS Configuration (Backend)
The backend should allow requests from `http://localhost:3000`

## Development

### Add New Page
1. Create file in `src/pages/`
2. Create component with functional component
3. Add route in `App.jsx`
4. Add navigation link in `Navbar.jsx`

### Add New API Endpoint
1. Add method in `src/services/api.js`
2. Use in component with async/await
3. Handle loading and error states

## Dependencies

- **React 18.2** - UI library
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool

## Styling

- Global CSS with CSS variables
- Mobile-first responsive design
- BEM naming conventions
- No external CSS frameworks (pure CSS)

## License

MIT
