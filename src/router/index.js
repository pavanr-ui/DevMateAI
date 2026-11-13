// Ionic's router wraps Vue Router and adds mobile page-transition animations.
import { createRouter, createWebHistory } from '@ionic/vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    // Lazy-loaded: the page's code is only downloaded when visited.
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
