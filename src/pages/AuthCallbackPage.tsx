import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'
import { exchangeCodeForToken } from '../services/api'
import { setAuthed, getOAuthState, clearOAuthState } from '../storage/authStorage'
import { errorMessageMap } from '../utils/errorMessageMap'
import { ROUTES } from '../constants'

/**
 * Google OAuth 콜백 페이지
 * - State 검증 (CSRF 방지)
 * - 백엔드로 인증 코드 전송
 * - 토큰 수신 및 저장
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  async function handleOAuthCallback() {
    try {
      // 1. URL 파라미터 추출
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')

      // 2. OAuth 에러 확인
      if (oauthError) {
        throw new Error('OAUTH_FAILED')
      }

      // 3. 인증 코드 확인
      if (!code) {
        throw new Error('OAuth code not found')
      }

      // 4. State 검증 (CSRF 방지)
      const savedState = getOAuthState()
      if (!state || !savedState || state !== savedState) {
        throw new Error('CSRF validation failed')
      }

      console.log('✅ State validation successful')

      // 5. 백엔드로 인증 코드 전송 및 토큰 수신
      const { accessToken, refreshToken } = await exchangeCodeForToken(code)

      // 6. JWT에서 이메일 추출
      const decoded = jwtDecode<{ email?: string; sub?: string }>(accessToken)
      const email = decoded.email || decoded.sub || 'unknown@example.com'

      console.log('✅ JWT decoded:', { email })

      // 7. 인증 정보 저장
      setAuthed(
        {
          localId: email,
          username: email.split('@')[0], // 이메일 앞부분을 username으로 사용
        },
        {
          accessToken,
          refreshToken,
        }
      )

      // 8. OAuth State 정리
      clearOAuthState()

      // 9. 메인 페이지로 이동
      console.log('✅ Login successful, redirecting to main page')
      navigate(ROUTES.MENTS, { replace: true })
    } catch (err) {
      console.error('❌ OAuth callback processing error:', err)
      
      // 에러 메시지를 i18n 키로 변환
      let errorMessage = t('auth.oauthFailed')
      if (err instanceof Error) {
        const i18nKey = errorMessageMap[err.message]
        errorMessage = i18nKey ? t(i18nKey) : err.message
      }
      setError(errorMessage)
      clearOAuthState()
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">로그인 실패</h2>
          <div className="mt-4 rounded-2xl border border-pink-200 bg-pink-50 p-3">
            <p className="text-sm text-pink-700">{error}</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
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
        <p className="mt-4 text-sm font-medium text-slate-900">로그인 처리 중...</p>
        <p className="mt-2 text-xs text-slate-500">잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}
