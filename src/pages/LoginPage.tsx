import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setAuthed } from '../storage/authStorage'
import { postLogin, postRegister } from '../services/api'
import { cn } from '../utils/cn'
import { ROUTES } from '../constants'
import { AxiosError } from 'axios'
import type { AuthResponse } from '../types'

type TabKey = 'login' | 'signup'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [tab, setTab] = useState<TabKey>('login')

  // 로그인 폼
  const [loginLocalId, setLoginLocalId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // 회원가입 폼
  const [signupLocalId, setSignupLocalId] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function resetError() {
    setError(null)
  }

  function completeAuthAndGo(localId: string, response: AuthResponse) {
    const token = response.accessToken
    if (token) {
      setAuthed(
        { 
          localId, 
          username: response.username || localId,
          userNum: response.userNum 
        }, 
        { 
          accessToken: token,
          refreshToken: response.refreshToken 
        }
      )
      navigate(ROUTES.MENTS)
    }
  }

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetError()

    const localId = loginLocalId.trim()
    const password = loginPassword

    if (!localId || !password) {
      setError(t('auth.userIdAndPasswordRequired'))
      return
    }

    setIsLoading(true)
    try {
      const response = await postLogin({ localId, password })
      
      if (response.accessToken) {
        setAuthed(
          { 
            localId, 
            username: response.username || localId,
            userNum: response.userNum 
          }, 
          { 
            accessToken: response.accessToken,
            refreshToken: response.refreshToken 
          }
        )
        navigate(ROUTES.MENTS)
      } else {
        setError(t('auth.loginFailed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginRequestError'))
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetError()

    const localId = signupLocalId.trim()
    const email = signupEmail.trim()
    const username = signupUsername.trim()
    const password = signupPassword
    const confirm = signupPasswordConfirm

    if (!localId || !email || !username || !password || !confirm) {
      setError('모든 필드를 입력해 주세요.')
      return
    }

    if (localId.length < 3) {
      setError('아이디는 3자 이상이어야 합니다.')
      return
    }

    if (username.length < 2) {
      setError(t('auth.minCharacters', { count: 2 }))
      return
    }

    if (password.length < 6) {
      setError(t('auth.minCharacters', { count: 6 }))
      return
    }

    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setIsLoading(true)
    try {
      const registerRes = await postRegister({ 
        localId, 
        password, 
        nickname: username, 
        email 
      })
      
      if (registerRes.accessToken) {
        completeAuthAndGo(localId, registerRes)
      } else {
        // 회원가입은 성공했지만 토큰이 없는 경우 자동 로그인
        const loginRes = await postLogin({ localId, password })
        completeAuthAndGo(localId, loginRes)
      }
    } catch (e) {
      const error = e as AxiosError
      const errorMessage = error.response?.data as any
      const message = typeof errorMessage === 'string' ? errorMessage : errorMessage?.message
      
      switch (message) {
        case '이미 사용 중인 ID입니다.':
          setError(t('auth.alreadyExistUserId'))
          break
        case '이미 사용 중인 이메일입니다.':
          setError(t('auth.alreadyExistEmail'))
          break
        default:
          setError(message || t('auth.signupRequestError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-8">
        <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">{t('auth.login')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.loginDescription')}</p>

          {/* 탭 전환 */}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-pink-50 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login')
                resetError()
              }}
              className={cn(
                'h-11 rounded-2xl text-sm font-semibold',
                tab === 'login' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-600'
              )}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup')
                resetError()
              }}
              className={cn(
                'h-11 rounded-2xl text-sm font-semibold',
                tab === 'signup' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
              )}
            >
              {t('auth.signup')}
            </button>
          </div>

          {/* 로그인 폼 */}
          {tab === 'login' ? (
            <form onSubmit={onLoginSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.userId')}</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    value={loginLocalId}
                    onChange={(e) => setLoginLocalId(e.target.value)}
                    type="text"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder={t('auth.enterUserId')}
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.password')}</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    type="password"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder="••••••"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-2xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white',
                  isLoading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
                )}
              >
                {isLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {isLoading ? t('common.loading') : t('auth.login')}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500">{t('auth.or')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/auth/start')}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('auth.loginWithGoogle')}
              </button>
            </form>
          ) : (
            /* 회원가입 폼 */
            <form onSubmit={onSignupSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.userId')}</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    value={signupLocalId}
                    onChange={(e) => setSignupLocalId(e.target.value)}
                    type="text"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder="아이디 (3자 이상)"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.email')}</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder={t('auth.enterEmail')}
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.username')}</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    type="text"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder={t('auth.enterUsername')}
                    autoComplete="nickname"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.password')} (6자 이상)</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    type="password"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder="••••••"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">{t('auth.passwordConfirm')}</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    value={signupPasswordConfirm}
                    onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                    type="password"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder="••••••"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-2xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white',
                  isLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                )}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('auth.signup')} 중...
                  </>
                ) : (
                  t('auth.signup')
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
