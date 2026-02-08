<script setup>
import { ref } from 'vue'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useRoute, useRouter } from 'vue-router'
import { resolveIsAdmin } from '../auth'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const router = useRouter()
const route = useRoute()

const login = async () => {
  try {
    errorMsg.value = ''
    const credentials = await signInWithEmailAndPassword(auth, email.value, password.value)
    const allowedToAdmin = await resolveIsAdmin(credentials.user, { forceRefresh: true })

    if (!allowedToAdmin) {
      await signOut(auth)
      errorMsg.value = 'To konto nie ma uprawnień administratora.'
      return
    }

    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    router.push(redirectPath)
  } catch (e) {
    console.log(e)
    errorMsg.value = 'Błędne dane logowania lub brak dostępu.'
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
       <h2><i class="fa-solid fa-user-lock"></i> STREFA REDAKCJI</h2>
       <p>Zaloguj się, aby zarządzać wynikami i newsami.</p>
       
       <div class="input-group">
           <input v-model="email" type="email" placeholder="E-mail (admin@snow.pl)">
       </div>
       
       <div class="input-group">
           <input v-model="password" type="password" placeholder="Hasło" @keyup.enter="login">
       </div>
       
       <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
       
       <button @click="login" class="btn-login">ZALOGUJ SIĘ <i class="fa-solid fa-arrow-right"></i></button>
       
       <div class="back-link">
           <router-link to="/">Wróć do strony głównej</router-link>
       </div>
    </div>
  </div>
</template>

<style scoped>
.login-container { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    min-height: 70vh; 
    background: #0f172a; 
}

.login-card { 
    background: #1e293b; 
    padding: 40px; 
    border-radius: 12px; 
    border: 1px solid #334155; 
    text-align: center; 
    width: 100%; 
    max-width: 350px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

h2 { 
    color: white; 
    font-family: 'Oswald', sans-serif; 
    margin-top: 0; 
    font-size: 1.8rem;
    letter-spacing: 1px;
}

p { 
    color: #94a3b8; 
    font-size: 0.9rem; 
    margin-bottom: 25px; 
}

.input-group { margin-bottom: 15px; }

input { 
    width: 100%; 
    padding: 14px; 
    background: #0f172a; 
    border: 1px solid #334155; 
    color: white; 
    border-radius: 8px; 
    box-sizing: border-box; 
    outline: none;
    font-size: 1rem;
    transition: 0.3s;
}

input:focus { border-color: #06b6d4; box-shadow: 0 0 10px rgba(6,182,212, 0.2); }

.btn-login { 
    width: 100%; 
    padding: 14px; 
    background: #06b6d4; 
    border: none; 
    font-weight: bold; 
    cursor: pointer; 
    border-radius: 8px; 
    margin-top: 10px; 
    transition: 0.3s; 
    font-family: 'Oswald', sans-serif;
    letter-spacing: 1px;
    font-size: 1rem;
    color: #0f172a;
}

.btn-login:hover { background: #22d3ee; transform: translateY(-2px); }

.error { 
    color: #ef4444; 
    font-weight: bold; 
    margin: 15px 0 5px; 
    font-size: 0.9rem;
    background: rgba(239, 68, 68, 0.1);
    padding: 10px;
    border-radius: 5px;
}

.back-link { margin-top: 20px; font-size: 0.85rem; }
.back-link a { color: #64748b; text-decoration: none; }
.back-link a:hover { color: #94a3b8; text-decoration: underline; }
</style>
