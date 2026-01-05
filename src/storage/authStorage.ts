import { STORAGE_KEYS } from './keys'

export type AuthedProfile = {
  email: string
  username: string
}

export function setAuthed(profile: AuthedProfile, token?: string): void {
  sessionStorage.setItem(STORAGE_KEYS.auth.email, profile.email)
  sessionStorage.setItem(STORAGE_KEYS.auth.username, profile.username)
  if (token) sessionStorage.setItem(STORAGE_KEYS.auth.token, token)
  else sessionStorage.removeItem(STORAGE_KEYS.auth.token)
}

export function clearAuthed(): void {
  sessionStorage.removeItem(STORAGE_KEYS.auth.email)
  sessionStorage.removeItem(STORAGE_KEYS.auth.username)
  sessionStorage.removeItem(STORAGE_KEYS.auth.token)
}

export function isAuthed(): boolean {
  const email = sessionStorage.getItem(STORAGE_KEYS.auth.email)
  const username = sessionStorage.getItem(STORAGE_KEYS.auth.username)
  return Boolean(email && username)
}

export function getAuthedProfile(): AuthedProfile | null {
  const email = sessionStorage.getItem(STORAGE_KEYS.auth.email)
  const username = sessionStorage.getItem(STORAGE_KEYS.auth.username)
  if (!email || !username) return null
  return { email, username }
}

export function getAuthedToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.auth.token)
}
