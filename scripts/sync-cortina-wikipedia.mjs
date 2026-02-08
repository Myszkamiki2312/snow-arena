import process from 'node:process'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { load } from 'cheerio'
import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json' with { type: 'json' }
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

countries.registerLocale(enLocale)

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const sourceTag = 'wikipedia-cortina-2026'
const medalTableUrl = 'https://en.wikipedia.org/wiki/2026_Winter_Olympics_medal_table'

const sportPages = [
  { sport: 'Narciarstwo alpejskie', icon: 'fa-solid fa-person-skiing', slug: 'Alpine_skiing_at_the_2026_Winter_Olympics' },
  { sport: 'Biathlon', icon: 'fa-solid fa-person-skiing-nordic', slug: 'Biathlon_at_the_2026_Winter_Olympics' },
  { sport: 'Bobsleje', icon: 'fa-regular fa-snowflake', slug: 'Bobsleigh_at_the_2026_Winter_Olympics' },
  { sport: 'Biegi narciarskie', icon: 'fa-solid fa-person-skiing-nordic', slug: 'Cross-country_skiing_at_the_2026_Winter_Olympics' },
  { sport: 'Curling', icon: 'fa-regular fa-snowflake', slug: 'Curling_at_the_2026_Winter_Olympics' },
  { sport: 'Łyżwiarstwo figurowe', icon: 'fa-solid fa-person-skating', slug: 'Figure_skating_at_the_2026_Winter_Olympics' },
  { sport: 'Narciarstwo dowolne', icon: 'fa-solid fa-person-skiing', slug: 'Freestyle_skiing_at_the_2026_Winter_Olympics' },
  { sport: 'Hokej na lodzie', icon: 'fa-solid fa-hockey-puck', slug: 'Ice_hockey_at_the_2026_Winter_Olympics' },
  { sport: 'Saneczkarstwo', icon: 'fa-regular fa-snowflake', slug: 'Luge_at_the_2026_Winter_Olympics' },
  { sport: 'Kombinacja norweska', icon: 'fa-solid fa-person-skiing-nordic', slug: 'Nordic_combined_at_the_2026_Winter_Olympics' },
  { sport: 'Short track', icon: 'fa-solid fa-person-skating', slug: 'Short_track_speed_skating_at_the_2026_Winter_Olympics' },
  { sport: 'Skeleton', icon: 'fa-regular fa-snowflake', slug: 'Skeleton_at_the_2026_Winter_Olympics' },
  { sport: 'Skoki narciarskie', icon: 'fa-solid fa-person-snowboarding', slug: 'Ski_jumping_at_the_2026_Winter_Olympics' },
  { sport: 'Skialpinizm', icon: 'fa-regular fa-snowflake', slug: 'Ski_mountaineering_at_the_2026_Winter_Olympics' },
  { sport: 'Snowboard', icon: 'fa-solid fa-person-snowboarding', slug: 'Snowboarding_at_the_2026_Winter_Olympics' },
  { sport: 'Łyżwiarstwo szybkie', icon: 'fa-solid fa-person-skating', slug: 'Speed_skating_at_the_2026_Winter_Olympics' },
]

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('Brakuje GOOGLE_APPLICATION_CREDENTIALS ze ścieżką do service account JSON')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function fetchHtml(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Nie można pobrać ${url}: ${response.status}`)
  return response.text()
}

function cleanText(text) {
  return String(text || '')
    .replace(/\[[^\]]+]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDateToIso(dateText) {
  if (!dateText) return null
  const parsed = new Date(`${dateText} 2026`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function normalizeTime(rawTime) {
  const text = cleanText(rawTime)
  const match = text.match(/(\d{1,2}):(\d{2})/)
  if (!match) return '00:00'
  const hours = String(Number(match[1])).padStart(2, '0')
  return `${hours}:${match[2]}`
}

function deterministicId(parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 24)
}

function parseMedals(html) {
  const $ = load(html)
  const medals = []

  const table = $('table.wikitable').filter((_, el) => {
    const headers = $(el).find('tr').first().text().toLowerCase()
    return headers.includes('gold') && headers.includes('silver') && headers.includes('bronze')
  }).first()

  table.find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('th,td')
    if (cells.length < 5) return

    const rankRaw = cleanText($(cells[0]).text())
    if (!/^\d+$/.test(rankRaw)) return

    const countryCell = $(cells[1])
    const countryName = cleanText(countryCell.text())
    if (!countryName) return

    const alpha2 = countries.getAlpha2Code(countryName, 'en')
    const alpha3 = alpha2 ? countries.alpha2ToAlpha3(alpha2) : null

    const gold = Number(cleanText($(cells[2]).text())) || 0
    const silver = Number(cleanText($(cells[3]).text())) || 0
    const bronze = Number(cleanText($(cells[4]).text())) || 0

    medals.push({
      code: alpha3 || deterministicId([countryName]).slice(0, 3).toUpperCase(),
      country: countryName,
      flag: alpha2 ? `https://flagcdn.com/w40/${alpha2.toLowerCase()}.png` : '',
      gold,
      silver,
      bronze,
      source: sourceTag,
    })
  })

  return medals
}

