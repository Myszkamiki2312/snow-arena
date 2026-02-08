import process from 'node:process'
import fs from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const keepSource = process.env.KEEP_SOURCE || 'wikipedia-cortina-2026'

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('Brakuje GOOGLE_APPLICATION_CREDENTIALS ze ścieżką do service account JSON')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

async function main() {
  const snap = await db.collection('events').get()
  const toDelete = snap.docs.filter((docSnap) => (docSnap.data().source || '') !== keepSource)

  console.log(`events total: ${snap.size}, to delete: ${toDelete.length}, keep source: ${keepSource}`)

  for (let i = 0; i < toDelete.length; i += 450) {
    const batch = db.batch()
    const chunk = toDelete.slice(i, i + 450)
    for (const docSnap of chunk) {
      batch.delete(docSnap.ref)
    }
    await batch.commit()
  }

  console.log('cleanup done')
}

main().catch((error) => {
  console.error('Błąd cleanup events:', error.message)
  process.exit(1)
})
