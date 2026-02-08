<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router' 
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const route = useRoute()
const article = ref(null)
const loading = ref(true)

onMounted(async () => {
  
  const docRef = doc(db, 'articles', route.params.id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    article.value = docSnap.data()
  } else {
    console.log("Nie ma takiego artykułu!")
  }
  loading.value = false
})
</script>

<template>
  <div class="article-page">
    
    <div v-if="loading" class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i> Ładowanie treści...
    </div>

    <div v-else-if="article" class="article-container">
        
        <div class="article-header">
            <span class="category-badge">{{ article.category }}</span>
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
                <span><i class="fa-regular fa-clock"></i> {{ article.date }}</span>
                <span><i class="fa-solid fa-user-pen"></i> Redakcja SnowArena</span>
            </div>
        </div>

        <div v-if="article.imageUrl" class="main-image">
            <img :src="article.imageUrl" alt="Zdjęcie główne">
        </div>

        <div class="article-content">
            <p class="text-body">{{ article.content }}</p>
        </div>

        <div class="footer-nav">
            <router-link to="/" class="btn-back">
                <i class="fa-solid fa-arrow-left"></i> Wróć do strony głównej
            </router-link>
        </div>
    </div>

    <div v-else class="not-found">
        <h2>404</h2>
        <p>Przykro nam, ten artykuł nie istnieje lub został usunięty.</p>
        <router-link to="/" class="btn-back">Wróć na start</router-link>
    </div>

  </div>
</template>

<style scoped>
.article-page { min-height: 80vh; padding: 40px 0; background: #0f172a; color: #cbd5e1; }


.article-container { 
    max-width: 900px; 
    margin: 0 auto; 
    background: #1e293b; 
    padding: 50px; 
    border-radius: 16px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    border: 1px solid #334155;
}


.category-badge { color: #06b6d4; font-weight: 800; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; display: block; margin-bottom: 10px; }
.article-title { 
    font-family: 'Oswald', sans-serif; font-size: 2.8rem; color: white; margin: 0 0 20px; line-height: 1.2; text-transform: none; 
}
.article-meta { 
    color: #64748b; font-size: 0.9rem; margin-bottom: 30px; border-bottom: 1px solid #334155; padding-bottom: 20px; 
    display: flex; gap: 20px;
}


.main-image { margin-bottom: 40px; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
.main-image img { width: 100%; height: auto; display: block; }


.text-body { 
    font-family: 'Georgia', serif; 
    font-size: 1.2rem; 
    line-height: 1.8; 
    color: #e2e8f0; 
    white-space: pre-wrap; 
    text-align: left;
}

.footer-nav { margin-top: 60px; border-top: 1px solid #334155; padding-top: 30px; }
.btn-back { color: #06b6d4; text-decoration: none; font-weight: bold; font-size: 1.1rem; transition: 0.2s; }
.btn-back:hover { color: white; margin-left: -5px; }

.loading, .not-found { text-align: center; margin-top: 100px; font-size: 1.5rem; color: #94a3b8; }


@media (max-width: 768px) {
    .article-container { padding: 25px; width: 95%; margin: 0 auto; box-sizing: border-box; }
    .article-title { font-size: 2rem; }
    .text-body { font-size: 1.1rem; }
}
</style>