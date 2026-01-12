/**
 * 에러 코드 → i18n 키 매핑
 * 페이지에서 사용: const key = errorMessageMap[error.message]; setError(t(key) || error.message)
 */
export const errorMessageMap: Record<string, string> = {
  // 인증 관련
  'SESSION_EXPIRED': 'auth.sessionExpired',
  'TOKEN_EXPIRED': 'auth.tokenExpired',
  'TOKEN_REFRESH_FAILED': 'auth.tokenRefreshFailed',
  'INVALID_ACCESS_TOKEN': 'auth.invalidAccessToken',
  'NO_ACCESS_TOKEN': 'auth.noAccessToken',
  'OAUTH_FAILED': 'auth.oauthFailed',
  
  // API 일반
  'API_REQUEST_FAILED': 'auth.apiRequestFailed',
}
