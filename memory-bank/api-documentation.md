# 📚 **API Documentation - Dana Bersama Backend**

**Update Terakhir:** 19 Desember 2024  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer Token (JWT)

---

## 🔐 **Authentication Endpoints**

### POST `/auth/register`
Mendaftarkan user baru

**Request Body:**
```json
{
  "username": "string (required, min 3 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "full_name": "string (required)",
  "phone": "string (optional)",
  "date_of_birth": "date (optional, YYYY-MM-DD)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "username": "...", "email": "..." },
    "token": "jwt_token_here"
  }
}
```

### POST `/auth/login`
Login user

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "username": "...", "email": "..." },
    "token": "jwt_token_here"
  }
}
```

---

## 💰 **Expense Endpoints**

### GET `/expenses`
Mendapatkan semua expenses user

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `category` (string, optional)
- `start_date` (date, optional, YYYY-MM-DD)
- `end_date` (date, optional, YYYY-MM-DD)
- `is_shared` (boolean, optional)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": {
    "expenses": [
      {
        "id": 1,
        "title": "Groceries",
        "amount": 150000,
        "category": "food",
        "expense_date": "2024-12-19",
        "is_shared": true,
        "user": { "id": 1, "full_name": "John Doe" }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

### POST `/expenses`
Membuat expense baru

**Request Body:**
```json
{
  "title": "string (required)",
  "amount": "number (required, positive)",
  "category": "string (required)",
  "description": "string (optional)",
  "expense_date": "date (required, YYYY-MM-DD)",
  "is_shared": "boolean (default: false)",
  "couple_id": "number (optional, for shared expenses)"
}
```

### PUT `/expenses/:id`
Update expense

### DELETE `/expenses/:id`
Hapus expense

### GET `/expenses/statistics`
Mendapatkan statistik expenses

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 1500000,
    "monthlyExpenses": 450000,
    "categoryBreakdown": {
      "food": 300000,
      "transport": 150000
    },
    "sharedVsPersonal": {
      "shared": 800000,
      "personal": 700000
    }
  }
}
```

---

## 🎯 **Goal Endpoints**

### GET `/goals`
Mendapatkan semua goals user

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `category` (string, optional)
- `status` (string: active/completed/paused)
- `priority` (string: low/medium/high)

### POST `/goals`
Membuat goal baru

**Request Body:**
```json
{
  "title": "string (required)",
  "target_amount": "number (required, positive)",
  "current_amount": "number (default: 0)",
  "category": "string (required)",
  "description": "string (optional)",
  "target_date": "date (required, YYYY-MM-DD)",
  "priority": "string (low/medium/high, default: medium)",
  "is_shared": "boolean (default: false)",
  "couple_id": "number (optional, for shared goals)"
}
```

### POST `/goals/:id/contribute`
Menambah kontribusi ke goal

**Request Body:**
```json
{
  "amount": "number (required, positive)",
  "description": "string (optional)"
}
```

### GET `/goals/statistics`
Mendapatkan statistik goals

---

## 📊 **Report Endpoints**

### GET `/reports/summary`
Mendapatkan ringkasan finansial

**Query Parameters:**
- `period` (string: week/month/year, default: month)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalIncome": 5000000,
    "totalExpenses": 3500000,
    "netSavings": 1500000,
    "goalProgress": {
      "totalGoals": 3,
      "completedGoals": 1,
      "totalTargetAmount": 10000000,
      "totalCurrentAmount": 4500000
    },
    "expensesByCategory": {
      "food": 1200000,
      "transport": 800000,
      "entertainment": 500000
    }
  }
}
```

### GET `/reports/expenses`
Analisis expenses detail

### GET `/reports/goals`
Progress goals detail

### GET `/reports/trends`
Tren pengeluaran dan tabungan

---

## 👥 **User Management Endpoints**

### GET `/users/profile`
Mendapatkan profile user

### PUT `/users/profile`
Update profile user

### POST `/users/change-password`
Ganti password

### POST `/users/couple/invite`
Undang pasangan untuk bergabung

**Request Body:**
```json
{
  "partner_email": "string (required, valid email)",
  "couple_name": "string (required)"
}
```

### POST `/users/couple/accept`
Terima undangan couple

### DELETE `/users/couple/leave`
Keluar dari couple

---

## 🔧 **Error Responses**

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development)"
}
```

---

## 📝 **Notes untuk Frontend Developer**

1. **Authentication**: Semua endpoint kecuali `/auth/*` memerlukan Bearer token di header
2. **Pagination**: Gunakan query parameters `page` dan `limit` untuk pagination
3. **Date Format**: Semua tanggal menggunakan format `YYYY-MM-DD`
4. **Amount Format**: Semua amount dalam Rupiah (integer, tanpa desimal)
5. **Error Handling**: Selalu check `success` field dalam response
6. **Couple Features**: Expense dan Goal bisa shared jika user sudah dalam couple

---

**Untuk testing API, gunakan:**
- **Postman Collection**: `src/backend/tests/postman/`
- **Test Server**: `npm run test:server`
- **API Documentation**: File ini + inline comments di controllers