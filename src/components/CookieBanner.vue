<script setup>
import { ref, onMounted } from 'vue'

const isVisible = ref(false)

onMounted(() => {

  if (!localStorage.getItem('cookiesAccepted')) {
    isVisible.value = true
  }
})

const acceptCookies = () => {
  localStorage.setItem('cookiesAccepted', 'true')
  isVisible.value = false
}
</script>

<template>
  <div v-if="isVisible" class="cookie-bar">
    <div class="cookie-content">
        <p>🍪 <strong>Szanujemy Twoją prywatność.</strong> Używamy plików cookies, aby analizować ruch i serwować reklamy. Korzystając ze strony, zgadzasz się na to.</p>
        <button @click="acceptCookies">ZGODA</button>
    </div>
  </div>
</template>

<style scoped>
.cookie-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: #0f172a;
    border-top: 2px solid #06b6d4;
    color: white;
    padding: 15px;
    z-index: 9999;
    box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
}
.cookie-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}
p { margin: 0; font-size: 0.9rem; color: #cbd5e1; }
button {
    background: #06b6d4;
    color: black;
    border: none;
    padding: 10px 20px;
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
}
button:hover { background: white; }

@media (max-width: 768px) {
    .cookie-content { flex-direction: column; text-align: center; }
}
</style>