import { ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEFAULT_DEPARTMENT_TAGS, createMent, getIsAdmin } from '../storage/mentStorage'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function MentEditorPage() {
  const navigate = useNavigate()
  const isAdmin = useMemo(() => getIsAdmin(), [])

  const [ko, setKo] = useState('')
  const [lo, setLo] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function validate(): string | null {
    if (ko.trim().length === 0) return '한국어 멘트를 입력해 주세요.'
    if (lo.trim().length === 0) return '라오어 번역을 입력해 주세요.'
    if (tags.length === 0) return '학과(태그)를 최소 1개 이상 선택해 주세요.'
    if (ko.trim().length < 4) return '한국어 멘트가 너무 짧아요.'
    if (lo.trim().length < 4) return '라오어 번역이 너무 짧아요.'
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    setIsReviewing(true)
    window.setTimeout(() => {
      const msg = validate()
      if (msg) {
        setIsReviewing(false)
        setError(msg)
        return
      }

      createMent({
        ko: ko.trim(),
        lo: lo.trim(),
        tags,
        aiHint: 'AI 컨셉 검토 후 승인되면 목록에 노출돼요.',
      })

      setIsReviewing(false)
      navigate('/ments')
    }, 1000)
  }

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
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900">멘트 추가</h1>
              <p className="text-xs text-slate-500">
                저장하면 <span className="font-semibold">pending</span>으로 등록됩니다.
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
              <label className="block text-xs font-semibold text-slate-700">한국어 멘트 (필수)</label>
              <textarea
                value={ko}
                onChange={(e) => setKo(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-pink-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-pink-400"
                placeholder="예) 오늘은 너랑 같이 걷고 싶어"
              />
            </div>

            <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
              <label className="block text-xs font-semibold text-slate-700">라오어 번역 (필수)</label>
              <textarea
                value={lo}
                onChange={(e) => setLo(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-pink-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-pink-400"
                placeholder="예) ..."
              />
            </div>

            <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-700">학과 선택 (필수, 최소 1개)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEFAULT_DEPARTMENT_TAGS.map((t) => {
                  const selected = tags.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cx(
                        'h-11 rounded-full border px-4 text-sm font-medium',
                        selected
                          ? 'border-purple-200 bg-purple-600 text-white'
                          : 'border-pink-200 bg-white text-slate-700'
                      )}
                    >
                      #{t}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm text-pink-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isReviewing}
              className={cx(
                'inline-flex h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold shadow-sm',
                isReviewing ? 'bg-purple-600 text-white' : 'bg-pink-600 text-white',
                'disabled:opacity-80'
              )}
            >
              {isReviewing ? 'AI 컨셉 검토 중...' : '저장'}
            </button>

            {!isAdmin && (
              <p className="text-center text-xs text-slate-500">
                사용자 모드에서는 <span className="font-semibold">승인(approved)</span>된 멘트만 목록에 보여요.
              </p>
            )}
          </form>
        </main>
      </div>
    </div>
  )
}
