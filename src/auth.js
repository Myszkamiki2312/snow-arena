import { computed, ref } from 'vue'
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

const currentUser = ref(null)
const isAdmin = ref(false)
const authReady = ref(false)

const adminEmails = new Set(
  (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
)

let initPromise = null

export const isLoggedIn = computed(() => !!currentUser.value)

export const resolveIsAdmin = async (user, { forceRefresh = false } = {}) => {
  if (!user) return false

  try {
    const tokenResult = await getIdTokenResult(user, forceRefresh)
    if (tokenResult?.claims?.admin === true) return true
  } catch (error) {
    console.error('Nie udało się pobrać claims admin:', error)
  }

  return adminEmails.has((user.email || '').toLowerCase())
}

export const initAuth = () => {
  if (initPromise) return initPromise

  initPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user
      isAdmin.value = await resolveIsAdmin(user)
      if (!authReady.value) {
        authReady.value = true
        resolve()
      }
    })
  })

  return initPromise
}

export { currentUser, isAdmin, authReady }
