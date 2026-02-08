<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import UpcomingEvents from '../components/UpcomingEvents.vue'
import PollWidget from '../components/PollWidget.vue'
import { db } from '../firebase'

const latestNews = ref([])
const topStories = ref([])
const medalTable = ref([])
const loading = ref(true)
const currentSlide = ref(0)
let slideInterval = null

const heroStory = computed(() => topStories.value[currentSlide.value] || null)
const feedNews = computed(() => latestNews.value.slice(0, 6))
const disciplineTiles = [
  { to: '/kategoria/skoki', label: 'Skoki narciarskie' },
  { to: '/kategoria/biegi', label: 'Biegi narciarskie' },
  { to: '/kategoria/biathlon', label: 'Biathlon' },
  { to: '/kategoria/alpejskie', label: 'Narciarstwo alpejskie' },
  { to: '/kategoria/hokej', label: 'Hokej na lodzie' },
  { to: '/kategoria/szybkie', label: 'Łyżwiarstwo szybkie' },
  { to: '/kategoria/figurowe', label: 'Łyżwiarstwo figurowe' },
  { to: '/kategoria/shorttrack', label: 'Short track' },
]

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
    const qTop = query(collection(db, 'articles'), where('isTopStory', '==', true), orderBy('date', 'desc'), limit(5))
    const snapTop = await getDocs(qTop)
    topStories.value = snapTop.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))

    if (topStories.value.length === 0) {
      const qFallback = query(collection(db, 'articles'), orderBy('date', 'desc'), limit(1))
      const snapFallback = await getDocs(qFallback)
      topStories.value = snapFallback.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    }

    if (topStories.value.length > 1) {
      slideInterval = setInterval(nextSlide, 5000)
    }

    const qNews = query(collection(db, 'articles'), orderBy('date', 'desc'), limit(8))
    const snapNews = await getDocs(qNews)
    latestNews.value = snapNews.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))

    const snapMedals = await getDocs(collection(db, 'medals'))
    const medals = snapMedals.docs.map((docItem) => docItem.data())
    medals.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
    medalTable.value = medals
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})
</script>

<template>
  <div class="arena-grid" :class="{ loaded: !loading }">
    <main class="main-feed">
      <section class="hero-shell" v-if="heroStory">
        <div class="hero-image" :style="{ backgroundImage: `url(${heroStory.imageUrl || 'https://via.placeholder.com/1300x680'})` }"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <p class="hero-kicker">Top Story</p>
          <h1>{{ heroStory.title }}</h1>
          <p v-if="heroStory.content">{{ heroStory.content.substring(0, 170) }}...</p>
          <div class="hero-actions">
            <RouterLink :to="`/artykul/${heroStory.id}`" class="btn-hero-primary">
              Czytaj artykuł <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
            <span class="hero-date">{{ heroStory.date }}</span>
          </div>
        </div>
        <div class="slider-dots" v-if="topStories.length > 1">
          <button
            v-for="(story, index) in topStories"
            :key="story.id"
            class="dot"
            :class="{ active: index === currentSlide }"
            @click="setSlide(index)"
            :aria-label="`Pokaż slajd ${index + 1}`"
          ></button>
        </div>
      </section>

      <PollWidget />

      <section class="section-head">
        <h2>Najnowsze wiadomości</h2>
        <RouterLink to="/kategoria/skoki" class="view-more">Zobacz więcej <i class="fa-solid fa-chevron-right"></i></RouterLink>
      </section>

      <section class="disciplines-section">
        <RouterLink v-for="discipline in disciplineTiles" :key="discipline.to" :to="discipline.to" class="discipline-pill">
          {{ discipline.label }}
        </RouterLink>
      </section>

      <section class="news-grid">
        <RouterLink v-for="news in feedNews" :key="news.id" :to="`/artykul/${news.id}`" class="news-card">
          <div class="news-image-wrap">
            <div v-if="news.imageUrl" class="news-img" :style="{ backgroundImage: `url(${news.imageUrl})` }"></div>
            <div v-else class="news-img-placeholder"><i class="fa-regular fa-image"></i></div>
            <span class="cat-tag">{{ news.category }}</span>
          </div>
          <div class="news-content">
            <h3>{{ news.title }}</h3>
            <p v-if="news.content">{{ news.content.substring(0, 110) }}...</p>
            <div class="news-meta">
              <span>{{ news.date }}</span>
              <span class="read-more">Czytaj <i class="fa-solid fa-arrow-right"></i></span>
            </div>
          </div>
        </RouterLink>
      </section>
    </main>

    <aside class="sidebar right-panel">
      <UpcomingEvents />

      <section class="card ranking-card">
        <div class="card-header">
          <h3>Klasyfikacja medalowa</h3>
        </div>
        <div v-if="medalTable.length === 0" class="empty">Trwa liczenie...</div>
        <table class="ranking-table" v-else>
          <thead>
            <tr><th>#</th><th>Kraj</th><th>🥇</th><th>🥈</th><th>🥉</th></tr>
          </thead>
          <tbody>
            <tr v-for="(nation, index) in medalTable.slice(0, 10)" :key="nation.code" :class="{ highlight: nation.code === 'POL' }">
              <td>{{ index + 1 }}</td>
              <td class="nation-cell">
                <img :src="nation.flag" class="flag-img" alt="">
                {{ nation.country }}
              </td>
              <td>{{ nation.gold }}</td>
              <td>{{ nation.silver }}</td>
              <td>{{ nation.bronze }}</td>
            </tr>
          </tbody>
        </table>
        <div class="show-more-container" v-if="medalTable.length > 10">
          <RouterLink to="/medale" class="btn-full-table">Pełna tabela</RouterLink>
        </div>
      </section>

      <section class="card social-card">
        <div class="card-header">
          <h3>Relacja live</h3>
        </div>
        <div class="social-body">
          <p>Miejsce na feed social i krótkie update'y dnia.</p>
          <strong>@SnowArenaPL</strong>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.arena-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}

