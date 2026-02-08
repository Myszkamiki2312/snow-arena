import process from 'node:process'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const medalsSourceUrl = process.env.MEDALS_SOURCE_URL
const eventsSourceUrl = process.env.EVENTS_SOURCE_URL

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('Brakuje GOOGLE_APPLICATION_CREDENTIALS ze ścieżką do service account JSON')
  process.exit(1)
}

if (!medalsSourceUrl && !eventsSourceUrl) {
  console.error('Podaj przynajmniej MEDALS_SOURCE_URL albo EVENTS_SOURCE_URL')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const normalizeCode = (code) => String(code || '').trim().toUpperCase()
const toNumber = (value) => Number(value || 0)

const safeEventId = (event) => {
  if (event.id) return String(event.id)
  const key = `${event.date || ''}_${event.time || ''}_${event.sport || ''}_${event.title || ''}`
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 20)
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Błąd pobierania ${url}: ${response.status}`)
  return response.json()
}

async function syncMedals(url) {
  const payload = await fetchJson(url)
  const medals = Array.isArray(payload) ? payload : payload.medals
  if (!Array.isArray(medals)) throw new Error('MEDALS_SOURCE_URL musi zwracać tablicę lub { medals: [] }')

  let count = 0
  const batch = db.batch()

  for (const item of medals) {
    const code = normalizeCode(item.code)
    if (!code) continue

    const docRef = db.collection('medals').doc(code)
    batch.set(
      docRef,
      {
        code,
        country: item.country || code,
        flag: item.flag || '',
        gold: toNumber(item.gold),
        silver: toNumber(item.silver),
        bronze: toNumber(item.bronze),
      },
      { merge: true },
    )
    count += 1
  }

  await batch.commit()
  console.log(`Zsynchronizowano medale: ${count}`)
}

async function syncEvents(url) {
  const payload = await fetchJson(url)
  const events = Array.isArray(payload) ? payload : payload.events
  if (!Array.isArray(events)) throw new Error('EVENTS_SOURCE_URL musi zwracać tablicę lub { events: [] }')

  let count = 0
  const batch = db.batch()

  for (const item of events) {
    if (!item?.title || !item?.date) continue
    const docRef = db.collection('events').doc(safeEventId(item))
    batch.set(
      docRef,
      {
        title: String(item.title),
        sport: String(item.sport || 'Igrzyska Olimpijskie'),
        date: String(item.date),
        time: String(item.time || '00:00'),
        icon: String(item.icon || 'fa-regular fa-snowflake'),
      },
      { merge: true },
    )
    count += 1
  }

  await batch.commit()
  console.log(`Zsynchronizowano wydarzenia: ${count}`)
}

async function main() {
  if (medalsSourceUrl) await syncMedals(medalsSourceUrl)
  if (eventsSourceUrl) await syncEvents(eventsSourceUrl)
}

main().catch((error) => {
  console.error('Błąd synchronizacji:', error.message)
  process.exit(1)
})
