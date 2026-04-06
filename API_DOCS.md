# TruLearnix API Documentation

**Base URL:** `https://api.trulearnix.com/api`

All protected routes require: `Authorization: Bearer <accessToken>`

---

## 🔐 Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login |
| POST | `/auth/verify-otp` | No | Verify email OTP |
| POST | `/auth/resend-otp` | No | Resend OTP |
| POST | `/auth/refresh-token` | No | Refresh access token |
| POST | `/auth/forgot-password` | No | Send reset OTP |
| POST | `/auth/reset-password` | No | Reset password |
| POST | `/auth/logout` | Yes | Logout |

---

## 👤 Users

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/users/me` | Yes | All | Get current user |
| PUT | `/users/me` | Yes | All | Update profile |
| POST | `/users/avatar` | Yes | All | Upload avatar |
| GET | `/users/enrolled-courses` | Yes | Student | Get enrollments |
| GET | `/users/notifications` | Yes | All | Get notifications |

---

## 📚 Courses

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/courses` | No | - | List published courses |
| GET | `/courses/:slug` | No | - | Get course details |
| GET | `/courses/:id/content` | Yes | Student | Get full course content |
| POST | `/courses` | Yes | Mentor | Create course |
| PUT | `/courses/:id` | Yes | Mentor | Update course |
| PATCH | `/courses/:id/submit` | Yes | Mentor | Submit for review |
| GET | `/courses/my-courses` | Yes | Mentor | Get mentor's courses |
| POST | `/courses/:id/progress` | Yes | Student | Mark lesson complete |
| POST | `/courses/:id/review` | Yes | Student | Add review |

---

## 💳 Payments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/payments/create-order` | Yes | Create Razorpay order |
| POST | `/payments/verify` | Yes | Verify payment |
| GET | `/payments/history` | Yes | Payment history |

---

## 🎥 Live Classes

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/classes/upcoming` | Yes | All | Get upcoming classes |
| POST | `/classes` | Yes | Mentor | Create class (Zoom/WebRTC) |
| GET | `/classes/:id/join` | Yes | All | Get join link |
| PATCH | `/classes/:id/start` | Yes | Mentor | Start class |
| PATCH | `/classes/:id/end` | Yes | Mentor | End class |
| DELETE | `/classes/:id` | Yes | Mentor | Cancel class |

---

## 🧠 Quizzes

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/quizzes` | Yes | Mentor | Create quiz |
| PUT | `/quizzes/:id` | Yes | Mentor | Update quiz |
| GET | `/quizzes/:id` | Yes | Student | Get quiz (no answers) |
| POST | `/quizzes/:id/submit` | Yes | Student | Submit quiz answers |
| GET | `/quizzes/my-quizzes` | Yes | Mentor | Get mentor's quizzes |

---

## 📜 Certificates

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/certificates/claim/:courseId` | Yes | Generate & claim certificate |
| GET | `/certificates/my` | Yes | Get my certificates |
| GET | `/certificates/verify/:id` | No | Verify certificate |

---

## 💰 Wallet

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/wallet` | Yes | Get balance + recent transactions |
| POST | `/wallet/withdraw` | Yes | Request withdrawal |
| GET | `/wallet/transactions` | Yes | Transaction history |

---

## 🔗 Affiliate

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/affiliate/stats` | Yes | Affiliate stats + earnings |
| GET | `/affiliate/referrals` | Yes | List referrals |

---

## 🛠️ Admin (Admin only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/dashboard` | Dashboard stats + charts |
| GET | `/admin/users` | All users (filterable) |
| PATCH | `/admin/users/:id/toggle` | Activate/suspend user |
| GET | `/admin/courses/pending` | Pending approval courses |
| PATCH | `/admin/courses/:id/approve` | Approve course |
| PATCH | `/admin/courses/:id/reject` | Reject course |
| GET | `/admin/tickets` | Support tickets |
| PATCH | `/admin/tickets/:id` | Update ticket |

---

## 📤 Upload

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/upload/video` | Mentor/Admin | Upload video to S3 |
| POST | `/upload/image` | Yes | Upload image to S3 |
| POST | `/upload/document` | Yes | Upload document to S3 |
| GET | `/upload/signed-url/:key` | Yes | Get signed URL for private video |

---

## 📝 Assignments

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/assignments` | Yes | Mentor | Create assignment |
| GET | `/assignments/course/:courseId` | Yes | All | Get course assignments |
| POST | `/assignments/:id/submit` | Yes | Student | Submit assignment |
| POST | `/assignments/:id/review/:studentId` | Yes | Mentor | Review submission |

---

## Socket.io Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-class` | Client→Server | `{classId, userId, userName}` | Join class room |
| `class-message` | Client→Server | `{classId, userId, userName, message}` | Send chat message |
| `new-message` | Server→Client | `{userId, userName, message, timestamp}` | Receive message |
| `user-joined` | Server→Client | `{userId, userName}` | User joined notification |
| `raise-hand` | Client→Server | `{classId, userId, userName}` | Raise hand |
| `webrtc-offer` | Client→Server | `{classId, offer, senderId}` | WebRTC offer |
| `webrtc-answer` | Client→Server | `{classId, answer, senderId}` | WebRTC answer |
| `webrtc-ice-candidate` | Client→Server | `{classId, candidate, senderId}` | ICE candidate |
| `notification` | Server→Client | `{type, message}` | Push notification |

---

## Database Schemas

### Collections
- **users** - Auth, profiles, wallet, notifications
- **courses** - Course content, modules, lessons
- **enrollments** - Student-course relationship, progress
- **quizzes** - Questions, options, answers
- **liveclasses** - Scheduled sessions, attendance
- **payments** - Razorpay transactions
- **transactions** - Wallet history
- **certificates** - Issued certificates
- **assignments** - Course assignments + submissions
- **supporttickets** - Help & support
