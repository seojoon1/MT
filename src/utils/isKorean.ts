/**
 * 주어진 문자열에 한글( Hangul ) 문자가 포함되어 있는지 검사합니다.
 * 간단한 정규식 기반 판별로 UI에서 TTS 버튼 노출 여부 판단에 사용합니다.
 */
export default function isKorean(text: string | null | undefined): boolean {
  if (!text) return false
  return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]/.test(text)
}
