<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'

const events = ref([])
const loading = ref(true)

const fetchEvents = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    
    const q = query(
        collection(db, 'events'),
        where('date', '>=', today),
        orderBy('date', 'asc'),
        orderBy('time', 'asc'),
        limit(10) // <--- ZMIANA NA 10 WYDARZEŃ
    )
    
    const snap = await getDocs(q)
    events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error("Błąd terminarza:", e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
    fetchEvents()
})

const formatDate = (dateStr) => {
    if(!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}`
}

const isToday = (dateStr) => {
    const today = new Date().toISOString().slice(0, 10)
    return dateStr === today
}
</script>

<template>
  <div class="card events-card">
      <div class="card-header">
          <h3>📅 TERMINARZ</h3>
          <div class="pulse-dot"></div>
      </div>
      
      <div v-if="loading" class="state-msg">Ładowanie startów...</div>
      <div v-else-if="events.length === 0" class="state-msg">Brak zaplanowanych startów.</div>
      
      <ul class="events-list" v-else>
          <li v-for="ev in events" :key="ev.id" :class="{ 'today-highlight': isToday(ev.date) }">
              <div class="event-time-box">
                  <span class="date">{{ formatDate(ev.date) }}</span>
                  <span class="time">{{ ev.time }}</span>
              </div>

              <div class="event-info">
                  <div class="sport-label">
                      <i :class="ev.icon"></i> {{ ev.sport }}
                      <span v-if="isToday(ev.date)" class="live-badge">DZIŚ</span>
                  </div>
                  <div class="event-title">{{ ev.title }}</div>
              </div>
          </li>
      </ul>
  </div>
</template>

<style scoped>
.card { background: var(--bg-card); border-radius: 12px; padding: 0; border: 1px solid #334155; margin-bottom: 20px; overflow: hidden; }
.card-header { 
    padding: 15px 20px; 
    border-bottom: 1px solid #334155; 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.5);
}
h3 { margin: 0; color: white; font-size: 1rem; border-left: 4px solid var(--accent-cyan); padding-left: 10px; font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; }

.pulse-dot { width: 8px; height: 8px; background-color: var(--accent-cyan); border-radius: 50%; box-shadow: 0 0 0 rgba(6, 182, 212, 0.7); animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(6, 182, 212, 0); } 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); } }

.state-msg { text-align: center; color: #64748b; font-size: 0.9rem; padding: 20px; }

.events-list { list-style: none; padding: 0; margin: 0; }
.events-list li { 
    display: flex; 
    gap: 15px; 
    padding: 15px 20px; 
    border-bottom: 1px solid #1e293b; 
    align-items: center;
    transition: background 0.2s;
}
.events-list li:last-child { border-bottom: none; }
.events-list li:hover { background: rgba(255,255,255,0.03); }

.today-highlight { background: rgba(6, 182, 212, 0.05); }

.event-time-box { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
    background: #0f172a; 
    padding: 8px 0; 
    width: 55px;
    border-radius: 8px; 
    border: 1px solid #334155;
    flex-shrink: 0; 
}
.date { font-size: 0.75rem; color: #94a3b8; font-weight: 700; margin-bottom: 2px; }
.time { font-size: 1rem; color: var(--accent-cyan); font-weight: 800; line-height: 1; }

.event-info { flex-grow: 1; }
.sport-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; font-weight: 600; }
.sport-label i { color: var(--accent-cyan); margin-right: 6px; }

.live-badge { 
    background: #ef4444; color: white; font-size: 0.6rem; padding: 1px 5px; border-radius: 4px; margin-left: auto; font-weight: bold; animation: pulse-red 2s infinite; 
}
@keyframes pulse-red { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

.event-title { font-weight: 700; font-size: 0.95rem; color: #f1f5f9; line-height: 1.3; }
</style>