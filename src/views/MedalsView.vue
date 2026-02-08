<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

const allMedals = ref([])
const loading = ref(true)

onMounted(async () => {
    const snap = await getDocs(collection(db, 'medals'))
    let list = snap.docs.map(doc => doc.data())
    list.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
    allMedals.value = list
    loading.value = false
})
</script>

<template>
  <div class="medals-page">
    <div class="header">
        <h1>KLASYFIKACJA MEDALOWA</h1>
        <router-link to="/" class="back-link">Powrót</router-link>
    </div>
    <div v-if="loading" class="loading">Liczenie...</div>
    <div class="table-wrapper" v-else>
        <table>
            <thead><tr><th>MIEJSCE</th><th class="left">KRAJ</th><th>ZŁOTO</th><th>SREBRO</th><th>BRĄZ</th><th>RAZEM</th></tr></thead>
            <tbody>
                <tr v-for="(m, i) in allMedals" :key="m.code" :class="{'poland': m.code === 'POL'}">
                    <td>{{ i + 1 }}</td>
                    <td class="left country-name">
                        <img :src="m.flag" class="flag-large"> 
                        {{ m.country }}
                    </td>
                    <td class="gold">{{ m.gold }}</td><td class="silver">{{ m.silver }}</td><td class="bronze">{{ m.bronze }}</td>
                    <td class="total">{{ m.gold + m.silver + m.bronze }}</td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<style scoped>
.medals-page { padding: 40px 0; max-width: 1000px; margin: 0 auto; color: white; min-height: 80vh; }
.header { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px; align-items: center; }
h1 { margin: 0; font-family: 'Oswald'; color: #06b6d4; }
.back-link { color: #aaa; text-decoration: none; font-weight: bold; }
.table-wrapper { background: #1e293b; border-radius: 12px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; text-align: center; }
th { background: #0f172a; padding: 15px; color: #aaa; font-size: 0.8rem; }
td { padding: 15px; border-bottom: 1px solid #333; font-size: 1.1rem; }
.left { text-align: left; }
.gold{color:gold} .silver{color:silver} .bronze{color:#cd7f32} .total{font-weight:bold}
.poland { background: rgba(220, 38, 38, 0.15); border-left: 4px solid red; }


.flag-large { width: 34px; height: auto; margin-right: 12px; vertical-align: middle; border-radius: 4px; box-shadow: 0 2px 5px black; }
</style>