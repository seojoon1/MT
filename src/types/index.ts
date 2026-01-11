// ============================
// Auth Types
// ============================

export type AuthedProfile = {
  localId: string
  username: string
  userNum?: string | number
}

export type AuthResponse = {
  status?: number
  message?: string
  accessToken?: string
  token?: string
  refreshToken?: string
  email?: string
  username?: string
  user_num?: string | number
}

export type DemoUser = {
  localId: string
  email: string
  username: string
  password: string
  createdAt: number
}

// ============================
// Ment Types
// ============================

export type Tag = string

export type MentStatus = 'pending' | 'approved' | 'rejected'

/** 로컬 스토리지용 멘트 타입 */
export type Ment = {
  id: string
  ko: string
  lo: string
  tags: Tag[]
  aiHint: string
  status: MentStatus
  createdAt: number
}

/** API 응답용 멘트 타입 */
export type MentItem = {
  mentId: number
  contentKo: string
  contentLo?: string
  tag: string
  authorNickname: string
  createdAt: string
  isApproved: number
  reason: string | null
}

/** 즐겨찾기 아이템 타입 */
export type FavoriteItem = {
  favorite_num: number
  ment_num: number
  comment: string
  ment_tag: string
  created_at?: string
}

/** 북마크 아이템 타입 */
export type BookmarkItem = {
  bookmark_num: number
  ment_num: number
  comment: string
  ment_tag: string
  created_at?: string
}

/** 번역 API 응답 타입 */
export type TranslateResponse = {
  content: string
}

// ============================
// API Types
// ============================

export type ApiMethod = 'GET' | 'POST' | 'DELETE'

export type ApiInit = {
  method?: ApiMethod
  body?: unknown
  token?: string | null
  skipAuth?: boolean
  signal?: AbortSignal
  baseOverride?: string
  headers?: Record<string, string>
}

// ============================
// Component Props Types
// ============================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type InputVariant = 'default' | 'error'
