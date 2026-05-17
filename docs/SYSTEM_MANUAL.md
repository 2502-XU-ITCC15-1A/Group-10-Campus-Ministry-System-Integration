# Campus Ministries System Manual

## 1. System Overview

The Campus Ministries System is a full-stack web application for managing recollections, evaluations, student records, account access, certificates, QR verification, and reports.

The system uses:

- React 18 frontend
- Vite development server
- Tailwind CSS styling
- Express.js backend
- MongoDB database
- JWT authentication
- Google OAuth login support
- Docker Compose for local deployment

## 2. Repository Structure

```text
CAMPUS-MINISTRY-SYSTEM-main/
├── backend/
│   ├── models/
│   │   ├── Certificate.js
│   │   ├── CertificateRecommendation.js
│   │   ├── Evaluation.js
│   │   ├── Recollection.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── evaluation.js
│   │   ├── faculty.js
│   │   └── student.js
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── assets/
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
├── docker-compose.yml
└── .gitignore
```

## 3. Architecture Diagram

```text
+----------------+
|  Browser User  |
+----------------+
        |
        v
+----------------------+        +------------------------+
| React + Vite Frontend|------->| Google OAuth Provider  |
+----------------------+        +------------------------+
        |
        v
+----------------------+
| Express API Backend  |
+----------------------+
   |        |        |
   v        v        v
+------+  +-----+  +-------------------+
| JWT  |  | QR  |  | MongoDB Database  |
+------+  +-----+  +-------------------+
```

## 4. Deployment Diagram

```text
+---------------------------------------------------+
|                 Local Docker Host                 |
|                                                   |
|  +-------------------+                            |
|  | frontend          |  Port 3000                 |
|  | React/Vite        |                            |
|  +-------------------+                            |
|            |                                      |
|            v                                      |
|  +-------------------+                            |
|  | backend           |  Port 5000                 |
|  | Express API       |                            |
|  +-------------------+                            |
|            |                                      |
|            v                                      |
|  +-------------------+                            |
|  | db                |  Port 27017                |
|  | MongoDB           |                            |
|  +-------------------+                            |
+---------------------------------------------------+

Browser -> frontend -> backend -> db
```

## 5. Docker Services

Defined in `docker-compose.yml`:

| Service | Purpose | Port |
| --- | --- | --- |
| `frontend` | React/Vite app | `3000` |
| `backend` | Express API | `5000` |
| `db` | MongoDB database | `27017` |

Start all services:

```bash
docker compose up -d
```

Rebuild after code changes:

```bash
docker compose build frontend backend
docker compose up -d frontend backend
```

View service status:

```bash
docker compose ps
```

## 6. Environment Variables

### Backend

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `SMTP_HOST` | SMTP server host for email notifications |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Use secure SMTP connection when set to `true` |
| `SMTP_USER` | SMTP account username |
| `SMTP_PASS` | SMTP account password or app password |
| `SMTP_FROM` | Sender name/email for notifications |
| `PORT` | Backend port |

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

## 7. Authentication Flow

```text
User        Frontend        Backend         MongoDB
 |             |               |               |
 | email/pass  |               |               |
 |------------>|               |               |
 |             | POST /login   |               |
 |             |-------------->|               |
 |             |               | find email    |
 |             |               |-------------->|
 |             |               | user document |
 |             |               |<--------------|
 |             |               | compare bcrypt|
 |             |               | create JWT    |
 |             | token + user  |               |
 |             |<--------------|               |
 | redirect by role            |               |
 |<------------|               |               |
```

## 8. Role-Based Access

| Role | Main Dashboard | Access |
| --- | --- | --- |
| `student` | `/student/dashboard` | Student dashboard, profile, evaluations, recollections, certificates |
| `staff` | `/formator/dashboard` | Formator dashboard, scoped evaluations, scoped recollections, student records, verify certificate |
| `admin` | `/admin/dashboard` | Full admin dashboard, users, students, certificates, reports, recollections |

Route protection is implemented in:

```text
frontend/src/components/ProtectedRoute.jsx
```

## 9. Session Expiration

The frontend logs out authenticated users after 5 minutes of inactivity.

Implemented in:

```text
frontend/src/App.jsx
```

Activity events that reset the timer:

- `click`
- `keydown`
- `mousemove`
- `scroll`
- `touchstart`

## 10. Database Entity Relationship Diagram

Use this section to manually draw the ERD in diagrams.net, Lucidchart, Canva, Word, PowerPoint, or any ERD tool. Create one rectangle per entity. Put the entity name at the top, then list the fields below it. Mark primary keys as `PK` and foreign keys as `FK`.

### 10.1 ERD Entities and Attributes

#### USER

