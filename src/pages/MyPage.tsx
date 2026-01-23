import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, User, FileText, Star, ArrowLeft, Calendar, MessageCircle } from 'lucide-react'
import { getProfile, getMentList } from '../services/api'
import type { Profile, MentItem } from '../types'

export default function MyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userMents, setUserMents] = useState<MentItem[]>([])
  const [loadingMents, setLoadingMents] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (err) {
        console.error('프로필 로딩 실패:', err)
        setError(err instanceof Error ? err.message : 'PROFILE_LOAD_FAILED')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    const fetchUserMents = async () => {
      if (!profile) return
      setLoadingMents(true)
      try {
        const all = await getMentList()
        const mine = all.filter((m: MentItem) => (m.authorNickname || '').trim() === (profile.nickname || '').trim())
        setUserMents(mine)
      } catch (err) {
        console.error('사용자 멘트 로딩 실패:', err)
      } finally {
        setLoadingMents(false)
      }
    }

    fetchUserMents()
  }, [profile])

  // Helper function to parse Lao text
  const parseLaoText = (contentLo: string): string => {
    if (!contentLo) return ''
    try {
      const parsed = JSON.parse(contentLo)
      return parsed.message || parsed.번역 || parsed.translation || contentLo
    } catch {
      return contentLo
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30">
      {/* Modern Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-white via-white to-pink-50/80 backdrop-blur-xl border-b border-pink-100/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-pink-50/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{t('common.back') || 'Back'}</span>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('mypage.title') || 'My Page'}
            </h1>
            <div className="w-12"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {/* Skeleton Loader for Profile */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">!</span>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : profile ? (
          <>
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-white to-pink-50/50 backdrop-blur-sm rounded-3xl border border-pink-100/50 shadow-xl overflow-hidden mb-6">
              {/* Decorative Background */}
              <div className="h-32 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10"></div>
              
              {/* Profile Info */}
              <div className="relative px-6 pb-6 -mt-12">
                {/* Avatar */}
                <div className="absolute -top-8 left-6">
                  <div className="h-24 w-24 rounded-2xl border-4 border-white bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <User className="h-10 w-10 text-white" />
                  </div>
                </div>

                {/* Nickname and Info */}
                <div className="pt-16">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.nickname}</h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">{t('mypage.subtitle') || 'Your personal space'}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl border border-pink-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-pink-100 to-pink-200 flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{profile.postCount}</div>
                      <div className="text-xs text-gray-500 mt-1">{t('mypage.posts') || 'Posts'}</div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-3">
                        <Heart className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{profile.totalLikes}</div>
                      <div className="text-xs text-gray-500 mt-1">{t('mypage.totalLikes') || 'Total Likes'}</div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-3">
                        <Star className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{profile.bookmarkCount ?? 0}</div>
                      <div className="text-xs text-gray-500 mt-1">{t('mypage.bookmarks') || 'Bookmarks'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Posts Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-white to-pink-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-pink-100 to-pink-200 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{t('mypage.posts') || 'My Posts'}</h3>
                      <p className="text-xs text-gray-500">Your contributed messages</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="divide-y divide-pink-50/50">
                {loadingMents ? (
                  <div className="p-8 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-pink-300 border-t-pink-600"></div>
                    <p className="mt-3 text-sm text-gray-500">{t('common.loading')}</p>
                  </div>
                ) : userMents.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-7 w-7 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-700 mb-2">{t('mypage.noData') || 'No posts yet'}</h4>
                    <p className="text-sm text-gray-500">Start by creating your first ment!</p>
                    <button
                      onClick={() => navigate('/ments/new')}
                      className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white text-sm font-medium hover:shadow-lg transition-all"
                    >
                      Create First Post
                    </button>
                  </div>
                ) : (
                  userMents.map((m) => (
                    <div
                      key={m.mentId}
                      className="p-5 hover:bg-pink-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/ments/${m.mentId}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 leading-relaxed line-clamp-2">
                            {m.contentKo}
                          </p>
                          {m.contentLo && (
                            <p className="mt-2 text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-lg p-2 border border-blue-100 line-clamp-2">
                              {parseLaoText(m.contentLo)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(m.createdAt).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            {m.tag && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full">
                                  {m.tag}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Removed likeCount since it doesn't exist in MentItem type */}
                          {m.isApproved === 1 && (
                            <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-full">
                              Approved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <User className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('mypage.noProfile') || 'No Profile'}</h3>
            <p className="text-gray-500 mb-4">{t('mypage.noData') || 'Profile data not available'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white text-sm font-medium hover:shadow-lg transition-all"
            >
              Go Home
            </button>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}