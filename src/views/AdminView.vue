<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase'
import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'

const activeTab = ref('news')

// --- LISTA KRAJÓW ---
const countriesList = [
    { code: 'AIN', name: 'Sportowcy Neutralni', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Olympic_flag_1986.svg/50px-Olympic_flag_1986.svg.png' },
    { code: 'POL', name: 'Polska', flag: 'https://flagcdn.com/w40/pl.png' },
    { code: 'NOR', name: 'Norwegia', flag: 'https://flagcdn.com/w40/no.png' },
    { code: 'GER', name: 'Niemcy', flag: 'https://flagcdn.com/w40/de.png' },
    { code: 'AUT', name: 'Austria', flag: 'https://flagcdn.com/w40/at.png' },
    { code: 'USA', name: 'USA', flag: 'https://flagcdn.com/w40/us.png' },
    { code: 'SWE', name: 'Szwecja', flag: 'https://flagcdn.com/w40/se.png' },
    { code: 'CHN', name: 'Chiny', flag: 'https://flagcdn.com/w40/cn.png' },
    { code: 'FRA', name: 'Francja', flag: 'https://flagcdn.com/w40/fr.png' },
    { code: 'ITA', name: 'Włochy', flag: 'https://flagcdn.com/w40/it.png' },
    { code: 'CAN', name: 'Kanada', flag: 'https://flagcdn.com/w40/ca.png' },
    { code: 'JPN', name: 'Japonia', flag: 'https://flagcdn.com/w40/jp.png' },
    { code: 'SUI', name: 'Szwajcaria', flag: 'https://flagcdn.com/w40/ch.png' },
    { code: 'FIN', name: 'Finlandia', flag: 'https://flagcdn.com/w40/fi.png' },
    { code: 'NED', name: 'Holandia', flag: 'https://flagcdn.com/w40/nl.png' },
    { code: 'CZE', name: 'Czechy', flag: 'https://flagcdn.com/w40/cz.png' },
    { code: 'SLO', name: 'Słowenia', flag: 'https://flagcdn.com/w40/si.png' },
    { code: 'KOR', name: 'Korea Płd.', flag: 'https://flagcdn.com/w40/kr.png' },
    { code: 'GBR', name: 'Wielka Brytania', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'UKR', name: 'Ukraina', flag: 'https://flagcdn.com/w40/ua.png' },
    { code: 'SVK', name: 'Słowacja', flag: 'https://flagcdn.com/w40/sk.png' },
    { code: 'EST', name: 'Estonia', flag: 'https://flagcdn.com/w40/ee.png' },
    { code: 'LAT', name: 'Łotwa', flag: 'https://flagcdn.com/w40/lv.png' },
    { code: 'AUS', name: 'Australia', flag: 'https://flagcdn.com/w40/au.png' },
    { code: 'KAZ', name: 'Kazachstan', flag: 'https://flagcdn.com/w40/kz.png' },
    { code: 'AND', name: 'Andora', flag: 'https://flagcdn.com/w40/ad.png' },
    { code: 'ARG', name: 'Argentyna', flag: 'https://flagcdn.com/w40/ar.png' },
    { code: 'BEL', name: 'Belgia', flag: 'https://flagcdn.com/w40/be.png' },
    { code: 'BIH', name: 'Bośnia i Hercegowina', flag: 'https://flagcdn.com/w40/ba.png' },
    { code: 'BRA', name: 'Brazylia', flag: 'https://flagcdn.com/w40/br.png' },
    { code: 'BUL', name: 'Bułgaria', flag: 'https://flagcdn.com/w40/bg.png' },
    { code: 'CHI', name: 'Chile', flag: 'https://flagcdn.com/w40/cl.png' },
    { code: 'CRO', name: 'Chorwacja', flag: 'https://flagcdn.com/w40/hr.png' },
    { code: 'DEN', name: 'Dania', flag: 'https://flagcdn.com/w40/dk.png' },
    { code: 'GEO', name: 'Gruzja', flag: 'https://flagcdn.com/w40/ge.png' },
    { code: 'GRE', name: 'Grecja', flag: 'https://flagcdn.com/w40/gr.png' },
    { code: 'ESP', name: 'Hiszpania', flag: 'https://flagcdn.com/w40/es.png' },
    { code: 'HUN', name: 'Węgry', flag: 'https://flagcdn.com/w40/hu.png' },
    { code: 'IRL', name: 'Irlandia', flag: 'https://flagcdn.com/w40/ie.png' },
    { code: 'ISL', name: 'Islandia', flag: 'https://flagcdn.com/w40/is.png' },
    { code: 'ISR', name: 'Izrael', flag: 'https://flagcdn.com/w40/il.png' },
    { code: 'JAM', name: 'Jamajka', flag: 'https://flagcdn.com/w40/jm.png' },
    { code: 'LIE', name: 'Liechtenstein', flag: 'https://flagcdn.com/w40/li.png' },
    { code: 'LTU', name: 'Litwa', flag: 'https://flagcdn.com/w40/lt.png' },
    { code: 'LUX', name: 'Luksemburg', flag: 'https://flagcdn.com/w40/lu.png' },
    { code: 'MEX', name: 'Meksyk', flag: 'https://flagcdn.com/w40/mx.png' },
    { code: 'MON', name: 'Monako', flag: 'https://flagcdn.com/w40/mc.png' },
    { code: 'MGL', name: 'Mongolia', flag: 'https://flagcdn.com/w40/mn.png' },
    { code: 'NZL', name: 'Nowa Zelandia', flag: 'https://flagcdn.com/w40/nz.png' },
    { code: 'POR', name: 'Portugalia', flag: 'https://flagcdn.com/w40/pt.png' },
    { code: 'ROU', name: 'Rumunia', flag: 'https://flagcdn.com/w40/ro.png' },
    { code: 'SRB', name: 'Serbia', flag: 'https://flagcdn.com/w40/rs.png' },
    { code: 'THA', name: 'Tajlandia', flag: 'https://flagcdn.com/w40/th.png' },
    { code: 'TUR', name: 'Turcja', flag: 'https://flagcdn.com/w40/tr.png' }
]


const loadingNews = ref(false)
const allArticles = ref([])
const currentPage = ref(1)
const itemsPerPage = 10
const isEditingNews = ref(false)
const newsId = ref(null)
const newsForm = ref({ title: '', category: 'Skoki narciarskie', date: new Date().toISOString().slice(0,10), imageUrl: '', content: '', isTopStory: false })

const fetchArticles = async () => {
    loadingNews.value = true
    try {
        const q = query(collection(db, 'articles'), orderBy('date', 'desc'))
        const snap = await getDocs(q)
        allArticles.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (e) { console.error(e) }
    loadingNews.value = false
}
const paginatedArticles = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return allArticles.value.slice(start, start + itemsPerPage)
})
const totalPages = computed(() => Math.ceil(allArticles.value.length / itemsPerPage))
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }

