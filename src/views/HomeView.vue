<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import UpcomingEvents from '../components/UpcomingEvents.vue'
import PollWidget from '../components/PollWidget.vue'

const latestNews = ref([])
const topStories = ref([]) 
const medalTable = ref([]) 
const loading = ref(true)

const currentSlide = ref(0)
let slideInterval = null

const nextSlide = () => {
    if (topStories.value.length > 0) {
        currentSlide.value = (currentSlide.value + 1) % topStories.value.length
    }
}
const setSlide = (index) => {
    currentSlide.value = index
    clearInterval(slideInterval)
    slideInterval = setInterval(nextSlide, 5000)
}

onMounted(async () => {
  try {
 
    const qTop = query(collection(db, 'articles'), where('isTopStory', '==', true), limit(5))
    const snapTop = await getDocs(qTop)
    topStories.value = snapTop.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
 
    if (topStories.value.length === 0) {
         const qFallback = query(collection(db, 'articles'), orderBy('date', 'desc'), limit(1))
         const snapFallback = await getDocs(qFallback)
         topStories.value = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    if(topStories.value.length > 1) slideInterval = setInterval(nextSlide, 5000)


    const qNews = query(collection(db, 'articles'), orderBy('date', 'desc'), limit(6))
    const snapNews = await getDocs(qNews)
    latestNews.value = snapNews.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const snapMedals = await getDocs(collection(db, 'medals'))
    let medals = snapMedals.docs.map(doc => doc.data())
    medals.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
    medalTable.value = medals

  } catch (e) { console.log(e) } 
  finally { loading.value = false }
})

onUnmounted(() => { if (slideInterval) clearInterval(slideInterval) })
</script>

<template>
  <div class="arena-grid">
    
    <main class="main-feed">
      
      <div class="hero-container" v-if="topStories.length > 0">
          <div class="hero-slide" v-for="(story, index) in topStories" :key="story.id" v-show="index === currentSlide">
             <div class="slide-bg" :style="{ backgroundImage: 'url(' + (story.imageUrl || 'https://via.placeholder.com/800x400') + ')' }"></div>
             <div class="hero-content">
                 <span class="tag">TOP STORY</span>
                 <h2>{{ story.title }}</h2>
                 <p v-if="story.content">{{ story.content.substring(0, 100) }}...</p>
                 <RouterLink :to="'/artykul/' + story.id" class="btn-hero">CZYTAJ WIĘCEJ <i class="fa-solid fa-arrow-right"></i></RouterLink>
             </div>
          </div>
          <div class="slider-dots" v-if="topStories.length > 1">
              <span v-for="(dot, i) in topStories" :key="i" class="dot" :class="{ active: i === currentSlide }" @click="setSlide(i)"></span>
          </div>
      </div>

      <PollWidget />

      <div class="section-title"><h3>NAJNOWSZE WIADOMOŚCI</h3><div class="line"></div></div>
      
      <div class="news-grid">
         <RouterLink v-for="(news, i) in latestNews" :key="i" :to="'/artykul/' + news.id" class="news-card">
            <div class="news-img" v-if="news.imageUrl" :style="{ backgroundImage: 'url(' + news.imageUrl + ')' }"></div>
            <div class="news-img-placeholder" v-else><i class="fa-regular fa-image"></i></div>
            <div class="news-content">
                <span class="cat-tag">{{ news.category }}</span>
                <h4>{{ news.title }}</h4>
                <div class="news-meta">{{ news.date }}</div>
            </div>
         </RouterLink>
      </div>
    </main>

    <aside class="sidebar right-panel">
      
      <UpcomingEvents />

      <div class="card ranking-card">
         <div class="card-header"><h3>🏆 KLASYFIKACJA</h3></div>
         <div v-if="medalTable.length === 0" style="text-align:center; padding:20px; color:#64748b;">Trwa liczenie...</div>
         <table class="ranking-table" v-else>
            <thead><tr><th>#</th><th>KRAJ</th><th>🥇</th><th>🥈</th><th>🥉</th></tr></thead>
            <tbody>
                <tr v-for="(nation, index) in medalTable.slice(0, 10)" :key="nation.code" :class="{'highlight': nation.code === 'POL'}">
                    <td>{{ index + 1 }}.</td>
                    <td class="nation-cell"><img :src="nation.flag" class="flag-img">{{ nation.country }}</td>
                    <td class="bold">{{ nation.gold }}</td><td>{{ nation.silver }}</td><td>{{ nation.bronze }}</td>
                </tr>
            </tbody>
         </table>
         <div class="show-more-container" v-if="medalTable.length > 10">
             <RouterLink to="/medale" class="btn-full-table">PEŁNA TABELA <i class="fa-solid fa-chevron-right"></i></RouterLink>
         </div>
      </div>

      <div class="card twitter-card">
          <div class="card-header"><h3><i class="fa-brands fa-x-twitter"></i> RELACJA LIVE</h3></div>
          <div style="padding: 30px 20px; text-align: center; color: #94a3b8; font-size: 0.9rem;">
              <p>Tu pojawią się tweety<br><strong style="color:white; font-size:1.1rem;">@SnowArenaPL</strong></p>
              <i class="fa-solid fa-comments" style="font-size: 2.5rem; margin-top: 15px; color: #334155;"></i>
          </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>

.arena-grid { display: grid; grid-template-columns: 1fr 320px; gap: 30px; align-items: start; }
@media (max-width: 1024px) { .arena-grid { grid-template-columns: 1fr; } .sidebar.right-panel { display: block; margin-top: 30px; } }

.card { background: var(--bg-card); border-radius: 12px; padding: 0; border: 1px solid #334155; margin-bottom: 20px; overflow: hidden; }
.card-header { padding: 15px 20px; border-bottom: 1px solid #334155; background: rgba(15, 23, 42, 0.5); }
h3 { margin: 0; color: white; font-size: 1rem; border-left: 4px solid var(--accent-cyan); padding-left: 10px; font-family: 'Oswald', sans-serif; text-transform: uppercase; }


.hero-container { position: relative; height: 380px; border-radius: 16px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); background: #000; }
@media (max-width: 768px) { .hero-container { height: 280px; margin-bottom: 20px; } .hero-content h2 { font-size: 1.5rem; } }
.hero-slide { position: absolute; inset: 0; display: flex; align-items: flex-end; transition: opacity 0.5s ease-in-out; }
.slide-bg { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.7; }
.hero-content { position: relative; z-index: 2; padding: 40px; width: 100%; color: white; }
.hero-content h2 { font-size: 2.2rem; margin: 15px 0; line-height: 1.1; text-transform: uppercase; font-style: italic; text-shadow: 2px 2px 10px black; font-family: 'Oswald'; }
.hero-content p { color: #ccc; max-width: 600px; margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tag { background: var(--accent-cyan); color: black; padding: 5px 12px; font-weight: bold; font-size: 0.75rem; border-radius: 4px; }
.btn-hero { background: white; border: none; padding: 12px 25px; font-weight: bold; cursor: pointer; border-radius: 30px; display: inline-block; text-decoration: none; color: black; transition: 0.3s; }
.btn-hero:hover { background: var(--accent-cyan); }

.news-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 600px) { .news-grid { grid-template-columns: 1fr; } }
.news-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid #334155; display: block; text-decoration: none; color: inherit; transition: 0.3s; }
.news-card:hover { transform: translateY(-5px); border-color: var(--accent-cyan); }
.news-img { height: 200px; background-size: cover; background-position: center; } 
.news-img-placeholder { height: 200px; background: #253347; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #475569; }
.news-content { padding: 20px; }
.news-content h4 { margin: 8px 0 10px; color: white; font-size: 1.2rem; line-height: 1.3; font-family: 'Oswald', sans-serif; }
.section-title { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; margin-top: 10px; } .line { height: 1px; background: #334155; flex-grow: 1; }

.ranking-table { width: 100%; border-collapse: collapse; color: #cbd5e1; font-size: 0.9rem; }
.ranking-table td { padding: 10px 5px; border-bottom: 1px solid #1e293b; text-align: center; font-weight: 500; }
.ranking-table td.nation-cell { text-align: left; color: white; font-weight: bold; display: flex; align-items: center; }
.highlight td { background: rgba(6, 182, 212, 0.1); border-left: 2px solid var(--accent-cyan); }
.flag-img { width: 24px; height: auto; margin-right: 8px; border-radius: 3px; box-shadow: 0 1px 3px black; }
.show-more-container { text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; }
.btn-full-table { color: #06b6d4; text-decoration: none; font-weight: bold; font-size: 0.8rem; }
.slider-dots { position: absolute; bottom: 20px; right: 30px; display: flex; gap: 8px; z-index: 5; }
.dot { width: 12px; height: 12px; background: rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: 0.3s; }
.dot.active { background: var(--accent-cyan); transform: scale(1.2); }
</style>