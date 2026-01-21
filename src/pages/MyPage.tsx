import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
    // 변경: /profile 엔드포인트에서 사용자 프로필을 받아옵니다.
    // 응답 형태: { nickname, postCount, totalLikes }
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
    // 변경: 프로필 로드 후 API에서 전체 멘트 목록을 가져와
    // 현재 사용자가 작성한 멘트만 필터링하여 표시합니다.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{t('mypage.title') || 'My Page'}</h1>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500">{t('common.back') || 'Back'}</button>
        </div>

        {loading ? (
          <div className="p-6 bg-white rounded-2xl border border-pink-100">{t('common.loading') || 'Loading...'}</div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">{error}</div>
        ) : profile ? (
          <div className="p-6 bg-white rounded-2xl border border-pink-100">
            {/* 변경: 서버에서 받은 닉네임/포스트 수/총 좋아요를 표시합니다. */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{profile.nickname}</h2>
              <p className="text-sm text-gray-500">{t('mypage.subtitle') || 'Profile summary'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="text-sm text-gray-500">{t('mypage.posts') || 'Posts'}</div>
                <div className="text-xl font-bold">{profile.postCount}</div>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="text-sm text-gray-500">{t('mypage.totalLikes') || 'Total Likes'}</div>
                <div className="text-xl font-bold">{profile.totalLikes}</div>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="text-sm text-gray-500">{t('mypage.bookmarks') || 'Bookmarks'}</div>
                <div className="text-xl font-bold">{profile.postCount ?? 0}</div>
              </div>
            </div>

            {/* 변경: 사용자가 작성한 멘트 목록 표시 */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">{t('mypage.posts') || 'Posts'}</h3>
              {loadingMents ? (
                <div className="p-4 bg-white/80 rounded-lg">{t('common.loading')}</div>
              ) : userMents.length === 0 ? (
                <div className="text-sm text-gray-500">{t('mypage.noData') || 'No posts.'}</div>
              ) : (
                <div className="space-y-3">
                  {userMents.map((m) => (
                    <div key={m.mentId} className="p-4 bg-white/90 rounded-xl border border-pink-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{m.contentKo}</p>
                        <span className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-pink-100">{t('mypage.noData') || 'No profile data available.'}</div>
        )}
      </div>
    </div>
  )
}
