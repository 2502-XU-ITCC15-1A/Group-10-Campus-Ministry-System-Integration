# Campus Ministries System

The Campus Ministries System is a full-stack web application for Xavier University Ateneo de Cagayan's Campus Ministries. It manages student evaluations, recollection schedules, student records, account access, QR-enabled certificates, certificate verification, reports, and role-based dashboards.

## Features

### Authentication

- Email and password login
- Google login support
- Student, formator, and admin registration
- Forgot password flow for local/demo reset codes
- Test accounts for quick demo access
- Role-based route protection
- Automatic logout after 5 minutes of inactivity

### Student Features

- Student dashboard
- Profile completion and update
- View available recollection schedules
- Register/participate in recollections
- View assigned and available evaluations
- Submit evaluation answers
- View issued certificates

### Formator Features

- Formator dashboard
- View scoped student records
- Monitor evaluations and recollections in assigned scope
- Create and manage evaluations
- Create and manage recollection schedules
- Recommend students for certificates
- Verify QR-enabled certificates

### Admin Features

- Admin dashboard with system statistics
- Manage account listing
- View student records and progress
- Create, assign, and delete evaluations
- Create and manage recollection schedules
- Generate QR-enabled certificates
- Verify certificate QR codes
- View submissions
- Export CSV reports

## Technology Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- React Context API
- Axios
- React Hot Toast
- Google OAuth

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- qrcode certificate generation
- CSV export support

### Deployment

- Docker
- Docker Compose

## Project Structure

```text
CAMPUS-MINISTRY-SYSTEM-main/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   ├── SYSTEM_MANUAL.md
│   └── USER_MANUAL.md
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18 or higher
- npm
- MongoDB 6 or higher, if running without Docker
- Docker and Docker Compose, if running with containers

## Environment Variables

### Backend

Create `backend/.env` when running the backend manually:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecms
JWT_SECRET=change-this-secret-in-production
GOOGLE_CLIENT_ID=your-google-client-id
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@xu.edu.ph
SMTP_PASS=your-email-app-password
SMTP_FROM="Campus Ministries <your-email@xu.edu.ph>"
```

### Frontend

Create `frontend/.env` when running the frontend manually:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Google login is optional. Leave the Google values blank if OAuth is not configured.

Email notification is optional during local development. If the SMTP variables are blank, recollection email notifications are shown in the backend console as email previews instead of being sent.

## Running the Application

### Option 1: Docker Compose

From the project root:

```bash
docker compose up -d
```

Open the application:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:5000/api
```

View running services:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs frontend
docker compose logs backend
```

Rebuild after code changes:

```bash
docker compose build frontend backend
docker compose up -d frontend backend
```

### Option 2: Manual Development Mode

Start MongoDB locally first, then run the backend:

```bash
cd backend
npm install
npm run dev
```

In another terminal, run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Test Accounts

The system can automatically create these test accounts when they are used for login.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `dfabela@xu.edu.ph` | `admin123` |
| Formator | `formator@xu.edu.ph` | `password123` |

## Main Routes

| Area | Route |
| --- | --- |
| Login | `/login` |
| Admin Dashboard | `/admin/dashboard` |
| Formator Dashboard | `/formator/dashboard` |
| Student Dashboard | `/student/dashboard` |
| Student Profile | `/student/profile` |
| Student Records | `/admin/student-records` |
| Manage Accounts | `/admin/manage-accounts` |
| Evaluation Builder | `/admin/evaluations/new` |
| Recollection Schedules | `/admin/recollections` |
| Certificate Generator | `/admin/certificates` |
| Certificate Verification | `/admin/certificate-scan` |
| Data Management | `/admin/data-management` |

## API Summary

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Login with email and password |
| POST | `/api/auth/google` | Login with Google |
| POST | `/api/auth/forgot-password` | Generate password reset code |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/seed` | Seed test data |

### Admin and Formator

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/stats-detailed` | Detailed report statistics |
| GET | `/api/admin/users` | Account list |
| GET | `/api/admin/students` | Student records |
| GET | `/api/admin/evaluations` | List evaluations |
| POST | `/api/admin/evaluations` | Create evaluation |
| DELETE | `/api/admin/evaluations/:id` | Delete evaluation |
| GET | `/api/admin/recollections` | List recollections |
| POST | `/api/admin/recollections` | Create recollection schedule |
| DELETE | `/api/admin/recollections/:id` | Delete recollection |
| POST | `/api/admin/certificates` | Generate certificate |
| POST | `/api/admin/certificates/verify` | Verify certificate QR data |
| GET | `/api/admin/submissions` | View submissions |
| GET | `/api/admin/export-csv` | Export report CSV |
| GET | `/api/formator/dashboard` | Formator dashboard data |
| POST | `/api/formator/certificate-recommendations` | Recommend certificate |

### Student

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/student/dashboard` | Student dashboard data |
| PUT | `/api/student/profile` | Update student profile |
| POST | `/api/student/recollections/:id/participate` | Join recollection |
| POST | `/api/student/evaluations/:id/enroll` | Enroll in evaluation |
| POST | `/api/student/evaluations/:id/submit` | Submit evaluation |

## Validation Commands

Build the frontend:

```bash
cd frontend
npm run build
```

Check backend route and model syntax:

```bash
find backend/routes backend/models -name '*.js' -maxdepth 2 -exec node --check {} \;
```

Check for whitespace errors before committing:

```bash
git diff --check
```

## Documentation

Additional documentation is available in:

- `docs/USER_MANUAL.md` for non-technical users
- `docs/SYSTEM_MANUAL.md` for technical users

## Known Notes

- Forgot password is configured for demo/local use and displays the reset code on screen because no email provider is connected.
- Recollection email notifications require SMTP credentials. Without SMTP credentials, the backend logs email previews.
- Manage Accounts currently lists accounts. Edit and delete account endpoints are not yet implemented.
- QR camera scanning depends on browser support for `BarcodeDetector`. Manual QR verification is available as a fallback.
- Google login requires valid Google OAuth configuration.

## License

This project is prepared for academic and capstone use by the Campus Ministries System team.
