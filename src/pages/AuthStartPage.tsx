import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createOAuthState, buildGoogleAuthorizeUrl } from '../services/authService'
import { setOAuthState } from '../storage/authStorage'

/**
 * @description
 * Google OAuth 2.0 인증 프로세스를 시작하는 페이지입니다.
 * 이 페이지는 렌더링되자마자 CSRF 방지를 위한 state를 생성하고, 
 * 이 state를 포함한 Google 인증 URL을 만들어 사용자를 해당 URL로 즉시 리다이렉트시킵니다.
 * 사용자는 이 페이지의 UI를 거의 보지 못하고 바로 Google 로그인 화면으로 이동하게 됩니다.
 */
export default function AuthStartPage() {
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트가 마운트될 때 한 번만 실행되는 로직
  useEffect(() => {
    try {
      // 1. CSRF(Cross-Site Request Forgery) 공격 방지를 위한 고유한 state 값을 생성합니다.
      // 이 값은 인증 요청 시 전달했다가 콜백(redirect) 시 함께 받아와, 요청이 우리 앱에서 시작된 것인지 검증하는 데 사용됩니다.
      const state = createOAuthState()

      // 2. 인증 후 Google이 리다이렉트할 우리 애플리케이션의 URI를 결정합니다.
      const redirectUri =
        `${window.location.origin}/auth/callback`

      // 3. 생성된 state와 redirectUri를 sessionStorage에 저장합니다.
      // AuthCallbackPage에서 Google이 보내준 state와 저장된 state를 비교하기 위함입니다.
      setOAuthState(state, redirectUri)

      // 4. Google OAuth 인증 URL을 생성합니다.
      const authUrl = buildGoogleAuthorizeUrl(state)

      // 5. 생성된 URL로 브라우저를 리다이렉트하여 Google 로그인 프로세스를 시작합니다.
      // 이 시점에서 사용자는 우리 사이트를 떠나 Google 페이지로 이동합니다.
      console.log('🔐 Redirecting to Google OAuth:', authUrl)
      window.location.href = authUrl
    } catch (err) {
      // URL 생성 또는 리다이렉트 과정에서 에러 발생 시 처리
      console.error('❌ OAuth 시작 오류:', err)
      setError(err instanceof Error ? err.message : 'OAuth 시작 중 오류가 발생했습니다.')
    }
  }, []) // 의존성 배열이 비어 있으므로, 마운트 시 1회만 실행됩니다.

  // 인증 흐름에 에러가 발생한 경우 보여줄 UI
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

  // 리다이렉트가 일어나기 전 잠시 동안 보여질 로딩 UI
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
