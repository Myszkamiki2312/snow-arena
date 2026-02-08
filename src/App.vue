<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { auth } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import CookieBanner from './components/CookieBanner.vue'

const isLoggedIn = ref(false)
const router = useRouter()
const globalSearch = ref('')

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user
  })
})

const handleLogout = async () => {
  if(!confirm("Czy na pewno chcesz się wylogować?")) return;
  await signOut(auth)
  isLoggedIn.value = false
  router.push('/')
}

const handleGlobalSearch = () => {
    if(globalSearch.value.trim()) {
        router.push({ name: 'search', query: { q: globalSearch.value } })
        globalSearch.value = '' 
    }
}
</script>

<template>
  <div class="app-layout">
    
    <header class="hero-header">
      <div class="container header-flex">
        <RouterLink to="/" class="brand-link">
            <div class="brand">
                 <img src="/logo-snowarena.png" alt="SNOWARENA Logo" class="logo-img">
            </div>
        </RouterLink>
        
        <div class="search-modern">
            <input 
                type="text" 
                placeholder="Szukaj na stronie..." 
                v-model="globalSearch"
                @keyup.enter="handleGlobalSearch"
            >
            <button @click="handleGlobalSearch"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </div>
    </header>

    <nav class="glass-nav">
      <div class="container nav-flex">
        <RouterLink to="/" class="nav-link">START</RouterLink>
        
        <div class="dropdown-container">
            <button class="nav-link dropdown-btn">
                DYSCYPLINY <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="dropdown-content">
                <div class="dropdown-grid">
                    <RouterLink to="/kategoria/skoki"><i class="fa-solid fa-person-snowboarding"></i> Skoki narciarskie</RouterLink>
                    <RouterLink to="/kategoria/biegi"><i class="fa-solid fa-person-skiing-nordic"></i> Biegi narciarskie</RouterLink>
                    <RouterLink to="/kategoria/biathlon"><i class="fa-solid fa-person-skiing-nordic"></i> Biathlon</RouterLink>
                    <RouterLink to="/kategoria/alpejskie"><i class="fa-solid fa-person-skiing"></i> Narciarstwo alpejskie</RouterLink>
                    <RouterLink to="/kategoria/hokej"><i class="fa-solid fa-hockey-puck"></i> Hokej na lodzie</RouterLink>
                    <RouterLink to="/kategoria/szybkie"><i class="fa-solid fa-person-skating"></i> Łyżwiarstwo szybkie</RouterLink>
                    <RouterLink to="/kategoria/snowboard"><i class="fa-solid fa-person-snowboarding"></i> Snowboard</RouterLink>
                    <RouterLink to="/kategoria/kombinacja"><i class="fa-solid fa-person-skiing-nordic"></i> Kombinacja norweska</RouterLink>
                    <RouterLink to="/kategoria/shorttrack"><i class="fa-solid fa-person-skating"></i> Short track</RouterLink>
                    <RouterLink to="/kategoria/dowolne"><i class="fa-solid fa-person-skiing"></i> Narciarstwo dowolne</RouterLink>
                    <RouterLink to="/kategoria/curling"><i class="fa-regular fa-snowflake"></i> Curling</RouterLink>
                    <RouterLink to="/kategoria/saneczkarstwo"><i class="fa-regular fa-snowflake"></i> Saneczkarstwo</RouterLink>
                    <RouterLink to="/kategoria/bobsleje"><i class="fa-regular fa-snowflake"></i> Bobsleje</RouterLink>
                    <RouterLink to="/kategoria/skeleton"><i class="fa-regular fa-snowflake"></i> Skeleton</RouterLink>
                    <RouterLink to="/kategoria/skialpinizm"><i class="fa-regular fa-snowflake"></i> Skialpinizm</RouterLink>
                    <RouterLink to="/kategoria/figurowe"><i class="fa-solid fa-person-skating"></i> Łyżwiarstwo figurowe</RouterLink>
                </div>
            </div>
        </div>

        <RouterLink to="/kategoria/skoki" class="nav-link desktop-only">SKOKI</RouterLink>
        <RouterLink to="/kategoria/biegi" class="nav-link desktop-only">BIEGI</RouterLink>
        <RouterLink to="/kategoria/biathlon" class="nav-link desktop-only">BIATHLON</RouterLink>
        <RouterLink to="/kategoria/alpejskie" class="nav-link desktop-only">ALPEJSKIE</RouterLink>
        <RouterLink to="/kategoria/hokej" class="nav-link desktop-only">HOKEJ</RouterLink>

        <template v-if="isLoggedIn">
            <RouterLink to="/admin" class="nav-link admin-btn" title="Panel Redaktora">
                <i class="fa-solid fa-pen-to-square"></i> PANEL
            </RouterLink>
            <button @click="handleLogout" class="nav-link logout-btn" title="Wyloguj się">
                <i class="fa-solid fa-right-from-bracket"></i> WYLOGUJ
            </button>
        </template>
      </div>
    </nav>

    <div class="container content-wrapper">
      <RouterView />
    </div>

    <footer class="modern-footer">
      <div class="container">
        <p>
            &copy; 2026 SNOW ARENA. Wszelkie prawa zastrzeżone. | Design & Code: <strong>Bartłomiej</strong> 🔥
            <RouterLink v-if="!isLoggedIn" to="/login" class="secret-login" title="Panel Admina">
                <i class="fa-solid fa-lock"></i>
            </RouterLink>
        </p>
      </div>
    </footer>

    <CookieBanner />

  </div>
