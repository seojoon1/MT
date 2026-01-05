import { Check, Heart, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Ment } from '../types/ment'
import { getIsAdmin, getMents, setIsAdmin, updateMentStatus } from '../storage/mentStorage'
import { getBookmarks, toggleBookmark } from '../storage/bookmarksStorage'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function MentListPage() {
  const navigate = useNavigate()

  const [isAdmin, setIsAdminState] = useState<boolean>(() => getIsAdmin())
  const [selectedTag, setSelectedTag] = useState<string>('전체')
  const [onlyBookmarks, setOnlyBookmarks] = useState(false)
  const [ments, setMentsState] = useState<Ment[]>(() => getMents())
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks())

  useEffect(() => {
    setIsAdmin(isAdmin)
  }, [isAdmin])

  const availableTags = useMemo(() => {
    const pool = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    const set = new Set<string>()
    for (const m of pool) for (const t of m.tags) set.add(t)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [isAdmin, ments])

  const normalizedSelectedTag =
    selectedTag === '전체' || availableTags.includes(selectedTag) ? selectedTag : '전체'

  const visibleMents = useMemo(() => {
    const base = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    const base2 = onlyBookmarks ? base.filter((m) => bookmarks.includes(m.id)) : base
    if (normalizedSelectedTag === '전체') return base2
    return base2.filter((m) => m.tags.includes(normalizedSelectedTag))
  }, [bookmarks, isAdmin, ments, normalizedSelectedTag, onlyBookmarks])

  function handleToggleBookmark(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const next = toggleBookmark(id)
    setBookmarks(next)
  }

  function handleApprove(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const next = updateMentStatus(id, 'approved')
    setMentsState(next)
  }

  function handleReject(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const next = updateMentStatus(id, 'rejected')
    setMentsState(next)
  }

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex h-full max-w-[480px] flex-col">
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">학과별 플러팅 멘트</h1>
              <p className="text-xs text-slate-500">
                {isAdmin ? '관리자 모드: 전체/승인/대기/거절 표시' : '사용자 모드: 승인된 멘트만 표시'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdminState((v) => !v)}
                className={cx(
                  'h-11 rounded-xl border px-3 text-sm font-medium',
                  isAdmin
                    ? 'border-purple-200 bg-purple-600 text-white'
                    : 'border-pink-200 bg-white text-slate-700'
                )}
              >
                {isAdmin ? 'Admin' : 'User'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/ments/new')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-pink-600 px-3 text-sm font-semibold text-white shadow-sm"
              >
                <Plus className="h-5 w-5" />
                추가
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setOnlyBookmarks((v) => !v)}
                className={cx(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium',
                  onlyBookmarks
                    ? 'border-pink-200 bg-pink-600 text-white'
                    : 'border-pink-200 bg-white text-slate-700'
                )}
              >
                <Heart className={cx('h-4 w-4', onlyBookmarks && 'fill-white')} />
                즐겨찾기
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('전체')}
                className={cx(
                  'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                  normalizedSelectedTag === '전체'
                    ? 'border-pink-200 bg-pink-600 text-white'
                    : 'border-pink-200 bg-white text-slate-700'
                )}
              >
                전체
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={cx(
                    'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                    normalizedSelectedTag === tag
                      ? 'border-purple-200 bg-purple-600 text-white'
                      : 'border-pink-200 bg-white text-slate-700'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {visibleMents.length === 0 ? (
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
              표시할 멘트가 없어요.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleMents.map((m) => {
                const isPending = m.status === 'pending'
                const isRejected = m.status === 'rejected'
                const isApproved = m.status === 'approved'
                const isBookmarked = bookmarks.includes(m.id)

                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/ments/${m.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') navigate(`/ments/${m.id}`)
                    }}
                    className={cx(
                      'rounded-2xl border bg-white p-4 shadow-sm',
                      'border-pink-100',
                      isRejected && 'opacity-80'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{m.ko}</p>
                        <p className="mt-1 text-sm text-slate-500">{m.lo}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700"
                            >
                              #{t}
                            </span>
                          ))}

                          {isAdmin && (
                            <span
                              className={cx(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                isApproved && 'bg-green-50 text-green-700',
                                isPending && 'bg-purple-50 text-purple-700',
                                isRejected && 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {m.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label="즐겨찾기"
                        onClick={(e) => handleToggleBookmark(e, m.id)}
                        className={cx(
                          'inline-flex h-11 w-11 items-center justify-center rounded-xl border',
                          isBookmarked
                            ? 'border-pink-200 bg-pink-50 text-pink-600'
                            : 'border-pink-200 bg-white text-slate-500'
                        )}
                      >
                        <Heart className={cx('h-5 w-5', isBookmarked && 'fill-pink-600')} />
                      </button>
                    </div>

                    {isAdmin && isPending && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleApprove(e, m.id)}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white"
                        >
                          <Check className="h-5 w-5" />
                          승인
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleReject(e, m.id)}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-slate-700"
                        >
                          <Trash2 className="h-5 w-5" />
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
