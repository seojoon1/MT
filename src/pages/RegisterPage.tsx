// src/pages/RegisterPage.tsx (แก้ไข)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setAuthed } from '../storage/authStorage'
import { postRegister, postLogin } from '../services/api'
import { cn } from '../utils/cn'
import { ROUTES } from '../constants'
import { AxiosError } from 'axios'
import type { AuthResponse } from '../types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Form states
  const [localId, setLocalId] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Error reset function
  function resetError() {
    setError(null)
  }

  /**
   * 인증 성공 후 공통 처리 로직
   */
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

  /**
   * 회원가입 폼 제출 핸들러
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetError()

    // Validation
    const trimmedLocalId = localId.trim()
    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()

    if (!trimmedLocalId || !trimmedEmail || !trimmedUsername || !password || !passwordConfirm) {
      setError(t('auth.allFieldsRequired'))
      return
    }
    if (trimmedLocalId.length < 3) {
      setError(t('auth.userIdMinLength'))
      return
    }
    if (trimmedUsername.length < 2) {
      setError(t('auth.minCharacters', { count: 2 }))
      return
    }
    if (password.length < 6) {
      setError(t('auth.minCharacters', { count: 6 }))
      return
    }
    if (password !== passwordConfirm) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setIsLoading(true)
    try {
      // 1. Register API call
      const registerRes = await postRegister({ 
        localId: trimmedLocalId, 
        password, 
        nickname: trimmedUsername, 
        email: trimmedEmail 
      })
      
      if (registerRes.accessToken) {
        // Direct login if token exists
        completeAuthAndGo(trimmedLocalId, registerRes)
      } else {
        // 2. Login after successful registration
        const loginRes = await postLogin({ localId: trimmedLocalId, password })
        completeAuthAndGo(trimmedLocalId, loginRes)
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
            
          <h1 className="text-lg font-semibold text-slate-900">{t('auth.signup')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.signupDescription') || 'Create your account to start connecting'}</p>

          {/* Link to login page */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {t('auth.alreadyHaveAccount') || 'Already have an account? Login'}
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            {/* User ID */}
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">{t('auth.userId')}</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                <User className="h-5 w-5 text-slate-400" />
                <input
                  value={localId}
                  onChange={(e) => setLocalId(e.target.value)}
                  type="text"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                  placeholder="아이디 (3자 이상)"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </label>

            {/* Email */}
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">{t('auth.email')}</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                  placeholder={t('auth.enterEmail')}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </label>

            {/* Username */}
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">{t('auth.username')}</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                <User className="h-5 w-5 text-slate-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                  placeholder={t('auth.enterUsername')}
                  autoComplete="nickname"
                  disabled={isLoading}
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">{t('auth.password')} (6자 이상)</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                  placeholder="••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </label>

            {/* Password Confirm */}
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">{t('auth.passwordConfirm')}</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  type="password"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                  placeholder="••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </label>

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-500">{t('auth.or')}</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => navigate('/auth/start')}
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
              {t('auth.signupWithGoogle') || t('auth.loginWithGoogle')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}