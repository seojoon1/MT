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
 * หน้าสำหรับสร้าง 'Ment' ใหม่
 * ผู้ใช้สามารถเขียน Ment ภาษาเกาหลี เลือกแท็กที่เกี่ยวข้อง และส่งไปได้ในหน้านี้
 * หน้านี้รับผิดชอบฟังก์ชัน 'สร้าง' โดยไม่มีฟังก์ชัน 'แก้ไข'
 */
export default function MentEditorPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  // ใช้สถานะผู้ดูแลระบบสำหรับการแสดงผล UI เท่านั้น (เช่น ข้อความช่วยเหลือ)
  const isAdmin = useMemo(() => checkIsAdmin(), [])

  // --- จัดการสถานะ ---
  const [ko, setKo] = useState('') // Ment ภาษาเกาหลีที่ผู้ใช้ป้อน
  const [tags, setTags] = useState<string[]>([]) // แท็กที่ผู้ใช้เลือก (เลือกเดียวในหนักมา UI)
  const [availableTags, setAvailableTags] = useState<string[]>([]) // รายการแท็กทั้งหมดที่จะแสดงเป็นตัวเลือก
  const [loadingTags, setLoadingTags] = useState(true) // สถานะการโหลดรายการแท็ก

  const [isSubmitting, setIsSubmitting] = useState(false) // สถานะการส่งฟอร์ม
  const [error, setError] = useState<string | null>(null) // ข้อความข้อผิดพลาด

  // --- โหลดรายการแท็ก ---
  // เมื่อคอมโพเนนต์ mount จะดึงรายการแท็กที่มีให้เลือกผ่าน API
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true)
      try {
        // 1. ดึงรายการ Ment ทั้งหมดที่ลงทะเบียนไว้
        const data = await getMentList()
        const tagSet = new Set<string>()

        // 2. รวมรายการแท็กพื้นฐานที่กำหนดไว้ในไฟล์แปล
        Object.keys(tagTranslations).forEach((k) => tagSet.add(k))

        // 3. แยกแท็กจากการตอบสนอง API และเพิ่มไปยัง Set (ลบซ้ำ)
        data.forEach((item: any) => {
          if (item.tag) {
            item.tag.split(',').forEach((t: string) => tagSet.add(t.trim()))
          }
        })

        // 4. บันทึกรายการแท็กที่เรียงลำดับไปยังสถานะ
        const sorted = Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'))
        setAvailableTags(sorted)

        // 5. การเลือกเริ่มต้น: หากไม่มีแท็กที่เลือกไว้ให้เลือกแท็กแรกในรายการเป็นค่าเริ่มต้น
        if (sorted.length > 0 && tags.length === 0) {
          setTags([sorted[0]])
        }
      } catch (err) {
        console.error('태그 목록을 로드하지 못했습니다.:', err)
        // หากการโทร API ล้มเหลว ให้แสดงเฉพาะรายการแท็กพื้นฐานจากไฟล์แปล
        const defaults = Object.keys(tagTranslations).sort((a, b) => a.localeCompare(b, 'ko'))
        setAvailableTags(defaults)
        if (defaults.length > 0 && tags.length === 0) setTags([defaults[0]])
      } finally {
        setLoadingTags(false)
      }
    }

    fetchTags()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // เรียกใช้เพียงครั้งเดียวเมื่อ mount

  /**
   * ตรวจสอบความถูกต้องก่อนส่งฟอร์ม
   * @returns {string | null} ข้อความข้อผิดพลาดหากการตรวจสอบล้มเหลว หรือ null หากสำเร็จ
   */
  function validate(): string | null {
    if (ko.trim().length === 0) return t('ment.enterKoreanMent')
    if (tags.length === 0) return t('ment.selectAtLeastOneTag')
    if (ko.trim().length < 4) return t('ment.mentTooShort')
    return null
  }

  /**
   * ตัวจัดการการส่งฟอร์ม
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // 1. ตรวจสอบความถูกต้อง
    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setIsSubmitting(true)
    try {
      // 2. ขอเพิ่ม Ment ผ่าน API
      // เนื่องจาก UI ปัจจุบันรองรับการเลือกแท็กเดียวเท่านั้น จึงส่งอังค์ประกอบแรกของอาร์เรย์แท็กที่เลือก
      await addComment({
        contentKo: ko.trim(),
        tag: tags[0],
      })
      // 3. เมื่อสำเร็จ ให้นำไปยังหน้ารายการ Ment
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
                      // เมื่อคลิกแท็ก ให้ตั้งค่าให้เลือกเฉพาะแท็กนั้น (การเลือกเดียว)
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

          {/* แสดงข้อความคำแนะนำการแปลอัตโนมัติเมื่อไม่ใช่ผู้ดูแลระบบ */}
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
