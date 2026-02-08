<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import CookieBanner from './components/CookieBanner.vue'
import { initAuth, isLoggedIn } from './auth'

const router = useRouter()
const globalSearch = ref('')
const isLoggedInState = computed(() => isLoggedIn.value)
const mobileMenuOpen = ref(false)

const categoryLinks = [
  { to: '/kategoria/skoki', icon: 'fa-solid fa-person-snowboarding', label: 'Skoki narciarskie' },
  { to: '/kategoria/biegi', icon: 'fa-solid fa-person-skiing-nordic', label: 'Biegi narciarskie' },
  { to: '/kategoria/biathlon', icon: 'fa-solid fa-person-skiing-nordic', label: 'Biathlon' },
  { to: '/kategoria/alpejskie', icon: 'fa-solid fa-person-skiing', label: 'Narciarstwo alpejskie' },
  { to: '/kategoria/hokej', icon: 'fa-solid fa-hockey-puck', label: 'Hokej na lodzie' },
  { to: '/kategoria/szybkie', icon: 'fa-solid fa-person-skating', label: 'Lyżwiarstwo szybkie' },
  { to: '/kategoria/snowboard', icon: 'fa-solid fa-person-snowboarding', label: 'Snowboard' },
  { to: '/kategoria/kombinacja', icon: 'fa-solid fa-person-skiing-nordic', label: 'Kombinacja norweska' },
  { to: '/kategoria/shorttrack', icon: 'fa-solid fa-person-skating', label: 'Short track' },
  { to: '/kategoria/dowolne', icon: 'fa-solid fa-person-skiing', label: 'Narciarstwo dowolne' },
  { to: '/kategoria/curling', icon: 'fa-regular fa-snowflake', label: 'Curling' },
  { to: '/kategoria/saneczkarstwo', icon: 'fa-regular fa-snowflake', label: 'Saneczkarstwo' },
  { to: '/kategoria/bobsleje', icon: 'fa-regular fa-snowflake', label: 'Bobsleje' },
  { to: '/kategoria/skeleton', icon: 'fa-regular fa-snowflake', label: 'Skeleton' },
  { to: '/kategoria/skialpinizm', icon: 'fa-regular fa-snowflake', label: 'Skialpinizm' },
  { to: '/kategoria/figurowe', icon: 'fa-solid fa-person-skating', label: 'Lyżwiarstwo figurowe' },
]

onMounted(() => {
  initAuth()
})

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = async () => {
  if (!confirm('Czy na pewno chcesz się wylogować?')) return
  await signOut(auth)
  router.push('/')
}

const handleGlobalSearch = () => {
  const q = globalSearch.value.trim()
  if (!q) return
  router.push({ name: 'search', query: { q } })
  globalSearch.value = ''
}
</script>

