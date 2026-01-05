import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Facebook, Mail, Lock, UserRound, LogIn } from 'lucide-react'
import { isAuthed, setAuthed } from '../storage/authStorage'
import { addUser, findUserByEmail, findUserByUsername, getUsers } from '../storage/usersStorage'

type TabKey = 'login' | 'signup'

type UsernameCheck = 'unknown' | 'invalid' | 'available' | 'taken'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function deriveUsernameFromEmail(email: string): string {
  const at = email.indexOf('@')
  const base = (at > 0 ? email.slice(0, at) : email).trim()
  return base || 'guest'
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [tab, setTab] = useState<TabKey>('login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupEmail, setSignupEmail] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')

  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>('unknown')

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthed()) {
      navigate('/planner', { replace: true })
    }
  }, [navigate])

  function goOAuth(provider: 'google' | 'facebook') {
    navigate(`/auth/${provider}`)
  }

  function resetError() {
    setError(null)
  }

  function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetError()

    const email = loginEmail.trim()
    const password = loginPassword

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    const existing = findUserByEmail(email)

    // 현재 방식 유지: 미가입(사용자 없음)인 경우 데모 용도로 그냥 통과
    if (!existing) {
      setAuthed({ email, username: deriveUsernameFromEmail(email) })
      navigate('/planner')
      return
    }

    if (existing.password !== password) {
      setError('비밀번호가 올바르지 않습니다.')
      return
    }

    setAuthed({ email: existing.email, username: existing.username })
    navigate('/planner')
  }

  function onSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetError()

    const email = signupEmail.trim()
    const username = signupUsername.trim()
    const password = signupPassword
    const confirm = signupPasswordConfirm

    if (!email || !username || !password || !confirm) {
      setError('모든 필드를 입력해 주세요.')
      return
    }

    if (username.length < 3) {
      setError('아이디는 3자 이상이어야 합니다.')
      return
    }

    if (usernameCheck !== 'available') {
      setError('아이디 중복확인을 완료해 주세요.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (password !== confirm) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    if (findUserByEmail(email)) {
      setError('이미 가입된 이메일입니다.')
      return
    }

    if (findUserByUsername(username)) {
      setError('이미 사용 중인 아이디입니다.')
      return
    }

    const created = addUser({ email, username, password })
    setAuthed({ email: created.email, username: created.username })
    navigate('/planner')
  }

  function runUsernameCheck() {
    resetError()
    const username = signupUsername.trim()
    if (username.length < 3) {
      setUsernameCheck('invalid')
      return
    }

    const taken = getUsers().some((u) => u.username.toLowerCase() === username.toLowerCase())
    setUsernameCheck(taken ? 'taken' : 'available')
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-8">
        <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">로그인</h1>
          <p className="mt-1 text-sm text-slate-500">플래너를 사용하려면 인증이 필요해요.</p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-pink-50 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login')
                resetError()
              }}
              className={cx(
                'h-11 rounded-2xl text-sm font-semibold',
                tab === 'login' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-600'
              )}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup')
                resetError()
              }}
              className={cx(
                'h-11 rounded-2xl text-sm font-semibold',
                tab === 'signup' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
              )}
            >
              회원가입
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={onLoginSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">이메일</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    type="email"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">비밀번호</span>
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
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 text-sm font-semibold text-white"
              >
                <LogIn className="h-5 w-5" />
                로그인
              </button>
            </form>
          ) : (
            <form onSubmit={onSignupSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">이메일</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <div>
                <span className="text-xs font-semibold text-slate-700">아이디</span>
                <div className="mt-2 flex gap-2">
                  <div className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3">
                    <UserRound className="h-5 w-5 text-slate-400" />
                    <input
                      value={signupUsername}
                      onChange={(e) => {
                        setSignupUsername(e.target.value)
                        setUsernameCheck('unknown')
                      }}
                      type="text"
                      className="h-full w-full bg-transparent text-sm text-slate-900 outline-none"
                      placeholder="닉네임"
                      autoComplete="username"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={runUsernameCheck}
                    className="h-12 shrink-0 rounded-2xl border border-pink-200 bg-white px-4 text-sm font-semibold text-slate-700"
                  >
                    중복확인
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {usernameCheck === 'unknown' && '아이디 중복확인을 진행해 주세요.'}
                  {usernameCheck === 'invalid' && '아이디는 3자 이상이어야 합니다.'}
                  {usernameCheck === 'available' && '사용 가능한 아이디입니다.'}
                  {usernameCheck === 'taken' && '이미 사용 중인 아이디입니다.'}
                </p>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">비밀번호 (6자 이상)</span>
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
                <span className="text-xs font-semibold text-slate-700">비밀번호 확인</span>
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
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-purple-600 text-sm font-semibold text-white"
              >
                회원가입
              </button>
            </form>
          )}

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-pink-100" />
              <span className="text-xs font-semibold text-slate-500">소셜 로그인</span>
              <div className="h-px flex-1 bg-pink-100" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => goOAuth('google')}
                className="h-12 rounded-2xl border border-pink-200 bg-white text-sm font-semibold text-slate-700"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => goOAuth('facebook')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white text-sm font-semibold text-slate-700"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
