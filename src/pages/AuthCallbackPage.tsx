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
 * @description
 * Google OAuth 인증 후 리다이렉트되는 콜백 페이지입니다.
 * 사용자가 Google에서 인증을 성공적으로 마치면, Google은 이 페이지로 사용자를 보냅니다.
 * 이 페이지는 URL에 포함된 인증 코드(code)와 state를 처리하여 실제 로그인을 완료하는 역할을 합니다.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  // 페이지가 로드될 때 OAuth 콜백 처리를 자동으로 시작합니다.
  useEffect(() => {
    handleOAuthCallback()
  }, [])

  /**
   * OAuth 콜백의 전체 처리 과정을 담당하는 비동기 함수.
   */
  async function handleOAuthCallback() {
    try {
      // 1. URL 쿼리 파라미터에서 `code`와 `state`를 추출합니다.
      // `code`: 백엔드가 Google로부터 액세스 토큰을 받기 위해 필요한 일회용 인증 코드.
      // `state`: CSRF 공격을 방지하기 위해 사용되는 값.
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')

      // 2. Google이 에러를 반환했는지 확인합니다 (예: 사용자가 '액세스 거부'를 클릭).
      if (oauthError) {
        throw new Error('OAUTH_FAILED')
      }

      // 3. 인증 코드가 URL에 없는 경우, 비정상적인 접근으로 간주하고 에러를 발생시킵니다.
      if (!code) {
        throw new Error('OAuth code not found')
      }

      // 4. CSRF 공격 방지를 위해 state 값을 검증합니다.
      // AuthStartPage에서 sessionStorage에 저장했던 state와 Google이 보내준 state가 일치해야 합니다.
      const savedState = getOAuthState()
      if (!state || !savedState || state !== savedState) {
        throw new Error('CSRF validation failed')
      }

      console.log('✅ State validation successful')

      // 5. 백엔드 서버에 인증 코드를 보내고, 액세스 토큰과 리프레시 토큰을 받아옵니다.
      // 중요: 클라이언트(브라우저)에서 직접 토큰을 교환하지 않고, 백엔드를 통해 처리하는 것이 보안상 안전합니다.
      //       (클라이언트 시크릿 노출 방지)
      const { accessToken, refreshToken } = await exchangeCodeForToken(code)

      // 6. 수신한 JWT(Access Token)를 디코딩하여 사용자 정보를 추출합니다.
      // 여기서는 이메일과 고유 식별자(sub)를 얻습니다.
      const decoded = jwtDecode<{ userNum?: number; localId?: string; username?: string }>(accessToken)
      const userNum = decoded.userNum
      const localId = decoded.localId || 'unknown'
      const username = decoded.username || localId

      console.log('✅ JWT decoded:', { userNum, localId, username })

      // 7. 받아온 토큰과 사용자 정보를 스토리지에 저장하여 로그인 상태를 만듭니다.
      setAuthed(
        {
          localId: localId,
          username: username,
          userNum: userNum
        },
        {
          accessToken,
          refreshToken,
        }
      )

      // 8. 사용이 끝난 OAuth state 정보를 스토리지에서 제거합니다.
      clearOAuthState()

      // 9. 모든 과정이 성공적으로 끝나면, 사용자를 메인 페이지로 이동시킵니다.
      // `replace: true` 옵션으로 브라우저 히스토리에서 현재 콜백 페이지를 제거하여,
      // 사용자가 '뒤로가기'로 이 페이지에 다시 접근하는 것을 방지합니다.
      console.log('✅ Login successful, redirecting to main page')
      navigate(ROUTES.MENTS, { replace: true })
    } catch (err) {
      console.error('❌ OAuth callback processing error:', err)
      
      // 발생한 에러에 따라 적절한 사용자 친화적 메시지를 설정합니다.
      let errorMessage = t('auth.oauthFailed')
      if (err instanceof Error) {
        const i18nKey = errorMessageMap[err.message]
        errorMessage = i18nKey ? t(i18nKey) : err.message
      }
      setError(errorMessage)
      // 에러 발생 시에도 저장된 state는 정리합니다.
      clearOAuthState()
    }
  }

  // 에러 발생 시 사용자에게 보여줄 UI
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

  // 토큰 교환 및 로그인 처리가 진행되는 동안 보여줄 로딩 UI
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