</template>

<style>

:root { --bg-dark: #0f172a; --bg-card: #1e293b; --accent-cyan: #06b6d4; --text-main: #f1f5f9; --text-muted: #94a3b8; }

body { margin: 0; padding: 0; width: 100vw; min-height: 100vh; overflow-x: hidden; background-color: var(--bg-dark); color: var(--text-main); font-family: 'Roboto', sans-serif; }
h1, h2, h3, .nav-link, .brand { font-family: 'Oswald', sans-serif; text-transform: uppercase; }

.container { max-width: 1600px; width: 97%; margin: 0 auto; }
a { text-decoration: none; color: inherit; }

.secret-login { margin-left: 10px; color: #1e293b; transition: 0.3s; font-size: 0.8rem; }
.secret-login:hover { color: #334155; }

.hero-header { background: linear-gradient(to right, #0f172a, #1e293b); padding: 20px 0; border-bottom: 1px solid #334155; }
.header-flex { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.brand-link { text-decoration: none; }
.brand { display: flex; align-items: center; cursor: pointer; }

.logo-img {
    height: 100px; 
    width: auto;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.3));
}
.brand:hover .logo-img { transform: scale(1.05); }

/* WYSZUKIWARKA */
.search-modern { display: flex; background: #0f172a; border: 1px solid #334155; border-radius: 50px; padding: 5px; width: 100%; max-width: 400px; }
.search-modern input { background: transparent; border: none; color: white; padding: 10px 15px; width: 100%; outline: none; }
.search-modern button { background: var(--accent-cyan); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; color: #0f172a; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }

/* MENU */
.glass-nav { background: rgba(15, 23, 42, 0.95); border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); }
.nav-flex { display: flex; gap: 0; overflow-x: visible; justify-content: flex-start; align-items: center; }

.nav-link { 
    color: #cbd5e1; padding: 18px 25px; font-weight: bold; font-size: 0.95rem; letter-spacing: 0.5px; border-bottom: 3px solid transparent; 
    white-space: nowrap; transition: 0.3s; background: transparent; border: none; cursor: pointer; font-family: 'Oswald', sans-serif;
    display: flex; align-items: center; gap: 8px;
}
.nav-link:hover, .nav-link.active, .router-link-active { color: var(--accent-cyan); background: rgba(6,182,212, 0.05); border-bottom: 3px solid var(--accent-cyan); }


.dropdown-container { position: relative; }
.dropdown-content {
    display: none; position: absolute; top: 100%; left: 0;
    background: #1e293b; border: 1px solid #334155; border-radius: 0 0 8px 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8); z-index: 1000; width: 600px; padding: 20px;
}
.dropdown-container:hover .dropdown-content { display: block; }
.dropdown-btn { border-bottom: none !important; }

.dropdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dropdown-grid a {
    padding: 10px; color: #cbd5e1; text-decoration: none; font-weight: 500; border-radius: 6px; transition: 0.2s;
    display: flex; align-items: center; gap: 10px;
}
.dropdown-grid a:hover { background: #334155; color: var(--accent-cyan); }
.dropdown-grid i { width: 20px; text-align: center; color: var(--accent-cyan); }


.admin-btn { margin-left: auto; color: #06b6d4 !important; border-left: 1px solid #334155; }
.admin-btn:hover { background: rgba(6, 182, 212, 0.1); }
.logout-btn { color: #ef4444 !important; border-left: 1px solid #334155; text-transform: uppercase; }
.logout-btn:hover { background: rgba(239, 68, 68, 0.1); border-bottom-color: #ef4444 !important; }

.content-wrapper { padding: 40px 0; min-height: 60vh; }
.modern-footer { background: #020617; padding: 40px; text-align: center; color: #475569; margin-top: 60px; border-top: 1px solid #1e293b; }


@media (max-width: 1200px) {
    .desktop-only { display: none !important; }
}

@media (max-width: 768px) {
    .header-flex { flex-direction: column; align-items: center; text-align: center; }
    .search-modern { width: 90%; margin-top: 10px; }
    .nav-link { padding: 15px 10px; font-size: 0.8rem; }
    .logo-img { height: 70px; }
    .dropdown-content { width: 90vw; left: -20px; }
    .dropdown-grid { grid-template-columns: 1fr; }
}
</style>