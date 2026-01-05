const USERS_KEY = 'flirting_ments_users'

export type DemoUser = {
  email: string
  username: string
  password: string
  createdAt: number
}

function safeParse(json: string | null): DemoUser[] {
  if (!json) return []
  try {
    const data = JSON.parse(json) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((x): x is DemoUser => {
      if (!x || typeof x !== 'object') return false
      const u = x as Record<string, unknown>
      return (
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

export function findUserByEmail(email: string): DemoUser | null {
  const normalized = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === normalized) ?? null
}

export function findUserByUsername(username: string): DemoUser | null {
  const normalized = username.trim().toLowerCase()
  return getUsers().find((u) => u.username.toLowerCase() === normalized) ?? null
}

export function addUser(input: { email: string; username: string; password: string }): DemoUser {
  const nextUser: DemoUser = {
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
