import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import koTranslations from './locales/ko.json'
import loTranslations from './locales/lo.json'

const resources = {
  ko: {
    translation: koTranslations,
  },
  lo: {
    translation: loTranslations,
  },
}

// localStorage에서 저장된 언어 가져오기
const savedLanguage = localStorage.getItem('language') || 'ko'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 저장된 언어 사용
    fallbackLng: 'ko', // 폴백 언어
    interpolation: {
      escapeValue: false, // React에서 XSS 보호는 자동으로 처리됨
    },
    debug: false, // 프로덕션에서는 false
  })

// 언어 변경 시 localStorage에 저장
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
})

export default i18n
