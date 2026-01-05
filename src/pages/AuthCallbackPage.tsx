import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { setAuthed, type AuthedProfile } from '../storage/authStorage'
import { exchangeCodeForToken, type OAuthProvider } from '../services/authService'

function deriveUsernameFromEmail(email: string): string {
  const at = email.indexOf('@')
  const base = (at > 0 ? email.slice(0, at) : email).trim()
  return base || 'guest'
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const provider = (params.get('provider') ?? '') as OAuthProvider
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''
  const code = params.get('code') ?? ''

  const redirectUri = useMemo(() => {
    if (!provider) return `${window.location.origin}/auth/callback`
    return `${window.location.origin}/auth/callback?provider=${encodeURIComponent(provider)}`
  }, [provider])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        // 1) query로 email/token이 오면 즉시 로그인 완료 처리
        if (email && token) {
          const profile: AuthedProfile = { email, username: deriveUsernameFromEmail(email) }
          setAuthed(profile, token)
          if (!cancelled) navigate('/planner', { replace: true })
          return
        }

        // 2) code만 오는 경우: 서버와 토큰 교환
        if (provider && code) {
          const { profile, token: exchangedToken } = await exchangeCodeForToken({
            provider,
            code,
            redirectUri,
          })
          setAuthed(profile, exchangedToken)
          if (!cancelled) navigate('/planner', { replace: true })
          return
        }

        throw new Error('로그인 정보를 확인할 수 없습니다.')
      } catch (e) {
        const msg = e instanceof Error ? e.message : '로그인에 실패했습니다.'
        if (!cancelled) setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [code, email, navigate, provider, redirectUri, token])

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-8">
        <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <h1 className="text-base font-semibold text-slate-900">소셜 로그인 콜백</h1>

          {loading && (
            <p className="mt-2 text-sm text-slate-600">로그인 처리 중...</p>
          )}

          {!loading && error && (
            <div className="mt-3 rounded-2xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-700">
              <p>{error}</p>
              <Link to="/login" className="mt-2 inline-block font-semibold text-pink-700 underline">
                로그인으로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