| Field | Type | Key | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | PK | Unique user ID |
| `email` | String |  | User email address |
| `password` | String |  | Hashed password |
| `googleId` | String |  | Google OAuth account ID |
| `role` | String |  | `student`, `staff`, or `admin` |
| `fullName` | String |  | Full name |
| `studentId` | String |  | Student/formator/admin ID |
| `department` | String |  | Assigned department |
| `batch` | String |  | Course and year grouping |
| `assignedEvaluations` | ObjectId[] | FK | References `EVALUATION._id` |
| `registeredRecollections` | ObjectId[] | FK | References `RECOLLECTION._id` |
| `certificates` | ObjectId[] | FK | References `CERTIFICATE._id` |
| `resetPasswordToken` | String |  | Hashed reset token |
| `resetPasswordExpires` | Date |  | Reset token expiration |

#### EVALUATION

| Field | Type | Key | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | PK | Unique evaluation ID |
| `title` | String |  | Evaluation title |
| `description` | String |  | Evaluation description |
| `questions` | Array |  | Evaluation questions |
| `assignedStudents` | ObjectId[] | FK | References `USER._id` |
| `batch` | String |  | Target batch |
| `dueDate` | Date |  | Evaluation deadline |
| `createdBy` | ObjectId | FK | References `USER._id` |
| `submissions` | Array |  | Embedded student submissions |

#### SUBMISSION

`SUBMISSION` is embedded inside `EVALUATION.submissions` in MongoDB. Show it as a separate entity in the ERD for readability.

| Field | Type | Key | Description |
| --- | --- | --- | --- |
| `student` | ObjectId | FK | References `USER._id` |
| `answers` | Object |  | Student answers |
| `submittedAt` | Date |  | Submission date/time |

#### RECOLLECTION

| Field | Type | Key | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | PK | Unique recollection ID |
| `title` | String |  | Recollection title |
| `description` | String |  | Recollection description |
| `date` | Date |  | Schedule date/time |
| `venue` | String |  | Location |
| `department` | String |  | Target department |
| `yearLevel` | String |  | Target year level |
| `facilitator` | String |  | Facilitator name |
| `slots` | Number |  | Maximum participants |
| `participants` | ObjectId[] | FK | References `USER._id` |

#### CERTIFICATE

| Field | Type | Key | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | PK | Unique certificate ID |
| `student` | ObjectId | FK | References `USER._id` |
| `eventName` | String |  | Event/certificate name |
| `eventDate` | Date |  | Event date |
| `qrData` | String |  | QR verification data |
| `qrCode` | String |  | QR image data |
| `status` | String |  | `pending`, `issued`, or `verified` |
| `issuedBy` | ObjectId | FK | References `USER._id` |

#### CERTIFICATE_RECOMMENDATION

| Field | Type | Key | Description |
| --- | --- | --- | --- |
| `_id` | ObjectId | PK | Unique recommendation ID |
| `student` | ObjectId | FK | References `USER._id` |
| `recommendedBy` | ObjectId | FK | References `USER._id` |
| `status` | String |  | Recommendation status |

### 10.2 ERD Relationships

Draw the following relationship lines:

| Parent Entity | Child Entity | Cardinality | Relationship Name |
| --- | --- | --- | --- |
| `USER` | `EVALUATION` | One-to-Many | User creates evaluations |
| `USER` | `SUBMISSION` | One-to-Many | Student submits evaluation answers |
| `EVALUATION` | `SUBMISSION` | One-to-Many | Evaluation contains submissions |
| `USER` | `RECOLLECTION` | Many-to-Many | Student registers for recollections |
| `USER` | `CERTIFICATE` | One-to-Many | Student receives certificates |
| `USER` | `CERTIFICATE` | One-to-Many | Admin issues certificates |
| `USER` | `CERTIFICATE_RECOMMENDATION` | One-to-Many | Student receives recommendations |
| `USER` | `CERTIFICATE_RECOMMENDATION` | One-to-Many | Formator creates recommendations |

### 10.3 Foreign Key Mapping

Use these links when drawing connectors:

| Foreign Key | References |
| --- | --- |
| `EVALUATION.createdBy` | `USER._id` |
| `EVALUATION.assignedStudents[]` | `USER._id` |
| `EVALUATION.submissions.student` | `USER._id` |
| `RECOLLECTION.participants[]` | `USER._id` |
| `USER.registeredRecollections[]` | `RECOLLECTION._id` |
| `CERTIFICATE.student` | `USER._id` |
| `CERTIFICATE.issuedBy` | `USER._id` |
| `USER.certificates[]` | `CERTIFICATE._id` |
| `CERTIFICATE_RECOMMENDATION.student` | `USER._id` |
| `CERTIFICATE_RECOMMENDATION.recommendedBy` | `USER._id` |

