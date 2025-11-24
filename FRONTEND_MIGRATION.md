# SEP-AI Frontend Rework - Complete Migration Guide

## 🎉 What Changed

The frontend has been completely reworked from **vanilla JavaScript + Tailwind CDN** to a modern **Vue 3 + Vite SPA** with a custom CSS design system and the interactive DotGrid background component.

### Before (Legacy)
```
Frontend Stack:
- ❌ Vanilla JavaScript (no framework)
- ❌ Tailwind CSS via CDN
- ❌ Static HTML files
- ❌ No build process
- ❌ Manual DOM manipulation
- ❌ Global JavaScript state
```

### After (New)
```
Frontend Stack:
- ✅ Vue 3 (Composition API)
- ✅ Custom CSS variables (no Tailwind)
- ✅ Single Page Application (SPA)
- ✅ Vite build tool
- ✅ Component-based architecture
- ✅ Pinia state management
```

## 📦 File Structure Changes

### Deleted Files
```
frontend/
├── ❌ for-professors.html       (now views/Home.vue)
├── ❌ for-students.html         (now views/Home.vue)
├── ❌ about.html                (not yet migrated)
├── ❌ login.html                (now views/auth/Login.vue)
├── ❌ signup.html               (now views/auth/Signup.vue)
├── ❌ professor.html            (now views/portals/ProfessorPortal.vue)
├── ❌ student.html              (now views/portals/StudentPortal.vue)
├── ❌ assessment-details.html   (now views/AssessmentDetails.vue)
├── ❌ confirmation.html         (deprecated)
└── ❌ components/               (legacy vanilla JS)
```

### New File Structure
```
frontend/
├── src/
│   ├── components/
│   │   └── DotGrid.vue                    # Interactive background
│   ├── stores/
│   │   ├── themeStore.ts                  # Dark/light mode
│   │   └── authStore.ts                   # Auth state
│   ├── views/
│   │   ├── Home.vue                       # Landing page
│   │   ├── AssessmentDetails.vue
│   │   ├── auth/
│   │   │   ├── Login.vue
│   │   │   └── Signup.vue
│   │   └── portals/
│   │       ├── ProfessorPortal.vue
│   │       └── StudentPortal.vue
│   ├── router/
│   │   └── index.ts                       # SPA routing
│   ├── services/
│   │   └── api.ts                         # Axios client
│   ├── styles/
│   │   └── global.css                     # CSS variables & design system
│   ├── types/
│   │   └── index.ts                       # TypeScript types
│   ├── App.vue                            # Root component
│   └── main.ts                            # Entry point
├── index.html                             # SPA template
├── vite.config.ts                         # Build config
├── tsconfig.json                          # TypeScript config
├── package.json                           # Dependencies
└── .env.example                           # Environment template
```

## 🚀 Installation & Running

### Prerequisites
- Node.js 16+ and npm 7+
- Download from: https://nodejs.org/

### Quick Start
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Docker Alternative
```bash
docker-compose up
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

## 🎨 Design System Overview

### CSS Variables (No Tailwind!)

All styling uses CSS custom properties stored in `src/styles/global.css`:

**Colors:**
```css
--color-bg              /* Background */
--color-bg-secondary    /* Card/container backgrounds */
--color-text            /* Primary text */
--color-text-secondary  /* Secondary text */
--color-border          /* Borders */
--color-primary         /* Primary accent color */
--color-success         /* Success states */
--color-danger          /* Error states */
--color-warning         /* Warning states */
```

**Usage in Components:**
```vue
<style scoped>
.my-container {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: var(--spacing-lg);
}
</style>
```

### Dark Mode

Automatically managed by `themeStore`. Just use CSS variables - they change automatically!

```vue
<script setup>
import { useThemeStore } from '@/stores/themeStore'

const theme = useThemeStore()
</script>

<template>
  <button @click="theme.toggleDarkMode()">
    Toggle Dark Mode
  </button>
