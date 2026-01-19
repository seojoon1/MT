import { STORAGE_KEYS } from '../constants'
import type { AuthedProfile } from '../types'

// 기존 코드 호환성을 위해 re-export
export type { AuthedProfile }

// --- 토큰 저장 전략 ---
// Access Token은 비교적 짧은 만료 시간을 가지며, 탈취될 경우 즉각적인 위협이 될 수 있습니다.
// XSS(Cross-Site Scripting) 공격으로부터 토큰을 보호하기 위해, localStorage나 sessionStorage 대신
// JavaScript 변수(메모리)에만 저장합니다. 이 경우, 페이지를 새로고침하면 토큰은 사라집니다.
let _accessToken: string | null = null;

// Refresh Token은 긴 만료 시간을 가지며, Access Token을 재발급받는 데 사용됩니다.
// 사용자의 로그인 세션을 유지하기 위해 localStorage에 저장됩니다.
// Refresh Token이 탈취되더라도, Access Token을 얻기 위해서는 추가적인 단계가 필요하므로
// Access Token을 직접 저장하는 것보다 안전합니다.

/**
 * 메모리에 저장된 Access Token을 반환합니다.
 * 페이지 새로고침 시에는 null이 됩니다.
 * @returns {string | null} Access Token 또는 null
 */
export function getAccessToken(): string | null {
  return _accessToken;
}

/**
 * Access Token을 메모리에 저장합니다. (주로 토큰 갱신 시 사용)
 * @param token {string | null} 저장할 Access Token
 */
export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

/**
 * 로그인 성공 시 호출되어 인증 상태(토큰, 프로필)를 저장합니다.
 * @param profile {AuthedProfile} 저장할 사용자 프로필 정보 (localId, username 등)
 * @param tokens {object} 저장할 토큰. accessToken은 메모리에, refreshToken은 localStorage에 저장됩니다.
 */
export function setAuthed(profile: AuthedProfile, tokens?: { accessToken?: string, refreshToken?: string }): void {
  console.log('setAuthed 호출:', { profile, tokens })

  // 사용자 정보는 localStorage에 저장하여 브라우저를 닫았다 열어도 유지되도록 합니다.
  localStorage.setItem(STORAGE_KEYS.auth.localId, profile.localId)
  localStorage.setItem(STORAGE_KEYS.auth.username, profile.username)
  
  if (profile.userNum) {
    localStorage.setItem(STORAGE_KEYS.auth.userNum, String(profile.userNum))
  }

  // Access Token은 메모리 변수에만 저장합니다.
  if (tokens?.accessToken) {
    _accessToken = tokens.accessToken;
    console.log('Access 토큰 메모리 저장 완료');
  } else {
    _accessToken = null;
  }

  // Refresh Token은 localStorage에 저장합니다.
  if (tokens?.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.auth.refreshToken || 'auth_refreshToken', tokens.refreshToken)
  }
}

/**
 * 로그아웃 시 호출되어 모든 인증 정보를 삭제합니다.
 */
export function clearAuthed(): void {
  // 메모리에 저장된 Access Token을 초기화합니다.
  _accessToken = null;
  
  // localStorage에 저장된 모든 인증 관련 정보를 제거합니다.
  localStorage.removeItem(STORAGE_KEYS.auth.localId)
  localStorage.removeItem(STORAGE_KEYS.auth.username)
  localStorage.removeItem(STORAGE_KEYS.auth.token) // 레거시 호환성을 위해 제거
  localStorage.removeItem(STORAGE_KEYS.auth.userNum)
  localStorage.removeItem(STORAGE_KEYS.auth.refreshToken)
}

/**
 * 사용자의 로그인 여부를 확인합니다.
 * @returns {boolean} 로그인 상태이면 true, 아니면 false
 * @description
 * 1. 메모리에 Access Token이 있는지 확인 (페이지 이동 시 빠른 체크)
 * 2. localStorage에 Refresh Token이 있는지 확인 (페이지 새로고침 후 세션 유지 체크)
 * 둘 중 하나라도 존재하면 로그인 상태로 간주합니다.
 */
export function isAuthed(): boolean {
  const hasRefreshToken = !!localStorage.getItem(STORAGE_KEYS.auth.refreshToken);
  const hasAccessToken = !!_accessToken;
  return hasRefreshToken || hasAccessToken;
}

