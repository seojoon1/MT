import { Check, X } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag } from '../i18n/tagTranslations'
import { PageContainer, Header, Main, Card, Button, Tag, Spinner, Alert } from '../components'
import { ROUTES } from '../constants'
import { getMentList, approveMent, rejectMent } from '../services/api'
import type { Ment, MentStatus } from '../types'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'

/**
 * @description
 * 단일 '멘트(Ment)'의 상세 정보를 보여주는 페이지입니다.
 * 일반 사용자 전용 페이지이며, 관리자는 이 페이지에 접근 시 메인 목록으로 리다이렉트됩니다.
 */
export default function MentDetailPage() {
  const { id } = useParams<{ id: string }>() // URL 파라미터에서 멘트 ID를 가져옴
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAdmin = useMemo(() => checkIsAdmin(), [])

  // --- 상태 관리 ---
  const [ment, setMent] = useState<Ment | null>(null) // 현재 페이지에 표시할 멘트 객체
  const [loading, setLoading] = useState(true) // 데이터 로딩 상태
  const [isProcessing, setIsProcessing] = useState(false) // 관리자 액션(승인/거절) 처리 중 상태
  const [error, setError] = useState<string | null>(null) // 에러 메시지
  const [successMessage, setSuccessMessage] = useState<string | null>(null) // 성공 메시지 (승인/거절 후)

  // --- 권한 제어 ---
  // 이 페이지는 일반 사용자 전용이므로, 관리자일 경우 메인 목록 페이지로 리다이렉트합니다.
  useEffect(() => {
    const adminStatus = checkIsAdmin()
    if (adminStatus) {
      navigate(ROUTES.MENTS, { replace: true })
      return
    }
  }, [navigate])

  // --- 데이터 로딩 ---
  // URL의 id에 해당하는 멘트 데이터를 불러옵니다.
  useEffect(() => {
    const fetchMent = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        // **데이터 로딩 전략**: 
        // 백엔드에 `getMentById`와 같은 API가 없으므로, 전체 멘트 목록을 가져온 후
        // 클라이언트 측에서 URL의 id와 일치하는 항목을 `find` 메소드로 찾습니다.
        // 이 방식은 API 구현을 단순화하지만, 멘트 개수가 많아지면 성능 저하의 원인이 될 수 있습니다.
        const data = await getMentList()
        const foundItem = data.find((item: any) => String(item.mentId) === id)
        
        if (foundItem) {
          // API 응답을 프론트엔드 `Ment` 타입으로 변환
          let parsedLo = ''
          if (foundItem.contentLo) {
            try {
              const parsed = JSON.parse(foundItem.contentLo)
              parsedLo = parsed.번역 || parsed.translation || foundItem.contentLo
            } catch {
              parsedLo = foundItem.contentLo
            }
          }
          
          const converted: Ment = {
            id: String(foundItem.mentId),
            ko: foundItem.contentKo,
            lo: parsedLo,
            tags: foundItem.tag ? foundItem.tag.split(',').map((t: string) => t.trim()) : [],
            aiHint: '',
            status: (foundItem.isApproved === 1 ? 'approved' : 'pending') as MentStatus,
            createdAt: new Date(foundItem.createdAt).getTime()
          }
          setMent(converted)
        }
      } catch (error) {
        console.error('멘트 불러오기 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMent()
  }, [id])

  // --- 관리자 액션 핸들러 ---
  // [주의] 아래의 handleApprove, handleRejectConfirm 함수와 관련 UI는
  // 페이지 상단의 관리자 리다이렉트 로직 때문에 실제로는 호출될 수 없는 '죽은 코드(Dead Code)'일 가능성이 높습니다.
  // 이전 개발 단계의 유물이거나, 다른 경로로 이 컴포넌트를 재사용하려던 흔적일 수 있습니다.

  async function handleApprove() {
    if (!ment || isProcessing) return
    
    setIsProcessing(true)
    setError(null)
    try {
      await approveMent(Number(ment.id))
      setSuccessMessage(t('ment.approveSuccess'))
      setTimeout(() => navigate(ROUTES.MENTS), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.approveFailed'))
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRejectConfirm() {
    if (!ment || isProcessing) return

    setIsProcessing(true)
    setError(null)
    try {
      await rejectMent(Number(ment.id))
      setSuccessMessage(t('ment.rejectSuccess'))
      setTimeout(() => navigate(ROUTES.MENTS), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.rejectFailed'))
    } finally {
      setIsProcessing(false)
    }
  }


  // --- 렌더링 로직 ---

  if (loading) {
    return (
      <PageContainer>
        <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />
        <Main><Card><p className="text-sm text-slate-600">{t('common.loading')}</p></Card></Main>
      </PageContainer>
    )
  }

  if (!ment) {
    return (
      <PageContainer>
        <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />
        <Main><Card><p className="text-sm text-slate-600">{t('ment.mentNotFound')}</p></Card></Main>
      </PageContainer>
    )
  }

  // 일반 사용자가 아직 승인되지 않은 멘트에 접근하는 것을 방지
  if (!isAdmin && ment.status !== 'approved') {
    return (
      <PageContainer>
        <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />
        <Main><Card><p className="text-sm text-slate-600">{t('ment.pendingApproval')}</p></Card></Main>
      </PageContainer>
    )
  }

  const isPending = ment.status === 'pending'

  return (
    <PageContainer>
      <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />

      <Main>
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}

        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 한국어 */}
            <div className="rounded-2xl bg-pink-50 p-4">
              <p className="text-xs font-semibold text-pink-700">{t('ment.korean')}</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{ment.ko}</p>
            </div>
            {/* 라오스어 */}
            <div className="rounded-2xl bg-purple-50 p-4">
              <p className="text-xs font-semibold text-purple-700">{t('ment.lao')}</p>
              {ment.lo ? (
                <p className="mt-2 text-base font-semibold text-slate-900">{ment.lo}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">{t('ment.noTranslation')}</p>
              )}
            </div>
          </div>

          {/* 태그 목록 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {ment.tags.map((t) => (
              <Tag key={t} label={translateTag(t, i18n.language as 'ko' | 'lo')} variant="pink" clickable={false} />
            ))}
            {isAdmin && (
              <Tag label={`status: ${ment.status}`} variant="slate" clickable={false} showHash={false} />
            )}
          </div>
        </Card>

        {/* [Dead Code] 관리자 승인/거절 영역. 페이지 상단의 리다이렉트 로직으로 인해 이 UI는 렌더링되지 않을 것입니다. */}
        {isAdmin && isPending && (
          <Card className="mt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('ment.adminAction')}</h3>
            <div className="flex gap-3">
              <Button variant="success" onClick={handleApprove} disabled={isProcessing} className="flex-1" leftIcon={isProcessing ? <Spinner size="sm" /> : <Check className="h-5 w-5" />}>
                {isProcessing ? t('common.loading') : t('ment.approve')}
              </Button>
              <Button variant="danger" onClick={handleRejectConfirm} disabled={isProcessing} className="flex-1" leftIcon={isProcessing ? <Spinner size="sm" /> : <X className="h-5 w-5" />}>
                {isProcessing ? t('common.loading') : t('ment.reject')}
              </Button>
            </div>
          </Card>
        )}
      </Main>
    </PageContainer>
  )
}
