import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { translateTag, tagTranslations } from '../i18n/tagTranslations'
import { Header, Textarea, Button, Alert } from '../components'
import { ROUTES } from '../constants'
import { addComment, getMentList } from '../services/api'
import { isAdmin as checkIsAdmin } from '../storage/authStorage'
import { Send, Sparkles, Hash, BookOpen } from 'lucide-react'

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

  // ฟังก์ชันสุ่มคำแนะนำ
  const writingTips = [
    t('ment.tip1'),
    t('ment.tip2'),
    t('ment.tip3'),
    t('ment.tip4'),
  ]
  const [randomTip] = useState(() => 
    writingTips[Math.floor(Math.random() * writingTips.length)]
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-purple-50/20">
      {/* Header ที่ติดด้านบน */}
      <Header
        title={t('ment.addTitle')}
        subtitle={t('ment.addSubtitle')}
        backTo={ROUTES.MENTS}
        className="bg-gradient-to-r from-white via-white to-pink-50/80 backdrop-blur-xl border-b border-pink-100/50 shadow-sm"
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mb-3">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {t('ment.addTitle')}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {t('ment.addSubtitle')}
          </p>
        </div>

        {/* Writing Tip */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">{t('ment.writingTip')}</p>
              <p className="text-sm text-blue-700 mt-1">{randomTip}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Korean Text Input */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold">KR</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t('ment.korean')}</h3>
                  <p className="text-xs text-gray-500">{t('common.submit')}</p>
                </div>
              </div>
              
              <Textarea
                value={ko}
                onChange={(e) => setKo(e.target.value)}
                rows={4}
                placeholder={t('ment.placeholderKorean') || "여기에 한국어 멘트를 작성해주세요..."}
                className="w-full border-pink-200 focus:border-pink-400 focus:ring-pink-200 rounded-xl"
              />
              
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>{t('ment.charCount')}: {ko.length}</span>
                {ko.length > 0 && (
                  <span className={`font-medium ${ko.length < 4 ? 'text-red-500' : 'text-green-500'}`}>
                    {ko.length < 4 ? t('ment.tooShort') : t('ment.goodLength')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tags Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t('ment.selectDepartment')}</h3>
                  <p className="text-xs text-gray-500">
                    {t('ment.required')} • {t('ment.oneItem')}
                  </p>
                </div>
              </div>

              {loadingTags ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 animate-pulse mb-2"></div>
                    <p className="text-sm text-gray-500">{t('ment.loadingTags')}</p>
                  </div>
                </div>
              ) : availableTags.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">{t('ment.noTagsAvailable')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTags.map((t) => {
                    const isSelected = tags.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTags(tags.includes(t) ? [] : [t])
                        }}
                        className={`
                          p-3 rounded-xl border text-sm font-medium transition-all duration-300
                          ${isSelected
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent shadow-lg'
                            : 'bg-white/80 border-pink-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                          }
                        `}
                      >
                        <span className="font-semibold">#</span>
                        {translateTag(t, i18n.language as 'ko' | 'lo')}
                      </button>
                    )
                  })}
                </div>
              )}
              
              {tags.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200">
                  <p className="text-sm font-medium text-gray-700">
                    {t('ment.selectedTag')}:{' '}
                    <span className="font-bold text-purple-600">
                      #{translateTag(tags[0], i18n.language as 'ko' | 'lo')}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="animate-fade-in">
              <Alert variant="error" className="rounded-2xl border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                {error}
              </Alert>
            </div>
          )}

          {/* Submit Button */}
          <div className="sticky bottom-6 z-10">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className={`
                h-14 rounded-2xl font-bold text-lg shadow-xl
                bg-gradient-to-r from-pink-500 to-purple-600
                hover:from-pink-600 hover:to-purple-700
                transform hover:scale-[1.02] active:scale-95
                transition-all duration-300
                border-0
              `}
              leftIcon={!isSubmitting && <Send className="h-5 w-5" />}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  {t('ment.registering')}
                </span>
              ) : (
                t('common.save')
              )}
            </Button>

            {/* Auto-translate Note */}
            {!isAdmin && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-blue-700 font-medium">
                    {t('ment.autoTranslateNote')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Bottom Spacing */}
        <div className="h-20"></div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        /* Textarea custom styling */
        textarea {
          resize: none;
        }
        
        textarea:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(249, 168, 212, 0.1);
        }
      `}</style>
    </div>
  )
}