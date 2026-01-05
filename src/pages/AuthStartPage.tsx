import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { buildStartOAuthUrl, type OAuthProvider } from '../services/authService'

export default function AuthStartPage() {
  const { provider } = useParams<{ provider: OAuthProvider }>()

  useEffect(() => {
    if (!provider) return
    const redirectUri = `${window.location.origin}/auth/callback?provider=${encodeURIComponent(provider)}`
    const url = buildStartOAuthUrl(provider, redirectUri)
    window.location.assign(url)
  }, [provider])

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-8">
        <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
          소셜 로그인으로 이동 중...
        </div>
      </div>
    </div>
  )
}
