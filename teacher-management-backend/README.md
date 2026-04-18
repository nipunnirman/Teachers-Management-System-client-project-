# Teacher Management System — Backend API

REST API for the Smart Web-Based Teacher Information and Resource Management System.  
Built with **Node.js + Express + MongoDB** (MEAN Stack backend).

---

## 📁 Project Structure

```
src/
├── server.js                  # Entry point
├── config/
│   └── database.js            # MongoDB connection
├── models/
│   ├── User.js                # Auth user (admin/teacher)
│   ├── Teacher.js             # Teacher profile & details
│   ├── Attendance.js          # Daily attendance records
│   ├── Leave.js               # Leave requests
│   ├── Salary.js              # Monthly salary slips
│   ├── Timetable.js           # Class schedules
│   └── Notification.js        # In-app notifications
├── controllers/
│   ├── authController.js
│   ├── teacherController.js
│   ├── attendanceController.js
│   ├── leaveController.js
│   ├── salaryController.js
│   ├── timetableController.js
│   ├── notificationController.js
│   └── reportController.js
├── routes/
│   ├── authRoutes.js
│   ├── teacherRoutes.js
│   ├── attendanceRoutes.js
│   ├── leaveRoutes.js
│   ├── salaryRoutes.js
│   ├── timetableRoutes.js
│   ├── notificationRoutes.js
│   └── reportRoutes.js
├── middleware/
│   ├── auth.js                # JWT protect + RBAC authorize
│   └── errorHandler.js        # Global error handler
└── utils/
    └── email.js               # Nodemailer email utility
```

---

## ⚙️ Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teacher_management_db
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@teachermanagement.com
FRONTEND_URL=http://localhost:4200
```

### 3. Run the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 🌐 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Admin | Register a new user |
| POST | `/login` | Public | Login & get JWT token |
| GET | `/me` | Private | Get logged-in user |
| POST | `/forgot-password` | Public | Send password reset email |
| POST | `/reset-password/:token` | Public | Reset password via token |
| PUT | `/admin-reset-password/:userId` | Admin | Admin resets any user's password |

### Teachers — `/api/teachers`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | List all teachers (filterable) |
| GET | `/me` | Teacher | Get own profile |
| GET | `/:id` | Private | Get teacher by ID |
| PUT | `/:id` | Admin/Teacher | Update teacher profile |
| DELETE | `/:id` | Admin | Remove teacher |

### Attendance — `/api/attendance`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Admin | Mark attendance |
| GET | `/` | Admin | Get all records (filtered) |
| GET | `/me` | Teacher | Get own attendance |
| PUT | `/:id` | Admin | Edit a record |
| GET | `/report/:teacherId` | Admin | Monthly report |

### Leave — `/api/leaves`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Teacher | Apply for leave |
| GET | `/` | Admin/Teacher | Get leave requests |
| PUT | `/:id/review` | Admin | Approve or reject |
| PUT | `/:id/cancel` | Teacher | Cancel pending request |
| GET | `/balance/:teacherId` | Private | Leave balance |

### Salary — `/api/salary`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/generate` | Admin | Generate salary slip |
| GET | `/` | Admin | All salary records |
| GET | `/me` | Teacher | Own salary history |
| GET | `/:id` | Private | Single salary slip |
| PUT | `/:id` | Admin | Update (bonus/deductions) |
| PUT | `/:id/mark-paid` | Admin | Mark as paid |

### Timetable — `/api/timetable`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Admin | Create entry (conflict check) |
| GET | `/` | Admin | All entries |
| GET | `/me` | Teacher | Own weekly timetable |
| PUT | `/:id` | Admin | Update entry |
| DELETE | `/:id` | Admin | Remove entry |

### Notifications — `/api/notifications`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get my notifications |
| PUT | `/read-all` | Private | Mark all as read |
| PUT | `/:id/read` | Private | Mark one as read |
| POST | `/announce` | Admin | Broadcast announcement |
| DELETE | `/:id` | Private | Delete notification |

### Reports — `/api/reports`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Admin | Overview stats |
| GET | `/attendance` | Admin | Yearly attendance analytics |
| GET | `/leave` | Admin | Leave analytics |
| GET | `/salary` | Admin | Salary analytics |
| GET | `/workload` | Admin | Teacher workload report |

---

## 🔐 Authentication

All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Roles: `admin` | `teacher`

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT + bcryptjs
- **Email**: Nodemailer
- **Validation**: express-validator
