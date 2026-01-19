# FM 프로젝트 분석 보고서

## 1. 프로젝트 개요

이 프로젝트는 '멘트(Ment)'라고 불리는 한국어-라오스어 번역 콘텐츠를 관리하는 웹 애플리케이션입니다. 사용자는 멘트를 조회, 검색, 북마크할 수 있으며 새로운 멘트를 등록 요청할 수 있습니다. 관리자는 사용자가 요청한 멘트를 승인 또는 거절하는 관리 기능을 수행합니다.

**주요 기능:**
- **인증:** 자체 ID/PW 회원가입 및 로그인, Google 소셜 로그인
- **멘트 관리:** 멘트 목록 조회, 생성, 상세 보기
- **관리자 기능:** 생성 요청된 멘트 승인/거절, 관리자/사용자 모드 전환
- **부가 기능:** 태그 기반 필터링, 북마크

---

## 2. 기술 아키텍처

### 2.1. 프론트엔드 스택
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **API Client**: Axios

### 2.2. 상태 관리
- 별도의 외부 상태 관리 라이브러리(Redux, Zustand 등) 없이 React 내장 Hooks (`useState`, `useEffect`, `useMemo`)를 중심으로 상태를 관리합니다.
- 인증 정보, 북마크 등 일부 상태는 `localStorage`와 `sessionStorage`를 캐시 또는 영속성 저장소로 활용합니다.

### 2.3. API 통신
- 모든 백엔드 API 요청은 `src/services/api.ts`에 정의된 중앙 Axios 클라이언트를 통해 이루어집니다.
- **핵심 기능: 자동 토큰 갱신**
  - Axios 응답 인터셉터(interceptor)를 사용하여 API 요청이 `401 Unauthorized` 에러를 반환하면, `localStorage`에 저장된 `RefreshToken`을 사용해 새로운 `AccessToken`을 자동으로 재발급 받습니다.
  - 재발급 성공 시, 실패했던 원래 요청을 새로운 토큰으로 다시 시도하여 사용자의 세션을 중단 없이 유지시킵니다.

### 2.4. 인증 전략 (중요)
이 프로젝트는 보안 강화를 위해 AccessToken과 RefreshToken을 분리하여 관리하는 전략을 사용합니다.

- **AccessToken (단기 인증 토큰)**
  - **저장소:** JavaScript 변수 (메모리)
  - **특징:** XSS 공격에 의한 토큰 탈취 위험을 최소화하기 위해 `localStorage`에 저장하지 않습니다. 페이지를 새로고침하면 사라집니다.
- **RefreshToken (장기 인증 토큰)**
  - **저장소:** `localStorage`
  - **특징:** 사용자의 로그인 세션을 유지하는 역할을 합니다. AccessToken이 만료(또는 소실)되었을 때, 이 토큰을 사용해 조용히 새로운 AccessToken을 발급받습니다.

---

## 3. 주요 파일 및 역할

```
src/
├── services/
│   ├── api.ts           # API 통신 중앙 허브 (Axios 클라이언트, 토큰 갱신 인터셉터)
│   └── authService.ts   # Google OAuth 인증 관련 유틸리티 함수
├── storage/
│   └── authStorage.ts   # 인증 토큰 및 사용자 정보 저장/관리 (메모리, localStorage)
├── pages/
│   ├── LoginPage.tsx        # 자체 로그인/회원가입 페이지
│   ├── AuthStartPage.tsx    # Google 로그인 시작 (리다이렉트) 페이지
│   ├── AuthCallbackPage.tsx # Google 로그인 콜백 처리 페이지
│   ├── MentListPage.tsx     # 메인 대시보드 (멘트 목록, 관리자/사용자 모드)
│   ├── MentEditorPage.tsx   # 새 멘트 생성 페이지
│   └── MentDetailPage.tsx   # 멘트 상세 정보 페이지 (일반 사용자 전용)
├── i18n/                    # 다국어(ko, lo) 처리 관련 파일
└── components/              # 공통 UI 컴포넌트
```

---

## 4. 주요 로직 흐름

### 4.1. 인증 흐름
1.  **시작 (`LoginPage`):** 사용자는 자체 계정으로 로그인하거나 'Google로 로그인' 버튼을 클릭합니다.
2.  **Google 인증 (`AuthStartPage`):** 'Google로 로그인' 시, CSRF 방지를 위한 `state` 값을 생성해 `sessionStorage`에 저장한 후, 사용자를 Google 인증 페이지로 리다이렉트합니다.
3.  **콜백 처리 (`AuthCallbackPage`):**
    - Google 인증 후, 사용자는 `/auth/callback` 경로로 돌아옵니다.
    - URL의 `state` 값과 `sessionStorage`의 값을 비교하여 CSRF 공격을 방어합니다.
    - URL의 `code` 값을 백엔드로 전송(`exchangeCodeForToken`)하여 `AccessToken`과 `RefreshToken`을 발급받습니다.
4.  **세션 저장 (`authStorage`):** 발급받은 `AccessToken`은 메모리에, `RefreshToken`은 `localStorage`에 저장하여 로그인 상태를 완료합니다.
5.  **페이지 로드 (`initAuthFromRefresh`):** 앱이 새로고침/재시작될 때, `localStorage`의 `RefreshToken`을 사용해 새로운 `AccessToken`을 발급받아 로그인 상태를 복원합니다.

### 4.2. 데이터 업데이트 전략
`MentListPage.tsx`에서는 사용자 행동에 따라 두 가지 다른 데이터 동기화 전략을 사용합니다.

- **북마크 추가/삭제 시 (Client-Side Update):**
  - API에 북마크 변경을 요청하고 성공 응답을 받으면, **서버에서 전체 목록을 다시 불러오지 않습니다.**
  - 대신, React `state`와 `localStorage`에 저장된 북마크 목록을 직접 수정하여 즉각적인 UI 반응성을 제공합니다.
- **관리자 승인/거절 시 (Server-Side Sync):**
  - API에 승인/거절을 요청하고 성공 응답을 받으면, **서버에서 최신 멘트 목록 전체를 다시 불러와** `state`를 덮어씁니다.
  - 이는 여러 관리자가 동시에 작업할 수 있는 환경에서 데이터 정합성을 확실하게 보장하기 위한 전략입니다.