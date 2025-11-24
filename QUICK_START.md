# 🚀 Quick Start Guide

## What's New?

Your frontend has been completely rebuilt with Vue 3, Vite, and a custom CSS design system. **No more Tailwind or vanilla JavaScript!**

---

## ⚡ Get Started in 2 Minutes

### Step 1: Install Node.js
If you don't have it: https://nodejs.org/ (download 16+ LTS)

### Step 2: Install Dependencies
```bash
cd frontend
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

Visit: **http://localhost:5173**

---

## 📚 What to Read First

1. **[REWORK_COMPLETE.md](./REWORK_COMPLETE.md)** - What was accomplished (5 min read)
2. **[FRONTEND_MIGRATION.md](./FRONTEND_MIGRATION.md)** - Why things changed (10 min read)
3. **[FRONTEND_DEV_GUIDE.md](./FRONTEND_DEV_GUIDE.md)** - How to develop (15 min read)
4. **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** - Where files are (reference)

---

## 🎯 Key Features

✨ **Interactive DotGrid Background**  
- Canvas-based animated dot grid on home page
- Responds to mouse movement
- Customizable colors and behavior

🎨 **Custom CSS Design System**  
- No Tailwind CSS
- CSS variables for theming
- Dark/light mode included

🔐 **Full Authentication**  
- Login/Signup pages ready
- Token-based auth
- Role-based routing (student/professor)

🚀 **Modern SPA**  
- Vue 3 + Vue Router
- Pinia state management
- TypeScript support

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/    # Vue components (DotGrid, etc)
│   ├── stores/        # Pinia state (auth, theme)
│   ├── views/         # Pages (Home, Login, Portals, etc)
│   ├── router/        # Vue Router config
│   ├── services/      # API client
│   ├── styles/        # Global CSS variables
│   ├── App.vue        # Root component
│   └── main.ts        # Entry point
├── index.html         # SPA template
├── package.json       # Dependencies
└── vite.config.ts     # Build config
```

---

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript
npm run type-check
```

---

## 🎨 Styling

No Tailwind! Use CSS variables instead:

```vue
<template>
  <div class="my-card">
    <h2>Hello</h2>
  </div>
</template>

<style scoped>
.my-card {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}

h2 {
  color: var(--color-text);
  margin-bottom: var(--spacing-base);
}
</style>
```

---

## 🌙 Dark Mode

Toggle dark mode automatically:

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

---

## 🔐 Authentication

### Login Example
```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

async function login() {
  try {
    await authStore.login('user@example.com', 'password')
    // Redirects based on role automatically
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>
```

### Protected Routes
Routes with `requiresAuth: true` automatically redirect to login if not authenticated.

---

## 📡 API Calls

All requests use Axios with automatic authentication:

```typescript
import apiClient from '@/services/api'

// GET
const data = await apiClient.get('/assessments')

// POST with auth header (automatic)
const result = await apiClient.post('/assessments', {
  title: 'New Assessment'
})
```

---

## 🐛 Troubleshooting

### npm install fails
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again

### Port 5173 already in use
- Change port in `vite.config.ts` or kill process on 5173

### Dark mode not working
- Check browser's localStorage (should have `sepai-theme` key)
- Hard refresh browser (Ctrl+Shift+R)

### API requests failing
- Check backend is running on `http://localhost:8000`
- Check `VITE_API_URL` in `.env` file

---

## 📖 Learn Vue 3

New to Vue 3? Start here:

- [Vue 3 Guide](https://vuejs.org/guide/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)

---

## 🚀 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. 📝 Create your first component in `src/views/`
4. 🎨 Use CSS variables from `src/styles/global.css`
5. 📡 Use `authStore` for auth state
6. 🚀 Deploy with `npm run build`

---

## 💡 Pro Tips

- **Lazy load routes**: Routes are automatically code-split for better performance
- **Type checking**: TypeScript catches errors at build time
- **Dark mode free**: Automatically managed with CSS variables
- **No Tailwind overhead**: Smaller bundle size
- **HMR**: Hot Module Reload works out of the box

---

## 📞 Need Help?

- See **REWORK_COMPLETE.md** for what was done
- See **FRONTEND_DEV_GUIDE.md** for detailed docs
- See **FILE_STRUCTURE.md** for file organization
- See **SETUP.md** in frontend folder for setup details

---

## 🎉 You're Ready!

```bash
cd frontend
npm install
npm run dev
```

Happy coding! 🚀

---

*Last updated: November 24, 2025*
*Frontend version: Vue 3 + Vite*