.arena-grid.loaded {
  opacity: 1;
  transform: translateY(0);
}

.main-feed {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.hero-shell {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  min-height: 430px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}

.hero-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
  animation: heroZoom 12s linear infinite;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(0, 0, 0, 0.76) 20%, rgba(0, 0, 0, 0.08) 72%),
    linear-gradient(180deg, rgba(4, 10, 20, 0.2), rgba(4, 10, 20, 0.86));
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: clamp(20px, 4vw, 44px);
  max-width: 760px;
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  padding: 5px 12px;
  background: rgba(0, 212, 255, 0.18);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.74rem;
}

.hero-content h1 {
  margin: 0;
  font-size: clamp(2rem, 4.4vw, 3.9rem);
  line-height: 0.94;
  text-transform: uppercase;
}

.hero-content p {
  margin-top: 14px;
  color: #d4e1fb;
  font-size: 1.03rem;
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-hero-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  background: linear-gradient(120deg, #00d4ff, #79f4ff);
  color: #031322;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 12px 20px;
}

.hero-date {
  color: #adc4e7;
  font-size: 0.9rem;
}

.slider-dots {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 3;
  display: flex;
  gap: 8px;
}

.dot {
  width: 11px;
  height: 11px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.38);
}

.dot.active {
  background: #00d4ff;
  transform: scale(1.15);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-head h2 {
  margin: 0;
  font-size: 1.3rem;
  text-transform: uppercase;
  color: #f4f8ff;
}

.view-more {
  color: #91e9ff;
  font-size: 0.9rem;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.disciplines-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.discipline-pill {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #d5e6ff;
  font-size: 0.85rem;
  padding: 7px 12px;
}

.discipline-pill:hover {
  border-color: rgba(0, 212, 255, 0.6);
  color: #ffffff;
}

.news-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(165deg, rgba(14, 24, 43, 0.94), rgba(9, 16, 30, 0.96));
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.news-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 212, 255, 0.8);
}

.news-image-wrap {
  position: relative;
}

.news-img, .news-img-placeholder {
  height: 190px;
}

.news-img {
  background-size: cover;
  background-position: center;
}

.news-img-placeholder {
  display: grid;
  place-items: center;
  background: #1b2942;
  color: #7f95bc;
  font-size: 1.8rem;
}

.cat-tag {
  position: absolute;
  left: 12px;
  top: 12px;
  border-radius: 999px;
  background: rgba(2, 8, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #88ebff;
}

.news-content {
  padding: 16px;
}

.news-content h3 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.05;
}

.news-content p {
  margin-top: 10px;
  color: #b5c8e9;
  font-size: 0.95rem;
}

.news-meta {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #87a0ca;
}

.read-more {
  color: #9bf0ff;
}

.card {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(160deg, #102039, #0b1629);
  margin-bottom: 18px;
}

.card-header {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
}

.card-header h3 {
  margin: 0;
  text-transform: uppercase;
  font-size: 1rem;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.87rem;
}

.ranking-table th,
.ranking-table td {
  text-align: center;
  padding: 9px 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.ranking-table th:nth-child(2),
.ranking-table td:nth-child(2) {
  text-align: left;
}

.nation-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.flag-img {
  width: 20px;
  border-radius: 2px;
}

.highlight td {
  background: rgba(0, 212, 255, 0.1);
}

.show-more-container {
  padding: 10px 14px;
}

.btn-full-table {
  color: #88ebff;
  font-size: 0.85rem;
}

.empty {
  padding: 18px;
  color: #8ea3c8;
  text-align: center;
}

.social-body {
  padding: 18px;
  color: #99add0;
  display: grid;
  gap: 10px;
}

.social-body strong {
  color: #edfbff;
  letter-spacing: 0.05em;
}

@keyframes heroZoom {
  from {
    transform: scale(1.03);
  }
  to {
    transform: scale(1.08);
  }
}

@media (max-width: 1100px) {
  .arena-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-shell {
    min-height: 340px;
  }

  .news-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
