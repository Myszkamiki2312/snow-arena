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
const codeAliases = {
  DEU: 'GER',
  SVN: 'SLO',
  NLD: 'NED',
}

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

function sanitizeCountryName(rawName) {
  return cleanText(rawName)
    .replace(/\*+/g, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
}

function looksLikeValidCountry(countryName) {
  return /\p{L}/u.test(countryName) && !/^\d+$/.test(countryName)
}

function detectMedalEvent(title) {
  const text = cleanText(title).toLowerCase()
  if (!text) return false

  const excluded = ['qualification', 'qualifying', 'training', 'practice', 'round robin', 'preliminary', 'group stage', 'heats', 'heat ']
  if (excluded.some((item) => text.includes(item))) return false

  const medalLike = [
    'final',
    'medal',
    'gold medal game',
    'bronze medal game',
    'big final',
    'small final',
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

function parseMedals(html) {
  const $ = load(html)
  const medals = []

  const table = $('table.wikitable').filter((_, el) => {
    const headersText = $(el).find('tr').first().text().toLowerCase()
    return headersText.includes('gold') && headersText.includes('silver') && headersText.includes('bronze')
  }).first()

  if (!table.length) return medals

  const headerCells = table.find('tr').first().find('th,td')
  const headers = headerCells
    .toArray()
    .map((cell) => cleanText($(cell).text()).toLowerCase())

  const findIndex = (patterns, fallbackIndex) => {
    const index = headers.findIndex((header) => patterns.some((pattern) => header.includes(pattern)))
    return index >= 0 ? index : fallbackIndex
  }

  const countryIndex = findIndex(['noc', 'nation', 'team', 'country'], 1)
  const goldIndex = findIndex(['gold'], 2)
  const silverIndex = findIndex(['silver'], 3)
  const bronzeIndex = findIndex(['bronze'], 4)

  table.find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('th,td')
    if (cells.length <= bronzeIndex || cells.length <= countryIndex) return

    const countryCell = $(cells[countryIndex])
    const countryName = sanitizeCountryName(countryCell.text())
    if (!countryName || !looksLikeValidCountry(countryName)) return

    const alpha2 = countries.getAlpha2Code(countryName, 'en')
    const alpha3 = alpha2 ? countries.alpha2ToAlpha3(alpha2) : null
    if (!alpha3) return
    const normalizedCode = codeAliases[alpha3] || alpha3

    const gold = Number(cleanText($(cells[goldIndex]).text())) || 0
    const silver = Number(cleanText($(cells[silverIndex]).text())) || 0
    const bronze = Number(cleanText($(cells[bronzeIndex]).text())) || 0

    medals.push({
      code: normalizedCode,
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
    const isMedalEvent = detectMedalEvent(eventText)
    const gamesEndDate = '2026-02-22'

    if (!isMedalEvent) return
    if (isoDate > gamesEndDate) return

    events.push({
      id,
      title: eventText,
      sport: sportMeta.sport,
      date: isoDate,
      time,
      icon: sportMeta.icon,
      isMedalEvent,
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
  return allEvents
}

async function syncDailyMedalEvents(events) {
  const medalEvents = events.filter((event) => event.isMedalEvent)
  const grouped = new Map()

  for (const event of medalEvents) {
    if (!grouped.has(event.date)) grouped.set(event.date, [])
    grouped.get(event.date).push(event)
  }

  const batch = db.batch()
  const seenDates = new Set()

  for (const [date, dayEvents] of grouped.entries()) {
    seenDates.add(date)
    const ref = db.collection('daily_medal_events').doc(date)
    const sorted = [...dayEvents].sort((a, b) => `${a.time}`.localeCompare(`${b.time}`))
    const sports = [...new Set(sorted.map((item) => item.sport))].sort()

    batch.set(
      ref,
      {
        date,
        source: sourceTag,
        totalMedalEvents: sorted.length,
        sports,
        events: sorted.map((item) => ({
          id: item.id,
          title: item.title,
          sport: item.sport,
          time: item.time,
          icon: item.icon,
        })),
        updatedAtISO: new Date().toISOString(),
      },
      { merge: true },
    )
  }

  const currentSnapshot = await db.collection('daily_medal_events').where('source', '==', sourceTag).get()
  currentSnapshot.docs.forEach((docSnap) => {
    if (!seenDates.has(docSnap.id)) {
      batch.delete(docSnap.ref)
    }
  })

  await batch.commit()
  console.log(`Dni z wydarzeniami medalowymi: ${grouped.size}`)
}

async function main() {
  await syncMedals()
  const events = await syncEvents()
  await syncDailyMedalEvents(events)
}

main().catch((error) => {
  console.error('Błąd synchronizacji z Wikipedii:', error.message)
  process.exit(1)
})
