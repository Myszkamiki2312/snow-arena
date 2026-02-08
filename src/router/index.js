import { createRouter, createWebHistory } from 'vue-router'
import { initAuth, isAdmin, isLoggedIn } from '../auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/kategoria/:id', name: 'category', component: () => import('../views/CategoryView.vue'), props: true },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { requiresAdmin: true } },
    { path: '/artykul/:id', name: 'article', component: () => import('../views/ArticleView.vue'), props: true },
    { path: '/medale', name: 'medals', component: () => import('../views/MedalsView.vue') },
    { path: '/szukaj', name: 'search', component: () => import('../views/SearchView.vue') },
  ],
})

router.beforeEach(async (to) => {
  await initAuth()

  if (to.meta.requiresAdmin && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'home' }
  }

  return true
})

export default router