const handleNewsSubmit = async () => {
    if (!newsForm.value.title.trim()) return alert("⚠️ BŁĄD: Wpisz tytuł!")
    loadingNews.value = true
    try {
        const payload = { ...newsForm.value, imageUrl: newsForm.value.imageUrl || '', isTopStory: newsForm.value.isTopStory || false }
        if (isEditingNews.value) { await updateDoc(doc(db, 'articles', newsId.value), payload); alert('Zaktualizowano!') } 
        else { await addDoc(collection(db, 'articles'), payload); alert('Dodano!') }
        resetNewsForm(); await fetchArticles()
    } catch (e) { alert('Błąd: ' + e.message) }
    loadingNews.value = false
}
const startEditNews = (art) => { newsForm.value = { ...art }; isEditingNews.value = true; newsId.value = art.id; activeTab.value = 'news'; window.scrollTo(0,0) }
const deleteArticle = async (id) => { if(confirm("Usunąć?")) { await deleteDoc(doc(db, 'articles', id)); fetchArticles() } }
const resetNewsForm = () => { newsForm.value = { title: '', category: 'Skoki narciarskie', date: new Date().toISOString().slice(0,10), imageUrl: '', content: '', isTopStory: false }; isEditingNews.value = false }



const medalForm = ref({ code: '', gold: 0, silver: 0, bronze: 0 })
const medalsList = ref([])
const loadingMedal = ref(false)
const fetchMedals = async () => {
    const snap = await getDocs(collection(db, 'medals'))
    let list = snap.docs.map(doc => doc.data())
    list.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
    medalsList.value = list
}
const updateMedals = async () => {
    if(!medalForm.value.code) return alert("Wybierz kraj!")
    const countryData = countriesList.find(c => c.code === medalForm.value.code)
    loadingMedal.value = true
    try {
        await setDoc(doc(db, 'medals', medalForm.value.code), {
            country: countryData.name, code: countryData.code, flag: countryData.flag,
            gold: Number(medalForm.value.gold), silver: Number(medalForm.value.silver), bronze: Number(medalForm.value.bronze)
        })
        alert(`Zaktualizowano: ${countryData.name}`); fetchMedals(); medalForm.value = { code: '', gold: 0, silver: 0, bronze: 0 }
    } catch (e) { alert('Błąd: ' + e.message) }
    loadingMedal.value = false
}
const selectCountry = (e) => { medalForm.value.code = e.target.value }
const editMedal = (m) => { medalForm.value = { ...m }; window.scrollTo(0,0) }
const deleteMedal = async (c) => { if(confirm(`Usunąć ${c}?`)) { await deleteDoc(doc(db, 'medals', c)); fetchMedals() } }


