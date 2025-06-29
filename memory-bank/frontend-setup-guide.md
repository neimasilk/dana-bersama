# 📱 **Frontend Setup Guide - Dana Bersama Mobile App**

**Update Terakhir:** 19 Desember 2024  
**Status:** 🚧 Ready for Implementation  
**Backend Status:** ✅ Complete & Ready for Integration

---

## 🎯 **Overview**

Panduan ini membantu developer frontend untuk setup aplikasi mobile Dana Bersama menggunakan React Native/Expo. Backend API sudah lengkap dan siap diintegrasikan.

---

## 🛠️ **Technology Stack**

### **Core Framework**
- **React Native** dengan **Expo** (recommended)
- **TypeScript** untuk type safety
- **Expo Router** untuk navigation

### **State Management**
- **Zustand** atau **Redux Toolkit** (pilih salah satu)
- **React Query/TanStack Query** untuk API state management

### **UI Components**
- **NativeBase** atau **Tamagui** (modern UI library)
- **React Native Paper** (Material Design alternative)
- **Expo Vector Icons** untuk iconography

### **Authentication & Storage**
- **Expo SecureStore** untuk token storage
- **AsyncStorage** untuk app preferences

### **API Integration**
- **Axios** untuk HTTP client
- **React Query** untuk caching dan synchronization

---

## 📁 **Recommended Project Structure**

```
src/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── dashboard.tsx
│   │   ├── expenses.tsx
│   │   ├── goals.tsx
│   │   ├── reports.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── forms/            # Form components
│   │   ├── ExpenseForm.tsx
│   │   ├── GoalForm.tsx
│   │   └── index.ts
│   └── charts/           # Chart components
│       ├── ExpenseChart.tsx
│       ├── GoalProgress.tsx
│       └── index.ts
├── services/             # API services
│   ├── api.ts           # Axios configuration
│   ├── auth.ts          # Authentication API
│   ├── expenses.ts      # Expenses API
│   ├── goals.ts         # Goals API
│   ├── reports.ts       # Reports API
│   ├── users.ts         # Users API
│   └── index.ts
├── stores/              # State management
│   ├── authStore.ts     # Authentication state
│   ├── expenseStore.ts  # Expenses state
│   ├── goalStore.ts     # Goals state
│   └── index.ts
├── hooks/               # Custom hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useApi.ts        # API hooks
│   └── index.ts
├── utils/               # Utility functions
│   ├── formatters.ts    # Date, currency formatters
│   ├── validators.ts    # Form validation
│   ├── constants.ts     # App constants
│   └── index.ts
├── types/               # TypeScript types
│   ├── api.ts          # API response types
│   ├── auth.ts         # Authentication types
│   ├── expense.ts      # Expense types
│   ├── goal.ts         # Goal types
│   └── index.ts
└── assets/             # Static assets
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 🚀 **Setup Steps**

### **1. Initialize Expo Project**
```bash
# Create new Expo project
npx create-expo-app dana-bersama-mobile --template tabs
cd dana-bersama-mobile

# Install additional dependencies
npx expo install expo-router expo-secure-store @expo/vector-icons
npm install axios @tanstack/react-query zustand
npm install @types/react @types/react-native typescript

