import { Heart, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag } from '../i18n/tagTranslations'
import type { Ment, MentStatus, BookmarkItem, MentItem } from '../types'
import { SettingsModal } from '../components/modals'
import { getMentList, approveMent, rejectMent, getPendingMents, addBookmark, deleteBookmark, getMyBookmarks } from '../services/api'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'
import { STORAGE_KEYS } from '../constants'

// SVG Icons
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const AdminIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

// Random profile data
const randomNames = ['Anonymous', 'Mystery User', 'Secret Admirer', 'Hidden Voice', 'Silent Heart', 'Unknown Soul', 'Whisperer', 'Dreamer', 'Hopeful', 'Romantic']
const randomColors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500']
const randomEmojis = ['😊', '🥰', '😇', '🤗', '🤫', '😌', '😉', '🤭', '😘', '😍']

const generateRandomProfile = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return {
    name: randomNames[hash % randomNames.length],
    color: randomColors[hash % randomColors.length],
    emoji: randomEmojis[hash % randomEmojis.length],
    id: `user_${hash.toString(16).slice(0, 6)}`
  }
}

export default function MentListPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)

  const [isAdmin, setIsAdminState] = useState<boolean>(false)
  const [originalIsAdmin, setOriginalIsAdmin] = useState<boolean>(false)
  const [selectedTag, setSelectedTag] = useState<string>('__all__')
  const [ments, setMentsState] = useState<Ment[]>([])
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const adminStatus = checkIsAdmin()
    setIsAdminState(adminStatus)
    setOriginalIsAdmin(adminStatus)
  }, [])

  function parseLaoText(contentLo: string): string {
    if (!contentLo) return ''
    try {
      const parsed = JSON.parse(contentLo)
      return parsed.message || parsed.번역 || parsed.translation || contentLo
    } catch {
      return contentLo
    }
  }

  useEffect(() => {
    const fetchMentsAndBookmarks = async () => {
      setLoading(true)
      setError(null)
      try {
        const mentData = isAdmin ? await getPendingMents() : await getMentList()

        const convertedMents: Ment[] = mentData.map((item: MentItem) => ({
          id: String(item.mentId),
          ko: item.contentKo,
          lo: parseLaoText(item.contentLo || ''),
          tags: item.tag ? item.tag.split(',').map((t: string) => t.trim()) : [],
          aiHint: '',
          status: (item.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
          createdAt: new Date(item.createdAt).getTime()
        }))
        setMentsState(convertedMents)

        if (!isAdmin) {
          try {
            const bookmarkData = await getMyBookmarks()
            const bookmarkIds = bookmarkData.map((item: BookmarkItem) => String((item as any).mentNum ?? (item as any).mentId)).filter(id => id && id !== 'undefined')
            setBookmarks(bookmarkIds)
            localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(bookmarkIds))
          } catch (bookmarkErr) {
            console.error('북마크 목록 불러오기 실패:', bookmarkErr)
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
  }, [isAdmin, t])

  const availableTags = useMemo(() => {
    const pool = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    const tagSet = new Set<string>()
    for (const m of pool) for (const t of m.tags) tagSet.add(t)
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [isAdmin, ments])

  const filteredMents = useMemo(() => {
    const base = isAdmin ? ments : ments.filter((m) => m.status === 'approved')
    if (selectedTag === '__all__') return base
    if (selectedTag === '__bookmarks__') {
      return base.filter((m) => bookmarks.includes(m.id))
    }
    return base.filter((m) => m.tags.includes(selectedTag))
  }, [isAdmin, ments, selectedTag, bookmarks])

  async function handleToggleBookmark(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const isBookmarked = bookmarks.includes(id)
    const mentId = Number(id)
    if (isNaN(mentId)) {
      setError(t('ment.invalidMentId'))
      return
    }

    const newBookmarks = isBookmarked ? bookmarks.filter(bId => bId !== id) : [...bookmarks, id]

    try {
      if (isBookmarked) {
        await deleteBookmark(mentId)
      } else {
        await addBookmark(mentId)
      }

      setBookmarks(newBookmarks)
      localStorage.setItem(STORAGE_KEYS.app.favorites, JSON.stringify(newBookmarks))
      setError(null)
    } catch (err) {
      console.error(isBookmarked ? '북마크 삭제 실패:' : '북마크 추가 실패:', err)
      setError(err instanceof Error ? err.message : isBookmarked ? t('ment.bookmarkRemoveFailed') : t('ment.bookmarkAddFailed'))
    }
  }

  async function refetchAdminMents() {
    const data = await getPendingMents()
    const convertedMents: Ment[] = data.map((item: MentItem) => ({
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
  }

  async function handleApprove(e: React.MouseEvent, id: string, mentId: number) {
    e.stopPropagation()
    setProcessingId(id)
    try {
      await approveMent(mentId)
      await refetchAdminMents()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.approveFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRejectConfirm(e: React.MouseEvent, id: string, mentId: number) {
    e.stopPropagation()
    setProcessingId(id)
    try {
      await rejectMent(mentId)
      await refetchAdminMents()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.rejectFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 border-pink-300',
      'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300',
      'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300',
      'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300',
      'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border-yellow-300',
      'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 border-indigo-300',
    ]
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30 pb-24">
      {/* Modern Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-white via-white to-pink-50/80 backdrop-blur-xl border-b border-pink-100/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {t('common.appName')}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAdmin ? t('ment.adminMode') : t('ment.userMode')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl border border-pink-200 bg-white/80 hover:bg-pink-50 transition-colors"
              >
                <SettingsIcon />
              </button> */}
              {originalIsAdmin && (
                <button
                  onClick={() => setIsAdminState(v => !v)}
                  className={`p-2 rounded-xl border flex items-center justify-center transition-all ${isAdmin
                      ? 'border-purple-300 bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'border-pink-300 bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700'
                    }`}
                >
                  {isAdmin ? <AdminIcon /> : <UserIcon />}
                </button>
              )}
            </div>
          </div>

          {/* Tag Filter with Modern Design */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedTag('__all__')}
                className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedTag === '__all__'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-lg'
                    : 'bg-white/80 border-pink-200 text-gray-700 hover:border-pink-300'
                  }`}
              >
                {t('ment.all')}
              </button>
              {!isAdmin && (
                <button
                  onClick={() => setSelectedTag('__bookmarks__')}
                  className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${selectedTag === '__bookmarks__'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-transparent shadow-lg'
                      : 'bg-white/80 border-pink-200 text-gray-700 hover:border-pink-300'
                    }`}
                >
                  <Heart className={`h-4 w-4 ${selectedTag === '__bookmarks__' ? 'fill-white' : ''}`} />
                  {t('ment.bookmarks')}
                </button>
              )}
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedTag === tag
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent shadow-lg'
                      : 'bg-white/80 border-pink-200 text-gray-700 hover:border-pink-300'
                    }`}
                >
                  #{translateTag(tag, i18n.language as 'ko' | 'lo')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/80 rounded-2xl border border-pink-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-lg">!</span>
            </div>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        ) : filteredMents.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('ment.noMents')}</h3>
            <p className="text-gray-600">Start by creating your first ment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMents
              .sort((a, b) => b.createdAt - a.createdAt) // เพิ่มบรรทัดนี้เพื่อเรียงจากใหม่ไปเก่า
              .map((m) => {
                const isPending = m.status === 'pending'
                const isBookmarked = bookmarks.includes(m.id)
                const profile = generateRandomProfile(m.id)

                return (
                  <div
                    key={m.id}
                    onClick={() => !isAdmin && navigate(`/ments/${m.id}`)}
                    className={`bg-white/90 backdrop-blur-sm rounded-2xl border shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl cursor-pointer ${isPending ? 'border-purple-200' : 'border-pink-100'
                      }`}
                  >
                    <div className="p-5">
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`h-10 w-10 rounded-full ${profile.color} flex items-center justify-center text-white font-bold text-lg`}>
                          {profile.emoji}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                          <p className="text-xs text-gray-500">{profile.id}</p>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900 leading-relaxed">
                            {m.ko}
                          </p>
                          {m.lo && (
                            <p className="mt-3 text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl p-3 border border-blue-100">
                              {m.lo}
                            </p>
                          )}

                          {/* Tags Section */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {m.tags.map((t) => (
                              <span
                                key={t}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium ${getTagColor(t)}`}
                              >
                                #{translateTag(t, i18n.language as 'ko' | 'lo')}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bookmark Button - Moved to bottom */}
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className={`px-5 py-3 border-t ${isPending ? 'border-purple-100' : 'border-pink-100'} bg-gradient-to-r from-white to-pink-50/30`}>
                      <div className="flex items-center justify-between">
                        {/* Bookmark Button - Now at bottom */}
                        {!isAdmin && (
                          <button
                            onClick={(e) => handleToggleBookmark(e, m.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${isBookmarked
                                ? 'bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-300 text-pink-600 shadow-sm'
                                : 'bg-white/80 border border-pink-200 text-gray-500 hover:border-pink-300 hover:bg-pink-50'
                              }`}
                          >
                            <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-pink-600' : ''}`} />
                            <span className="text-sm font-medium">
                              {isBookmarked ? t('ment.bookmarked') : t('ment.bookmark')}
                            </span>
                          </button>
                        )}

                        {/* Status Badge */}
                        {isAdmin && (
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${m.status === 'approved'
                              ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300'
                              : isPending
                                ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-300'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300'
                            }`}>
                            {m.status}
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="text-xs text-gray-500">
                          {new Date(m.createdAt).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Admin Actions - Moved to bottom */}
                      {isAdmin && isPending && (
                        <div className="mt-3 pt-3 border-t border-purple-100">
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => handleApprove(e, m.id, Number(m.id))}
                              disabled={processingId === m.id}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg"
                            >
                              {processingId === m.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                              ) : (
                                <>
                                  <CheckIcon />
                                  {t('ment.approve')}
                                </>
                              )}
                            </button>
                            <button
                              onClick={(e) => handleRejectConfirm(e, m.id, Number(m.id))}
                              disabled={processingId === m.id}
                              className="flex-1 py-2.5 rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-white text-red-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-red-50"
                            >
                              {processingId === m.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  {t('ment.reject')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {!isAdmin && (
        <button
          onClick={() => navigate('/ments/new')}
          className="fixed bottom-6 right-6 z-20 h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
        >
          <Plus className="h-6 w-6" />
          {/* Shine Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-45 group-hover:animate-shine"></div>
        </button>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-45deg); }
          100% { transform: translateX(200%) skewX(-45deg); }
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  )
}