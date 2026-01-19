import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag, tagTranslations } from '../i18n/tagTranslations'
import { PageContainer, Header, Main, Card, Textarea, Button, Tag, Alert } from '../components'
import { ROUTES } from '../constants'
import { addComment, getMentList } from '../services/api'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'

/**
 * @description
 * 새로운 '멘트(Ment)'를 생성하는 페이지입니다.
 * 사용자는 이 페이지에서 한글 멘트를 작성하고, 관련된 태그를 선택하여 제출할 수 있습니다.
 * 이 페이지는 '수정' 기능 없이 '생성' 기능만 담당합니다.
 */
export default function MentEditorPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  // 관리자 여부는 UI 표시에만 사용 (예: 안내 문구)
  const isAdmin = useMemo(() => checkIsAdmin(), [])

  // --- 상태 관리 ---
  const [ko, setKo] = useState('') // 사용자가 입력한 한글 멘트
  const [tags, setTags] = useState<string[]>([]) // 사용자가 선택한 태그 (UI상 단일 선택)
  const [availableTags, setAvailableTags] = useState<string[]>([]) // 선택지로 보여줄 전체 태그 목록
  const [loadingTags, setLoadingTags] = useState(true) // 태그 목록 로딩 상태

  const [isSubmitting, setIsSubmitting] = useState(false) // 폼 제출 진행 상태
  const [error, setError] = useState<string | null>(null) // 에러 메시지

  // --- 태그 목록 로딩 ---
  // 컴포넌트 마운트 시, API를 통해 선택 가능한 태그 목록을 가져옵니다.
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true)
      try {
        // 1. 기존에 등록된 모든 멘트 목록을 가져옵니다.
        const data = await getMentList()
        const tagSet = new Set<string>()

        // 2. 번역 파일에 정의된 기본 태그 목록을 항상 포함시킵니다.
        Object.keys(tagTranslations).forEach((k) => tagSet.add(k))

        // 3. API 응답에서 태그들을 추출하여 Set에 추가 (중복 제거)
        data.forEach((item: any) => {
          if (item.tag) {
            item.tag.split(',').forEach((t: string) => tagSet.add(t.trim()))
          }
        })

        // 4. 정렬된 태그 목록을 상태에 저장합니다.
        const sorted = Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'))
        setAvailableTags(sorted)

        // 5. 기본 선택: 기존에 선택된 태그가 없으면 목록의 첫 번째 태그를 기본으로 선택해줍니다.
        if (sorted.length > 0 && tags.length === 0) {
          setTags([sorted[0]])
        }
      } catch (err) {
        console.error('태그 목록 불러오기 실패:', err)
        // API 호출 실패 시, 번역 파일의 기본 태그 목록만이라도 보여줍니다.
        const defaults = Object.keys(tagTranslations).sort((a, b) => a.localeCompare(b, 'ko'))
        setAvailableTags(defaults)
        if (defaults.length > 0 && tags.length === 0) setTags([defaults[0]])
      } finally {
        setLoadingTags(false)
      }
    }

    fetchTags()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 마운트 시 한 번만 실행

  /**
   * 폼 제출 전 유효성을 검사합니다.
   * @returns {string | null} 유효성 검사 실패 시 에러 메시지, 성공 시 null
   */
  function validate(): string | null {
    if (ko.trim().length === 0) return t('ment.enterKoreanMent')
    if (tags.length === 0) return t('ment.selectAtLeastOneTag')
    if (ko.trim().length < 4) return t('ment.mentTooShort')
    return null
  }

  /**
   * 폼 제출 핸들러
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // 1. 유효성 검사
    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setIsSubmitting(true)
    try {
      // 2. API로 멘트 추가 요청
      // 현재 UI는 단일 태그 선택만 지원하므로, 선택된 태그 배열의 첫 번째 요소를 보냅니다.
      await addComment({
        contentKo: ko.trim(),
        tag: tags[0],
      })
      // 3. 성공 시 멘트 목록 페이지로 이동
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
                      // 태그 클릭 시, 해당 태그만 선택되도록 설정 (단일 선택)
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

          {/* 관리자가 아닌 경우에만 자동 번역 안내 문구 표시 */}
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
