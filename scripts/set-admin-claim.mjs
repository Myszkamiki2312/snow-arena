import process from 'node:process'
import fs from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const adminEmail = process.env.ADMIN_EMAIL
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (!adminEmail) {
  console.error('Brakuje ADMIN_EMAIL, np. ADMIN_EMAIL=twoj@email.pl npm run set-admin-claim')
  process.exit(1)
}

if (!credentialsPath) {
  console.error('Brakuje GOOGLE_APPLICATION_CREDENTIALS ze ścieżką do klucza service account JSON')
  process.exit(1)
}

if (!fs.existsSync(credentialsPath)) {
  console.error(`Nie znaleziono pliku klucza: ${credentialsPath}`)
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
})

async function run() {
  const auth = getAuth()
  const user = await auth.getUserByEmail(adminEmail)
  await auth.setCustomUserClaims(user.uid, { admin: true })
  console.log(`Ustawiono admin: true dla ${adminEmail} (uid: ${user.uid})`)
}

run().catch((error) => {
  console.error('Nie udało się ustawić custom claims:', error.message)
  process.exit(1)
})
