# SEP-AI Frontend - Development Guide

## 🚀 Getting Started

### Option 1: Local Development (Recommended)

**Prerequisites:**
- Node.js 16+ and npm 7+
- Download from https://nodejs.org/

**Steps:**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Option 2: Docker Development

**Prerequisites:**
- Docker and Docker Compose installed

**Steps:**
```bash
# From project root
docker-compose up

# Frontend will be at http://localhost:5173
# Backend will be at http://localhost:8000
```

## 📁 Frontend Structure

```
frontend/
├── src/
│   ├── components/       # Reusable Vue components
│   ├── stores/          # Pinia state management
│   ├── views/           # Page components
│   ├── router/          # Vue Router config
│   ├── services/        # API client
│   ├── styles/          # Global CSS and design system
│   ├── App.vue          # Root component
│   └── main.ts          # Entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite build config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## 🎨 Design Decisions

### Why Not Tailwind?

The frontend has been redesigned to use **CSS variables** instead of Tailwind CDN for:

1. **Zero Dependencies**: No CDN required, build-time CSS processing only
2. **Smaller Bundle**: No Tailwind overhead in production
3. **Full Control**: Custom design system with semantic naming
4. **Better Dark Mode**: CSS variables make theme switching seamless
5. **Modern CSS**: Uses native CSS for all styling

### CSS Variable System

All colors and spacing use CSS custom properties. See `src/styles/global.css` for the complete design system.

**Theme Toggle:**
```vue
<script setup>
import { useThemeStore } from '@/stores/themeStore'

const theme = useThemeStore()
</script>

<template>
  <button @click="theme.toggleDarkMode()">
    {{ theme.isDark ? '☀️' : '🌙' }}
  </button>
</template>
```

## 🔧 Development Workflow

### Creating a New Page

1. Create a new Vue component in `src/views/`
2. Add a route in `src/router/index.ts`
3. Use the global CSS variables for styling

```vue
<template>
  <div class="page-container">
    <h1>My New Page</h1>
  </div>
</template>

<script setup lang="ts">
// Your logic here
</script>

<style scoped>
.page-container {
  padding: var(--spacing-lg);
  background-color: var(--color-bg);
  min-height: 100vh;
}

h1 {
  color: var(--color-text);
}
</style>
```

### Creating a New Component

1. Create a new Vue component in `src/components/`
2. Import and use in other components

```vue
<template>
  <div class="my-component">
    <!-- Component content -->
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
/* Component styles */
</style>
```

## 🔐 Authentication Flow

```
Login/Signup
    ↓
authStore.login() or authStore.signup()
    ↓
Set token in localStorage
    ↓
Redirect to /professor or /student
    ↓
useAuthStore().isAuthenticated returns true
    ↓
Route guards pass user through
```

## 🌐 API Integration

Backend at `http://localhost:8000`:

```typescript
// In any component or composable
import apiClient from '@/services/api'

// Make requests
const data = await apiClient.get('/assessments')
```

Authentication token is automatically added to all requests.

## 🎯 Key Files to Modify

### Adding a Feature

1. **API endpoint**: Update `src/services/api.ts` if needed
2. **State management**: Add to `src/stores/` if global state needed
3. **UI**: Create/update component in `src/views/` or `src/components/`
4. **Routing**: Add route to `src/router/index.ts`

### Styling

- **Global styles**: Edit `src/styles/global.css`
- **Component styles**: Use `<style scoped>` in component files
- **CSS variables**: Access via `var(--color-primary)`, etc.

## 📦 Build & Deploy

**Production build:**
```bash
npm run build
```

Creates optimized `dist/` folder.

**Deploy to static hosting:**
- Upload `dist/` folder contents
- Configure web server to redirect all 404s to `index.html`

## 🐛 Common Issues

### "npm not found"
Install Node.js from https://nodejs.org/

### Port 5173 in use
Kill process on port 5173 or change port in `vite.config.ts`

### API requests failing
Check backend is running on `http://localhost:8000`

### Dark mode not working
Check browser's localStorage for `sepai-theme` key

## 📚 Learning Resources

- **Vue 3**: https://vuejs.org/guide/
- **Vite**: https://vitejs.dev/guide/
- **Pinia**: https://pinia.vuejs.org/
- **Vue Router**: https://router.vuejs.org/

## 🚀 Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open browser: http://localhost:5173
4. Begin development!

---

For questions or issues, refer to the SETUP.md file.
