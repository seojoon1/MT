/**
 * Google OAuth 인증 서비스
 * CSRF 방지 및 백엔드 토큰 교환 처리
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

/**
 * 백엔드로 인증 코드를 전송하여 토큰 교환
 * EUC-KR/UTF-8 인코딩 처리 포함
 * 
 * 주의: 이 요청은 로그인 전이므로 Authorization 헤더를 보내지 않음
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string
  refreshToken?: string
}> {
  // 개발 환경에서는 Vite 프록시 사용, 프로덕션에서는 직접 호출
  const isDev = import.meta.env.DEV
  const forceRemote = String(import.meta.env.VITE_API_BASE_URL_FORCE_REMOTE ?? '').toLowerCase() === 'true'
  
  let url: string
  if (isDev && !forceRemote) {
    // 개발 환경: Vite 프록시를 통해 /api -> 백엔드로 전달
    // vite.config.ts에서 /api를 제거하고 백엔드로 전송
    url = '/api/oauth/callback/google'
  } else {
    // 프로덕션 또는 강제 원격: 백엔드 URL 직접 사용
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    url = `${apiBaseUrl}/oauth/callback/google`
  }

  console.log('🚀 OAuth 코드 교환 요청:', { 
    url, 
    codeLength: code.length,
    codePreview: code.substring(0, 20) + '...',
    isDev,
    forceRemote,
    env: {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ? '설정됨' : '미설정'
    }
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Authorization 헤더 없음 (아직 로그인 전)
    },
    body: JSON.stringify({ code }),
    credentials: 'include', // 쿠키 포함 (CORS 설정 필요)
  })

  console.log('📡 백엔드 응답:', {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries())
  })

  // 응답 본문 인코딩 처리 (EUC-KR/UTF-8)
  const buf = await res.arrayBuffer()
  const utf8Text = new TextDecoder('utf-8').decode(buf)
  const eucKrText = new TextDecoder('euc-kr', { fatal: false }).decode(buf)
  const decoded = utf8Text.includes('�') ? eucKrText : utf8Text

  if (!res.ok) {
    console.error('❌ 백엔드 에러:', {
      status: res.status,
      statusText: res.statusText,
      body: decoded,
      url
    })
    throw new Error(decoded || `백엔드 오류 (HTTP ${res.status}: ${res.statusText})`)
  }

  console.log('✅ 백엔드 응답 본문:', decoded)

  const data = JSON.parse(decoded)

  // 카멜케이스/스네이크케이스 둘 다 지원
  const accessToken = data.accessToken || data.access_token || data.token
  const refreshToken = data.refreshToken || data.refresh_token

  if (!accessToken) {
    console.error('❌ 토큰 없음:', data)
    throw new Error('백엔드 응답에 accessToken이 없습니다.')
  }

  console.log('✅ 토큰 수신 성공')

  return { accessToken, refreshToken }
}
