<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

const route = useRoute()
const searchResults = ref([])
const loading = ref(true)
const queryText = ref('')

const performSearch = async (txt) => {
    loading.value = true
    queryText.value = txt
    try {
       
        const q = query(collection(db, 'articles'), orderBy('date', 'desc'))
        const snap = await getDocs(q)
        const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
      
        const lowerTxt = txt.toLowerCase()
        searchResults.value = allDocs.filter(doc => 
            doc.title.toLowerCase().includes(lowerTxt) || 
            (doc.content && doc.content.toLowerCase().includes(lowerTxt))
        )
    } catch (e) { console.log(e) }
    finally { loading.value = false }
}

onMounted(() => performSearch(route.query.q))
watch(() => route.query.q, (newQ) => performSearch(newQ))
</script>

<template>
  <div class="search-page">
    <div class="section-title">
        <h3><i class="fa-solid fa-magnifying-glass"></i> WYNIKI DLA: "{{ queryText }}"</h3>
        <div class="line"></div>
    </div>

    <div v-if="loading" class="msg">Szukam...</div>
    <div v-else-if="searchResults.length === 0" class="msg empty-state">
        Niestety, nic nie znaleziono. Spróbuj innej frazy.
    </div>

    <div class="news-grid" v-else>
       <RouterLink 
           v-for="(news, i) in searchResults" 
           :key="i" 
           :to="'/artykul/' + news.id" 
           class="news-card"
       >
          <div class="news-img" v-if="news.imageUrl" :style="{ backgroundImage: 'url(' + news.imageUrl + ')' }"></div>
          <div class="news-img-placeholder" v-else><i class="fa-regular fa-image"></i></div>

          <div class="news-content">
              <span class="cat-tag">{{ news.category }}</span>
              <h4>{{ news.title }}</h4>
              <div class="news-meta">{{ news.date }}</div>
          </div>
       </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.search-page { padding: 20px 0; min-height: 60vh; }
.section-title { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
.section-title h3 { margin: 0; color: #06b6d4; font-size: 1.5rem; font-family: 'Oswald'; text-transform: uppercase; }
.line { height: 1px; background: #334155; flex-grow: 1; }
.news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.news-card { background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; transition: 0.3s; display: block; text-decoration: none; color: inherit; }
.news-card:hover { transform: translateY(-5px); border-color: #06b6d4; }
.news-img { height: 180px; background-size: cover; background-position: center; }
.news-img-placeholder { height: 180px; background: #0f172a; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #475569; }
.news-content { padding: 20px; }
.cat-tag { color: #06b6d4; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; display: block; }
h4 { margin: 0 0 10px; color: white; font-size: 1.1rem; line-height: 1.4; font-family: 'Oswald'; }
.news-meta { color: #64748b; font-size: 0.8rem; }
.msg { text-align: center; color: #94a3b8; font-size: 1.1rem; margin-top: 50px; }
</style>