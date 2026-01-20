import { Check, Heart, Plus, Settings, Trash2, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag } from '../i18n/tagTranslations'
import type { Ment, MentStatus, BookmarkItem, MentItem } from '../types'
import { cn } from '../utils/cn'
import { SettingsModal } from '../components/modals'
import { getMentList, approveMent, rejectMent, getPendingMents, addBookmark, deleteBookmark, getMyBookmarks } from '../services/api'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'
import { STORAGE_KEYS } from '../constants'


/**
 * @description
 * 애플리케이션의 메인 페이지로, '멘트(Ment)' 목록을 보여주는 대시보드 역할을 합니다.
 * 이 컴포넌트는 사용자의 권한(일반 사용자/관리자)에 따라 두 가지 모드로 동작합니다.
 *
 * - **사용자 모드**: 승인된 멘트 목록을 보여주며, 북마크 추가/삭제, 멘트 상세 보기, 새 멘트 추가 등의 기능을 제공합니다.
 * - **관리자 모드**: 승인 대기 중인 멘트 목록을 보여주며, 각 멘트를 승인하거나 거절하는 기능을 제공합니다.
 */
export default function MentListPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)

  // --- 상태 관리 ---
  const [isAdmin, setIsAdminState] = useState<boolean>(false) // 현재 UI 모드 (관리자/사용자)
  const [originalIsAdmin, setOriginalIsAdmin] = useState<boolean>(false) // 실제 사용자의 고유 권한
  const [selectedTag, setSelectedTag] = useState<string>('__all__') // 선택된 태그 필터
  const [ments, setMentsState] = useState<Ment[]>([]) // API로부터 받아온 전체 멘트 목록
  const [bookmarks, setBookmarks] = useState<string[]>([]) // 북마크된 멘트 ID 목록
  const [loading, setLoading] = useState(false) // 데이터 로딩 상태
  const [error, setError] = useState<string | null>(null) // 에러 메시지
  const [processingId, setProcessingId] = useState<string | null>(null) // 관리자 승인/거절 처리 중인 멘트 ID

  // 컴포넌트 마운트 시 사용자의 실제 관리자 권한을 확인하여 상태에 저장
  useEffect(() => {
    const adminStatus = checkIsAdmin()
    setIsAdminState(adminStatus) // 초기 UI 모드를 실제 권한과 일치시킴
    setOriginalIsAdmin(adminStatus)
  }, [])

  // 백엔드에서 받은 JSON 문자열 형식의 라오스어 번역을 파싱하는 함수
  function parseLaoText(contentLo: string): string {
    if (!contentLo) return ''
    try {
      const parsed = JSON.parse(contentLo)
      
      // 다양한 key 값에 대응 (번역, translation)
      return  parsed.message || parsed.번역 || parsed.translation || contentLo
    } catch {
      // 파싱 실패 시 원본 문자열 반환
      return contentLo
    }
  }

  // --- 데이터 로딩 ---
  // `isAdmin` 상태가 변경될 때마다(모드 전환 시) 적절한 멘트와 북마크 목록을 불러옵니다.
  useEffect(() => {
    const fetchMentsAndBookmarks = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. 멘트 목록 호출: 관리자 모드 여부에 따라 다른 API를 호출
        const mentData = isAdmin ? await getPendingMents() : await getMentList()
        
        // 2. API 응답 데이터를 프론트엔드 `Ment` 타입으로 변환
        const convertedMents: Ment[] = mentData.map((item: MentItem) => ({
          id: String(item.mentId),
          ko: item.contentKo,
          lo: parseLaoText(item.contentLo || ''),
          authorNickname: item.authorNickname || '',
          tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [],
          aiHint: '',
          status: (item.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
          createdAt: new Date(item.createdAt).getTime()
        }))
        setMentsState(convertedMents)
        
        // 3. 북마크 목록 호출: 사용자 모드일 때만 실행
        if (!isAdmin) {
          try {
            const bookmarkData = await getMyBookmarks()
            const bookmarkIds = bookmarkData.map((item: BookmarkItem) => String((item as any).mentNum ?? (item as any).mentId)).filter(id => id && id !== 'undefined');
            setBookmarks(bookmarkIds)
            // 빠른 접근을 위해 localStorage에도 캐싱
            localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(bookmarkIds))
          } catch (bookmarkErr) {
            console.error('북마크 목록 불러오기 실패:', bookmarkErr)
            // 북마크 로딩 실패는 전체 페이지를 막을 정도의 치명적 오류는 아니므로, 에러를 표시하지 않고 넘어감
          }
        }
      } catch (err) {
        console.error('멘트 로딩 실패:', err)
        setError(err instanceof Error ? err.message : t('ment.loadingMentsFailed'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchMentsAndBookmarks()
  }, [isAdmin, t]) // `isAdmin` 상태가 바뀔 때마다 다시 실행

  // --- 필터링 로직 (Memoization) ---
  // 현재 멘트 목록에서 중복을 제거한 전체 태그 목록을 계산합니다.
  // `ments`나 `isAdmin` 상태가 바뀔 때만 재계산하여 성능을 최적화합니다.
  const availableTags = useMemo(() => {
    const pool = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    const tagSet = new Set<string>()
    for (const m of pool) for (const t of m.tags) tagSet.add(t)
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [isAdmin, ments])

  // 현재 선택된 태그에 따라 보여줄 멘트 목록을 필터링합니다.
  // `ments`, `selectedTag`, `bookmarks` 등이 변경될 때만 재계산됩니다.
  const filteredMents = useMemo(() => {
    const base = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    if (selectedTag === '__all__') return base
    if (selectedTag === '__bookmarks__') {
      return base.filter((m) => bookmarks.includes(m.id))
    }
    return base.filter((m) => m.tags.includes(selectedTag))
  }, [isAdmin, ments, selectedTag, bookmarks])

  
  // --- 사용자 상호작용 핸들러 ---

  /**
   * 북마크 버튼 클릭 시 실행되는 핸들러.
   * API 호출 후, 목록을 다시 불러오는 대신 클라이언트 상태(state, localStorage)를 직접 수정하여
   * 즉각적인 UI 피드백을 제공합니다 (Optimistic Update와 유사).
   */
  async function handleToggleBookmark(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const isBookmarked = bookmarks.includes(id)
    const mentId = Number(id)
    if (isNaN(mentId)) {
      setError(t('ment.invalidMentId'));
      return;
    }

    // 새로운 북마크 목록을 미리 계산
    const newBookmarks = isBookmarked ? bookmarks.filter(bId => bId !== id) : [...bookmarks, id];
    
    try {
      // API 호출
      if (isBookmarked) {
        await deleteBookmark(mentId)
      } else {
        await addBookmark(mentId)
      }
      
      // API 호출 성공 시, 상태와 localStorage 업데이트
      setBookmarks(newBookmarks)
      localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(newBookmarks))
      setError(null)
    } catch (err) {
      console.error(isBookmarked ? '북마크 삭제 실패:' : '북마크 추가 실패:', err)
      setError(err instanceof Error ? err.message : isBookmarked ? t('ment.bookmarkRemoveFailed') : t('ment.bookmarkAddFailed'))
    }
  }

  /**
   * (관리자) 승인/거절 후 멘트 목록을 다시 불러와 상태를 갱신하는 공통 함수
   */
  async function refetchAdminMents() {
    const data = await getPendingMents();
    const convertedMents: Ment[] = data.map((item: MentItem) => ({
      id: String(item.mentId), 
      ko: item.contentKo, 
      lo: parseLaoText(item.contentLo || ''),
      authorNickname: item.authorNickname || '',
      tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [], 
      aiHint: '',
      status: (item.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
      createdAt: new Date(item.createdAt).getTime()
    }));
    setMentsState(convertedMents);
    setError(null);
  }

  /**
   * (관리자) 멘트 승인 시 실행되는 핸들러.
   */
  async function handleApprove(e: React.MouseEvent, id: string, mentId: number) {
    e.stopPropagation()
    setProcessingId(id)
    try {
      await approveMent(mentId)
      await refetchAdminMents() // 중복 로직을 함수로 대체
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.approveFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  /**
   * (관리자) 멘트 거절 시 실행되는 핸들러.
   */
  async function handleRejectConfirm(e: React.MouseEvent, id: string, mentId: number) {
    e.stopPropagation()
    setProcessingId(id)
    try {
      await rejectMent(mentId)
      await refetchAdminMents() // 중복 로직을 함수로 대체
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.rejectFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  // --- 렌더링 ---
  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="mx-auto flex h-full max-w-[480px] flex-col">
        {/* 헤더: 앱 이름, 설정 버튼, 관리자/사용자 모드 토글 버튼 */}
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-gradient-to-b from-pink-50/90 to-purple-50/70 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">{t('common.appName')}</h1>
              <p className="text-xs text-slate-500">{isAdmin ? t('ment.adminMode') : t('ment.userMode')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowSettings(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-pink-200 bg-white text-slate-700" aria-label="설정">
                <Settings className="h-5 w-5" />
              </button>
              {originalIsAdmin && (
                <button type="button" onClick={() => setIsAdminState((v) => !v)} className={cn('h-10 w-10 rounded-xl border flex items-center justify-center text-xs font-bold', isAdmin ? 'border-purple-300 bg-purple-600 text-white' : 'border-pink-300 bg-pink-50 text-pink-700')} aria-label={isAdmin ? '어드민 모드' : '유저 모드'}>
                  {isAdmin ? 'A' : 'U'}
                </button>
              )}
            </div>
          </div>
          {/* 태그 필터링 UI */}
          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setSelectedTag('__all__')} className={cn('h-10 shrink-0 rounded-full border px-4 text-sm font-medium', selectedTag === '__all__' ? 'border-purple-200 bg-purple-600 text-white' : 'border-pink-200 bg-white text-slate-700')}>
                {t('ment.all')}
              </button>
              {!isAdmin && (
                <button type="button" onClick={() => setSelectedTag('__bookmarks__')} className={cn('flex h-10 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium', selectedTag === '__bookmarks__' ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-200 bg-white text-slate-700')}>
                  <Heart className={cn('h-4 w-4', selectedTag === '__bookmarks__' && 'fill-white')} />
                  {t('ment.bookmarks')}
                </button>
              )}
              {availableTags.map((tag) => (
                <button key={tag} type="button" onClick={() => setSelectedTag(tag)} className={cn('h-10 shrink-0 rounded-full border px-4 text-sm font-medium', selectedTag === tag ? 'border-purple-200 bg-purple-600 text-white' : 'border-pink-200 bg-white text-slate-700')}>
                  #{translateTag(tag, i18n.language as 'ko' | 'lo')}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠: 멘트 목록 */}
        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {loading ? (
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm text-center">{t('ment.loadingMents')}</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">{error}</div>
          ) : filteredMents.length === 0 ? (
            <div className="rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-600 shadow-sm">{t('ment.noMents')}</div>
          ) : (
            <div className="space-y-3">
              {filteredMents.map((m) => {
                const isPending = m.status === 'pending'
                const isBookmarked = bookmarks.includes(m.id)
                return (
                  <div key={m.id} role="button" tabIndex={0} onClick={() => !isAdmin && navigate(`/ments/${m.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') !isAdmin && navigate(`/ments/${m.id}`) }} className={cn('relative rounded-2xl border bg-white p-4 shadow-sm', 'border-pink-100')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{m.ko}</p>
                        <p className="mt-1 text-sm text-slate-500">{m.lo}</p>
                        {m.authorNickname && (
                          <p className="mt-2 text-xs text-slate-400">@{m.authorNickname}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.tags.map((t) => (
                            <span key={t} className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
                              #{translateTag(t, i18n.language as 'ko' | 'lo')}
                              
                            </span>
                          ))}
                          {isAdmin && (
                            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', m.status === 'approved' && 'bg-green-50 text-green-700', isPending && 'bg-purple-50 text-purple-700', m.status === 'rejected' && 'bg-slate-100 text-slate-600')}>
                              {m.status}
                            </span>
                          )}
                        </div>
                      </div>
                      {!isAdmin && (
                        <button type="button" aria-label="북마크" onClick={(e) => handleToggleBookmark(e, m.id)} className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl border', isBookmarked ? 'border-pink-200 bg-pink-50 text-pink-600' : 'border-pink-200 bg-white text-slate-500')}>
                          <Heart className={cn('h-5 w-5', isBookmarked && 'fill-pink-600')} />
                        </button>
                      )}
                    </div>
                    {/* 관리자 모드이고, 멘트가 'pending' 상태일 때만 승인/거절 버튼 표시 */}
                    {isAdmin && isPending && (
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={(e) => handleApprove(e, m.id, Number(m.id))} disabled={processingId === m.id} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white disabled:opacity-50">
                          <Check className="h-5 w-5" />
                          {processingId === m.id ? t('common.loading') : t('ment.approve')}
                        </button>
                        <button type="button" onClick={(e) => handleRejectConfirm(e, m.id, Number(m.id))} disabled={processingId === m.id} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-50">
                          <Trash2 className="h-5 w-5" />
                          {processingId === m.id ? t('common.loading') : t('ment.reject')}
                        </button>
                      </div>
                    )}
                    {/* 작성자 아바타 + 닉네임: 우측 하단에 절대 위치 */}
                    {m.authorNickname && (
                      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full bg-white/0 px-2 py-1">
                        <User className="h-5 w-5 text-slate-400" />
                        <span className="text-xs text-slate-500">@{m.authorNickname}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* 사용자 모드일 때만 '멘트 추가' 플로팅 버튼 표시 */}
      {!isAdmin && (
        <button type="button" onClick={() => navigate('/ments/new')} className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700 active:scale-95 transition-transform" aria-label="멘트 추가">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* 설정 모달 */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
