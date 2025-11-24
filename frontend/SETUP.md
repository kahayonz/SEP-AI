# SEP-AI Frontend - Vue 3 + Vite Setup Guide

## ⚡ Quick Start

This frontend has been completely reworked from vanilla JavaScript + Tailwind CDN to a modern Vue 3 + Vite single-page application with a custom CSS design system.

### Prerequisites

- **Node.js** 16+ and **npm** 7+
- Download from: https://nodejs.org/

### Installation

```bash
cd frontend
npm install
npm run dev
```

The development server will start at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── DotGrid.vue           # Interactive dot grid background
│   ├── stores/
│   │   ├── themeStore.ts         # Dark/light mode management
│   │   └── authStore.ts          # Authentication state
│   ├── views/
│   │   ├── Home.vue              # Landing page with DotGrid
│   │   ├── AssessmentDetails.vue
│   │   ├── auth/
│   │   │   ├── Login.vue
│   │   │   └── Signup.vue
│   │   └── portals/
│   │       ├── ProfessorPortal.vue
│   │       └── StudentPortal.vue
│   ├── router/
│   │   └── index.ts              # Vue Router configuration
│   ├── services/
│   │   └── api.ts                # Axios API client with interceptors
│   ├── styles/
│   │   └── global.css            # Design system & CSS variables
│   ├── App.vue                   # Root component
│   └── main.ts                   # Entry point
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## 🎨 Design System

All styling uses **CSS custom properties** (CSS variables) instead of Tailwind. The design system supports:

### Color Variables

**Light Mode:**
- `--color-bg`: #f5f5f5
- `--color-bg-secondary`: #ffffff
- `--color-text`: #222222
- `--color-text-secondary`: #666666
- `--color-border`: #e0e0e0

**Dark Mode:** (all automatically inverted)
- `--color-bg`: #18181b
- `--color-bg-secondary`: #232326
- `--color-text`: #f3f4f6
- `--color-text-secondary`: #d1d5db
- `--color-border`: #27272a

### Utility Classes

Common utilities are available in `global.css`:

```css
.flex, .flex-col, .flex-center      /* Flexbox utilities */
.gap-1, .gap-2, .gap-3, .gap-4      /* Gap spacing */
.p-1, .p-2, .p-3, .p-4              /* Padding */
.m-1, .m-2, .m-3, .m-4              /* Margin */
.rounded, .rounded-lg                /* Border radius */
.shadow, .shadow-lg                  /* Shadows */
.text-center                          /* Text alignment */
.w-full, .h-full                      /* Width/Height */
.hidden                               /* Display: none */
```

## 🌙 Dark Mode

Dark mode is automatically managed by the **themeStore**:

```vue
<script setup>
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

// Toggle dark mode
themeStore.toggleDarkMode()

// Access dark mode state
console.log(themeStore.isDark)
</script>
```

The theme preference is persisted in `localStorage` under the key `sepai-theme`.

## 🔐 Authentication

The **authStore** manages user authentication:

```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Login
await authStore.login(email, password)

// Sign up
await authStore.signup(email, password, name, role)

// Logout
authStore.logout()

// Access user data
console.log(authStore.user)
console.log(authStore.isAuthenticated)
</script>
```

### API Configuration

The API client in `src/services/api.ts` automatically:
- Adds Bearer token to Authorization headers
- Redirects to `/login` on 401 responses
- Proxies requests through Vite dev server to backend

Configure the backend URL via environment variable:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## 🎯 Key Features

### 1. **DotGrid Background Component**
- Interactive canvas-based dot grid
- GSAP animations with inertia
- Mouse hover and click effects
- Fully responsive

### 2. **Custom CSS Styling**
- No Tailwind CDN dependency
- CSS variables for theming
- Dark/light mode support
- Semantic HTML with scoped styles

### 3. **Vue 3 Composition API**
- Reactive state management with Pinia
- Type-safe with TypeScript
- Component-based architecture

### 4. **Vue Router SPA**
- Client-side routing
- Route guards for authentication
- Lazy-loaded components

## 🔄 API Integration

All API requests go through `src/services/api.ts` which uses Axios:

```typescript
import apiClient from '@/services/api'

// GET
const response = await apiClient.get('/assessments')

// POST
const response = await apiClient.post('/auth/login', { email, password })

// PUT
const response = await apiClient.put('/assessments/1', data)

// DELETE
const response = await apiClient.delete('/assessments/1')
```

## 📝 Available Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production (dist/)
npm run preview   # Preview production build
npm run type-check # Check TypeScript types
```

## 🚀 Deployment

Build and deploy the `dist/` folder generated by `npm run build`:

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

The app will be served as a static SPA. Ensure your web server redirects all routes to `index.html` for client-side routing to work.

## 📚 Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Axios](https://axios-http.com/)

## ⚙️ Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

Available environment variables:
- `VITE_API_URL` - Backend API base URL (default: http://localhost:8000)

## 🐛 Troubleshooting

### "Cannot find module" errors after `npm install`

Run: `npm install` again and restart the dev server

### Dark mode not persisting

Check browser localStorage for `sepai-theme` key

### API requests failing

Ensure backend is running on the configured `VITE_API_URL`

### Port 5173 already in use

Change dev server port in `vite.config.ts`:
```typescript
server: {
  port: 3000,  // Change to different port
}
```

## 📄 License

Part of the SEP-AI project
