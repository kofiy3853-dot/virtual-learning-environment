# University LMS - Backend (Phase 1 & 2)

A production-ready RESTful API for a University Learning Management System (LMS) built with Node.js, Express, MongoDB, and Socket.io.

## Phase 1 Features
- **User Roles**: Student, Teacher, and Super Admin.
- **Auth**: JWT-based security with bcrypt.
- **Courses**: CRUD for courses, modules, and content.
- **Assignments**: Submission system with Cloudinary support.

## Phase 2 Features
- **Grades & Analytics**: Weighted grading, pass/fail rates, and at-risk student tracking.
- **Quiz System**: Auto-grading for MCQs/TF and manual grading for short answers.
- **Attendance**: Bulk marking and percentage tracking.
- **Communication**: Real-time chat (Socket.io), threaded discussions, and announcements.
- **Live Classroom**: Time-gated virtual room management (Daily.co integration).

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Security**: Helmet, Rate Limiting, Mongo Sanitize, JWT.

## Installation
1. Clone the repository.
2. Navigate to `backend`: `cd backend`
3. Install dependencies: `npm install`
4. Update `.env` with your API keys.
5. Start server: `npm run dev`

## API Endpoints (Phase 2 Additions)

### Grades
- `GET /api/students/me/grades`
- `GET /api/courses/:id/grade-weights`
- `GET /api/courses/:id/gradebook`

### Quizzes
- `POST /api/courses/:id/quizzes`
- `POST /api/quizzes/:id/start`
- `POST /api/quizzes/:id/submit`

### Attendance
- `POST /api/courses/:id/attendance`
- `GET /api/courses/:id/attendance/summary`
- `POST /api/attendance/:sessionId/mark`

### Communication
- `POST /api/courses/:id/announcements`
- `GET /api/messages/:userId`
- `GET /api/notifications/me`

### Live Sessions
- `POST /api/courses/:id/live-sessions`
- `GET /api/live-sessions/:id/join`
