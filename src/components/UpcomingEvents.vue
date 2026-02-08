<script setup>
import { computed, onMounted, ref } from 'vue'
import { db } from '../firebase'
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore'

const events = ref([])
const loading = ref(true)
const todayMedalCount = ref(0)
const gamesEndDate = '2026-02-22'

const getLocalIsoDate = (timeZone = 'Europe/Warsaw') => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

const looksLikeMedalEvent = (title = '') => {
  const text = String(title).toLowerCase()
  if (!text) return false
  const excluded = ['qualification', 'qualifying', 'training', 'practice', 'round robin', 'preliminary', 'group stage', 'heats', 'heat ']
  if (excluded.some((item) => text.includes(item))) return false
  const medalLike = [
    'final',
    'medal',
    'gold medal',
    'bronze medal',
    'downhill',
    'super-g',
    'giant slalom',
    'slalom',
    'skiathlon',
    'big air',
    'halfpipe',
    'moguls',
    'mass start',
    'relay',
    'team event',
    'individual',
    'pursuit',
  ]
  return medalLike.some((item) => text.includes(item))
}

const todayIso = getLocalIsoDate()

const groupedEvents = computed(() => {
  const groups = []
  let current = null

  for (const event of events.value) {
    if (!current || current.date !== event.date) {
      current = { date: event.date, items: [], medalCount: 0 }
      groups.push(current)
    }
    current.items.push(event)
    if (event.isMedalEvent) current.medalCount += 1
  }

  return groups
})

const fetchEvents = async () => {
  try {
    const q = query(
      collection(db, 'events'),
      where('date', '>=', todayIso),
      orderBy('date', 'asc'),
      orderBy('time', 'asc'),
      limit(20),
    )

    const snap = await getDocs(q)
    events.value = snap.docs
      .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      .filter((event) => event.date <= gamesEndDate && (event.isMedalEvent === true || looksLikeMedalEvent(event.title)))

    const fromEvents = events.value.filter((event) => {
      if (event.date !== todayIso) return false
      return Boolean(event.isMedalEvent) || looksLikeMedalEvent(event.title)
    }).length

    const summarySnap = await getDoc(doc(db, 'daily_medal_events', todayIso))
    const fromSummary = summarySnap.exists() ? Number(summarySnap.data().totalMedalEvents || 0) : 0

    todayMedalCount.value = Math.max(fromEvents, fromSummary)
  } catch (error) {
    console.error('Błąd terminarza:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEvents()
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

const isToday = (dateStr) => dateStr === todayIso
</script>

<template>
  <div class="card events-card">
    <div class="card-header">
      <h3>📅 Terminarz</h3>
      <div class="header-badges">
        <span class="medal-counter">🥇 Dziś medalowe: {{ todayMedalCount }}</span>
        <div class="pulse-dot"></div>
      </div>
    </div>

    <div v-if="loading" class="state-msg">Ładowanie startów...</div>
    <div v-else-if="events.length === 0" class="state-msg">Brak zaplanowanych startów.</div>

    <div v-else class="events-groups">
      <div v-for="group in groupedEvents" :key="group.date" class="events-day">
        <div class="day-header" :class="{ today: isToday(group.date) }">
          <strong>{{ formatDate(group.date) }}</strong>
          <span>Medalowe: {{ group.medalCount }}</span>
        </div>

        <ul class="events-list">
          <li v-for="event in group.items" :key="event.id" :class="{ 'today-highlight': isToday(event.date) }">
            <div class="event-time-box">
              <span class="time">{{ event.time }}</span>
            </div>

            <div class="event-info">
              <div class="sport-label">
                <i :class="event.icon"></i> {{ event.sport }}
                <span v-if="event.isMedalEvent" class="medal-badge">MEDAL</span>
                <span v-if="isToday(event.date)" class="live-badge">DZIŚ</span>
              </div>
              <div class="event-title">{{ event.title }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 0;
  border: 1px solid #334155;
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(15, 23, 42, 0.5);
}

h3 {
  margin: 0;
  color: white;
  font-size: 1rem;
  border-left: 4px solid var(--accent-cyan);
  padding-left: 10px;
  font-family: 'Oswald', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.medal-counter {
  font-size: 0.75rem;
  color: #f8c96b;
  border: 1px solid rgba(248, 201, 107, 0.3);
  border-radius: 999px;
  padding: 3px 8px;
  background: rgba(248, 201, 107, 0.08);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--accent-cyan);
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(6, 182, 212, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(6, 182, 212, 0); }
  100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
}

.state-msg {
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
  padding: 20px;
}

.events-groups {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.events-day {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
}

.day-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #93acd3;
  background: rgba(148, 163, 184, 0.1);
}

.day-header.today {
  color: #d8f9ff;
  background: rgba(0, 212, 255, 0.12);
}

.events-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.events-list li {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-top: 1px solid #1e293b;
  align-items: center;
  transition: background 0.2s;
}

.events-list li:hover {
  background: rgba(255, 255, 255, 0.03);
}

.today-highlight {
  background: rgba(6, 182, 212, 0.05);
}

.event-time-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  padding: 8px 0;
  width: 54px;
  border-radius: 8px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.time {
  font-size: 0.92rem;
  color: var(--accent-cyan);
  font-weight: 800;
  line-height: 1;
}

.event-info {
  flex-grow: 1;
}

.sport-label {
  font-size: 0.67rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.sport-label i {
  color: var(--accent-cyan);
}

.medal-badge {
  background: rgba(245, 158, 11, 0.18);
  color: #f9d27f;
  border: 1px solid rgba(245, 158, 11, 0.35);
  font-size: 0.58rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
}

.live-badge {
  background: #ef4444;
  color: white;
  font-size: 0.58rem;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: auto;
  font-weight: 700;
}

.event-title {
  font-weight: 700;
  font-size: 0.92rem;
  color: #f1f5f9;
  line-height: 1.3;
}
</style>
