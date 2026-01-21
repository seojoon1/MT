// src/pages/LoginPage.tsx (แก้ไขแล้ว)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, LogIn, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setAuthed } from '../storage/authStorage'
import { postLogin } from '../services/api'
import { cn } from '../utils/cn'
import { ROUTES } from '../constants'
import type { AuthResponse } from '../types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Login form states
  const [localId, setLocalId] = useState('')
  const [password, setPassword] = useState('')
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
   * 로그인 폼 제출 핸들러
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetError()

    const trimmedLocalId = localId.trim()

    if (!trimmedLocalId || !password) {
      setError(t('auth.userIdAndPasswordRequired'))
      return
    }

    setIsLoading(true)
    try {
      const response = await postLogin({ localId: trimmedLocalId, password })
      
      if (response.accessToken) {
        completeAuthAndGo(trimmedLocalId, response)
      } else {
        setError(t('auth.loginFailed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginRequestError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Background Pattern */}
      {/* <div className="absolute inset-0 bg-[url('../public/bg.png')] opacity-30"></div> */}
      
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 pb-8 pt-16">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {t('common.appName')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('auth.loginDescription')}
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-pink-100/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('auth.login')}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {t('auth.loginDescription')}
            </p>
          </div>

          {/* Signup Link */}
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              {t('auth.dontHaveAccount') || "Don't have an account? Sign up"}
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* User ID */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('auth.userId')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={localId}
                  onChange={(e) => setLocalId(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-pink-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all"
                  placeholder={t('auth.enterUserId')}
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl border border-pink-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-fade-in rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full rounded-xl py-3.5 font-semibold text-white transition-all duration-300',
                isLoading 
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:shadow-lg active:scale-95'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>{t('auth.login')}</span>
                  </>
                )}
              </div>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/80 px-3 text-xs text-gray-500 backdrop-blur-sm">
                  {t('auth.or')}
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => navigate('/auth/start')}
              disabled={isLoading}
              className="group w-full rounded-xl border border-gray-300 bg-white py-3.5 font-medium text-gray-700 transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-3">
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
                <span>{t('auth.loginWithGoogle')}</span>
              </div>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 {t('common.appName')}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
      `}</style>
    </div>
  )
}