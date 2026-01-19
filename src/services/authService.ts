/**
 * Google OAuth 인증 서비스
 * OAuth URL 생성 및 CSRF 방지를 위한 state 관리.
 * 
 * @description
 * 이 서비스는 구글 OAuth 인증 프로세스를 시작하는 데 필요한 URL을 생성합니다.
 * 실제 인증 코드(code)를 백엔드에 보내 토큰을 받아오는 로직은 api.ts의 exchangeCodeForToken 함수에 구현되어 있습니다.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

/**
 * CSRF(Cross-Site Request Forgery) 공격을 방지하기 위한 랜덤 state 값을 생성합니다.
 * 이 값은 인증 요청 시 함께 전송되었다가 콜백 시 반환되어, 요청의 유효성을 검증하는 데 사용됩니다.
 * @returns {string} 16바이트 길이의 랜덤 문자열을 base64url 형식으로 인코딩하여 반환합니다.
 */
export function createOAuthState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  // base64url 인코딩: URL에서 안전하게 사용하기 위해 '+' -> '-', '/' -> '_'로 변환하고 '=' 패딩을 제거합니다.
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Google OAuth 인증 페이지로 리다이렉트할 URL을 생성합니다.
 * @param state {string} createOAuthState 함수를 통해 생성된 CSRF 방지용 state 값
 * @returns {string} 생성된 전체 Google OAuth 인증 URL
 */
export function buildGoogleAuthorizeUrl(state: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.')
  }

  // redirect_uri는 현재 웹 애플리케이션의 주소(origin)를 기반으로 동적으로 생성됩니다.
  // 예: http://localhost:5173/auth/callback
  const redirectUri =`${window.location.origin}/auth/callback`

  const params = new URLSearchParams({
    // Google Cloud Console에서 발급받은 클라이언트 ID
    client_id: clientId,
    // Google 인증 후 리다이렉트될 URI
    redirect_uri: redirectUri,
    // 'code': 서버가 액세스 토큰과 교환할 수 있는 인증 코드를 요청
    response_type: 'code',
    // 요청할 사용자 정보의 범위 (openid, email, profile)
    scope: 'openid email profile',
    // CSRF 공격 방지를 위한 상태 토큰
    state: state,
    // 'offline': 사용자가 없어도 API에 액세스할 수 있도록 리프레시 토큰을 요청
    access_type: 'offline',
    // 'consent': 매번 사용자에게 동의를 구하는 화면을 표시
    prompt: 'consent',
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}
