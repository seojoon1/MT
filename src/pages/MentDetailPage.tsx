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

export default function MentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAdmin = useMemo(() => checkIsAdmin(), [])

  const [ment, setMent] = useState<Ment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 어드민 모드 체크 및 리다이렉트
  useEffect(() => {
    const adminStatus = checkIsAdmin()
    if (adminStatus) {
      navigate(ROUTES.MENTS, { replace: true })
      return
    }
  }, [navigate])

  // API에서 멘트 목록 가져와서 해당 ID 찾기
  useEffect(() => {
    const fetchMent = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const data = await getMentList()
        const foundItem = data.find((item: any) => String(item.mentId) === id)
        
        if (foundItem) {
          // contentLo JSON 파싱
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

  if (loading) {
    return (
      <PageContainer>
        <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />
        <Main>
          <Card>
            <p className="text-sm text-slate-600">{t('common.loading')}</p>
          </Card>
        </Main>
      </PageContainer>
    )
  }

  if (!ment) {
    return (
      <PageContainer>
        <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />
        <Main>
          <Card>
            <p className="text-sm text-slate-600">{t('ment.mentNotFound')}</p>
          </Card>
        </Main>
      </PageContainer>
    )
  }

  if (!isAdmin && ment.status !== 'approved') {
    return (
      <PageContainer>
        <Header title={t('ment.detail')} backTo={ROUTES.MENTS} />
        <Main>
          <Card>
            <p className="text-sm text-slate-600">
              {t('ment.pendingApproval')}
            </p>
          </Card>
        </Main>
      </PageContainer>
    )
  }

  const isPending = ment.status === 'pending'

  return (
    <PageContainer>
      <Header
        title={t('ment.detail')}
        backTo={ROUTES.MENTS}
      />

      <Main>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="success" className="mb-4">
            {successMessage}
          </Alert>
        )}

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

        {/* 관리자 승인/거절 영역 */}
        {isAdmin && isPending && (
          <Card className="mt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('ment.adminAction')}</h3>
            
            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1"
                leftIcon={isProcessing ? <Spinner size="sm" /> : <Check className="h-5 w-5" />}
              >
                {isProcessing ? t('common.loading') : t('ment.approve')}
              </Button>
              <Button
                variant="danger"
                onClick={handleRejectConfirm}
                disabled={isProcessing}
                className="flex-1"
                leftIcon={isProcessing ? <Spinner size="sm" /> : <X className="h-5 w-5" />}
              >
                {isProcessing ? t('common.loading') : t('ment.reject')}
              </Button>
            </div>
          </Card>
        )}
      </Main>
    </PageContainer>
  )
}
