/**
 * 조건부 클래스명 조합 유틸리티
 * @example cx('base', isActive && 'active', isDisabled && 'disabled')
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
