const APP_PREFIX = 'flirting_ments'

const BOOKMARKS_KEY = `${APP_PREFIX}_bookmarks`

type BookmarkState = string[]

function safeParse(json: string | null): BookmarkState | null {
  if (!json) return null
  try {
    const data = JSON.parse(json) as unknown
    if (!Array.isArray(data)) return null
    return data.filter((x): x is string => typeof x === 'string')
  } catch {
    return null
  }
}

export function getBookmarks(): string[] {
  const parsed = safeParse(localStorage.getItem(BOOKMARKS_KEY))
  if (!parsed) {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([] satisfies string[]))
    return []
  }
  return parsed
}

export function setBookmarks(ids: string[]): void {
  const unique = Array.from(new Set(ids))
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(unique))
}

export function toggleBookmark(id: string): string[] {
  const current = getBookmarks()
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id]
  setBookmarks(next)
  return next
}

export function isBookmarked(id: string, bookmarks: string[]): boolean {
  return bookmarks.includes(id)
}
