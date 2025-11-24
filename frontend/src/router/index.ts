import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
  },
  {
    path: '/for-students',
    name: 'ForStudents',
    component: () => import('@/views/ForStudents.vue'),
  },
  {
    path: '/for-professors',
    name: 'ForProfessors',
    component: () => import('@/views/ForProfessors.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/auth/Signup.vue'),
  },
  {
    path: '/professor',
    name: 'ProfessorPortal',
    component: () => import('@/views/portals/ProfessorPortal.vue'),
    meta: { requiresAuth: true, role: 'professor' },
  },
  {
    path: '/professor/create-assessment',
    name: 'CreateAssessment',
    component: () => import('@/views/portals/CreateAssessment.vue'),
    meta: { requiresAuth: true, role: 'professor' },
  },
  {
    path: '/professor/manage-classes',
    name: 'ManageClasses',
    component: () => import('@/views/portals/ManageClasses.vue'),
    meta: { requiresAuth: true, role: 'professor' },
  },
  {
    path: '/professor/manage-assessments',
    name: 'ManageAssessments',
    component: () => import('@/views/portals/ManageAssessments.vue'),
    meta: { requiresAuth: true, role: 'professor' },
  },
  {
    path: '/professor/classes/:classId/assessments',
    name: 'ViewAssessments',
    component: () => import('@/views/portals/ViewAssessments.vue'),
    meta: { requiresAuth: true, role: 'professor' },
  },
  {
    path: '/professor/assessments/:assessmentId/submissions',
    name: 'ViewSubmissions',
    component: () => import('@/views/portals/ViewSubmissions.vue'),
    meta: { requiresAuth: true, role: 'professor' },
  },
  {
    path: '/student',
    name: 'StudentPortal',
    component: () => import('@/views/portals/StudentPortal.vue'),
    meta: { requiresAuth: true, role: 'student' },
  },
  {
    path: '/assessment/:id',
    name: 'AssessmentDetails',
    component: () => import('@/views/AssessmentDetails.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // If we have a token but no user data, try to fetch it
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      authStore.logout()
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.role && authStore.user?.role !== to.meta.role) {
    next('/')
  } else {
    next()
  }
})

export default router
