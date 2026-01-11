import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag } from '../i18n/tagTranslations'
import { PageContainer, Header, Main, Card, Textarea, Button, Tag, Alert } from '../components'
import { ROUTES } from '../constants'
import { addComment, getMentList } from '../services/api'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'

export default function MentEditorPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAdmin = useMemo(() => checkIsAdmin(), [])

  const [ko, setKo] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API에서 태그 목록 가져오기
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true)
      try {
        const data = await getMentList()
        const tagSet = new Set<string>()
        data.forEach((item: any) => {
          if (item.tag) {
            item.tag.split(',').forEach((t: string) => tagSet.add(t.trim()))
          }
        })
        setAvailableTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko')))
      } catch (err) {
        console.error('태그 목록 불러오기 실패:', err)
      } finally {
        setLoadingTags(false)
      }
    }
    
    fetchTags()
  }, [])

  function validate(): string | null {
    if (ko.trim().length === 0) return t('ment.enterKoreanMent')
    if (tags.length === 0) return t('ment.selectAtLeastOneTag')
    if (ko.trim().length < 4) return t('ment.mentTooShort')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }

    setIsSubmitting(true)
    try {
      await addComment({
        contentKo: ko.trim(),
        tag: tags[0], // 첫 번째 태그 사용
      })
      navigate(ROUTES.MENTS)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ment.addFailed'))
    } finally {
      setIsSubmitting(false)
    }
  } 

  return (
    <PageContainer>
      <Header
        title={t('ment.addTitle')}
        subtitle={t('ment.addSubtitle')}
        backTo={ROUTES.MENTS}
      />

      <Main>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <Textarea
              label={t('ment.korean') + ' (' + t('common.submit') + ')'}
              value={ko}
              onChange={(e) => setKo(e.target.value)}
              rows={3}
              placeholder={t('ment.korean') + ' ' + t('common.submit')}
            />
          </Card>

          <Card>
            <p className="text-xs font-semibold text-slate-700">{t('ment.selectDepartment')} ({t('ment.required')}, {t('ment.oneItem')})</p>
            {loadingTags ? (
              <p className="mt-3 text-sm text-slate-500">{t('ment.loadingTags')}</p>
            ) : availableTags.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('ment.noTagsAvailable')}</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableTags.map((t) => (
                  <Tag
                    key={t}
                    label={translateTag(t, i18n.language as 'ko' | 'lo')}
                    selected={tags.includes(t)}
                    variant="purple"
                    onClick={() => {
                      // 하나만 선택 가능
                      setTags(tags.includes(t) ? [] : [t])
                    }}
                  />
                ))}
              </div>
            )}
          </Card>

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            type="submit"
            variant={isSubmitting ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('ment.registering') : t('common.save')}
          </Button>

          {!isAdmin && (
            <p className="text-center text-xs text-slate-500">
              {t('ment.autoTranslateNote')}
            </p>
          )}
        </form>
      </Main>
    </PageContainer>
  )
}
