/**
 * Google OAuth 인증 서비스
 * OAuth URL 생성 및 state 관리
 * 
 * 주의: 실제 토큰 교환은 api.ts의 exchangeCodeForToken 사용
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

/**
 * CSRF 방지용 랜덤 state 생성 (16바이트 base64url)
 */
export function createOAuthState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  // base64url 인코딩
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Google OAuth 인증 URL 생성
 */
export function buildGoogleAuthorizeUrl(state: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.')
  }

  // redirect_uri는 환경변수에서 가져오거나 자동 생성
  const redirectUri =
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/auth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}