const eventForm = ref({ title: '', sport: 'Skoki narciarskie', date: new Date().toISOString().slice(0,10), time: '16:00', icon: 'fa-solid fa-person-snowboarding' })
const eventsList = ref([])
const loadingEvents = ref(false)
const isEditingEvent = ref(false) 
const eventId = ref(null) 

const sportsIcons = {
    'Skoki narciarskie': 'fa-solid fa-person-snowboarding',
    'Biegi narciarskie': 'fa-solid fa-person-skiing-nordic',
    'Biathlon': 'fa-solid fa-person-skiing-nordic',
    'Narciarstwo alpejskie': 'fa-solid fa-person-skiing',
    'Hokej na lodzie': 'fa-solid fa-hockey-puck',
    'Short track': 'fa-solid fa-person-skating',
    'Łyżwiarstwo szybkie': 'fa-solid fa-person-skating',
    'Curling': 'fa-regular fa-snowflake',
    'Snowboard': 'fa-solid fa-person-snowboarding',
    'Saneczkarstwo': 'fa-regular fa-snowflake',
    'Bobsleje': 'fa-regular fa-snowflake',
    'Skeleton': 'fa-regular fa-snowflake',
    'Kombinacja norweska': 'fa-solid fa-person-skiing-nordic',
    'Narciarstwo dowolne': 'fa-solid fa-person-skiing',
    'Skialpinizm': 'fa-regular fa-snowflake',
    'Łyżwiarstwo figurowe': 'fa-solid fa-person-skating'
}

const updateIcon = () => {
    if (sportsIcons[eventForm.value.sport]) {
        eventForm.value.icon = sportsIcons[eventForm.value.sport]
    } else {
        eventForm.value.icon = 'fa-regular fa-snowflake'
    }
}