</template>
```

## 🔄 Feature Mapping

### Old → New

| Feature | Old Implementation | New Implementation |
|---------|-------------------|-------------------|
| **Routing** | Manual URL changes | Vue Router SPA |
| **Dark Mode** | Inline scripts in HTML | themeStore composable |
| **Auth** | localStorage + AJAX | authStore with Pinia |
| **API Calls** | Fetch API | Axios with interceptors |
| **Styling** | Tailwind + custom CSS | CSS variables only |
| **Components** | Vanilla JS classes | Vue single-file components |
| **State** | Global objects | Pinia stores |

## 🔐 Authentication

### Login
```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function login(email, password) {
  await authStore.login(email, password)
  router.push('/professor') // or /student
}
</script>
```

### Protected Routes
Routes are automatically protected via router guards in `src/router/index.ts`:

```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})
```

## 📡 API Integration

All API calls use Axios with automatic token handling:

```typescript
import apiClient from '@/services/api'

// Automatically adds Authorization header
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
})
```

**Configure backend URL:**
```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

Or create `.env`:
```env
VITE_API_URL=http://localhost:8000
```

## 🎯 Key Component Examples

### Home Page with DotGrid
```vue
<template>
  <div class="home-wrapper">
    <DotGrid :dot-size="16" :gap="32" base-color="#27FF64" />
    <!-- Content overlays DotGrid -->
  </div>
</template>

<script setup>
import DotGrid from '@/components/DotGrid.vue'
</script>
```

### Protected Portal
```vue
<template>
  <div class="portal">
    <h1>Welcome, {{ user.name }}</h1>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
```

## 🛠️ Development Workflow

### Adding a New Page

1. **Create the Vue component:**
   ```
   src/views/MyPage.vue
   ```

2. **Add a route:**
   ```typescript
   // src/router/index.ts
   {
     path: '/my-page',
     component: () => import('@/views/MyPage.vue'),
     meta: { requiresAuth: true }
   }
   ```

3. **Use CSS variables for styling:**
   ```vue
   <style scoped>
   .my-page {
     background-color: var(--color-bg);
     color: var(--color-text);
   }
   </style>
   ```

### Adding Global State

Use Pinia stores in `src/stores/`:

```typescript
// src/stores/myStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMyStore = defineStore('my', () => {
  const count = ref(0)
  
  const increment = () => count.value++
  
  return { count, increment }
})
```

Use in components:
```vue
<script setup>
import { useMyStore } from '@/stores/myStore'

const store = useMyStore()
</script>

<template>
  <div>
    Count: {{ store.count }}
    <button @click="store.increment()">+</button>
  </div>
</template>
```

## 📚 Project Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4.21",           // Framework
    "vue-router": "^4.3.2",     // SPA routing
    "pinia": "^2.1.7",          // State management
    "gsap": "^3.12.2",          // DotGrid animations
    "axios": "^1.6.7"           // HTTP client
  },
  "devDependencies": {
    "vite": "^5.0.8",           // Build tool
    "@vitejs/plugin-vue": "^5.0.4",
    "vue-tsc": "^1.8.27",       // TypeScript
    "typescript": "^5.3.3"
  }
}
```

## ✅ Migration Checklist

- [x] Set up Vue 3 + Vite project
- [x] Create DotGrid component with GSAP
- [x] Implement CSS variable design system
- [x] Set up authentication with Pinia
- [x] Create router with guard system
- [x] Migrate Home page
- [x] Migrate auth pages (Login/Signup)
- [x] Create portal placeholder pages
- [x] Add dark mode functionality
- [ ] **Next**: Migrate full professor portal
- [ ] **Next**: Migrate full student portal
- [ ] **Next**: Add assessment details page
- [ ] **Next**: Test all features

## 🚀 Building for Production

```bash
npm run build
```

Creates optimized `dist/` folder ready for deployment.

**Deploy to static hosting:**
- Upload `dist/` contents to hosting
- Configure server to redirect all 404s to `index.html`

## 📞 Support

See `SETUP.md` and `FRONTEND_DEV_GUIDE.md` for more details.

---

**Migration completed:** November 24, 2025
**Frontend Framework:** Vue 3
**Build Tool:** Vite
**Styling:** CSS Variables (Custom Design System)
