<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

const route = useRoute()
const categoryNews = ref([])
const loading = ref(true)
const categoryDisplayName = ref('')


const currentPage = ref(1)
const itemsPerPage = 10


const paginatedNews = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return categoryNews.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(categoryNews.value.length / itemsPerPage))

const changePage = (page) => {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const fetchNews = async (urlId) => {
  loading.value = true
  currentPage.value = 1 
  const map = {
    'skoki': 'Skoki narciarskie', 'biegi': 'Biegi narciarskie', 'alpejskie': 'Narciarstwo alpejskie',
    'biathlon': 'Biathlon', 'hokej': 'Hokej na lodzie', 'snowboard': 'Snowboard',
    'szybkie': 'Łyżwiarstwo szybkie', 'curling': 'Curling', 'kombinacja': 'Kombinacja norweska',
    'dowolne': 'Narciarstwo dowolne', 'skialpinizm': 'Skialpinizm', 'figurowe': 'Łyżwiarstwo figurowe',
    'shorttrack': 'Short track', 'bobsleje': 'Bobsleje', 'saneczkarstwo': 'Saneczkarstwo', 'skeleton': 'Skeleton'
  }
  let dbCategory = map[urlId] || urlId.charAt(0).toUpperCase() + urlId.slice(1)
  categoryDisplayName.value = dbCategory.toUpperCase()

  try {
    const q = query(collection(db, 'articles'), where('category', '==', dbCategory), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    categoryNews.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) { console.log(e) }
  finally { loading.value = false }
}

onMounted(() => fetchNews(route.params.id))
watch(() => route.params.id, (newId) => fetchNews(newId))
</script>

<template>
  <div class="category-page">
    <div class="section-title">
        <h3><i class="fa-solid fa-layer-group"></i> {{ categoryDisplayName }}</h3>
        <div class="line"></div>
    </div>

    <div v-if="loading" class="msg">Ładowanie newsów...</div>
    <div v-else-if="categoryNews.length === 0" class="msg empty-state">Brak newsów w tej kategorii.</div>

    <div class="news-grid" v-else>
       <RouterLink 
           v-for="(news, i) in paginatedNews" 
           :key="i" 
           :to="'/artykul/' + news.id" 
           class="news-card"
       >
          <div class="news-img" v-if="news.imageUrl" :style="{ backgroundImage: 'url(' + news.imageUrl + ')' }"></div>
          <div class="news-img-placeholder" v-else><i class="fa-regular fa-image"></i></div>

          <div class="news-content">
              <span class="cat-tag">{{ news.category }}</span>
              <h4>{{ news.title }}</h4>
              <p class="news-excerpt" v-if="news.content">{{ news.content.substring(0, 100) }}...</p>
              <div class="news-meta">{{ news.date }}</div>
          </div>
       </RouterLink>
    </div>

    <div class="pagination" v-if="totalPages > 1">
        <button 
            v-for="page in totalPages" 
            :key="page" 
            @click="changePage(page)"
            :class="{ active: page === currentPage }"
        >
            {{ page }}
        </button>
    </div>
  </div>
</template>

<style scoped>
.category-page { padding: 20px 0; min-height: 60vh; }
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
.news-excerpt { color: #cbd5e1; font-size: 0.9rem; margin: 0 0 15px; line-height: 1.5; }
.news-meta { color: #64748b; font-size: 0.8rem; }
.msg { text-align: center; color: #94a3b8; font-size: 1.1rem; margin-top: 50px; }

/* STYLE PAGINACJI */
.pagination { display: flex; justify-content: center; gap: 10px; margin-top: 50px; }
.pagination button {
    background: #1e293b; border: 1px solid #334155; color: white;
    width: 40px; height: 40px; border-radius: 6px; cursor: pointer; font-weight: bold;
    transition: 0.3s;
}
.pagination button:hover { border-color: #06b6d4; color: #06b6d4; }
.pagination button.active { background: #06b6d4; color: black; border-color: #06b6d4; }
</style>