import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'
import { getAuthedToken, getRefreshToken, clearAuthed, updateTokens } from '../storage/authStorage'
import type { AuthResponse, MentItem, TranslateResponse, ApiInit, BookmarkItem, LoginPayload, RegisterPayload, RefreshTokenPayload, AddCommentPayload, TranslatePayload } from '../types'

// Axios config에 커스텀 플래그 추가를 위한 타입 확장
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  skipAuth?: boolean
}

// 기존 코드 호환성을 위해 re-export
export type { AuthResponse, MentItem, TranslateResponse, BookmarkItem, LoginPayload, RegisterPayload, AddCommentPayload, TranslatePayload }

function ensureApiBase(): string { //base URL 결정
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined

  if (!base) throw new Error('VITE_API_BASE_URL environment variable is not set')
  return base
}
function createClient(baseURL: string): AxiosInstance { // Axios 인스턴스 생성
  const client = axios.create({
    baseURL, //base URL 설정
    withCredentials: true, //쿠키 포함
    headers: { 'Content-Type': 'application/json' }, //기본 헤더 설정
  })

  // 401 에러 시 자동 리프레시 토큰 갱신 및 재시도
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as CustomAxiosRequestConfig

      // skipAuth 또는 특정 경로는 리프레시 제외
      const skipRefresh = originalRequest.skipAuth || 
                            originalRequest.url?.includes('/login') ||
                            originalRequest.url?.includes('/register') ||
                            originalRequest.url?.includes('/ment/list')

      // 401 에러이고, 재시도하지 않은 요청이며, refresh 대상인 경우
      if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
        originalRequest._retry = true

        try {
          const refreshToken = getRefreshToken()
          if (!refreshToken) {
            console.error('No refresh token - logging out')
            clearAuthed()
            window.location.href = '/login'
            return Promise.reject(new Error('SESSION_EXPIRED'))
          }

          console.log('Attempting to refresh access token...')
          
          // refresh token으로 새로운 access token 요청
          const response = await refreshAccessToken({ refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = response

          if (!accessToken) {
            throw new Error('TOKEN_REFRESH_FAILED')
          }

          console.log('Token refresh successful')

          // 새로운 토큰 저장
          updateTokens(accessToken, newRefreshToken || refreshToken)

          // 원래 요청의 헤더를 새 토큰으로 업데이트
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          // 원래 요청 재시도
          return client(originalRequest)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          clearAuthed()
          window.location.href = '/login'
          return Promise.reject(new Error('TOKEN_REFRESH_FAILED'))
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}
function getClient(baseOverride?: string): AxiosInstance {
  const base = baseOverride ?? ensureApiBase()
  return createClient(base)
}


async function apiRequest<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { baseOverride, skipAuth, method = 'GET', body, signal } = init
  const client = getClient(baseOverride)

  const headers: AxiosRequestHeaders = new AxiosHeaders({ 'Content-Type': 'application/json', ...(init.headers ?? {}) })
  if (!skipAuth) {
    const token = init.token ?? getAuthedToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  try {
    const res = await client.request<T>({
      url: path,
      method,
      data: body,
      signal,
      headers,
      skipAuth, // 인터셉터에서 사용하기 위해 전달
    } as CustomAxiosRequestConfig)
    return res.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // 서버에서 제공한 에러 메시지 우선, 없으면 에러 코드 사용
      const message =
        typeof err.response?.data === 'object' && err.response?.data !== null && 'message' in (err.response?.data as object)
          ? String((err.response?.data as { message?: unknown }).message)
          : err.message || 'API_REQUEST_FAILED'
      throw new Error(message)
    }
    throw err instanceof Error ? err : new Error('API_REQUEST_FAILED')
  }
}

export async function postLogin(payload: LoginPayload): Promise<AuthResponse> {
  // 로컬(이메일/비번) 로그인 엔드포인트
  return apiRequest<AuthResponse>('/login', { method: 'POST', body: payload, skipAuth: true })
}

export async function postRegister(payload: RegisterPayload): Promise<AuthResponse> {
  //로컬 회원가입
  return apiRequest<AuthResponse>('/register', { method: 'POST', body: payload, skipAuth: true })
}

export async function refreshAccessToken(payload: RefreshTokenPayload): Promise<AuthResponse> {
  // 백엔드가 헤더 `authorization-refresh`로 토큰을 받는 구현에 맞춤
  return apiRequest<AuthResponse>('/refreshtoken', {
    method: 'POST',
    skipAuth: true,
    headers: { 'authorization-refresh': payload.refreshToken },
  })
}

export async function logout(): Promise<void> {
//로그아웃
  await apiRequest<void>(`/logout`, { method: 'POST' })
}

export async function deletedAccount(): Promise<void> {
  // 회원탈퇴
  await apiRequest<void>('/delete/user', { method: 'DELETE' })
}

/**
 * Google OAuth 토큰 교환
 * 인증 코드를 백엔드에 전송하여 accessToken과 refreshToken을 받음
 * 주의: 이 요청은 로그인 전이므로 Authorization 헤더를 보내지 않음
 */
export async function exchangeCodeForToken(code: string): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>('/oauth/callback/google', {
      method: 'POST',
      body: { code },
      skipAuth: true,
    })
    
    if (!response.accessToken) {
      throw new Error('INVALID_ACCESS_TOKEN')
    }
    
    return response
  } catch (error) {
    console.error('OAuth token exchange failed:', error)
    throw error instanceof Error ? error : new Error('OAUTH_FAILED')
  }
}