# UI Library (choose one)
npm install native-base react-native-svg
# OR
npm install @tamagui/core @tamagui/config @tamagui/animations-react-native
```

### **2. Configure TypeScript**
```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/stores/*": ["src/stores/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

### **3. Setup API Client**
```typescript
// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      await SecureStore.deleteItemAsync('auth_token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

### **4. Setup Authentication Store**
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/auth';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  couple_id?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const { token, user } = response.data;
      
      await SecureStore.setItemAsync('auth_token', token);
      set({ user, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const response = await authService.getProfile();
        set({ user: response.data, isAuthenticated: true });
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('auth_token');
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

---

## 🎨 **UI/UX Guidelines**

### **Design System**
- **Primary Color**: #2563EB (Blue)
- **Secondary Color**: #10B981 (Green)
- **Accent Color**: #F59E0B (Amber)
- **Error Color**: #EF4444 (Red)
- **Typography**: System fonts (SF Pro iOS, Roboto Android)

### **Screen Layouts**
1. **Dashboard**: Overview cards, recent transactions, quick actions
2. **Expenses**: List view dengan filter, FAB untuk add expense
3. **Goals**: Progress cards, contribution tracking
4. **Reports**: Charts dan analytics
5. **Profile**: User info, couple management, settings

### **Navigation Pattern**
- **Bottom Tabs**: Main navigation (Dashboard, Expenses, Goals, Reports, Profile)
- **Stack Navigation**: Detail screens, forms, settings
- **Modal**: Quick actions, confirmations

---

## 🔗 **API Integration Examples**

### **Expenses Service**
```typescript
// src/services/expenses.ts
import api from './api';
import { Expense, CreateExpenseData } from '@/types/expense';

export const expenseService = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get<{ data: Expense[] }>('/expenses', { params }),

  getById: (id: number) => 
    api.get<{ data: Expense }>(`/expenses/${id}`),

  create: (data: CreateExpenseData) => 
    api.post<{ data: Expense }>('/expenses', data),

  update: (id: number, data: Partial<CreateExpenseData>) => 
    api.put<{ data: Expense }>(`/expenses/${id}`, data),

  delete: (id: number) => 
    api.delete(`/expenses/${id}`),
};
```

### **React Query Hook**
```typescript
// src/hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/services/expenses';

export const useExpenses = (params?: any) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseService.getAll(params),
    select: (data) => data.data.data,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};
```

---

## 📱 **Key Features Implementation**

### **1. Authentication Flow**
- Splash screen dengan auth check
- Login/Register forms dengan validation
- Biometric authentication (optional)
- Auto-logout pada token expiry

### **2. Expense Management**
- Add/Edit expense form
- Category selection
- Date picker
- Photo attachment (future)
- Sharing dengan pasangan

### **3. Goal Tracking**
- Goal creation wizard
- Progress visualization
- Contribution tracking
- Achievement notifications

### **4. Reports & Analytics**
- Monthly/yearly summaries
- Category breakdown charts
- Spending trends
- Goal progress reports

### **5. Couple Features**
- Partner invitation
- Shared expenses view
- Joint goal management
- Permission management

---

## 🧪 **Testing Strategy**

### **Testing Tools**
```bash
npm install --save-dev jest @testing-library/react-native
npm install --save-dev detox # E2E testing
```

### **Test Types**
1. **Unit Tests**: Components, hooks, utilities
2. **Integration Tests**: API services, stores
3. **E2E Tests**: Critical user flows
4. **Visual Tests**: Component screenshots

---

## 🚀 **Development Workflow**

### **Development Scripts**
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### **Git Workflow**
1. Feature branches dari `develop`
2. Pull request dengan review
3. Automated testing pada PR
4. Merge ke `develop` → `main`

---

## 📋 **Implementation Checklist**

### **Phase 1: Setup & Authentication**
- [ ] Initialize Expo project
- [ ] Setup TypeScript configuration
- [ ] Configure API client
- [ ] Implement authentication store
- [ ] Create login/register screens
- [ ] Setup navigation structure

### **Phase 2: Core Features**
- [ ] Dashboard screen
- [ ] Expense management
- [ ] Goal tracking
- [ ] Basic reports
- [ ] User profile

### **Phase 3: Advanced Features**
- [ ] Couple management
- [ ] Advanced analytics
- [ ] Notifications
- [ ] Offline support
- [ ] Performance optimization

### **Phase 4: Polish & Testing**
- [ ] UI/UX refinement
- [ ] Comprehensive testing
- [ ] Performance testing
- [ ] App store preparation

---

## 🔗 **Useful Resources**

- **Backend API**: [API Documentation](api-documentation.md)
- **Backend Technical**: [Backend Technical Guide](backend-technical-guide.md)
- **Expo Docs**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **React Query**: https://tanstack.com/query/latest
- **Zustand**: https://github.com/pmndrs/zustand

---

**🎯 Ready to start mobile development!**  
**Backend API sudah lengkap dan tested - tinggal integrate! 🚀**