const fetchEvents = async () => {
    loadingEvents.value = true
    try {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'), orderBy('time', 'asc'))
        const snap = await getDocs(q)
        eventsList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (e) { console.error(e) }
    loadingEvents.value = false
}

const handleEventSubmit = async () => {
    if(!eventForm.value.title) return alert("Wpisz tytuł wydarzenia!")
    loadingEvents.value = true
    try {
        const payload = { ...eventForm.value }
        if (isEditingEvent.value) {
            await updateDoc(doc(db, 'events', eventId.value), payload)
            alert("Zaktualizowano wydarzenie! 📅")
        } else {
            await addDoc(collection(db, 'events'), payload)
            alert("Dodano wydarzenie! 📅")
        }
        fetchEvents()
        resetEventForm()
    } catch(e) { alert(e.message) }
    loadingEvents.value = false
}
const startEditEvent = (ev) => { eventForm.value = { ...ev }; eventId.value = ev.id; isEditingEvent.value = true; window.scrollTo({ top: 0, behavior: 'smooth' }) }
const resetEventForm = () => { eventForm.value = { title: '', sport: 'Skoki narciarskie', date: new Date().toISOString().slice(0,10), time: '16:00', icon: 'fa-solid fa-person-snowboarding' }; isEditingEvent.value = false; eventId.value = null }
const deleteEvent = async (id) => { if(confirm("Usunąć to wydarzenie?")) { await deleteDoc(doc(db, 'events', id)); fetchEvents() } }


const activePoll = ref(null) 
const isEditingPoll = ref(false) 
const pollForm = ref({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: ''
})

const fetchPoll = async () => {
    try {
        const snap = await getDoc(doc(db, 'polls', 'active_poll'))
        if(snap.exists()) {
            activePoll.value = snap.data()
        } else {
            activePoll.value = null
        }
    } catch(e) { console.error(e) }
}

const startEditPoll = () => {
    if(!activePoll.value) return
    isEditingPoll.value = true
    pollForm.value.question = activePoll.value.question
    pollForm.value.option1 = activePoll.value.options[0]?.text || ''
    pollForm.value.option2 = activePoll.value.options[1]?.text || ''
    pollForm.value.option3 = activePoll.value.options[2]?.text || ''
    pollForm.value.option4 = activePoll.value.options[3]?.text || ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deletePoll = async () => {
    if(confirm("Czy na pewno usunąć sondę ze strony głównej?")) {
        await deleteDoc(doc(db, 'polls', 'active_poll'))
        activePoll.value = null
        isEditingPoll.value = false
        alert("Sonda usunięta!")
    }
}

const handlePollSubmit = async () => {
    if (!pollForm.value.question || !pollForm.value.option1 || !pollForm.value.option2) {
        return alert("Musisz podać pytanie i przynajmniej 2 opcje!")
    }
    
   
    let confirmMsg = "UWAGA: Opublikowanie nowej sondy zresetuje głosy! Kontynuować?"
    if (isEditingPoll.value) {
        confirmMsg = "Zapisujemy zmiany w treści. Głosy zostaną zachowane (o ile nie zmieniłeś drastycznie opcji)."
    }

    if (confirm(confirmMsg)) {
        try {
           
            const newOptions = [
                { text: pollForm.value.option1, votes: isEditingPoll.value ? (activePoll.value.options[0]?.votes || 0) : 0 },
                { text: pollForm.value.option2, votes: isEditingPoll.value ? (activePoll.value.options[1]?.votes || 0) : 0 }
            ]
            if(pollForm.value.option3) newOptions.push({ text: pollForm.value.option3, votes: isEditingPoll.value ? (activePoll.value.options[2]?.votes || 0) : 0 })
            if(pollForm.value.option4) newOptions.push({ text: pollForm.value.option4, votes: isEditingPoll.value ? (activePoll.value.options[3]?.votes || 0) : 0 })

            const pollData = {
                question: pollForm.value.question,
                options: newOptions
            }

            await setDoc(doc(db, 'polls', 'active_poll'), pollData)
            alert(isEditingPoll.value ? "Zaktualizowano sondę! 📊" : "Nowa sonda opublikowana! 📊")
            
            fetchPoll() 
            
       
            pollForm.value = { question: '', option1: '', option2: '', option3: '', option4: '' }
            isEditingPoll.value = false

        } catch (e) {
            alert("Błąd: " + e.message)
        }
    }
}

const cancelPollEdit = () => {
    isEditingPoll.value = false
    pollForm.value = { question: '', option1: '', option2: '', option3: '', option4: '' }
}

const loadingDrafts = ref(false)
const draftsList = ref([])

const fetchDrafts = async () => {
    loadingDrafts.value = true
    try {
        const q = query(collection(db, 'article_drafts'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        draftsList.value = snap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }))
    } catch (e) {
        console.error(e)
    }
    loadingDrafts.value = false
}

const publishDraft = async (draft) => {
    if(!confirm(`Opublikować szkic: ${draft.title}?`)) return
    try {
        const payload = {
            title: draft.title,
            category: draft.category || 'Skoki narciarskie',
            date: draft.date || new Date().toISOString().slice(0,10),
            imageUrl: draft.imageUrl || '',
            content: draft.content || '',
            isTopStory: false
        }
        await addDoc(collection(db, 'articles'), payload)
        await deleteDoc(doc(db, 'article_drafts', draft.id))
        await fetchDrafts()
        await fetchArticles()
        alert('Szkic opublikowany!')
    } catch (e) {
        alert('Błąd publikacji: ' + e.message)
    }
}

const deleteDraft = async (id) => {
    if(!confirm('Usunąć ten szkic?')) return
    await deleteDoc(doc(db, 'article_drafts', id))
    await fetchDrafts()
}

onMounted(() => { fetchArticles(); fetchMedals(); fetchEvents(); fetchPoll(); fetchDrafts() })
</script>

<template>
  <div class="admin-container">
    <div class="tabs">
        <button @click="activeTab = 'news'" :class="{ active: activeTab === 'news' }">📰 NEWSY</button>
        <button @click="activeTab = 'drafts'" :class="{ active: activeTab === 'drafts' }">🤖 SZKICE AI</button>
        <button @click="activeTab = 'medals'" :class="{ active: activeTab === 'medals' }">🥇 MEDALE</button>
        <button @click="activeTab = 'events'" :class="{ active: activeTab === 'events' }">📅 TERMINARZ</button>
        <button @click="activeTab = 'poll'" :class="{ active: activeTab === 'poll' }">📊 SONDA</button>
    </div>

    <div v-show="activeTab === 'news'" class="tab-content">
        <div class="admin-card" :class="{ 'editing-mode': isEditingNews }">
            <h2 v-if="!isEditingNews">DODAJ NEWS</h2>
            <h2 v-else>EDYCJA ARTYKUŁU</h2>
             <div class="form-group"><label>Kategoria</label><select v-model="newsForm.category"><option>Skoki narciarskie</option><option>Biegi narciarskie</option><option>Biathlon</option><option>Narciarstwo alpejskie</option><option>Hokej na lodzie</option><option>Snowboard</option><option>Kombinacja norweska</option><option>Short track</option><option>Łyżwiarstwo szybkie</option><option>Curling</option><option>Saneczkarstwo</option><option>Bobsleje</option><option>Skeleton</option><option>Narciarstwo dowolne</option><option>Skialpinizm</option><option>Łyżwiarstwo figurowe</option></select></div>
             <div class="form-group checkbox-group"><input type="checkbox" id="topStory" v-model="newsForm.isTopStory"><label for="topStory" class="checkbox-label">🔥 Ustaw jako TOP STORY</label></div>
             <div class="form-group"><label>Tytuł</label><input v-model="newsForm.title"></div>
             <div class="form-group"><label>Foto URL</label><input v-model="newsForm.imageUrl"></div>
             <div class="form-group"><label>Treść</label><textarea v-model="newsForm.content" rows="3"></textarea></div>
             <div class="form-group"><label>Data</label><input type="date" v-model="newsForm.date"></div>
             <button @click="handleNewsSubmit" class="btn-news">{{ isEditingNews ? 'ZAPISZ' : 'OPUBLIKUJ' }}</button>
             <button v-if="isEditingNews" @click="resetNewsForm" class="btn-cancel">ANULUJ</button>
        </div>
        <div class="admin-card list-card">
             <h2>TWOJE ARTYKUŁY ({{ allArticles.length }})</h2>
             <div class="articles-list">
                 <div v-for="art in paginatedArticles" :key="art.id" class="list-item">
                     <div class="item-info"><span>{{ art.date }} | {{ art.title }}</span></div>
                     <div class="item-actions"><button @click="startEditNews(art)" class="btn-mini edit">E</button><button @click="deleteArticle(art.id)" class="btn-mini del">X</button></div>
                 </div>
             </div>
             <div class="pagination" v-if="totalPages > 1"><button @click="prevPage" :disabled="currentPage === 1">❮</button><span>{{ currentPage }} / {{ totalPages }}</span><button @click="nextPage" :disabled="currentPage === totalPages">❯</button></div>
        </div>
    </div>

    <div v-show="activeTab === 'drafts'" class="tab-content">
        <div class="admin-card draft-card">
            <h2>SZKICE Z AUTOMATU ({{ draftsList.length }})</h2>
            <p style="color:#94a3b8; margin-top:-6px;">Nowe szkice tworzą się automatycznie po wydarzeniach medalowych.</p>
            <div v-if="loadingDrafts" class="state-line">Ładowanie szkiców...</div>
            <div v-else-if="draftsList.length === 0" class="state-line">Brak szkiców do publikacji.</div>

            <div class="list-item draft-item" v-for="draft in draftsList" :key="draft.id">
                <div class="item-info">
                    <span style="color:#06b6d4; font-weight:bold; margin-right:10px;">{{ draft.date }} {{ draft.time || '' }}</span>
                    <strong>{{ draft.category }}:</strong> {{ draft.title }}
                </div>
                <div class="item-actions">
                    <button @click="publishDraft(draft)" class="btn-mini publish">P</button>
                    <button @click="deleteDraft(draft.id)" class="btn-mini del">X</button>
                </div>
            </div>
        </div>
    </div>

    <div v-show="activeTab === 'medals'" class="tab-content">
        <div class="admin-card medal-card">
            <h2>UPDATE WYNIKÓW</h2>
            <div class="form-group"><select @change="selectCountry" v-model="medalForm.code"><option value="" disabled>-- Kraj --</option><option v-for="c in countriesList" :key="c.code" :value="c.code">{{ c.name }}</option></select></div>
            <div class="medals-row"><div class="m-box gold"><label>🥇</label><input type="number" v-model="medalForm.gold"></div><div class="m-box silver"><label>🥈</label><input type="number" v-model="medalForm.silver"></div><div class="m-box bronze"><label>🥉</label><input type="number" v-model="medalForm.bronze"></div></div>
            <button @click="updateMedals" :disabled="loadingMedal" class="btn-medal">ZAPISZ</button>
        </div>
        <div class="admin-card list-card">
            <h2>TABELA</h2>
            <div class="medal-list-item" v-for="m in medalsList" :key="m.code">
                <div class="m-info"><strong>{{ m.country }}</strong></div><div class="m-stats"><span class="g">{{ m.gold }}</span><span class="s">{{ m.silver }}</span><span class="b">{{ m.bronze }}</span></div>
                <div class="m-actions"><button @click="editMedal(m)" class="btn-mini edit">E</button><button @click="deleteMedal(m.code)" class="btn-mini del">X</button></div>
            </div>
        </div>
    </div>

    <div v-show="activeTab === 'events'" class="tab-content">
        <div class="admin-card event-card" :class="{ 'editing-mode': isEditingEvent }">
            <h2 v-if="!isEditingEvent">DODAJ WYDARZENIE</h2>
            <h2 v-else>EDYTUJ WYDARZENIE</h2>
            <div class="form-group">
                <label>Dyscyplina</label>
                <select v-model="eventForm.sport" @change="updateIcon">
                    <option>Skoki narciarskie</option><option>Biegi narciarskie</option><option>Biathlon</option><option>Narciarstwo alpejskie</option><option>Hokej na lodzie</option><option>Short track</option><option>Łyżwiarstwo szybkie</option><option>Snowboard</option><option>Curling</option><option>Saneczkarstwo</option><option>Bobsleje</option><option>Skeleton</option><option>Kombinacja norweska</option><option>Narciarstwo dowolne</option><option>Skialpinizm</option><option>Łyżwiarstwo figurowe</option>
                </select>
            </div>
            <div class="form-group"><label>Opis</label><input v-model="eventForm.title" placeholder="np. Kwalifikacje mężczyzn HS140"></div>
            <div class="date-row">
                <div class="form-group"><label>Data</label><input type="date" v-model="eventForm.date"></div>
                <div class="form-group"><label>Godzina</label><input type="time" v-model="eventForm.time"></div>
            </div>
            <button @click="handleEventSubmit" class="btn-news" style="margin-top:10px;">{{ isEditingEvent ? 'ZAPISZ ZMIANY' : 'DODAJ DO KALENDARZA 📅' }}</button>
            <button v-if="isEditingEvent" @click="resetEventForm" class="btn-cancel">ANULUJ</button>
        </div>
        <div class="admin-card list-card">
            <h2>ZAPLANOWANE STARTY</h2>
            <div v-if="eventsList.length === 0" style="text-align:center; padding:10px;">Brak.</div>
            <div class="list-item" v-for="ev in eventsList" :key="ev.id">
                <div class="item-info"><span style="color:#06b6d4; font-weight:bold; margin-right:10px;">{{ ev.date }} {{ ev.time }}</span><strong>{{ ev.sport }}:</strong> {{ ev.title }}</div>
                <div class="item-actions"><button @click="startEditEvent(ev)" class="btn-mini edit">E</button><button @click="deleteEvent(ev.id)" class="btn-mini del">X</button></div>
            </div>
        </div>
    </div>

    <div v-show="activeTab === 'poll'" class="tab-content">
        <div class="admin-card" v-if="activePoll" style="border-left: 4px solid #8b5cf6;">
            <h3>📊 AKTUALNA SONDA NA STRONIE</h3>
            <p style="font-size:1.1rem; font-weight:bold;">{{ activePoll.question }}</p>
            <ul style="margin:10px 0; color:#ccc;">
                <li v-for="(opt, idx) in activePoll.options" :key="idx">{{ opt.text }} (Głosów: {{ opt.votes }})</li>
            </ul>
            <div style="display:flex; gap:10px; margin-top:15px;">
                <button @click="startEditPoll" class="btn-mini edit" style="width:auto; padding:5px 15px;">EDYTUJ TREŚĆ ✏️</button>
                <button @click="deletePoll" class="btn-mini del" style="width:auto; padding:5px 15px;">USUŃ SONDĘ 🗑️</button>
            </div>
        </div>

        <div class="admin-card poll-card-admin" :class="{ 'editing-mode': isEditingPoll }">
            <h2 v-if="!isEditingPoll">UTWÓRZ NOWĄ SONDĘ</h2>
            <h2 v-else>EDYTUJ SONDĘ</h2>
            
            <div class="form-group"><label>Pytanie</label><input v-model="pollForm.question" placeholder="np. Kto wygra konkurs skoków?"></div>
            <div class="form-group"><label>Opcja 1</label><input v-model="pollForm.option1" placeholder="np. Kamil Stoch"></div>
            <div class="form-group"><label>Opcja 2</label><input v-model="pollForm.option2" placeholder="np. Stefan Kraft"></div>
            <div class="form-group"><label>Opcja 3 (opcjonalnie)</label><input v-model="pollForm.option3"></div>
            <div class="form-group"><label>Opcja 4 (opcjonalnie)</label><input v-model="pollForm.option4"></div>
            
            <button @click="handlePollSubmit" class="btn-news">
                {{ isEditingPoll ? 'ZAPISZ ZMIANY' : 'OPUBLIKUJ NOWĄ SONDĘ 📊' }}
            </button>
            <button v-if="isEditingPoll" @click="cancelPollEdit" class="btn-cancel">ANULUJ EDYCJĘ</button>
        </div>
    </div>

  </div>
</template>

<style scoped>
.admin-container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
.tabs { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
.tabs button { background: #1e293b; padding: 10px 20px; color: #aaa; border: 1px solid #333; cursor: pointer; border-radius:6px; font-weight:bold; }
.tabs button.active { background: #06b6d4; color: black; }
.admin-card { background: #1e293b; padding: 30px; border-radius: 12px; margin-bottom: 20px; color: white; border: 1px solid #333; transition: border-color 0.3s; }
.medal-card { border-top: 4px solid gold; }
.event-card { border-top: 4px solid #f43f5e; }
.poll-card-admin { border-top: 4px solid #8b5cf6; } 
.draft-card { border-top: 4px solid #22c55e; }
.editing-mode { border: 2px solid #06b6d4; background: #162032; }

input, select, textarea { width: 100%; padding: 12px; background: #0f172a; color: white; border: 1px solid #333; margin-bottom: 10px; border-radius:6px; outline: none; }
input:focus, select:focus, textarea:focus { border-color: #06b6d4; }
.medals-row, .date-row { display: flex; gap: 10px; } 
.m-box, .date-row .form-group { flex: 1; text-align: center; }
.btn-medal { width: 100%; padding: 15px; background: gold; border: none; font-weight: bold; cursor: pointer; border-radius:8px; }
.btn-news { width: 100%; padding: 15px; background: #06b6d4; border: none; font-weight: bold; cursor: pointer; border-radius:8px; margin-bottom:10px; }
.btn-cancel { width: 100%; padding: 10px; background: #333; color:white; border: none; font-weight: bold; cursor: pointer; border-radius:8px; }
.medal-list-item, .list-item { display: flex; justify-content: space-between; background: #0f172a; padding: 10px; margin-bottom: 5px; color: white; align-items: center; border-radius:6px; border:1px solid #333; }
.m-info { display: flex; align-items: center; }
.m-stats { font-weight: bold; font-family: 'Oswald'; gap: 10px; display: flex; }
.g{color:gold} .s{color:silver} .b{color:#cd7f32}
.btn-mini { width: 35px; height: 35px; border: none; cursor: pointer; border-radius:4px; margin-left:5px; font-weight:bold; } 
.edit{background:#3b82f6; color:white} .del{background:#ef4444; color:white}
.publish{background:#22c55e; color:black}
label { font-weight:bold; color:#aaa; font-size:0.8rem; display: block; margin-bottom: 5px; }
.articles-list { min-height: 100px; }
.checkbox-group { display: flex; align-items: center; gap: 10px; background: rgba(6, 182, 212, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #06b6d4; margin-bottom: 15px; }
.checkbox-group input { width: 20px; height: 20px; margin: 0; }
.checkbox-label { color: #06b6d4; font-weight: bold; margin: 0 !important; cursor: pointer; }
.top-story-item { border-left: 4px solid #06b6d4; background: rgba(6, 182, 212, 0.05); }
.pagination { display: flex; justify-content: center; gap: 15px; margin-top: 20px; }
.pagination button { background: #334155; color: white; border: none; padding: 5px 15px; border-radius: 6px; cursor: pointer; }
.state-line { text-align:center; color:#94a3b8; background:#0f172a; padding:12px; border-radius:8px; border:1px solid #334155; }
.draft-item { border-left: 3px solid #22c55e; }
</style>
