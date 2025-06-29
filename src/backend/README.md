# Dana Bersama Backend API

Backend API server untuk aplikasi Dana Bersama - Aplikasi Keuangan untuk Pasangan.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm atau yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit file `.env` sesuai dengan konfigurasi database Anda.

3. **Setup database**
   ```bash
   # Buat database PostgreSQL
   createdb dana_bersama_dev
   
   # Jalankan migrations
   npm run migrate
   
   # (Optional) Seed sample data
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:3000`

## 📋 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server dengan nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed sample data
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🏥 Health Check

Setelah server berjalan, Anda dapat mengecek status dengan:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "message": "Dana Bersama API is running",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/invite-partner` - Invite partner
- `POST /api/users/accept-invitation` - Accept partner invitation

### Expense Management
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get specific expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/categories` - Get expense categories

### Goal Management
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get specific goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contribute` - Add contribution to goal

### Reports & Analytics
- `GET /api/reports/summary` - Get financial summary
- `GET /api/reports/expenses` - Get expense analytics
- `GET /api/reports/goals` - Get goal progress
- `GET /api/reports/trends` - Get spending trends

## 🗄 Database Schema

Database menggunakan PostgreSQL dengan tabel:

- **users** - User accounts
- **couples** - Couple relationships
- **expenses** - Expense records
- **goals** - Savings goals
- **transactions** - Goal contributions/withdrawals
- **migrations** - Migration tracking

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | dana_bersama_dev |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - |
| `JWT_EXPIRES_IN` | JWT expiration | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | 7d |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📝 Logging

Aplikasi menggunakan Winston untuk logging:
- **Console**: Development environment
- **Files**: `logs/combined.log` dan `logs/error.log`
- **Levels**: error, warn, info, debug

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation dengan Joi
- **Password Hashing**: bcryptjs dengan salt rounds 12
- **JWT Authentication**: Access & refresh tokens

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers (coming soon)
├── database/        # Database migrations & seeds
├── middleware/      # Custom middleware
├── models/          # Database models (coming soon)
├── routes/          # API routes
├── services/        # Business logic (coming soon)
├── utils/           # Helper functions
└── app.js          # Main application file
```

## 🚀 Deployment

### Production Setup

1. Set environment variables untuk production
2. Setup PostgreSQL database
3. Run migrations: `npm run migrate`
4. Start server: `npm start`

### Docker (Coming Soon)

Docker configuration akan ditambahkan untuk memudahkan deployment.

## 🤝 Contributing

Ikuti panduan development di [Vibe Coding Guide](../../vibe-guide/VIBE_CODING_GUIDE.md).

## 📄 License

MIT License - see LICENSE file for details.