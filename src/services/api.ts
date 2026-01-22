import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'
import { getAuthedToken, getRefreshToken, clearAuthed, updateTokens } from '../storage/authStorage'
import type { AuthResponse, MentItem, TranslateResponse, ApiInit, BookmarkItem, LoginPayload, RegisterPayload, RefreshTokenPayload, AddCommentPayload, TranslatePayload, Profile } from '../types'

/**
 * @file api.ts
 * @description
 * 이 애플리케이션의 모든 백엔드 API 통신을 중앙에서 관리하는 파일입니다.
 * Axios 라이브러리를 기반으로 클라이언트를 생성하고, 다음과 같은 핵심 기능을 수행합니다.
 * 1. API 요청/응답의 공통 처리 (Base URL, Header 등)
 * 2. Access Token 자동 첨부: 인증이 필요한 모든 요청에 자동으로 Access Token을 헤더에 추가합니다.
 * 3. Access Token 자동 갱신: API 요청이 401 Unauthorized 에러를 반환했을 때,
 *    저장된 Refresh Token을 사용해 자동으로 새로운 Access Token을 발급받고, 실패했던 요청을 재시도합니다.
 */


// Axios config에 커스텀 플래그를 추가하기 위한 타입 확장
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean // 토큰 갱신 후 재시도 여부를 나타내는 플래그ㅌ
  skipAuth?: boolean // 인증 헤더(Access Token)를 생략할지 여부를 나타내는 플래그
}

// 기존 코드 호환성을 위해 re-export
export type { AuthResponse, MentItem, TranslateResponse, BookmarkItem, LoginPayload, RegisterPayload, AddCommentPayload, TranslatePayload }

/**
 * 환경변수에서 API 서버의 Base URL을 가져옵니다.
 * 설정되어 있지 않으면 에러를 발생시킵니다.
 */
function ensureApiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!base) throw new Error('VITE_API_BASE_URL environment variable is not set')
  return base
}

/**
 * Axios 인스턴스를 생성하고, 핵심적인 인터셉터 로직을 설정합니다.
 * @param baseURL API 서버의 Base URL
 */
function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true, // 타 도메인 간 요청 시 쿠키 포함 여부
    headers: { 'Content-Type': 'application/json' },
  })

  // --- 응답 인터셉터 (Response Interceptor) ---
  // 자동 토큰 갱신 로직의 핵심입니다.
  client.interceptors.response.use(
    // 성공적인 응답은 그대로 통과시킵니다.
    (response) => response,
    // 에러가 발생한 응답을 처리합니다.
    async (error) => {
      const originalRequest = error.config as CustomAxiosRequestConfig

      // 토큰 갱신을 건너뛰어야 하는 경우 (인증이 필요 없는 요청 등)
      const skipRefresh = originalRequest.skipAuth || 
                            originalRequest.url?.includes('/login') ||
                            originalRequest.url?.includes('/register') ||
                            originalRequest.url?.includes('/ment/list')

      // --- 자동 토큰 갱신 조건 확인 ---
      // 1. 응답 상태가 401(Unauthorized)인가? (Access Token 만료를 의미)
      // 2. 이전에 재시도한 요청이 아닌가? (무한 재시도 방지)
      // 3. 토큰 갱신을 건너뛸 요청이 아닌가?
      if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
        originalRequest._retry = true // 재시도 플래그를 true로 설정

        try {
          const refreshToken = getRefreshToken()
          if (!refreshToken) {
            // Refresh Token이 없으면 세션이 만료된 것이므로, 로그아웃 처리
            console.error('No refresh token - logging out')
            clearAuthed()
            window.location.href = '/login'
            return Promise.reject(new Error('SESSION_EXPIRED'))
          }

          console.log('Attempting to refresh access token...')
          
          // 백엔드에 Refresh Token을 보내 새로운 Access Token을 요청합니다.
          const response = await refreshAccessToken({ refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = response

          if (!accessToken) {
            // 새 토큰 발급에 실패하면, 로그아웃 처리
            throw new Error('TOKEN_REFRESH_FAILED')
          }

          console.log('Token refresh successful')

          // 새로 발급받은 토큰들을 스토리지에 업데이트합니다.
          updateTokens(accessToken, newRefreshToken || refreshToken)

          // 실패했던 원래 요청의 헤더에 새로운 Access Token을 설정합니다.
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          // 수정된 설정으로 원래 요청을 다시 보냅니다.
          return client(originalRequest)
        } catch (refreshError) {
          // 토큰 갱신 과정 자체에서 에러가 발생하면, 로그아웃 처리합니다.
          console.error('Token refresh failed:', refreshError)
          clearAuthed()
          window.location.href = '/login'
          return Promise.reject(new Error('TOKEN_REFRESH_FAILED'))
        }
      }

      // 401 에러가 아니거나, 재시도 조건에 맞지 않으면 에러를 그대로 반환합니다.
      return Promise.reject(error)
    }
  )

  return client
}

