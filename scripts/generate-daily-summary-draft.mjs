import process from 'node:process'
import fs from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const timezone = process.env.DAILY_SUMMARY_TZ || 'Europe/Warsaw'
const summaryHour = Number(process.env.DAILY_SUMMARY_HOUR || 22)
const forceRun = process.env.FORCE_DAILY_SUMMARY === 'true'

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('Brakuje GOOGLE_APPLICATION_CREDENTIALS ze ścieżką do service account JSON')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

function getLocalDateParts() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    isoDate: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour),
  }
}

function medalTopLine(index, item) {
  return `${index + 1}. ${item.country || item.code} 🥇${item.gold} 🥈${item.silver} 🥉${item.bronze}`
}

async function sendEmailIfConfigured(subject, text) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.NOTIFY_EMAIL_TO

  if (!host || !user || !pass || !to) return

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: `"Snow Arena Bot" <${user}>`,
    to,
    subject,
    text,
  })
}

async function main() {
  const { isoDate, hour } = getLocalDateParts()
  if (!forceRun && hour < summaryHour) {
    console.log(`Pomijam: lokalna godzina ${hour}, start od ${summaryHour}:00 (${timezone})`)
    return
  }

  const draftId = `daily_summary_${isoDate}`
  const draftRef = db.collection('article_drafts').doc(draftId)
  const existingDraft = await draftRef.get()

  if (existingDraft.exists) {
    console.log(`Podsumowanie ${isoDate} już istnieje`)
    return
  }

  const medalsSnap = await db.collection('medals').get()
  const medals = medalsSnap.docs.map((docSnap) => docSnap.data())
  medals.sort((a, b) => Number(b.gold || 0) - Number(a.gold || 0) || Number(b.silver || 0) - Number(a.silver || 0) || Number(b.bronze || 0) - Number(a.bronze || 0))

  const eventsSnap = await db
    .collection('events')
    .where('date', '==', isoDate)
    .where('isMedalEvent', '==', true)
    .get()

  const medalEvents = eventsSnap.docs.map((docSnap) => docSnap.data())
  const sports = [...new Set(medalEvents.map((item) => item.sport).filter(Boolean))]
  const top5 = medals.slice(0, 5)
  const top5Text = top5.length > 0 ? top5.map((item, index) => medalTopLine(index, item)).join('\n') : 'Brak danych medalowych.'
  const eventsList = medalEvents.length > 0
    ? medalEvents
        .sort((a, b) => String(a.time || '00:00').localeCompare(String(b.time || '00:00')))
        .map((item) => `- ${item.time || '00:00'} | ${item.sport}: ${item.title}`)
        .join('\n')
    : '- Brak medalowych wydarzeń w kalendarzu.'

  const title = `Dzień na IO (${isoDate}): medale, topy, niespodzianki`
  const lead = `Podsumowanie dnia olimpijskiego ${isoDate}. Sprawdź najważniejsze wydarzenia medalowe i aktualną klasyfikację.`
  const content = [
    lead,
    '',
    'Najważniejsze wydarzenia medalowe:',
    eventsList,
    '',
    `Liczba wydarzeń medalowych: ${medalEvents.length}`,
    `Dyscypliny dnia: ${sports.length > 0 ? sports.join(', ') : 'brak'}`,
    '',
    'Top 5 klasyfikacji medalowej:',
    top5Text,
    '',
    'Szkic wygenerowany automatycznie. Uzupełnij szczegóły wyników i komentarz redakcyjny.',
  ].join('\n')

  const nowIso = new Date().toISOString()
  await draftRef.set({
    title,
    lead,
    content,
    category: 'Igrzyska Olimpijskie',
    date: isoDate,
    imageUrl: '',
    source: 'auto-daily-summary',
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  console.log(`Utworzono podsumowanie dnia: ${isoDate}`)

  await sendEmailIfConfigured(
    `Snow Arena: podsumowanie dnia ${isoDate} gotowe`,
    `Wygenerowano szkic podsumowania dnia (${isoDate}). Wejdź do panelu admina i opublikuj jednym kliknięciem.`,
  )
}

main().catch((error) => {
  console.error('Błąd generowania podsumowania dnia:', error.message)
  process.exit(1)
})
