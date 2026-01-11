import { STORAGE_KEYS } from '../constants'

const BOOKMARKS_KEY = STORAGE_KEYS.app.favorites // 즐겨찾기와 동일 키 사용

/**
 * 북마크(즐겨찾기) ID 목록을 가져옵니다.
 */
export function getBookmarks(): string[] {
  try {
    const json = localStorage.getItem(BOOKMARKS_KEY)
    if (!json) return []
    const data = JSON.parse(json) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

/**
 * 북마크 목록을 저장합니다.
 */
export function setBookmarks(bookmarks: string[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
}

/**
 * 북마크를 토글합니다 (추가/제거).
 * @returns 토글 후 북마크 여부
 */
export function toggleBookmark(id: string): boolean {
  const bookmarks = getBookmarks()
  const index = bookmarks.indexOf(id)
  
  if (index === -1) {
    // 추가
    bookmarks.push(id)
    setBookmarks(bookmarks)
    return true
  } else {
    // 제거
    bookmarks.splice(index, 1)
    setBookmarks(bookmarks)
    return false
  }
}

/**
 * 특정 ID가 북마크되어 있는지 확인합니다.
 */
export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id)
}
