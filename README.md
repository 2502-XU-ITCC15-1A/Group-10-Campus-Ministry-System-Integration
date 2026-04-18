Campus Ministry E-Certification System (eCMS)

The XU Campus Ministry Evaluation & Certification System (eCMS) is a full-stack web application developed as a capstone project. It is designed to digitize, centralize, and optimize the evaluation and certification processes of the Xavier University Campus Ministry.
System Architecture
Frontend Layer
•	Framework: React.js
•	Styling: Tailwind CSS
•	State Management: React Context API
•	Form Handling: React Hook Form
•	HTTP Client: Axios
Backend Layer
•	Runtime: Node.js
•	Framework: Express.js
•	Database: MongoDB (Mongoose)
•	Authentication: JWT & bcryptjs
•	QR Code Generation: qrcode library
 
Security Mechanisms
•	Role-Based Access Control (RBAC)
•	Input Validation & Sanitization
•	Password Hashing Middleware
•	Secure API Communication via Axios Interceptors
 
System Modules
1. Authentication Module
•	User login
•	Token generation and validation
•	Role management
2. Evaluation Management Module
•	Creation of evaluation templates
•	Assignment to student groups
•	Submission handling
3. Student Module
•	Dashboard for pending evaluations
•	Evaluation form interface
•	Certificate viewing
4. Certificate Module
•	Automated certificate generation
•	QR code integration for verification
5. Analytics Module
•	Real-time statistics
•	Submission tracking
•	Participation monitoring
 
Database Design
Entities
•	User
o	Stores credentials, role, and assigned evaluations
•	Evaluation
o	Contains questions, structure, and submissions
•	Certificate
o	Stores issued certificates with QR code data
 
 System Workflow
1.	Admin creates an evaluation form
2.	Admin assigns evaluation to specific student groups
3.	Students log in and complete assigned evaluations
4.	System records and validates submissions
5.	Admin monitors analytics via dashboard
6.	Certificates are generated and issued automatically
   
 Deployment Strategy
•	Dockerized backend for consistent deployment
•	Environment-based configuration using .env
•	Local and containerized execution supported

Requirements
- Node.js (v20+)
- MongoDB
- Docker

Steps 
- npm install 
- npm run dev 
- Configure .env: 
- PORT=5000 
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_secure_random_secret