export async function getMentList(): Promise<MentItem[]> {
  return apiRequest<MentItem[]>('/ment/list', { method: 'GET' })
}

// 멘트 추가 (원문만 전송)
export async function addComment(payload: AddCommentPayload): Promise<{ tag: string; contentKo: string }> {
  return apiRequest<{ tag: string; contentKo: string }>('/request/comment', { 
    method: 'POST', 
    body: payload 
  })
}

// 즐겨찾기 목록 조회


export async function translateComment(payload: TranslatePayload): Promise<string> {
  // 한국어 → 라오스어 번역
  const response = await apiRequest<TranslateResponse>('/translate', { 
    method: 'POST', 
    body: payload 
  })
  
  // content는 JSON 문자열이므로 파싱
  try {
    const parsed = JSON.parse(response.content) as { translation?: string }
    return parsed.translation || ''
  } catch {
    return ''
  }
}

// ============================
// 관리자 전용 API
// ============================

// 승인 대기 목록 조회 (관리자 전용)
export async function getPendingMents(): Promise<MentItem[]> {
  return apiRequest<MentItem[]>('/admin/ment/pending', { method: 'GET' })
}

// 멘트 승인 (관리자 전용)
export async function approveMent(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/add/comment?mentId=${mentId}`, { 
    method: 'POST' 
  })
}

// 멘트 거절 (관리자 전용)
export async function rejectMent(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/request/negative?mentId=${mentId}`, { 
    method: 'POST'
  })
}
// ============================

// 북마크 추가
export async function addBookmark(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/add/bookmark?mentId=${mentId}`, { 
    method: 'POST' 
  })
}

// 북마크 삭제
export async function deleteBookmark(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/delete/bookmark?mentId=${mentId}`, { 
    method: 'DELETE' 
  })
}

// 내 북마크 목록 조회
export async function getMyBookmarks(): Promise<BookmarkItem[]> {
  return apiRequest<BookmarkItem[]>('/my/bookmarks', { method: 'GET' })
}

/**
 * 앱 시작 시 로컬에 저장된 refresh token으로 access token을 초기화합니다.
 * 성공하면 true, 실패하거나 토큰이 없으면 false를 반환합니다.
 */
export async function initAuthFromRefresh(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const resp = await refreshAccessToken({ refreshToken })
    const { accessToken, refreshToken: newRefreshToken } = resp
    if (!accessToken) return false

    updateTokens(accessToken, newRefreshToken || refreshToken)
    return true
  } catch (err) {
    console.error('initAuthFromRefresh failed:', err)
    clearAuthed()
    return false
  }
}