### 10.4 Recommended ERD Layout

Use this layout when drawing the ERD:

```text
                         USER
                          |
        ---------------------------------------
        |            |            |           |
        v            v            v           v
   EVALUATION   RECOLLECTION  CERTIFICATE  CERTIFICATE_RECOMMENDATION
        |
        v
   SUBMISSION
```

Recommended placement:

- Put `USER` at the top or center.
- Put `EVALUATION` below-left of `USER`.
- Put `SUBMISSION` directly below `EVALUATION`.
- Put `RECOLLECTION` beside `EVALUATION`.
- Put `CERTIFICATE` to the right of `USER`.
- Put `CERTIFICATE_RECOMMENDATION` beside `CERTIFICATE`.

### 10.5 ERD Drawing Steps

1. Create a rectangle named `USER`.
2. Add all `USER` fields and mark `_id` as `PK`.
3. Create rectangles for `EVALUATION`, `SUBMISSION`, `RECOLLECTION`, `CERTIFICATE`, and `CERTIFICATE_RECOMMENDATION`.
4. Add each entity's fields from the tables above.
5. Mark all `_id` fields as `PK`.
6. Mark reference fields as `FK`.
7. Draw a one-to-many connector from `USER` to `EVALUATION` using `EVALUATION.createdBy`.
8. Draw a one-to-many connector from `EVALUATION` to `SUBMISSION`.
9. Draw a one-to-many connector from `USER` to `SUBMISSION` using `SUBMISSION.student`.
10. Draw a many-to-many connector between `USER` and `RECOLLECTION`.
11. Draw one-to-many connectors from `USER` to `CERTIFICATE` for both `student` and `issuedBy`.
12. Draw one-to-many connectors from `USER` to `CERTIFICATE_RECOMMENDATION` for both `student` and `recommendedBy`.
13. Label each connector with its relationship name, such as `creates`, `submits`, `registers`, `receives`, `issues`, and `recommends`.

### 10.6 Notes for Presentation

- `USER` is the central entity because students, formators, and admins are stored in the same collection.
- The `role` field determines user permissions.
- `SUBMISSION` is embedded in `EVALUATION` in the database, but shown separately in the ERD for clarity.
- `RECOLLECTION` has a many-to-many relationship with `USER` through `participants` and `registeredRecollections`.
- `CERTIFICATE` has two relationships with `USER`: the student who receives it and the admin who issues it.
- `CERTIFICATE_RECOMMENDATION` also has two relationships with `USER`: the student being recommended and the formator who recommended them.

## 11. Data Models

### User

File:

```text
backend/models/userSchema.js
```

Important fields:

```js
email, password, googleId, role, fullName, studentId,
department, batch, assignedEvaluations,
registeredRecollections, certificates,
resetPasswordToken, resetPasswordExpires
```

### Certificate

File:

```text
backend/models/certificatesSchema.js
```

Important fields:

```js
student, eventName, eventDate, qrData, qrCode, status, issuedBy
```

### Recollection

File:

```text
backend/models/Recollection.js
```

Used for schedule creation, student visibility, and participant registration.

### Evaluation

File:

```text
backend/models/Evaluation.js
```

Used for evaluation creation, assignment, enrollment, and submissions.

## 12. API Route Summary

### Authentication

Base path:

```text
/api/auth
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/login` | Email/password login |
| `POST` | `/google` | Google login |
| `POST` | `/forgot-password` | Generate reset token |
| `POST` | `/reset-password` | Reset password using token |
| `POST` | `/seed` | Seed test accounts |

### Admin

Base path:

```text
/api/admin
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/stats` | Admin dashboard stats |
| `GET` | `/stats-detailed` | Detailed report stats |
| `GET` | `/users` | Account listing |
| `GET` | `/students` | Student listing |
| `GET` | `/evaluations` | Evaluation listing |
| `POST` | `/evaluations` | Create evaluation |
| `DELETE` | `/evaluations/:id` | Delete evaluation |
| `GET` | `/recollections` | List recollections |
| `POST` | `/recollections` | Create recollection |
| `DELETE` | `/recollections/:id` | Delete recollection |
| `POST` | `/certificates` | Generate certificate |
| `POST` | `/certificates/verify` | Verify certificate QR data |
| `GET` | `/submissions` | List submissions |
| `GET` | `/export-csv` | Export CSV report |

### Formator

Base path:

```text
/api/formator
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/dashboard` | Formator dashboard data |
| `POST` | `/certificate-recommendations` | Recommend student certificate |

### Student

Base path:

