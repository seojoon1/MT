import { STORAGE_KEYS } from '../constants'
import type { DemoUser } from '../types'

const USERS_KEY = STORAGE_KEYS.app.users

// 기존 코드 호환성을 위해 re-export
export type { DemoUser }

function safeParse(json: string | null): DemoUser[] {
  if (!json) return []
  try {
    const data = JSON.parse(json) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((x): x is DemoUser => {
      if (!x || typeof x !== 'object') return false
      const u = x as Record<string, unknown>
      return (
        typeof u.localId === 'string' &&
        typeof u.email === 'string' &&
        typeof u.username === 'string' &&
        typeof u.password === 'string' &&
        typeof u.createdAt === 'number'
      )
    })
  } catch {
    return []
  }
}

export function getUsers(): DemoUser[] {
  return safeParse(localStorage.getItem(USERS_KEY))
}

export function setUsers(next: DemoUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(next))
}

export function findUserByLocalId(localId: string): DemoUser | null {
  const normalized = localId.trim().toLowerCase()
  return getUsers().find((u) => u.localId.toLowerCase() === normalized) ?? null
}

export function findUserByEmail(email: string): DemoUser | null {
  const normalized = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === normalized) ?? null
}

export function findUserByUsername(username: string): DemoUser | null {
  const normalized = username.trim().toLowerCase()
  return getUsers().find((u) => u.username.toLowerCase() === normalized) ?? null
}

export function addUser(input: { localId: string; email: string; username: string; password: string }): DemoUser {
  const nextUser: DemoUser = {
    localId: input.localId.trim(),
    email: input.email.trim(),
    username: input.username.trim(),
    password: input.password,
    createdAt: Date.now(),
  }
  const users = getUsers()
  const next = [nextUser, ...users]
  setUsers(next)
  return nextUser
}
