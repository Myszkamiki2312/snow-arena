import { createRouter, createWebHistory } from 'vue-router'

// IMPORTY WSZYSTKICH WIDOKÓW
import HomeView from '../views/HomeView.vue'
import CategoryView from '../views/CategoryView.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import ArticleView from '../views/ArticleView.vue'
import MedalsView from '../views/MedalsView.vue'
import SearchView from '../views/SearchView.vue' // <--- NOWY WIDOK SZUKANIA

import { auth } from '../firebase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/kategoria/:id', name: 'category', component: CategoryView, props: true },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true } },
    { path: '/artykul/:id', name: 'article', component: ArticleView, props: true },
    { path: '/medale', name: 'medals', component: MedalsView },
    
    // NOWA TRASA SZUKANIA
    { path: '/szukaj', name: 'search', component: SearchView }
  ]
})

// STRAŻNIK (Blokuje /admin przed niezalogowanymi)
router.beforeEach((to, from, next) => {
  const currentUser = auth.currentUser
  if (to.meta.requiresAuth && !currentUser) {
    next('/login')
  } else {
    next()
  }
})

export default router