# Campus Ministries System User Manual

## 1. Introduction

The Campus Ministries System is a web application for managing student recollections, evaluations, certificates, account access, and certificate verification. It supports three user roles:

- Student
- Formator
- Admin

The application runs in a browser. The local system address is usually:

```text
http://localhost:3000
```

## 2. Test Accounts

Use these accounts for testing:

| Role | Email | Password |
| --- | --- | --- |
| Formator | `formator@xu.edu.ph` | `password123` |
| Admin | `dfabela@xu.edu.ph` | `admin123` |

## 3. Signing In

1. Open the login page.
2. Enter your school email.
3. Enter your password.
4. Click **Log In**.

After logging in, the system redirects you based on your role:

- Student: Student Dashboard
- Formator: Formator Dashboard
- Admin: Admin Dashboard

## 4. Google Login

If Google login is configured:

1. Click **Sign in with Google**.
2. Choose your school Google account.
3. Complete Google verification.

Students who sign in using Google may need to complete their student profile before seeing schedules and evaluations.

## 5. Forgot Password

1. On the login page, click **Forgot password?**
2. Enter your registered school email.
3. Click **Get Code**.
4. Enter the reset code shown by the system.
5. Enter and confirm your new password.
6. Click **Reset Password**.
7. Return to login and sign in with the new password.

Note: In this local/demo version, the reset code is shown on screen because email delivery is not configured.

## 6. Session Timeout

For security, the system automatically logs users out after 5 minutes of no activity.

Activity includes:

- Clicking
- Typing
- Moving the mouse
- Scrolling
- Touching the screen

When the session expires, the system returns to the login page.

## 7. Student Guide

### 7.1 Student Dashboard

The Student Dashboard shows:

- Recollection schedules
- Announcements
- Pending evaluations
- Available evaluations
- Certificates

### 7.2 Complete Student Profile

If your profile is incomplete:

1. Click **Edit Student Profile**.
2. Fill in your department, course, and year level.
3. Save the profile.
4. Return to the dashboard.

Your profile information is used to show the correct recollection schedules.

### 7.3 Register for a Recollection

1. Go to the Student Dashboard.
2. Find the **Recollection Schedules** section.
3. Review the date, venue, department, year level, and available slots.
4. Click **Participate**.

The button changes to **Registered** after successful registration.

Students only see recollections matching their department and year level.

### 7.4 Submit Evaluations

1. Go to **Pending Evaluations**.
2. Open the evaluation form.
3. Answer all required questions.
4. Submit the form.

Submitted evaluations are removed from the pending list.

### 7.5 Enroll in Available Evaluations

If available evaluations are shown:

1. Review the evaluation details.
2. Click **Enroll**.
3. The evaluation is added to your assigned/pending evaluations.

### 7.6 View Certificates

The **Your Certificates** section displays issued certificates and QR codes. The QR code can be scanned by authorized users to verify the certificate.

## 8. Formator Guide

### 8.1 Formator Dashboard

The Formator Dashboard shows:

- Assigned students
- Completed students
- Pending students
- Evaluations
- Recollections
- Recent certificate recommendations

Formator accounts are scoped to their assigned department and batch.

### 8.2 Create Evaluation

1. Click **Create Evaluation**.
2. Fill in the evaluation title, description, questions, batch, and due date.
3. Select students or allow the system to auto-assign students based on batch.
4. Submit the evaluation.

Formator accounts can only create evaluations within their assigned scope.

### 8.3 Create Recollection Schedule

1. Click **Recollections**.
2. Fill in the recollection title, date, venue, department, year level, facilitator, and slots.
3. Submit the schedule.

Matching students will see the schedule on their dashboard.

### 8.4 View Student Records

1. Click **Student Records**.
2. Search students by name, email, student ID, batch, or department.
3. Use the completion filter if needed.

Formator accounts only see students in their assigned scope.

### 8.5 Recommend a Certificate

1. Go to Formator Dashboard.
2. Find an assigned student.
3. Click **Recommend**.

The recommendation is sent to admin for certificate processing.

### 8.6 Verify Certificate

1. Click **Verify Certificate**.
2. Start camera scanning or paste QR data manually.
3. The system shows whether the certificate is valid.

## 9. Admin Guide

### 9.1 Admin Dashboard

The Admin Dashboard shows:

- Total evaluations
- Pending evaluations
- Total students
- Certificates
- Submissions
- Recent evaluations

### 9.2 Manage Accounts

1. Click **Manage Accounts**.
2. View all registered accounts.
3. Search by name, email, role, or batch.
4. Filter by role.

Current account management is read-only. Account creation is handled through registration.

### 9.3 Student Records

1. Click **Student Records**.
2. View student details and completion progress.
3. Search or filter students.

### 9.4 Generate Certificates

1. Click **Certificates**.
2. Filter students by batch, year level, or evaluation status.
3. Select a student.
4. Enter event name and event date.
5. Click **Generate Certificate**.

The system generates a certificate record and QR code.

### 9.5 Verify Certificates

1. Click **Verify Certificate**.
2. Use camera scan or paste QR data manually.
3. View verification status and certificate details.

### 9.6 Recollection Management

Admins can:

- Create recollection schedules
- View schedules
- View registrants
- Delete schedules

### 9.7 Data Management

Admins can:

- View submission statistics
- View recent submissions
- Export reports as CSV

## 10. Common Problems

### Login failed

Check:

- Email spelling
- Password
- Backend service is running

### Student cannot see recollection

Check:

- Student profile is complete
- Student department matches the recollection department
- Student year level matches the recollection year level
- Recollection date is not in the past

### Google login not available

Google login requires a configured Google Client ID.

### Camera scanner does not work

Some browsers do not support built-in QR camera scanning. Use the manual QR data field instead.