<template>
  <div class="app-layout">
    <div class="ambient-bg"></div>

    <header class="hero-header">
      <div class="container topbar">
        <RouterLink to="/" class="brand-link">
          <img src="/logo-snowarena.png" alt="SNOWARENA Logo" class="logo-img">
          <div class="brand-copy">
            <strong>SNOW ARENA</strong>
            <span>Blog sportów zimowych</span>
          </div>
        </RouterLink>

        <div class="header-actions">
          <div class="search-modern">
            <input
              v-model="globalSearch"
              type="text"
              placeholder="Szukaj artykułu..."
              @keyup.enter="handleGlobalSearch"
            >
            <button @click="handleGlobalSearch" aria-label="Szukaj">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>

          <button class="mobile-toggle" :aria-expanded="mobileMenuOpen" @click="toggleMobileMenu">
            <i class="fa-solid" :class="mobileMenuOpen ? 'fa-xmark' : 'fa-bars'"></i>
          </button>
        </div>
      </div>
    </header>

    <nav class="glass-nav" :class="{ open: mobileMenuOpen }">
      <div class="container nav-flex">
        <RouterLink to="/" class="nav-link">Start</RouterLink>
        <div class="desktop-disciplines">
          <button class="nav-link disciplines-btn">
            Dyscypliny <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="disciplines-dropdown">
            <div class="disciplines-grid">
              <RouterLink v-for="category in categoryLinks" :key="category.to" :to="category.to" class="disciplines-item">
                <i :class="category.icon"></i>
                <span>{{ category.label }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
        <RouterLink to="/kategoria/skoki" class="nav-link">Skoki</RouterLink>
        <RouterLink to="/kategoria/biathlon" class="nav-link">Biathlon</RouterLink>
        <RouterLink to="/kategoria/hokej" class="nav-link">Hokej</RouterLink>
        <RouterLink to="/medale" class="nav-link">Medale</RouterLink>

        <template v-if="isLoggedInState">
          <RouterLink to="/admin" class="nav-link admin-btn">
            <i class="fa-solid fa-pen-to-square"></i> Panel
          </RouterLink>
          <button @click="handleLogout" class="nav-link logout-btn">
            <i class="fa-solid fa-right-from-bracket"></i> Wyloguj
          </button>
        </template>
      </div>

      <div class="mobile-menu">
        <div class="mobile-grid">
          <RouterLink v-for="category in categoryLinks" :key="category.to" :to="category.to" class="mobile-item">
            <i :class="category.icon"></i>
            <span>{{ category.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <main class="container content-wrapper">
      <RouterView />
    </main>

    <footer class="modern-footer">
      <div class="container footer-row">
        <p>&copy; 2026 SNOW ARENA. Wszelkie prawa zastrzeżone.</p>
        <RouterLink v-if="!isLoggedInState" to="/login" class="secret-login" title="Panel Admina">
          <i class="fa-solid fa-lock"></i> Admin
        </RouterLink>
      </div>
    </footer>

    <CookieBanner />
  </div>
</template>

<style>
:root {
  --bg-dark: #060b15;
  --bg-card: #131f35;
  --accent-cyan: #00d4ff;
  --accent-pink: #ff5ea8;
  --text-main: #f4f8ff;
  --text-muted: #8ea3c8;
}

body {
  margin: 0;
  padding: 0;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: 'Saira Condensed', 'Trebuchet MS', sans-serif;
}

h1, h2, h3, .nav-link, .brand-copy strong {
  font-family: 'Bebas Neue', 'Arial Narrow', sans-serif;
  letter-spacing: 0.05em;
}

.app-layout {
  position: relative;
  min-height: 100vh;
}

.ambient-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(1200px 600px at 90% -10%, rgba(0, 212, 255, 0.18), transparent 70%),
    radial-gradient(900px 500px at -10% 30%, rgba(255, 94, 168, 0.14), transparent 70%),
    linear-gradient(180deg, #061023 0%, #060b15 60%);
}

.container {
  width: min(1680px, 96%);
  margin: 0 auto;
}

a {
  text-decoration: none;
  color: inherit;
}

.hero-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  background: rgba(8, 14, 28, 0.72);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 84px;
  height: auto;
  filter: drop-shadow(0 0 12px rgba(0, 212, 255, 0.45));
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-copy strong {
  font-size: 1.7rem;
}

.brand-copy span {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-modern {
  display: flex;
  align-items: center;
  width: min(480px, 52vw);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  padding: 4px;
}

.search-modern input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #f3f7ff;
  padding: 10px 15px;
  font-size: 0.95rem;
}

.search-modern button {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  color: #041223;
  background: linear-gradient(135deg, var(--accent-cyan), #78f4ff);
}

.mobile-toggle {
  display: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border-radius: 12px;
  width: 42px;
  height: 42px;
  cursor: pointer;
}

.glass-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(4, 9, 18, 0.88);
  backdrop-filter: blur(16px);
}

.nav-flex {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 56px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #d9e4ff;
  padding: 12px 16px;
  text-transform: uppercase;
  cursor: pointer;
}

.nav-link:hover, .router-link-active {
  color: #ffffff;
  border-bottom-color: var(--accent-cyan);
}

.desktop-disciplines {
  position: relative;
}

.disciplines-btn {
  display: inline-flex;
}

.disciplines-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 560px;
  padding-top: 8px;
  display: none;
}

.desktop-disciplines:hover .disciplines-dropdown {
  display: block;
}

.disciplines-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(7, 14, 28, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.disciplines-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #d6e5ff;
  background: rgba(255, 255, 255, 0.03);
}

.disciplines-item:hover {
  border-color: rgba(0, 212, 255, 0.6);
  color: #ffffff;
}

.admin-btn {
  margin-left: auto;
  color: #80f2ff;
}

.logout-btn {
  color: #ff8cb7;
}

.mobile-menu {
  display: none;
}

.mobile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 0 0 14px;
}

.mobile-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #d6e4ff;
}

.content-wrapper {
  padding: 28px 0 34px;
  min-height: 64vh;
  animation: fadeIn 0.5s ease-out;
}

.modern-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(3, 6, 12, 0.9);
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  color: #89a0c7;
}

.secret-login {
  color: #b5c8ea;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .search-modern {
    width: min(420px, 46vw);
  }
}

@media (max-width: 860px) {
  .brand-copy span {
    display: none;
  }

  .mobile-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .search-modern {
    width: min(350px, 62vw);
  }

  .glass-nav .nav-flex {
    display: none;
  }

  .desktop-disciplines {
    display: none;
  }

  .glass-nav.open .mobile-menu {
    display: block;
  }

  .glass-nav.open {
    padding-top: 10px;
  }
}

@media (max-width: 640px) {
  .topbar {
    gap: 10px;
  }

  .logo-img {
    width: 62px;
  }

  .brand-copy strong {
    font-size: 1.3rem;
  }

  .search-modern {
    width: 100%;
  }

  .header-actions {
    flex: 1;
    justify-content: flex-end;
  }

  .footer-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
