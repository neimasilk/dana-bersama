# Dana Bersama - Aplikasi Keuangan untuk Pasangan

**Aplikasi manajemen keuangan yang dirancang khusus untuk pasangan di Indonesia**

## 🎯 Tentang Proyek

Dana Bersama adalah aplikasi mobile yang memfasilitasi transparansi finansial, kolaborasi dalam pengelolaan uang, dan pencapaian tujuan keuangan bersama untuk pasangan. Aplikasi ini menawarkan alternatif yang lebih baik dari Splitwise dengan fokus khusus pada dinamika keuangan pasangan Indonesia.

### ✨ Fitur Utama
- 💰 **Pembagi Tagihan Fleksibel** - Pembagian rata, persentase, atau custom
- 🎯 **Pelacak Tujuan Tabungan Bersama** - DP rumah, liburan, dll
- 💬 **Komunikasi Terintegrasi** - Chat untuk diskusi keuangan
- 📊 **Laporan & Analytics** - Visualisasi pengeluaran dan tren
- 🔒 **Keamanan Tinggi** - End-to-end encryption

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- React Native development environment
- Docker (optional, untuk development)

### Setup Development Environment

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd dana-bersama
   ```

2. **Setup menggunakan Vibe Coding**
   ```bash
   chmod +x vibe-guide/init_vibe.sh
   ./vibe-guide/init_vibe.sh
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd src/backend
   npm install
   
   # Mobile App
   cd ../mobile
   npm install
   ```

4. **Setup database**
   ```bash
   cd src/backend
   cp .env.example .env
   # Edit .env dengan database credentials
   npm run migrate
   npm run seed
   ```

5. **Start development servers**
   ```bash
   # Backend API (Port 3000)
   cd src/backend
   npm run dev
   
   # Mobile App (akan ditambahkan setelah setup)
   cd src/mobile
   npm start
   ```

## 📚 API Documentation

**Backend API sudah lengkap dan siap digunakan!**

- **Base URL**: `http://localhost:3000/api`
- **Documentation**: [API Documentation](memory-bank/api-documentation.md)
- **Endpoints Available**:
  - 🔐 Authentication (register, login)
  - 💰 Expenses (CRUD, statistics, filtering)
  - 🎯 Goals (CRUD, contributions, progress tracking)
  - 📊 Reports (financial summary, analytics, trends)
  - 👥 User Management (profile, couple features)

**Testing API:**
```bash
cd src/backend
npm test                    # Run all tests
npm run test:controllers    # Test API endpoints
npm run test:server        # Start test server
   # Buat database PostgreSQL
   createdb dana_bersama_dev
   
   # Jalankan migrations
   cd src/backend
   npm run migrate
   ```

5. **Jalankan aplikasi**
   ```bash
   # Terminal 1: Backend API
   cd src/backend
   npm run dev
   
   # Terminal 2: Mobile App
   cd src/mobile
   npm start
   ```

## 📁 Struktur Proyek

```
dana-bersama/
├── vibe-guide/           # Panduan development & workflow
├── memory-bank/          # Dokumentasi proyek aktif
├── baby-steps-archive/   # Riwayat development cycles
├── src/
│   ├── backend/         # Node.js API server
│   └── mobile/          # React Native app
└── README.md           # Dokumentasi utama (file ini)
```

## 📚 Dokumentasi

- **[Spesifikasi Produk](memory-bank/spesifikasi-produk.md)** - Requirements dan fitur lengkap
- **[Arsitektur Sistem](memory-bank/architecture.md)** - Desain teknis dan database schema
- **[Testing Strategy](memory-bank/testing-strategy.md)** - Strategi testing komprehensif
- **[Testing Templates](memory-bank/test-templates.md)** - Template dan setup files untuk testing
- **[Testing Checklist](memory-bank/testing-checklist.md)** - Checklist testing untuk developer
- **[QA Testing Guide](memory-bank/qa-testing-guide.md)** - Panduan lengkap untuk QA Tester
- **[Panduan Tim](vibe-guide/PERAN_TIM.md)** - Peran dan tanggung jawab tim
- **[Progress Tracking](memory-bank/papan-proyek.md)** - Status development saat ini
- **[Summary Report](memory-bank/summary-report.md)** - Ringkasan proyek dan metrik

## 👥 Tim Development

Proyek ini menggunakan **AI-First Development** dengan tim hibrida:

- **Claude-Arsitek** - System design & planning
- **Dev-Frontend** - React Native development
- **Dev-Backend** - Node.js API development
- **QA-Tester** - Testing & quality assurance
- **Tech-Writer** - Documentation & code review

## 🔄 Development Workflow

Kami menggunakan **Vibe Coding V1.4** methodology:

1. **Planning** - Arsitek merancang baby-step di `memory-bank/papan-proyek.md`
2. **Implementation** - Developer mengerjakan tugas yang di-assign
3. **Testing** - QA-Tester melakukan validation
4. **Review** - Code review dan dokumentasi update
5. **Reset** - Archive dan mulai cycle berikutnya

### Melihat Status Proyek
```bash
# Lihat ringkasan proyek
./vibe-guide/init_vibe.sh --dashboard

# Lihat baby-step aktif
cat memory-bank/papan-proyek.md
```

## 🎯 Roadmap

### Phase 1 (MVP - 3 bulan) - 65% Complete
- ✅ **Backend API Complete** - All controllers, models, and endpoints ready
- ✅ **Database Schema** - User, Couple, Expense, Goal, Transaction models
- ✅ **Authentication System** - JWT-based auth with middleware
- ✅ **Core expense splitting** - CRUD operations with sharing features
- ✅ **Goal tracking** - Shared goals with contribution system
- ✅ **Reporting & Analytics** - Financial summaries and trends
- ✅ **Testing Framework** - Comprehensive unit and integration tests
- 🔄 **Mobile App Setup** - React Native/Expo structure (In Progress)
- ⏳ **UI/UX Implementation** - Screens and components
- ⏳ **API Integration** - Connect mobile app with backend

### Phase 2 (Growth - 6 bulan)
- 🔄 Bank integration
- 🔄 Advanced analytics
- 🔄 Premium features
- 🔄 Marketing push

### Phase 3 (Scale - 12 bulan)
- ⏳ Investment planning
- ⏳ Insurance management
- ⏳ Financial advisor integration
- ⏳ Regional expansion

## 🤝 Contributing

1. Baca [Panduan Tim](vibe-guide/PERAN_TIM.md) untuk memahami workflow
2. Check baby-step aktif di [Papan Proyek](memory-bank/papan-proyek.md)
3. Ambil tugas yang belum di-assign atau koordinasi dengan Arsitek
4. Follow coding standards dan testing requirements
5. Update dokumentasi jika diperlukan

## 📄 License

MIT License - see LICENSE file for details

## 📞 Contact

Untuk pertanyaan atau diskusi proyek, silakan buka issue di repository ini.

---

**Status Terakhir**: Backend API Complete - Mobile App Development  
**Update**: 19 Desember 2024  
**Next Milestone**: Working MVP Mobile App + Backend Integration (Januari 2025)  
**API Ready**: ✅ All endpoints tested and documented