# SEP-AI - Software Engineering Principle Evaluation with AI

A full-stack application for evaluating student software engineering projects using AI-powered analysis.

## 🚀 Quick Start

### Frontend (Vue 3 + Vite)
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
# Backend at http://localhost:8000
```

## 📋 Documentation

- **[Frontend Migration Guide](./FRONTEND_MIGRATION.md)** - Complete migration from Tailwind to Vue 3 + custom CSS
- **[Frontend Development Guide](./FRONTEND_DEV_GUIDE.md)** - How to work with the new frontend
- **[Frontend Setup Guide](./frontend/SETUP.md)** - Detailed setup instructions

## 📁 Project Structure

```
SEP-AI/
├── frontend/                          # Vue 3 SPA with Vite
│   ├── src/
│   │   ├── components/               # Reusable Vue components
│   │   ├── stores/                   # Pinia state management
│   │   ├── views/                    # Page components
│   │   ├── router/                   # Vue Router config
│   │   ├── services/                 # API client
│   │   ├── styles/                   # CSS variables & design system
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                           # FastAPI application
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── routes.py
│   │   ├── routes_ai.py
│   │   └── ai_evaluator.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── .env
│
└── README.md
```

## 🎨 Frontend Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: Custom CSS Variables (no Tailwind)
- **HTTP Client**: Axios
- **Animations**: GSAP (for DotGrid background)
- **Routing**: Vue Router

## ⚡ Key Features

### Interactive DotGrid Background
- Canvas-based animated dot grid
- GSAP inertia animations
- Mouse hover and click effects
- Fully responsive

### Design System
- CSS variables for theming
- Dark/light mode support
- Semantic component styling
- No external CSS framework dependencies

### Authentication
- Email/password login and signup
- JWT token-based authentication
- Role-based access (student/professor)
- Automatic token refresh

### Portals
- **Professor Portal**: View student submissions, provide AI-powered feedback, manage grades
- **Student Portal**: Submit projects, view feedback, track progress

## 🔧 Development

### Adding a New Page

1. Create component in `frontend/src/views/`
2. Add route in `frontend/src/router/index.ts`
3. Use CSS variables for styling

### Adding a New Component

1. Create component in `frontend/src/components/`
2. Use scoped styles with CSS variables

### Managing Global State

Use Pinia stores in `frontend/src/stores/`

## 🌙 Dark Mode

Dark mode is automatically managed and persisted:

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

## 📡 API Integration

All API requests use Axios with automatic authentication:

```typescript
import apiClient from '@/services/api'

const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
})
```

## 🚀 Building for Production

### Frontend
```bash
cd frontend
npm run build
# Creates optimized dist/ folder
```

### Backend
```bash
cd backend
# Create production-ready container or deploy uvicorn server
```

## 🐛 Troubleshooting

**Frontend not starting?**
- Ensure Node.js 16+ is installed
- Run `npm install` in frontend directory

**Backend connection issues?**
- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_URL` environment variable

**Dark mode not persisting?**
- Check browser localStorage for `sepai-theme` key

## 📚 Resources

- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

## 📄 License

Part of the SEP-AI Educational Project
