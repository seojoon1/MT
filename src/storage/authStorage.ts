import { STORAGE_KEYS } from '../constants'
import type { AuthedProfile } from '../types'

// 기존 코드 호환성을 위해 re-export
export type { AuthedProfile }

export function setAuthed(profile: AuthedProfile, tokens?: { accessToken?: string, refreshToken?: string }): void {
  console.log('setAuthed 호출:', { profile, tokens })
  sessionStorage.setItem(STORAGE_KEYS.auth.localId, profile.localId)
  sessionStorage.setItem(STORAGE_KEYS.auth.username, profile.username)
  if (profile.userNum) {
    sessionStorage.setItem(STORAGE_KEYS.auth.userNum || 'auth_userNum', String(profile.userNum))
  }
  if (tokens?.accessToken) {
    sessionStorage.setItem(STORAGE_KEYS.auth.token, tokens.accessToken)
    console.log('토큰 저장 성공:', tokens.accessToken.substring(0, 20) + '...')
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.auth.token)
    console.log('토큰 없음 - 제거')
  }
  if (tokens?.refreshToken) {
    sessionStorage.setItem(STORAGE_KEYS.auth.refreshToken || 'auth_refreshToken', tokens.refreshToken)
  }
}

export function clearAuthed(): void {
  sessionStorage.removeItem(STORAGE_KEYS.auth.localId)
  sessionStorage.removeItem(STORAGE_KEYS.auth.username)
  sessionStorage.removeItem(STORAGE_KEYS.auth.token)
  sessionStorage.removeItem(STORAGE_KEYS.auth.userNum || 'auth_userNum')
  sessionStorage.removeItem(STORAGE_KEYS.auth.refreshToken || 'auth_refreshToken')
}

export function isAuthed(): boolean {
  const localId = sessionStorage.getItem(STORAGE_KEYS.auth.localId)
  const username = sessionStorage.getItem(STORAGE_KEYS.auth.username)
  return Boolean(localId && username)
}

export function getAuthedProfile(): AuthedProfile | null {
  const localId = sessionStorage.getItem(STORAGE_KEYS.auth.localId)
  const username = sessionStorage.getItem(STORAGE_KEYS.auth.username)
  if (!localId || !username) return null
  return { localId, username }
}

export function getAuthedToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.auth.token)
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.auth.refreshToken)
}

export function getAuthEmail(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.auth.localId)
}

export function updateTokens(accessToken: string, refreshToken?: string): void {
  sessionStorage.setItem(STORAGE_KEYS.auth.token, accessToken)
  if (refreshToken) {
    sessionStorage.setItem(STORAGE_KEYS.auth.refreshToken, refreshToken)
  }
}

// ============================
// Admin Check
// ============================

// JWT 토큰 디코딩 (간단한 base64 디코딩)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('JWT 디코딩 실패:', error)
    return null
  }
}

// 토큰에서 관리자 권한 확인
export function isAdmin(): boolean {
  const token = getAuthedToken()
  if (!token) return false
  
  const payload = decodeJWT(token)
  if (!payload) return false
  
  // role, isAdmin, admin 등 다양한 키 체크
  return payload.role === 'ADMIN' || 
         payload.role === 'admin' || 
         payload.isAdmin === true || 
         payload.admin === true
}

// ============================
// OAuth State Management
// ============================

export function setOAuthState(state: string, redirectUri: string): void {
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('oauth_redirect_uri', redirectUri)
}

export function getOAuthState(): string | null {
  return sessionStorage.getItem('oauth_state')
}

export function clearOAuthState(): void {
  sessionStorage.removeItem('oauth_state')
  sessionStorage.removeItem('oauth_redirect_uri')
}
