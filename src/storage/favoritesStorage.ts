import { STORAGE_KEYS } from '../constants'

const FAVORITES_KEY = STORAGE_KEYS.app.favorites

export type LocalFavorite = {
  id: string
  mentId: string | number
  comment: string
  tag: string
  isLocal: boolean
  createdAt: number
}

function safeParseFavorites(json: string | null): LocalFavorite[] {
  if (!json) return []
  try {
    const data = JSON.parse(json) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((x): x is LocalFavorite => {
      if (!x || typeof x !== 'object') return false
      const f = x as Record<string, unknown>
      return (
        typeof f.id === 'string' &&
        (typeof f.mentId === 'string' || typeof f.mentId === 'number') &&
        typeof f.comment === 'string' &&
        typeof f.tag === 'string' &&
        typeof f.isLocal === 'boolean' &&
        typeof f.createdAt === 'number'
      )
    })
  } catch {
    return []
  }
}

export function getLocalFavorites(): LocalFavorite[] {
  return safeParseFavorites(localStorage.getItem(FAVORITES_KEY))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function setLocalFavorites(favorites: LocalFavorite[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export function addLocalFavorite(input: {
  mentId: string | number
  comment: string
  tag: string
  isLocal: boolean
}): LocalFavorite {
  const favorites = getLocalFavorites()
  
  // 이미 존재하는지 확인
  const exists = favorites.some((f) => f.mentId === input.mentId)
  if (exists) {
    throw new Error('이미 즐겨찾기에 추가된 멘트입니다.')
  }
  
  const newFavorite: LocalFavorite = {
    id: crypto.randomUUID(),
    mentId: input.mentId,
    comment: input.comment,
    tag: input.tag,
    isLocal: input.isLocal,
    createdAt: Date.now(),
  }
  
  setLocalFavorites([newFavorite, ...favorites])
  return newFavorite
}

export function removeLocalFavorite(id: string): void {
  const favorites = getLocalFavorites()
  setLocalFavorites(favorites.filter((f) => f.id !== id))
}

export function isFavorited(mentId: string | number): boolean {
  return getLocalFavorites().some((f) => f.mentId === mentId)
}
