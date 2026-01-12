import { STORAGE_KEYS } from '../constants'
import type { AuthedProfile } from '../types'

// 기존 코드 호환성을 위해 re-export
export type { AuthedProfile }

// [핵심 변경 1] Access Token은 보안을 위해 '메모리 변수'에만 저장합니다.
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

// [핵심 변경 2] 로그인 처리: Access -> 메모리, Refresh/Profile -> 로컬 스토리지
export function setAuthed(profile: AuthedProfile, tokens?: { accessToken?: string, refreshToken?: string }): void {
  console.log('setAuthed 호출:', { profile, tokens })

  // 1. 사용자 정보는 로컬스토리지 (새로고침/재접속 시 UX 유지를 위해)
  localStorage.setItem(STORAGE_KEYS.auth.localId, profile.localId)
  localStorage.setItem(STORAGE_KEYS.auth.username, profile.username)
  
  if (profile.userNum) {
    localStorage.setItem(STORAGE_KEYS.auth.userNum, String(profile.userNum))
  }

  // 2. Access Token은 메모리 변수에 저장 (스토리지 저장 X)
  if (tokens?.accessToken) {
    _accessToken = tokens.accessToken;
    console.log('Access 토큰 메모리 저장 완료');
  } else {
    _accessToken = null;
  }

  // 3. Refresh Token은 로컬스토리지 (자동 로그인을 위해)
  if (tokens?.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.auth.refreshToken || 'auth_refreshToken', tokens.refreshToken)
  }
}

export function clearAuthed(): void {
  // 메모리 초기화
  _accessToken = null;
  
  // 스토리지 초기화 (Local Storage 사용)
  localStorage.removeItem(STORAGE_KEYS.auth.localId)
  localStorage.removeItem(STORAGE_KEYS.auth.username)
  // 토큰 키가 기존에 저장되어 있을 수 있으니 확실히 제거
  localStorage.removeItem(STORAGE_KEYS.auth.token) 
  localStorage.removeItem(STORAGE_KEYS.auth.userNum)
  localStorage.removeItem(STORAGE_KEYS.auth.refreshToken)
}

// 로그인 여부는 Refresh Token이 있거나, 메모리에 Access Token이 있을 때
export function isAuthed(): boolean {
  const hasRefreshToken = !!localStorage.getItem(STORAGE_KEYS.auth.refreshToken);
  const hasAccessToken = !!_accessToken;
  return hasRefreshToken || hasAccessToken;
}

export function getAuthedProfile(): AuthedProfile | null {
  // 로컬스토리지에서 조회
  const localId = localStorage.getItem(STORAGE_KEYS.auth.localId)
  const username = localStorage.getItem(STORAGE_KEYS.auth.username)
  if (!localId || !username) return null
  return { localId, username }
}

// 기존 함수 이름 호환성 유지 (이제 메모리에서 가져옴)
export function getAuthedToken(): string | null {
  return _accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.auth.refreshToken)
}

export function getAuthEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.auth.localId)
}

// 토큰 갱신 시 호출
export function updateTokens(accessToken: string, refreshToken?: string): void {
  _accessToken = accessToken; // 메모리 갱신
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.auth.refreshToken, refreshToken) // 스토리지 갱신
  }
}

// ============================
// Admin Check
// ============================

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null; // 간단한 유효성 검사 추가
    
    const base64Url = parts[1]
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

export function isAdmin(): boolean {
  // 스토리지 대신 메모리 변수(_accessToken) 확인
  const token = _accessToken; 
  if (!token) return false
  
  const payload = decodeJWT(token)
  if (!payload) return false
  
  return payload.role === 'ADMIN' || 
        payload.role === 'admin' || 
        payload.isAdmin === true || 
        payload.admin === true
}

// ============================
// OAuth State Management
// ============================
// OAuth 상태는 짧은 시간 유지되므로 SessionStorage 유지도 괜찮지만,
// 모바일 브라우저 등의 호환성을 위해 LocalStorage로 통일하는 것도 방법입니다.
// 여기서는 안전하게 기존 SessionStorage 유지를 권장합니다 (탭 닫으면 초기화 의도).

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