/**
 * localStorage에서 사용자 프로필 정보를 가져옵니다.
 * @returns {AuthedProfile | null} 프로필 정보 또는 null
 */
export function getAuthedProfile(): AuthedProfile | null {
  const localId = localStorage.getItem(STORAGE_KEYS.auth.localId)
  const username = localStorage.getItem(STORAGE_KEYS.auth.username)
  const userNumStr = localStorage.getItem(STORAGE_KEYS.auth.userNum)
  const userNum = userNumStr ? parseInt(userNumStr, 10) : undefined;

  if (!localId || !username) return null
  return { localId, username, userNum }
}

/**
 * 메모리에서 Access Token을 가져옵니다. (getAccessToken과 동일, 호환성 유지)
 * @returns {string | null} Access Token 또는 null
 */
export function getAuthedToken(): string | null {
  return _accessToken;
}

/**
 * localStorage에서 Refresh Token을 가져옵니다.
 * @returns {string | null} Refresh Token 또는 null
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.auth.refreshToken)
}

/**
 * localStorage에서 사용자 이메일(localId)을 가져옵니다.
 * @returns {string | null} 이메일 또는 null
 */
export function getAuthEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.auth.localId)
}

/**
 * Access Token 만료 후, Refresh Token을 사용해 토큰들을 갱신할 때 호출됩니다.
 * @param accessToken {string} 새로 발급받은 Access Token
 * @param refreshToken {string} (선택) 경우에 따라 함께 갱신될 수 있는 Refresh Token
 */
export function updateTokens(accessToken: string, refreshToken?: string): void {
  _accessToken = accessToken; // 메모리의 Access Token을 새 것으로 교체
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.auth.refreshToken, refreshToken) // localStorage의 Refresh Token도 갱신
  }
}

// ============================
// Admin 권한 확인 (클라이언트 측)
// ============================

/**
 * JWT 토큰의 payload를 디코딩하는 간단한 유틸리티 함수.
 * @param token {string} 디코딩할 JWT 토큰
 * @returns {any} 디코딩된 payload 객체 또는 null
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
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

/**
 * 현재 로그인한 사용자가 관리자 권한을 가졌는지 확인합니다.
 * @returns {boolean} 관리자이면 true, 아니면 false
 * @description
 * 이 함수는 메모리에 있는 Access Token(JWT)을 디코딩하여 'role' 또는 'admin' 관련 클레임을 확인합니다.
 * **중요**: 이 로직은 오직 UI(화면) 상에서 관리자용 메뉴를 보여주거나 감추는 등의 편의 기능을 위한 것입니다.
 * 실제 핵심적인 관리자 기능에 대한 접근 제어는 반드시 **백엔드 서버**에서 이루어져야 합니다.
 */
export function isAdmin(): boolean {
  const token = _accessToken; 
  if (!token) return false
  
  const payload = decodeJWT(token)
  if (!payload) return false
  
  // 다양한 형태의 관리자 클레임을 확인 (예: role: 'ADMIN', isAdmin: true 등)
  return payload.role === 'ADMIN' || 
        payload.role === 'admin' || 
        payload.isAdmin === true || 
        payload.admin === true
}


// ============================
// OAuth 인증 과정용 State 관리
// ============================

/**
 * OAuth 인증 시작 시, CSRF 방지를 위한 state와 redirect URI를 sessionStorage에 저장합니다.
 * @description
 * sessionStorage는 탭/윈도우가 닫히면 데이터가 사라지므로,
 * 일회성 인증 과정 중에만 잠시 필요한 이 데이터를 저장하기에 적합합니다.
 * @param state {string} CSRF 방지용 랜덤 문자열
 * @param redirectUri {string} 인증 후 돌아올 URI
 */
export function setOAuthState(state: string, redirectUri: string): void {
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('oauth_redirect_uri', redirectUri)
}

/**
 * sessionStorage에 저장된 CSRF 방지용 state 값을 가져옵니다.
 * @returns {string | null} state 값 또는 null
 */
export function getOAuthState(): string | null {
  return sessionStorage.getItem('oauth_state')
}

/**
 * 인증 절차가 끝나면 sessionStorage에 저장했던 state 관련 정보를 제거합니다.
 */
export function clearOAuthState(): void {
  sessionStorage.removeItem('oauth_state')
  sessionStorage.removeItem('oauth_redirect_uri')
}