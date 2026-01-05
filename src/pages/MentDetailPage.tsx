import { ChevronLeft, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getIsAdmin, getMentById } from '../storage/mentStorage'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function MentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isAdmin = useMemo(() => getIsAdmin(), [])

  const ment = useMemo(() => {
    if (!id) return null
    return getMentById(id)
  }, [id])

  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    return () => {
      // cleanup no-op (timeout is short and stateful)
    }
  }, [])

  if (!ment) {
    return (
      <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="mx-auto flex h-full max-w-[480px] flex-col">
          <header className="sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 py-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Link
                to="/ments"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-pink-200 bg-white"
              >
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </Link>
              <h1 className="text-base font-semibold text-slate-900">멘트 상세</h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
              멘트를 찾을 수 없어요.
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!isAdmin && ment.status !== 'approved') {
    return (
      <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="mx-auto flex h-full max-w-[480px] flex-col">
          <header className="sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 py-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Link
                to="/ments"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-pink-200 bg-white"
              >
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </Link>
              <h1 className="text-base font-semibold text-slate-900">멘트 상세</h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
              승인 대기 중인 멘트예요. 관리자 승인 후 노출됩니다.
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex h-full max-w-[480px] flex-col">
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                to="/ments"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-pink-200 bg-white"
              >
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </Link>
              <h1 className="text-base font-semibold text-slate-900">멘트 상세</h1>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isPlaying) return
                setIsPlaying(true)
                window.setTimeout(() => setIsPlaying(false), 1500)
              }}
              className={cx(
                'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold shadow-sm',
                isPlaying ? 'bg-purple-600 text-white' : 'bg-white text-slate-700',
                'border border-pink-200'
              )}
            >
              {isPlaying ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                  재생 중...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  듣기
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-pink-50 p-4">
                <p className="text-xs font-semibold text-pink-700">한국어</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{ment.ko}</p>
              </div>
              <div className="rounded-2xl bg-purple-50 p-4">
                <p className="text-xs font-semibold text-purple-700">라오어</p>
                <p className="mt-2 text-base font-medium text-slate-800">{ment.lo}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ment.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700"
                >
                  #{t}
                </span>
              ))}
              {isAdmin && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  status: {ment.status}
                </span>
              )}
            </div>
          </div>

          {/* <div className="mt-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-purple-700">AI 한 줄 설명</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{ment.aiHint}</p>
          </div> */}
        </main>
      </div>
    </div>
  )
}
