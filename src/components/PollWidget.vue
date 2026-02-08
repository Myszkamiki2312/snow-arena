<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase'
import { doc, getDoc, runTransaction } from 'firebase/firestore'

const poll = ref(null)
const hasVoted = ref(false)
const loading = ref(true)
const voting = ref(false)

const buildVoteKey = (question) => `vote_${question}`


const fetchPoll = async () => {
    try {
        const docRef = doc(db, 'polls', 'active_poll')
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
            poll.value = { id: snap.id, ...snap.data() }
            if (localStorage.getItem(buildVoteKey(poll.value.question))) {
                hasVoted.value = true
            }
        }
    } catch (e) {
        console.error("Błąd ankiety:", e)
    } finally {
        loading.value = false
    }
}

const vote = async (optionIndex) => {
    if (hasVoted.value || voting.value || !poll.value) return
    voting.value = true

    try {
        const pollRef = doc(db, 'polls', 'active_poll')

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(pollRef)
            if (!snap.exists()) {
                throw new Error('Brak aktywnej sondy')
            }

            const data = snap.data()
            const options = [...(data.options || [])]
            if (!options[optionIndex]) {
                throw new Error('Niepoprawna opcja głosowania')
            }

            const currentVotes = Number(options[optionIndex].votes || 0)
            options[optionIndex] = { ...options[optionIndex], votes: currentVotes + 1 }

            transaction.update(pollRef, { options })
            poll.value = { ...poll.value, options }
        })

        hasVoted.value = true
        localStorage.setItem(buildVoteKey(poll.value.question), 'true')
    } catch (e) {
        console.error("Nie udało się zapisać głosu", e)
    } finally {
        voting.value = false
    }
}


const totalVotes = computed(() => {
    if (!poll.value) return 0
    return poll.value.options.reduce((acc, opt) => acc + opt.votes, 0)
})

const getPercentage = (votes) => {
    if (totalVotes.value === 0) return 0
    return Math.round((votes / totalVotes.value) * 100)
}

onMounted(() => {
    fetchPoll()
})
</script>

<template>
  <div class="poll-card" v-if="poll">
      <div class="poll-header">
          <h3>📊 SONDA DNIA</h3>
          <span class="total-votes" v-if="hasVoted">Głosów: {{ totalVotes }}</span>
      </div>
      
      <h2 class="question">{{ poll.question }}</h2>

      <div v-if="!hasVoted" class="options-list">
          <button 
            v-for="(opt, index) in poll.options" 
            :key="index" 
            class="vote-btn" 
            :disabled="voting"
            @click="vote(index)"
          >
            {{ opt.text }}
          </button>
      </div>

      <div v-else class="results-list">
          <div v-for="(opt, index) in poll.options" :key="index" class="result-item">
              <div class="result-label">
                  <span>{{ opt.text }}</span>
                  <span class="percent">{{ getPercentage(opt.votes) }}%</span>
              </div>
              <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: getPercentage(opt.votes) + '%' }"></div>
              </div>
          </div>
          <div class="thank-you">Dziękujemy za głos!</div>
      </div>
  </div>
</template>

<style scoped>
.poll-card {
    background: linear-gradient(145deg, #1e293b, #0f172a);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.poll-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
h3 { margin: 0; color: #06b6d4; font-family: 'Oswald'; font-size: 1rem; letter-spacing: 1px; }
.total-votes { font-size: 0.8rem; color: #64748b; }

.question { margin: 0 0 20px 0; color: white; font-size: 1.2rem; font-weight: bold; line-height: 1.3; }


.options-list { display: flex; flex-direction: column; gap: 10px; }
.vote-btn {
    background: #334155;
    color: white;
    border: 1px solid #475569;
    padding: 12px 15px;
    text-align: left;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
    font-size: 1rem;
    font-weight: 500;
}
.vote-btn:hover { background: #06b6d4; color: #0f172a; border-color: #06b6d4; transform: translateX(5px); }
.vote-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }


.results-list { display: flex; flex-direction: column; gap: 15px; }
.result-label { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem; color: #cbd5e1; }
.percent { font-weight: bold; color: #06b6d4; }

.progress-bar-bg { width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #06b6d4; transition: width 1s ease-out; }

.thank-you { text-align: center; color: #64748b; font-size: 0.8rem; margin-top: 10px; font-style: italic; }
</style>