/**
 * 설정된 Axios 클라이언트 인스턴스를 가져옵니다.
 */
function getClient(baseOverride?: string): AxiosInstance {
  const base = baseOverride ?? ensureApiBase()
  return createClient(base)
}

/**
 * 모든 API 요청을 처리하는 범용 래퍼 함수입니다.
 * @param path 요청할 API의 경로
 * @param init 요청에 대한 설정 (메서드, 바디, 인증 생략 여부 등)
 */
async function apiRequest<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { baseOverride, skipAuth, method = 'GET', body, signal } = init
  const client = getClient(baseOverride)

  const headers: AxiosRequestHeaders = new AxiosHeaders({ 'Content-Type': 'application/json', ...(init.headers ?? {}) })
  
  // `skipAuth: true`가 아닌 경우, 저장된 Access Token을 Authorization 헤더에 추가합니다.
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
      skipAuth, // 인터셉터에서 사용하기 위해 커스텀 설정을 전달
    } as CustomAxiosRequestConfig)
    return res.data
  } catch (err) {
    // Axios 에러 발생 시, 백엔드가 제공한 에러 메시지를 우선적으로 사용합니다.
    if (axios.isAxiosError(err)) {
      const message =
        typeof err.response?.data === 'object' && err.response?.data !== null && 'message' in (err.response?.data as object)
          ? String((err.response?.data as { message?: unknown }).message)
          : err.message || 'API_REQUEST_FAILED'
      throw new Error(message)
    }
    throw err instanceof Error ? err : new Error('API_REQUEST_FAILED')
  }
}

// =======================================
// API 함수 정의
// =======================================

/** (인증 불필요) 로컬 ID/PW로 로그인합니다. */
export async function postLogin(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/login', { method: 'POST', body: payload, skipAuth: true })
}

/** (인증 불필요) 로컬 ID/PW로 회원가입합니다. */
export async function postRegister(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/register', { method: 'POST', body: payload, skipAuth: true })
}

/** (인증 불필요) Refresh Token으로 새로운 Access Token을 발급받습니다. */
export async function refreshAccessToken(payload: RefreshTokenPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/refreshtoken', {
    method: 'POST',
    skipAuth: true,
    headers: { 'authorization-refresh': payload.refreshToken },
  })
}

/** 로그아웃을 요청합니다. */
export async function logout(): Promise<void> {
  await apiRequest<void>(`/logout`, { method: 'POST' })
}

/** 회원 탈퇴를 요청합니다. */
export async function deletedAccount(): Promise<void> {
  await apiRequest<void>('/delete/user', { method: 'DELETE' })
}

/**
 * (인증 불필요) Google OAuth 인증 코드를 백엔드에 보내 토큰으로 교환합니다.
 * @param code Google로부터 받은 일회용 인증 코드
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

/** 전체 '멘트' 목록을 조회합니다. */
export async function getMentList(): Promise<MentItem[]> {
  const list = await apiRequest<MentItem[]>('/ment/list', { method: 'GET' })
  return list.map((item) => ({
    ...item,
    contentLo: item.contentLo ? parseTranslationContent(item.contentLo) : item.contentLo,
  }))
}

/** 새로운 '멘트'를 추가(요청)합니다. */
export async function addComment(payload: AddCommentPayload): Promise<{ tag: string; contentKo: string }> {
  return apiRequest<{ tag: string; contentKo: string }>('/request/comment', { 
    method: 'POST', 
    body: payload 
  })
}

/** '멘트'를 번역합니다. */
export async function translateComment(payload: TranslatePayload): Promise<string> {
  const response = await apiRequest<TranslateResponse>('/translate', {
    method: 'POST',
    body: payload,
  })

  return parseTranslationContent(response.content)
}

/**
 * Translate API의 `content` 필드를 안정적으로 파싱합니다.
 * 지원되는 형태:
 * - 이미 문자열인 번역 텍스트
 * - JSON 문자열: "{ \"translation\": \"...\" }"
 * - 중첩된 JSON (여러 번 이스케이프된 문자열)
 * - 객체 형태: { translation: string } 또는 { content: string }
 */
