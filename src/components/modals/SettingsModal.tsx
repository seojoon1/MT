import { X, LogOut, Trash2, Globe } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../common'
import { cn } from '../../utils/cn'
import { logout, deletedAccount } from '../../services/api'
import { clearAuthed } from '../../storage/authStorage'
import { ROUTES } from '../../constants'

type Language = 'ko' | 'lo' | 'en'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'lo', label: 'ພາສາລາວ', flag: '🇱🇦' },
]

export default function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen) return null

  function handleLanguageChange(lang: Language) {
    i18n.changeLanguage(lang)
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (err) {
      console.error('로그아웃 API 실패:', err)
    } finally {
      // 모든 스토리지 데이터 삭제
      clearAuthed()
      localStorage.clear()
      sessionStorage.clear()
      navigate(ROUTES.LOGIN)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      await deletedAccount()
      // 모든 스토리지 데이터 삭제
      clearAuthed()
      localStorage.clear()
      sessionStorage.clear()
      navigate(ROUTES.LOGIN)
    } catch (err) {
      console.error('회원탈퇴 실패:', err)
      alert(err instanceof Error ? err.message : '회원탈퇴에 실패했습니다.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="닫기"
      />

      {/* 모달 */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t('settings.settings')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 언어 설정 */}
        <div className="mt-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Globe className="h-4 w-4" />
            {t('settings.language')}
          </div>
          <div className="mt-3 flex gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'flex-1 rounded-xl border py-3 text-center text-sm font-medium transition-colors',
                  i18n.language === lang.code
                    ? 'border-pink-200 bg-pink-600 text-white'
                    : 'border-pink-100 bg-white text-slate-700 hover:bg-pink-50'
                )}
              >
                <span className="block text-lg">{lang.flag}</span>
                <span className="mt-1 block text-xs">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="my-5 border-t border-slate-100" />

        {/* 계정 관리 */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="md"
            fullWidth
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
            isLoading={isLoggingOut}
            disabled={isLoggingOut}
          >
            {t('auth.logout')}
          </Button>

          {!showDeleteConfirm ? (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {t('settings.deleteAccount')}
            </Button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                {t('settings.confirmDelete')}
              </p>
              <p className="mt-1 text-xs text-red-600">
                {t('settings.deleteWarning')}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteAccount}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {t('settings.deleteAccount')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 버전 정보 */}
        <p className="mt-5 text-center text-xs text-slate-400">
          {t('settings.version')} 1.0.0
        </p>
      </div>
    </div>
  )
}
