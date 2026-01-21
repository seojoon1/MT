// ============================
// 인증 관련 타입
// ============================

export type AuthedProfile = {
  localId: string
  username: string
  userNum?: string | number
}

export type AuthResponse = {
  status?: number
  message?: string
  accessToken: string
  refreshToken?: string
  email?: string
  username?: string
  userNum?: string | number
}

export type DemoUser = {
  localId: string
  email: string
  username: string
  password: string
  createdAt: number
}

// ============================
// 인증 요청 타입
// ============================

export type LoginPayload = {
  localId: string
  password: string
}

export type RegisterPayload = {
  localId: string
  password: string
  nickname: string
  email: string
}

export type RefreshTokenPayload = {
  refreshToken: string
}




// ============================
// 멘트 관련 타입
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

// ============================
// 멘트 요청 타입
// ============================

export type AddCommentPayload = {
  contentKo: string
  tag: string
}

export type TranslatePayload = {
  comment: string
}

/** 즐겨찾기/북마크 아이템 타입 */
export type BookmarkItem = {
  bookmarkNum: number
  mentNum: number
  comment: string
  mentTag: string
  createdAt?: string
}

/** 번역 API 응답 타입 */
export type TranslateResponse = {
  content: string
}

// ============================
// Component Props Types
// ============================

import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, HTMLAttributes } from 'react'

// Button Component
export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

// Input Component
export type InputProps = {
  label?: string
  leftIcon?: ReactNode
  variant?: InputVariant
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

// Card Component
export type CardProps = {
  children: ReactNode
  noPadding?: boolean
} & HTMLAttributes<HTMLDivElement>

// Header Component
export type HeaderProps = {
  title: string
  subtitle?: ReactNode
  backTo?: string
  rightContent?: ReactNode
  className?: string
}

// Alert Component
export type AlertVariant = 'error' | 'warning' | 'success' | 'info'

export type AlertProps = {
  children: ReactNode
  variant?: AlertVariant
  className?: string
}

// Tag Component
export type TagVariant = 'pink' | 'purple' | 'slate'

export type TagProps = {
  label: string
  selected?: boolean
  variant?: TagVariant
  clickable?: boolean
  showHash?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

// Textarea Component
export type TextareaProps = {
  label?: string
  variant?: InputVariant
  error?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>

// Spinner Component
export type SpinnerSize = 'sm' | 'md' | 'lg'

export type SpinnerProps = {
  size?: SpinnerSize
  className?: string
}

// Layout Components
export type MainProps = {
  children: ReactNode
  className?: string
}

export type PageContainerProps = {
  children: ReactNode
  className?: string
}

// Modal Components
export type Language = 'ko' | 'lo' | 'en'

export type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

// ============================
// API Types
// ===========================

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

// Button Variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Input Variants
export type InputVariant = 'default' | 'error'