function parseTranslationContent(content: unknown): string {
  if (content === null || content === undefined) return ''

  // 이미 객체인 경우
  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>
    if (typeof obj.translation === 'string') return obj.translation
    if (typeof obj.content === 'string') return parseTranslationContent(obj.content)
    // 첫 번째로 발견되는 문자열 값을 반환
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (typeof v === 'string') return v
    }
    return ''
  }

  // 문자열인 경우: JSON으로 파싱을 시도하고, 필요하면 여러 번 언랩
  if (typeof content === 'string') {
    let str = content.trim()

    // 코드 블록 ```json ... ``` 형태로 감싸져 있는 경우 안의 내용을 추출
    if (str.startsWith('```')) {
      // 첫 번째 줄(예: ```json) 이후부터 마지막 ``` 이전까지 가져옵니다.
      const parts = str.split('\n')
      // remove first line if it starts with ```
      if (parts.length >= 2) {
        // find last line that is ``` and remove it
        if (parts[parts.length - 1].trim() === '```') {
          parts.pop()
        }
        parts.shift()
        str = parts.join('\n').trim()
      }
    }

    // 최대 3회까지 중첩 JSON을 언랩합니다.
    for (let i = 0; i < 3; i++) {
      if (!str) return ''
      // 빠른 힌트: JSON 객체/배열로 보이면 파싱 시도
      const first = str[0]
      if (first === '{' || first === '[' || first === '"') {
        try {
          const parsed = JSON.parse(str)
          if (typeof parsed === 'string') {
            str = parsed.trim()
            continue
          }
          if (typeof parsed === 'object' && parsed !== null) {
            const obj = parsed as Record<string, unknown>
            if (typeof obj.translation === 'string') return obj.translation
            if (typeof obj.content === 'string') return parseTranslationContent(obj.content)
            for (const k of Object.keys(obj)) {
              const v = obj[k]
              if (typeof v === 'string') return v
            }
            return ''
          }
          // 숫자/불리언 등 원시값이 나오면 문자열로 반환
          return String(parsed)
        } catch {
          // 파싱 실패하면 그대로 반환
          return str
        }
      }

      // 문자열이 일반 텍스트라면 바로 반환
      return str
    }
    return str
  }

  return ''
}

/** 북마크를 추가합니다. */
export async function addBookmark(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/add/bookmark?mentId=${mentId}`, { 
    method: 'POST' 
  })
}

/** 북마크를 삭제합니다. */
export async function deleteBookmark(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/delete/bookmark?mentId=${mentId}`, { 
    method: 'DELETE' 
  })
}

/** 현재 로그인한 사용자의 북마크 목록을 조회합니다. */
export async function getMyBookmarks(): Promise<BookmarkItem[]> {
  return apiRequest<BookmarkItem[]>('/my/bookmarks', { method: 'GET' })
}

/** 현재 로그인한 사용자의 프로필을 조회합니다. (GET /profile) */
export async function getProfile(): Promise<Profile> {
  return apiRequest<Profile>('/profile', { method: 'GET' })
}


// ============================
// 관리자 전용 API
// ============================

/** (관리자) 승인 대기 중인 '멘트' 목록을 조회합니다. */
export async function getPendingMents(): Promise<MentItem[]> {
  const list = await apiRequest<MentItem[]>('/admin/ment/pending', { method: 'GET' })
  return list.map((item) => ({
    ...item,
    contentLo: item.contentLo ? parseTranslationContent(item.contentLo) : item.contentLo,
  }))
}

/** (관리자) 특정 '멘트'를 승인합니다. */
export async function approveMent(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/add/comment?mentId=${mentId}`, { 
    method: 'POST' 
  })
}

/** (관리자) 특정 '멘트'를 거절합니다. */
export async function rejectMent(mentId: number): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`/request/negative?mentId=${mentId}`, { 
    method: 'POST'
  })
}


// ============================
// 앱 초기화 관련 함수
// ============================

/**
 * 앱 시작 시 호출되는 함수.
 * localStorage에 저장된 Refresh Token으로 새로운 Access Token을 발급받아 로그인 상태를 복원합니다.
 * 이 함수 덕분에 사용자는 페이지를 새로고침해도 로그인이 유지됩니다.
 * @returns {Promise<boolean>} 성공 시 true, 토큰이 없거나 실패 시 false를 반환합니다.
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
    // 초기화 실패 시 저장된 모든 인증 정보를 삭제하여 깨끗한 상태로 만듭니다.
    clearAuthed()
    return false
  }
}