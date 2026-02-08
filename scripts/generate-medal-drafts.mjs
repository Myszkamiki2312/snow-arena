import process from 'node:process'
import fs from 'node:fs'
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

async function sendNotificationEmail(newDraftsCount) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.NOTIFY_EMAIL_TO

  if (!host || !user || !pass || !to || newDraftsCount === 0) {
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: `"Snow Arena Bot" <${user}>`,
    to,
    subject: `Snow Arena: ${newDraftsCount} nowych szkiców artykułów`,
    text: `Hej, mam ${newDraftsCount} nowych szkiców artykułów medalowych. Wejdź do panelu admina i kliknij opublikuj.`,
  })

  console.log(`Wysłano powiadomienie email do ${to}`)
}

async function main() {
  const todayIso = new Date().toISOString().slice(0, 10)
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
  await sendNotificationEmail(createdCount)
}

main().catch((error) => {
  console.error('Błąd generowania szkiców:', error.message)
  process.exit(1)
})
