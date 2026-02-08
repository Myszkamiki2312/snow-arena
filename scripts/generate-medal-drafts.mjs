import process from 'node:process'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('Brakuje GOOGLE_APPLICATION_CREDENTIALS ze ścieżką do service account JSON')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
const automationStateRef = db.collection('automation_state').doc('notifications')

function buildDraft(event) {
  const date = event.date || ''
  const time = event.time || '00:00'
  const sport = event.sport || 'Igrzyska Olimpijskie'
  const title = `Zapowiedź medalowa: ${event.title}`
  const lead = `Dziś o ${time} rozpocznie się medalowa konkurencja w dyscyplinie ${sport}.`

  const content = [
    `${lead}`,
    '',
    'To szkic wygenerowany automatycznie na podstawie kalendarza wydarzeń medalowych.',
    '',
    `Data: ${date}`,
    `Godzina: ${time}`,
    `Dyscyplina: ${sport}`,
    '',
    'Uzupełnij po starcie:',
    '- wynik końcowy',
    '- medalistów',
    '- kontekst i komentarz ekspercki',
  ].join('\n')

  const nowIso = new Date().toISOString()
  return {
    title,
    lead,
    content,
    category: sport,
    date,
    time,
    icon: event.icon || 'fa-regular fa-snowflake',
    imageUrl: '',
    eventId: event.id,
    source: 'auto-medal-draft',
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

function buildMedalHash(medals) {
  const normalized = medals
    .map((item) => ({
      code: item.code || '',
      gold: Number(item.gold || 0),
      silver: Number(item.silver || 0),
      bronze: Number(item.bronze || 0),
    }))
    .sort((a, b) => String(a.code).localeCompare(String(b.code)))

  return crypto.createHash('sha1').update(JSON.stringify(normalized)).digest('hex')
}

function formatTopMedals(medals) {
  if (medals.length === 0) return 'Brak danych medalowych.'
  return medals
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.country || item.code} 🥇${item.gold} 🥈${item.silver} 🥉${item.bronze}`)
    .join('\n')
}

async function loadMedalSnapshot() {
  const snap = await db.collection('medals').get()
  const medals = snap.docs.map((docSnap) => docSnap.data())
  medals.sort((a, b) => Number(b.gold || 0) - Number(a.gold || 0) || Number(b.silver || 0) - Number(a.silver || 0) || Number(b.bronze || 0) - Number(a.bronze || 0))
  return medals
}

async function loadTodayMedalEventsCount(todayIso) {
  const snap = await db.collection('daily_medal_events').doc(todayIso).get()
  if (!snap.exists) return 0
  return Number(snap.data().totalMedalEvents || 0)
}

async function sendNotificationEmail({ newDraftsCount, medalTableChanged, medalsTop5, todayMedalEvents }) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.NOTIFY_EMAIL_TO

  if (!host || !user || !pass || !to) {
    return
  }

  if (newDraftsCount === 0 && !medalTableChanged) return

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const subjectParts = []
  if (newDraftsCount > 0) subjectParts.push(`${newDraftsCount} nowych szkiców`)
  if (medalTableChanged) subjectParts.push('aktualizacja tabeli medalowej')

  const body = [
    'Hej,',
    '',
    `Nowe szkice medalowe: ${newDraftsCount}`,
    `Tabela medalowa zmieniona: ${medalTableChanged ? 'TAK' : 'NIE'}`,
    `Wydarzenia medalowe dziś: ${todayMedalEvents}`,
    '',
    'Top 5 tabeli medalowej:',
    medalsTop5,
    '',
    'Panel admina: https://snowarena.firebaseapp.com/admin',
  ].join('\n')

  await transporter.sendMail({
    from: `"Snow Arena Bot" <${user}>`,
    to,
    subject: `Snow Arena: ${subjectParts.join(' + ')}`,
    text: body,
  })

  console.log(`Wysłano powiadomienie email do ${to}`)
}

async function main() {
  const todayIso = new Date().toISOString().slice(0, 10)

  const medals = await loadMedalSnapshot()
  const currentMedalHash = buildMedalHash(medals)
  const stateSnap = await automationStateRef.get()
  const previousMedalHash = stateSnap.exists ? stateSnap.data().lastMedalHash : null
  const medalTableChanged = previousMedalHash !== currentMedalHash
  const todayMedalEvents = await loadTodayMedalEventsCount(todayIso)

  const eventsSnap = await db
    .collection('events')
    .where('date', '==', todayIso)
    .where('isMedalEvent', '==', true)
    .get()

  let createdCount = 0

  for (const docSnap of eventsSnap.docs) {
    const event = { id: docSnap.id, ...docSnap.data() }
    const draftId = `medal_${event.id}`
    const draftRef = db.collection('article_drafts').doc(draftId)
    const existingDraft = await draftRef.get()

    if (existingDraft.exists) continue

    const draft = buildDraft(event)
    await draftRef.set(draft)
    createdCount += 1
  }

  console.log(`Nowe szkice: ${createdCount}`)
  await sendNotificationEmail({
    newDraftsCount: createdCount,
    medalTableChanged,
    medalsTop5: formatTopMedals(medals),
    todayMedalEvents,
  })

  await automationStateRef.set(
    {
      lastMedalHash: currentMedalHash,
      lastRunAt: new Date().toISOString(),
      lastDraftsCreated: createdCount,
    },
    { merge: true },
  )
}

main().catch((error) => {
  console.error('Błąd generowania szkiców:', error.message)
  process.exit(1)
})