```text
/api/student
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/dashboard` | Student dashboard data |
| `PUT` | `/profile` | Update student profile |
| `POST` | `/recollections/:id/participate` | Register for recollection |
| `POST` | `/evaluations/:id/enroll` | Self-enroll in evaluation |
| `POST` | `/evaluations/:id/submit` | Submit evaluation |

## 13. Main Frontend Components

| Component | Purpose |
| --- | --- |
| `Login.jsx` | Login, Google login, forgot password |
| `AdminDashboard.jsx` | Admin overview |
| `FacultyDashboard.jsx` | Formator scoped overview |
| `StudentDashboard.jsx` | Student recollections, evaluations, certificates |
| `ManageAccounts.jsx` | Account listing |
| `StudentRecords.jsx` | Student listing and progress |
| `EvaluationBuilder.jsx` | Evaluation creation |
| `RecollectionScheduleManager.jsx` | Recollection creation/listing |
| `CertificateGenerator.jsx` | Certificate generation |
| `CertificateScanner.jsx` | QR certificate verification |
| `DataManagement.jsx` | Submissions and CSV export |

## 14. Key Code Snippets

### API Client

File:

```text
frontend/src/services/api.js
```

Purpose:

- Sets API base URL
- Adds JSON headers
- Redirects to login on unauthorized responses

### JWT Login Response

File:

```text
backend/routes/auth.js
```

Purpose:

- Signs JWT
- Returns user data to frontend
- Redirect logic is handled by `Login.jsx`

### Certificate QR Generation

File:

```text
backend/routes/certGenerationRoutes.js
```

Process:

1. Admin selects student and event details.
2. Backend creates QR data.
3. Backend generates QR image with `qrcode`.
4. Certificate is saved to MongoDB.
5. Student receives certificate reference.

### Certificate Verification

File:

```text
backend/routes/certVerificationRoutes.js
```

Endpoint:

```text
POST /api/admin/certificates/verify
```

The endpoint accepts QR data and returns whether the certificate exists and is valid.

## 15. Recollection Flow Diagram

```text
Admin/Formator -> Frontend: Create recollection schedule
Frontend      -> Backend : POST /api/admin/recollections
Backend       -> MongoDB : Save recollection

Student       -> Frontend: Open Student Dashboard
Frontend      -> Backend : GET /api/student/dashboard
Backend       -> MongoDB : Find recollections by department and year level
MongoDB       -> Backend : Matching recollections
Backend       -> Frontend: recollectionSchedules
Frontend      -> Student : Show Participate button

Student       -> Frontend: Click Participate
Frontend      -> Backend : POST /api/student/recollections/:id/participate
Backend       -> MongoDB : Add student to participants
```

## 16. Evaluation Flow Diagram

```text
Admin/Formator -> Frontend: Create evaluation
Frontend      -> Backend : POST /api/admin/evaluations
Backend       -> MongoDB : Save evaluation and assigned students

Student       -> Frontend: Open dashboard
Frontend      -> Backend : GET /api/student/dashboard
Backend       -> MongoDB : Find assigned pending evaluations
Backend       -> Frontend: pendingEvaluations

Student       -> Frontend: Submit answers
Frontend      -> Backend : POST /api/student/evaluations/:id/submit
Backend       -> MongoDB : Save submission
```

## 17. Certificate Flow Diagram

```text
Admin        -> Frontend: Generate certificate
Frontend     -> Backend : POST /api/admin/certificates
Backend      -> Backend : Generate qrData and qrCode
Backend      -> MongoDB : Save certificate
Frontend     -> Admin   : Show QR code

Scanner Page -> Backend : POST /api/admin/certificates/verify
Backend      -> MongoDB : Find certificate by QR data
Backend      -> Scanner : Valid or invalid certificate info
```

## 18. Security Notes

- Passwords are hashed with bcrypt.
- JWT tokens are used for authenticated routes.
- Role checks are performed in backend route middleware.
- Frontend protected routes redirect unauthorized users.
- Session expires after 5 minutes of inactivity.
- Password reset tokens expire after 15 minutes.

## 19. Known Technical Limitations

- Forgot password is demo/local mode; no email provider is configured.
- Manage Accounts is read-only because admin edit/delete user endpoints are not implemented.
- Camera QR scanning depends on browser support for `BarcodeDetector`; manual verification is available as fallback.
- `frontend/dist` changes are generated build output.

## 20. Developer Commands

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Docker:

```bash
docker compose up -d
docker compose build frontend backend
docker compose up -d frontend backend
docker compose logs frontend
docker compose logs backend
```

Validation:

```bash
cd frontend
npm run build
```

```bash
cd ..
find backend/routes backend/models -name '*.js' -maxdepth 2 -exec node --check {} \;
git diff --check
```
