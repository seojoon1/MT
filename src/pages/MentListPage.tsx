import { Check, Heart, Plus, Settings, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag } from '../i18n/tagTranslations'
import type { Ment, MentStatus, BookmarkItem } from '../types'
import { cn } from '../utils/cn'
import { SettingsModal } from '../components/modals'
import { getMentList, approveMent, rejectMent, getPendingMents, addBookmark, deleteBookmark, getMyBookmarks } from '../services/api'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'
import { STORAGE_KEYS } from '../constants'

export default function MentListPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)

  const [isAdmin, setIsAdminState] = useState<boolean>(false)
  const [selectedTag, setSelectedTag] = useState<string>('__all__') // 내부 키로 저장
  const [ments, setMentsState] = useState<Ment[]>([])
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.app.favorites)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [hasAdminPermission, setHasAdminPermission] = useState<boolean>(false)

  // 어드민 권한 체크
  useEffect(() => {
    const adminStatus = checkIsAdmin()
    setHasAdminPermission(adminStatus)
    setIsAdminState(adminStatus)
  }, [])

  // 라오스어 JSON 파싱 함수
  function parseLaoText(contentLo: string): string {
    if (!contentLo) return ''
    try {
      const parsed = JSON.parse(contentLo)
      return parsed.번역 || parsed.translation || contentLo
    } catch {
      return contentLo
    }
  }

  // API에서 멘트 목록과 북마크 리스트 불러오기
  useEffect(() => {
    const fetchMentsAndBookmarks = async () => {
      setLoading(true)
      setError(null)
      try {
        // 멘트 목록 호출
        const mentData = isAdmin ? await getPendingMents() : await getMentList()
        
        // API 응답을 로컬 Ment 타입으로 변환
        const convertedMents: Ment[] = mentData.map((item: any) => ({
          id: String(item.mentId),
          ko: item.contentKo,
          lo: parseLaoText(item.contentLo || ''),
          tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [],
          aiHint: '',
          status: (item.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
          createdAt: new Date(item.createdAt).getTime()
        }))
        setMentsState(convertedMents)
        
        // 어드민이 아닐 때만 북마크 리스트 불러오기
        if (!isAdmin) {
          try {
            const bookmarkData = await getMyBookmarks()
            console.log('📌 북마크 API 응답:', bookmarkData)
            
            // 북마크 리스트를 mentNum 기준으로 변환하고 로컬 스토리지에 동기화
            const bookmarkIds = bookmarkData.map((item: BookmarkItem) => {
              return String(item.mentNum)
            })
            console.log('📌 변환된 북마크 IDs:', bookmarkIds)
            
            setBookmarks(bookmarkIds)
            
            // 로컬 스토리지에 북마크 리스트 저장
            localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(bookmarkIds))
          } catch (bookmarkErr) {
            console.error('북마크 목록 불러오기 실패:', bookmarkErr)
            // 북마크 로딩 실패는 치명적이지 않으므로 에러 표시하지 않음
          }
        }
      } catch (err) {
        console.error('멘트 목록 불러오기 실패:', err)
        setError(err instanceof Error ? err.message : '멘트를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMentsAndBookmarks()
  }, [isAdmin])

  const availableTags = useMemo(() => {
    const pool = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    const set = new Set<string>()
    for (const m of pool) for (const t of m.tags) set.add(t)
    const tags = Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
    console.log('📋 Available tags:', tags)
    return tags
  }, [isAdmin, ments])

  const normalizedSelectedTag =
    selectedTag === '__all__' || selectedTag === '__bookmarks__' || availableTags.includes(selectedTag) ? selectedTag : '__all__'

  console.log('🎯 Current selection:', { 
    selectedTag, 
    normalizedSelectedTag, 
    availableTagsCount: availableTags.length,
    isMatch: availableTags.includes(selectedTag)
  })

  const filteredMents = useMemo(() => {
    const base = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    if (normalizedSelectedTag === '__all__') return base
    if (normalizedSelectedTag === '__bookmarks__') {
      return base.filter((m) => bookmarks.includes(m.id))
    }
    const filtered = base.filter((m) => m.tags.includes(normalizedSelectedTag))
    console.log('✅ Filtered:', { normalizedSelectedTag, count: filtered.length, total: base.length })
    return filtered
  }, [isAdmin, ments, normalizedSelectedTag, bookmarks, t])

  // 북마크 토글 - API 연동
  async function handleToggleBookmark(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    
    // localStorage에서 현재 북마크 목록 읽기
    const currentBookmarks = (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.app.favorites)
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    })()
    
    const isBookmarked = currentBookmarks.includes(id)
    
    try {
      const mentId = Number(id)
      if (isNaN(mentId)) {
        setError('잘못된 멘트 ID입니다.')
        return
      }
      
      if (isBookmarked) {
        // 북마크 삭제
        await deleteBookmark(mentId)
        const newBookmarks = currentBookmarks.filter((bid: string) => bid !== id)
        localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(newBookmarks))
        setBookmarks(newBookmarks)
      } else {
        // 북마크 추가
        await addBookmark(mentId)
        const newBookmarks = [...currentBookmarks, id]
        localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(newBookmarks))
        setBookmarks(newBookmarks)
      }
      
      setError(null)
    } catch (err) {
      console.error(isBookmarked ? '북마크 삭제 실패:' : '북마크 추가 실패:', err)
      setError(err instanceof Error ? err.message : isBookmarked ? '북마크 삭제 실패' : '북마크 추가 실패')
    }
  }

  async function handleApprove(e: React.MouseEvent, id: string, mentId: number) {
    e.stopPropagation()
    setProcessingId(id)
    try {
      await approveMent(mentId)
      // API 재조회로 상태 동기화
      const data = isAdmin ? await getPendingMents() : await getMentList()
      const convertedMents: Ment[] = data.map((item: any) => ({
        id: String(item.mentId),
        ko: item.contentKo,
        lo: parseLaoText(item.contentLo || ''),
        tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [],
        aiHint: '',
        status: (item.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
        createdAt: new Date(item.createdAt).getTime()
      }))
      setMentsState(convertedMents)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '승인 실패')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (rejectingId === id) {
      // 토글 - 닫기
      setRejectingId(null)
      setRejectReason((prev) => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    } else {
      // 토글 - 열기
      setRejectingId(id)
    }
  }

  async function handleRejectConfirm(e: React.MouseEvent, id: string, mentId: number) {
    e.stopPropagation()

    setProcessingId(id)
    try {
      await rejectMent(mentId)
      // API 재조회로 상태 동기화
      const data = isAdmin ? await getPendingMents() : await getMentList()
      const convertedMents: Ment[] = data.map((item: any) => ({
        id: String(item.mentId),
        ko: item.contentKo,
        lo: parseLaoText(item.contentLo || ''),
        tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [],
        aiHint: '',
        status: (item.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
        createdAt: new Date(item.createdAt).getTime()
      }))
      setMentsState(convertedMents)
      setRejectingId(null)
      setRejectReason((prev) => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '거절 실패')
    } finally {
      setProcessingId(null)
    }
  }

  function handleRejectReasonChange(id: string, value: string) {
    setRejectReason((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex h-full max-w-[480px] flex-col">
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">{t('common.appName')}</h1>
              <p className="text-xs text-slate-500">
                {isAdmin ? t('ment.adminMode') : t('ment.userMode')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-pink-200 bg-white text-slate-700"
                aria-label="설정"
              >
                <Settings className="h-5 w-5" />
              </button>

              {hasAdminPermission && (
                <button
                  type="button"
                  onClick={() => setIsAdminState((v) => !v)}
                  className={cn(
                    'h-10 w-10 rounded-xl border flex items-center justify-center text-xs font-bold',
                    isAdmin
                      ? 'border-purple-300 bg-purple-600 text-white'
                      : 'border-pink-300 bg-pink-50 text-pink-700'
                  )}
                  aria-label={isAdmin ? '어드민 모드' : '유저 모드'}
                >
                  {isAdmin ? 'A' : 'U'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedTag('__all__')}
                className={cn(
                  'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                  normalizedSelectedTag === '__all__'
                    ? 'border-purple-200 bg-purple-600 text-white'
                    : 'border-pink-200 bg-white text-slate-700'
                )}
              >
                {t('ment.all')}
              </button>
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setSelectedTag('__bookmarks__')}
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium',
                    normalizedSelectedTag === '__bookmarks__'
                      ? 'border-pink-600 bg-pink-600 text-white'
                      : 'border-pink-200 bg-white text-slate-700'
                  )}
                >
                  <Heart className={cn('h-4 w-4', normalizedSelectedTag === '__bookmarks__' && 'fill-white')} />
                  {t('ment.bookmarks')}
                </button>
              )}
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                    normalizedSelectedTag === tag
                      ? 'border-purple-200 bg-purple-600 text-white'
                      : 'border-pink-200 bg-white text-slate-700'
                  )}
                >
                  #{translateTag(tag, i18n.language as 'ko' | 'lo')}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {loading ? (
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm text-center">
              {t('ment.loadingMents')}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          ) : filteredMents.length === 0 ? (
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
              {t('ment.noMents')}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMents.map((m) => {
                const isPending = m.status === 'pending'
                const isRejected = m.status === 'rejected'
                const isApproved = m.status === 'approved'
                const isBookmarked = bookmarks.includes(m.id)

                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isAdmin && navigate(`/ments/${m.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') !isAdmin && navigate(`/ments/${m.id}`)
                    }}
                    className={cn(
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
                              #{translateTag(t, i18n.language as 'ko' | 'lo')}
                            </span>
                          ))}

                          {isAdmin && (
                            <span
                              className={cn(
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

                      {!isAdmin && (
                        <button
                          type="button"
                          aria-label="북마크"
                          onClick={(e) => handleToggleBookmark(e, m.id)}
                          className={cn(
                            'inline-flex h-11 w-11 items-center justify-center rounded-xl border',
                            isBookmarked
                              ? 'border-pink-200 bg-pink-50 text-pink-600'
                              : 'border-pink-200 bg-white text-slate-500'
                          )}
                        >
                          <Heart className={cn('h-5 w-5', isBookmarked && 'fill-pink-600')} />
                        </button>
                      )}
                    </div>

                    {isAdmin && isPending && (
                      <>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleApprove(e, m.id, Number(m.id))}
                            disabled={processingId === m.id}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            <Check className="h-5 w-5" />
                            {processingId === m.id ? t('common.loading') : t('ment.approve')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleReject(e, m.id)}
                            disabled={processingId !== null}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-5 w-5" />
                            {rejectingId === m.id ? t('common.cancel') : t('ment.reject')}
                          </button>
                        </div>

                        {rejectingId === m.id && (
                          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-slate-700">
                              {t('ment.rejectReason')}
                            </label>
                            <textarea
                              value={rejectReason[m.id] || ''}
                              onChange={(e) => handleRejectReasonChange(m.id, e.target.value)}
                              placeholder={t('ment.enterRejectReason')}
                              className="w-full px-3 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                              rows={3}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type="button"
                              onClick={(e) => handleRejectConfirm(e, m.id, Number(m.id))}
                              disabled={processingId === m.id || !rejectReason[m.id]?.trim()}
                              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-600 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {processingId === m.id ? t('common.loading') : t('ment.confirmReject')}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}        </main>      </div>

      {!isAdmin && (
        <button
          type="button"
          onClick={() => navigate('/ments/new')}
          className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700 active:scale-95 transition-transform"
          style={{ maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}
          aria-label="멘트 추가"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
