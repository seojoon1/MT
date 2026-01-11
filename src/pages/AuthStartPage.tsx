import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createOAuthState, buildGoogleAuthorizeUrl } from '../services/authService'
import { setOAuthState } from '../storage/authStorage'

/**
 * Google OAuth 인증 시작 페이지
 * - State 생성 및 저장
 * - Google 인증 URL로 리다이렉트
 */
export default function AuthStartPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // 1. CSRF 방지용 state 생성
      const state = createOAuthState()

      // 2. Redirect URI 결정
      const redirectUri =
        import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
        `${window.location.origin}/auth/callback`

      // 3. State와 Redirect URI를 sessionStorage에 저장
      setOAuthState(state, redirectUri)

      // 4. Google OAuth URL 생성
      const authUrl = buildGoogleAuthorizeUrl(state)

      // 5. Google 로그인 페이지로 리다이렉트
      console.log('🔐 Redirecting to Google OAuth:', authUrl)
      window.location.href = authUrl
    } catch (err) {
      console.error('❌ OAuth 시작 오류:', err)
      setError(err instanceof Error ? err.message : 'OAuth 시작 중 오류가 발생했습니다.')
    }
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">오류</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-pink-600 text-sm font-semibold text-white hover:bg-pink-700"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 shadow-sm text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-600" />
        <p className="mt-4 text-sm font-medium text-slate-900">구글 로그인으로 이동 중...</p>
        <p className="mt-2 text-xs text-slate-500">잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}