function parseScheduleRows(html, sportMeta) {
  const $ = load(html)
  const events = []

  const table = $('table.wikitable').filter((_, el) => {
    const headerText = cleanText($(el).find('tr').first().text()).toLowerCase()
    return headerText.includes('date') && headerText.includes('time') && headerText.includes('event')
  }).first()

  if (!table.length) return events

  let currentDate = null
  table.find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('th,td')
    if (cells.length < 2) return

    let dateText = ''
    let timeText = ''
    let eventText = ''

    if (cells.length >= 3) {
      dateText = cleanText($(cells[0]).text())
      timeText = cleanText($(cells[1]).text())
      eventText = cleanText($(cells[2]).text())
    } else {
      timeText = cleanText($(cells[0]).text())
      eventText = cleanText($(cells[1]).text())
    }

    if (dateText) {
      currentDate = dateText
    }

    const isoDate = parseDateToIso(currentDate)
    if (!isoDate || !eventText) return

    const time = normalizeTime(timeText)
    const id = deterministicId([sportMeta.sport, isoDate, time, eventText])

    events.push({
      id,
      title: eventText,
      sport: sportMeta.sport,
      date: isoDate,
      time,
      icon: sportMeta.icon,
      source: sourceTag,
    })
  })

  return events
}

async function syncMedals() {
  const html = await fetchHtml(medalTableUrl)
  const medals = parseMedals(html)

  const batch = db.batch()
  const seenCodes = new Set()

  for (const medal of medals) {
    seenCodes.add(medal.code)
    const ref = db.collection('medals').doc(medal.code)
    batch.set(ref, medal, { merge: true })
  }

  const currentSnapshot = await db.collection('medals').where('source', '==', sourceTag).get()
  currentSnapshot.docs.forEach((docSnap) => {
    if (!seenCodes.has(docSnap.id)) {
      batch.delete(docSnap.ref)
    }
  })

  await batch.commit()
  console.log(`Medale zsynchronizowane: ${medals.length}`)
}

async function syncEvents() {
  const allEvents = []

  for (const sportMeta of sportPages) {
    const url = `https://en.wikipedia.org/wiki/${sportMeta.slug}`
    try {
      const html = await fetchHtml(url)
      const rows = parseScheduleRows(html, sportMeta)
      allEvents.push(...rows)
    } catch (error) {
      console.error(`Pominięto ${sportMeta.slug}: ${error.message}`)
    }
  }

  const batch = db.batch()
  const seenIds = new Set()
  for (const event of allEvents) {
    seenIds.add(event.id)
    const ref = db.collection('events').doc(event.id)
    batch.set(ref, event, { merge: true })
  }

  const currentSnapshot = await db.collection('events').where('source', '==', sourceTag).get()
  currentSnapshot.docs.forEach((docSnap) => {
    if (!seenIds.has(docSnap.id)) {
      batch.delete(docSnap.ref)
    }
  })

  await batch.commit()
  console.log(`Wydarzenia zsynchronizowane: ${allEvents.length}`)
}

async function main() {
  await syncMedals()
  await syncEvents()
}

main().catch((error) => {
  console.error('Błąd synchronizacji z Wikipedii:', error.message)
  process.exit(1)
})
