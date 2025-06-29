# 🔧 **Backend Technical Guide - Dana Bersama**

**Update Terakhir:** 19 Desember 2024  
**Status:** ✅ Complete - Ready for Frontend Integration

---

## 📁 **Struktur Backend**

```
src/backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── config/
│   │   └── database.js         # Database connection config
│   ├── controllers/            # ✅ All controllers implemented
│   │   ├── authController.js   # Authentication (register, login)
│   │   ├── expenseController.js # Expense CRUD + statistics
│   │   ├── goalController.js   # Goal CRUD + contributions
│   │   ├── reportController.js # Financial analytics
│   │   └── userController.js   # User profile + couple management
│   ├── middleware/             # ✅ All middleware ready
│   │   ├── auth.js            # JWT authentication
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── validation.js      # Input validation
│   │   └── *Validation.js     # Specific validations per controller
│   ├── models/                # ✅ All models with associations
│   │   ├── User.js           # User model with couple relationship
│   │   ├── Couple.js         # Couple partnership model
│   │   ├── Expense.js        # Expense model with sharing
│   │   ├── Goal.js           # Goal model with contributions
│   │   ├── Transaction.js    # Transaction history
│   │   └── index.js          # Model associations
│   ├── routes/               # ✅ All routes configured
│   │   ├── auth.js          # /api/auth/*
│   │   ├── expenses.js      # /api/expenses/*
│   │   ├── goals.js         # /api/goals/*
│   │   ├── reports.js       # /api/reports/*
│   │   └── users.js         # /api/users/*
│   └── utils/
│       └── logger.js        # Logging utility
├── tests/                   # ✅ Comprehensive testing
│   ├── controllers/         # Controller unit tests
│   ├── models/             # Model tests
│   ├── integration/        # API integration tests
│   └── utils/              # Test helpers
├── database/               # ✅ Database setup
│   ├── migrate.js         # Database migration
│   └── seed.js            # Sample data seeding
├── package.json           # Dependencies and scripts
├── jest.config.js         # Testing configuration
└── .env.example          # Environment variables template
```

---

## 🗄️ **Database Schema**

### **Users Table**
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- full_name
- phone
- date_of_birth
- profile_picture
- couple_id (Foreign Key to Couples)
- created_at, updated_at
```

### **Couples Table**
```sql
- id (Primary Key)
- couple_name
- user1_id (Foreign Key to Users)
- user2_id (Foreign Key to Users)
- created_at, updated_at
```

### **Expenses Table**
```sql
- id (Primary Key)
- user_id (Foreign Key to Users)
- couple_id (Foreign Key to Couples, nullable)
- title
- amount (Integer, in Rupiah)
- category
- description
- expense_date
- is_shared (Boolean)
- created_at, updated_at
```

### **Goals Table**
```sql
- id (Primary Key)
- user_id (Foreign Key to Users)
- couple_id (Foreign Key to Couples, nullable)
- title
- target_amount (Integer)
- current_amount (Integer, default 0)
- category
- description
- target_date
- priority (low/medium/high)
- status (active/completed/paused)
- is_shared (Boolean)
- created_at, updated_at
```

### **Transactions Table**
```sql
- id (Primary Key)
- user_id (Foreign Key to Users)
- goal_id (Foreign Key to Goals, nullable)
- expense_id (Foreign Key to Expenses, nullable)
- amount (Integer)
- transaction_type (expense/goal_contribution)
- description
- transaction_date
- created_at, updated_at
```

---

## 🔐 **Authentication Flow**

### **JWT Implementation**
- **Token Generation**: Login/Register menghasilkan JWT token
- **Token Validation**: Middleware `auth.js` memvalidasi setiap request
- **Token Payload**: `{ id: user_id, email: user_email }`
- **Token Expiry**: 24 jam (configurable di .env)

### **Protected Routes**
Semua routes kecuali `/api/auth/*` memerlukan authentication:
```javascript
// Header yang diperlukan
Authorization: Bearer <jwt_token>
```

---

## 📊 **API Response Format**

### **Success Response**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

### **Pagination Response**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

## 🧪 **Testing**

### **Test Coverage**
- ✅ **Unit Tests**: Semua controllers dan models
- ✅ **Integration Tests**: API endpoints end-to-end
- ✅ **Validation Tests**: Input validation dan error handling
- ✅ **Authentication Tests**: JWT token validation

### **Running Tests**
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Test coverage report
```

---

## 🔧 **Development Scripts**

```bash
# Development
npm run dev                # Start development server with nodemon
npm start                  # Start production server

# Database
npm run migrate           # Run database migrations
npm run seed              # Seed sample data
npm run db:reset          # Reset database (migrate + seed)

# Testing
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:server       # Start test server for manual testing

# Utilities
npm run lint              # ESLint code checking
npm run format            # Prettier code formatting
```

---

## 🔗 **Integration Points untuk Frontend**

### **1. Authentication Flow**
```javascript
// Login
POST /api/auth/login
// Simpan token di AsyncStorage/SecureStore
// Set token di axios default headers
```

### **2. Data Fetching Pattern**
```javascript
// Expenses dengan pagination
GET /api/expenses?page=1&limit=10&category=food

// Goals dengan filter
GET /api/goals?status=active&priority=high

// Reports untuk dashboard
GET /api/reports/summary?period=month
```

### **3. Real-time Updates**
```javascript
// Setelah create/update/delete
// Refresh data atau update state lokal
// Implementasi optimistic updates untuk UX yang baik
```

### **4. Error Handling**
```javascript
// Check response.data.success
// Handle validation errors dari response.data.errors
// Show user-friendly error messages
```

---

## 📝 **Notes untuk Frontend Developer**

1. **API Base URL**: `http://localhost:3000/api` (development)
2. **Date Format**: Semua tanggal menggunakan `YYYY-MM-DD`
3. **Amount Format**: Integer dalam Rupiah (tanpa desimal)
4. **File Upload**: Belum diimplementasi (akan ditambah di fase berikutnya)
5. **Real-time Features**: WebSocket belum ada (gunakan polling untuk sekarang)
6. **Offline Support**: Implementasi di frontend (backend sudah RESTful)

---

## 🚀 **Ready for Integration**

**Backend sudah 100% siap untuk integrasi mobile app:**
- ✅ Semua endpoint tested dan documented
- ✅ Error handling konsisten
- ✅ Validation lengkap
- ✅ Authentication system ready
- ✅ Database schema final
- ✅ API documentation lengkap

**Next Steps untuk Frontend:**
1. Setup React Native/Expo project
2. Configure API client (axios)
3. Implement authentication flow
4. Create UI components
5. Integrate dengan backend endpoints

---

**Untuk pertanyaan teknis, lihat:**
- [API Documentation](api-documentation.md)
- [Testing Guide](../vibe-guide/roles/tester.md)
- Backend source code di `src/backend/src/`