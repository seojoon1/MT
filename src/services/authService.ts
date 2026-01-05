import type { AuthedProfile } from '../storage/authStorage'

export type OAuthProvider = 'google' | 'facebook'

export function buildStartOAuthUrl(provider: OAuthProvider, redirectUri: string): string {
  const apiUrl = (import.meta.env.VITE_AUTH_API_URL as string | undefined) ?? ''

  // 개발 단계 fallback: 백엔드가 없으면 callback을 바로 흉내낸다.
  if (!apiUrl) {
    const email = `demo_${provider}@example.com`
    const token = `demo_${provider}_${Date.now()}`
    return `/auth/callback?provider=${encodeURIComponent(provider)}&email=${encodeURIComponent(
      email
    )}&token=${encodeURIComponent(token)}`
  }

  // 실제 백엔드가 있다면: provider별 시작 URL로 이동(백엔드 구현에 맞춰 조정 가능)
  return `${apiUrl.replace(/\/$/, '')}/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`
}

export async function exchangeCodeForToken(input: {
  provider: OAuthProvider
  code: string
  redirectUri: string
}): Promise<{ profile: AuthedProfile; token: string }> {
  const apiUrl = (import.meta.env.VITE_AUTH_API_URL as string | undefined) ?? ''

  // fallback: 코드 교환도 로컬에서 흉내
  if (!apiUrl) {
    return {
      profile: {
        email: `demo_${input.provider}@example.com`,
        username: `demo_${input.provider}`,
      },
      token: `demo_${input.provider}_${input.code}`,
    }
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error('토큰 교환에 실패했습니다.')
  }

  const data = (await res.json()) as { email?: string; username?: string; token?: string }
  if (!data.email || !data.username || !data.token) {
    throw new Error('서버 응답이 올바르지 않습니다.')
  }

  return {
    profile: { email: data.email, username: data.username },
    token: data.token,
  }
}
