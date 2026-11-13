// Ionic's router wraps Vue Router and adds mobile page-transition animations.
import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useAuthStore } from '@/stores/auth'
import { createAuthGuard } from './guards'
import { dashboardItem, historyItem, projectsItem, settingsItem, tools } from './navigation'

// Lazy-loaded pages: each page's code downloads only when first visited.
const ComingSoonPage = () => import('@/pages/ComingSoonPage.vue')

/** Modules not built yet show a "coming in Phase N" placeholder. */
const placeholderRoutes = [...tools, historyItem].map((item) => ({
  path: item.path,
  name: item.name,
  component: ComingSoonPage,
  meta: { title: item.label, nav: item },
}))

const routes = [
  // Signed-out pages
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { guestOnly: true, title: 'Sign in' },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/pages/auth/SignupPage.vue'),
    meta: { guestOnly: true, title: 'Create account' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    meta: { guestOnly: true, title: 'Reset password' },
  },

  // Signed-in app (sidebar / tab bar shell)
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      {
        path: dashboardItem.path,
        name: dashboardItem.name,
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: { title: dashboardItem.label },
      },
      {
        path: 'tools',
        name: 'tools',
        component: () => import('@/pages/ToolsPage.vue'),
        meta: { title: 'AI Tools' },
      },
      {
        path: projectsItem.path,
        name: projectsItem.name,
        component: () => import('@/pages/projects/ProjectsPage.vue'),
        meta: { title: projectsItem.label },
      },
      {
        path: settingsItem.path,
        name: settingsItem.name,
        component: () => import('@/pages/settings/SettingsPage.vue'),
        meta: { title: settingsItem.label },
      },
      ...placeholderRoutes,
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(createAuthGuard(() => useAuthStore()))

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · DevMate AI` : 'DevMate AI'
})

export default router
