# fm 프로젝트 온보딩 가이드

> React와 TypeScript 기반의 '멘트' 관리 웹 애플리케이션입니다.

-   **기술 스택(Tech Stack)**
    -   **Frameworks & Libraries**: React 19, React Router 7
    -   **Language**: TypeScript 5.9
    -   **Build & Bundling**: Vite 7
    -   **Styling**: Tailwind CSS 3, lucide-react (아이콘)
    -   **API Communication**: Axios
    -   **Internationalization (i18n)**: i18next, react-i18next
    -   **Linting & Formatting**: ESLint, Prettier (ESLint 플러그인 형태로)

---

## SRC 디렉터리 분석 (핵심 로직)

애플리케이션의 핵심 로직은 `src` 디렉터리에 기능별 그룹으로 구성되어 있습니다.

### 1. Pages (화면 단위 컴포넌트)

사용자가 직접 상호작용하는 최상위 화면 단위 컴포넌트 그룹입니다. 각 페이지는 특정 라우트(`Route`)에 매핑됩니다.

-   `LoginPage.tsx`
    -   **역할 (Role)**: 사용자 로그인 및 회원가입 UI와 로직을 담당합니다.
    -   **로직 (Logic)**:
        1.  `useState`를 통해 '로그인'과 '회원가입' 탭 상태를 관리합니다.
        2.  사용자 입력(ID, 비밀번호 등)을 각각의 `state`에 바인딩합니다.
        3.  '로그인' 또는 '회원가입' 버튼 클릭 시, `services/api.ts`에 정의된 `postLogin` 또는 `postRegister` 함수를 호출하여 서버에 요청을 보냅니다.
        4.  API 요청이 성공하면, 응답으로 받은 토큰과 사용자 정보를 `storage/authStorage.ts`의 `setAuthed` 함수를 통해 저장합니다.
        5.  `react-router-dom`의 `useNavigate`를 사용하여 메인 페이지(`ROUTES.MENTS`)로 리다이렉트시킵니다.
        6.  API 요청 실패 시 에러 메시지를 `state`에 저장하여 사용자에게 보여줍니다.

-   `MentListPage.tsx`
    -   **역할 (Role)**: 애플리케이션의 메인 대시보드. '멘트' 목록을 조회하고 관리하는 핵심 페이지입니다.
    -   **로직 (Logic)**:
        1.  **권한 분기**: `authStorage.ts`의 `isAdmin()` 함수를 통해 사용자가 관리자인지 확인하고, `isAdmin` 상태에 따라 UI 모드를 '사용자 모드'와 '관리자 모드'로 전환합니다.
        2.  **데이터 로딩**: `useEffect` 내에서 `isAdmin` 상태를 감지합니다.
            -   관리자 모드: `getPendingMents()` API를 호출하여 승인 대기 중인 멘트 목록을 가져옵니다.
            -   사용자 모드: `getMentList()` API를 호출하여 승인된 전체 멘트 목록과, `getMyBookmarks()`를 호출하여 북마크 목록을 가져옵니다.
        3.  **필터링**: `useMemo`를 사용하여 성능을 최적화합니다. 사용자가 선택한 태그(`selectedTag`)에 따라 `ments` 배열을 필터링하여 `filteredMents`를 생성합니다.
        4.  **상호작용 (사용자)**:
            -   멘트 클릭 시 `MentDetailPage`로 이동합니다.
            -   북마크 아이콘 클릭 시 `addBookmark`/`deleteBookmark` API를 호출하고, 목록을 다시 불러오지 않고 `bookmarks` 상태를 직접 업데이트하여 즉각적인 UI 피드백을 제공합니다.
        5.  **상호작용 (관리자)**:
            -   '승인'/'거절' 버튼 클릭 시 `approveMent`/`rejectMent` API를 호출합니다.
            -   API 호출 성공 후, 목록을 최신 상태로 갱신하기 위해 `getPendingMents`를 다시 호출합니다.

-   `MentEditorPage.tsx`
    -   **역할 (Role)**: 새로운 '멘트'를 생성하는 페이지입니다.
    -   **로직 (Logic)**:
        1.  **태그 로딩**: `useEffect`를 사용해 페이지 마운트 시 `getMentList` API를 호출하여 기존 멘트들에서 사용된 모든 태그를 가져와 `availableTags` 상태에 저장합니다.
        2.  **입력 처리**: 사용자가 입력한 한글 멘트와 선택한 태그를 `ko`, `tags` 상태에 저장합니다.
        3.  **제출 (Submit)**: '저장' 버튼 클릭 시 `handleSubmit` 함수가 실행됩니다.
        4.  **유효성 검사**: `validate` 함수를 통해 멘트 내용과 태그 선택 여부를 확인합니다.
        5.  **API 호출**: 유효성 검사를 통과하면 `addComment` API를 호출하여 서버에 새로운 멘트 생성을 요청합니다.
        6.  **리다이렉트**: 성공적으로 제출되면 메인 페이지(`ROUTES.MENTS`)로 돌아갑니다.

### 2. Services (외부 통신 및 비즈니스 로직)

애플리케이션의 핵심 비즈니스 로직과 서버 API 통신을 담당하는 파일 그룹입니다.

-   `api.ts` **(매우 중요)**
    -   **역할 (Role)**: 모든 백엔드 API 통신을 중앙에서 관리하는 HTTP 클라이언트입니다. Axios를 기반으로 구현되었습니다.
    -   **로직 (Logic)**:
        1.  **Axios 인스턴스 생성 (`createClient`)**:
            -   `axios.create`를 사용해 공통 설정(baseURL, withCredentials 등)을 가진 클라이언트를 생성합니다.
            -   `.env` 파일의 `VITE_API_BASE_URL`을 `baseURL`로 사용합니다.
        2.  **요청 인터셉터 (Request Interceptor)**: `apiRequest` 함수 내에서 구현됩니다.
            -   `skipAuth: true` 옵션이 없는 모든 요청에 대해 `authStorage.ts`의 `getAuthedToken()`을 호출하여 Access Token을 가져옵니다.
            -   토큰이 존재하면 `Authorization: Bearer <token>` 헤더를 자동으로 추가하여 요청을 보냅니다.
        3.  **응답 인터셉터 (Response Interceptor) - 자동 토큰 갱신**:
            -   API 응답이 **401 Unauthorized** 에러를 반환하면 인터셉터가 이를 가로챕니다.
            -   이 요청이 재시도된 요청이 아닌지 (`_retry` 플래그 확인) 확인하여 무한 루프를 방지합니다.
            -   `authStorage.ts`의 `getRefreshToken()`으로 Refresh Token을 가져옵니다.
            -   가져온 Refresh Token으로 `/refreshtoken` API를 호출하여 새로운 Access Token과 Refresh Token을 발급받습니다.
            -   `authStorage.ts`의 `updateTokens`를 호출하여 새로 발급받은 토큰들을 저장합니다.
            -   **실패했던 원래 요청**의 헤더에 새로운 Access Token을 넣어 **자동으로 재전송**합니다.
            -   이 모든 과정은 사용자 모르게 백그라운드에서 처리되어, 사용자는 세션 만료를 거의 느끼지 못합니다.
        4.  **API 함수 제공**:
            -   `postLogin`, `postRegister`, `getMentList`, `addComment` 등 프로젝트에서 사용하는 모든 API 요청을 각각의 함수로 추상화하여 제공합니다. 각 함수는 내부적으로 `apiRequest`를 호출합니다.

-   `authService.ts`
    -   **역할 (Role)**: Google OAuth 인증 관련 로직을 담당합니다.
    -   **로직 (Logic)**:
        1.  `createOAuthState`: CSRF 공격을 방지하기 위한 임의의 `state` 문자열을 생성합니다. 이 값은 인증 요청 시 사용되며, 콜백 시 동일한 값이 돌아오는지 검증하는 데 쓰입니다.
        2.  `buildGoogleAuthorizeUrl`: `VITE_GOOGLE_CLIENT_ID`, `redirect_uri`, `scope` 등 필요한 파라미터와 생성된 `state` 값을 조합하여 사용자를 리다이렉트시킬 Google 인증 URL을 동적으로 생성합니다.

### 3. Storage (브라우저 저장소 관리)

`localStorage`, `sessionStorage`와 같은 브라우저 저장소를 안전하고 일관성 있게 사용하기 위한 래퍼(Wrapper) 함수 그룹입니다.

-   `authStorage.ts` **(매우 중요)**
    -   **역할 (Role)**: 사용자의 인증 상태(토큰, 프로필 정보)를 관리하는 모든 로직을 캡슐화합니다. 외부에서는 이 파일의 함수들을 통해서만 인증 정보에 접근해야 합니다.
    -   **로직 (Logic)**:
        1.  **토큰 저장 전략**:
            -   **Access Token (`_accessToken`)**: 탈취 위험을 줄이기 위해 `localStorage`가 아닌, 파일 스코프 내의 **자바스크립트 변수(메모리)**에 저장됩니다. 따라서 페이지를 새로고침하면 사라집니다.
            -   **Refresh Token**: 세션 유지를 위해 `localStorage`에 저장됩니다. 페이지를 새로고침해도 유지됩니다.
        2.  `setAuthed(profile, tokens)`: 로그인 성공 시 호출됩니다.
            -   사용자 프로필(`localId`, `username`)은 `localStorage`에 저장합니다.
            -   `tokens.accessToken`은 메모리 변수 `_accessToken`에 할당합니다.
            -   `tokens.refreshToken`은 `localStorage`에 저장합니다.
        3.  `clearAuthed()`: 로그아웃 시 호출됩니다. 메모리의 `_accessToken`과 `localStorage`의 모든 관련 정보를 삭제합니다.
        4.  `isAuthed()`: 사용자의 로그인 여부를 확인합니다. 메모리의 `_accessToken` **또는** `localStorage`의 `refreshToken`이 존재하면 `true`를 반환합니다. 이 덕분에 페이지 새로고침 후에도 로그인 상태가 유지될 수 있습니다.
        5.  `isAdmin()`: **UI 편의성을 위한 클라이언트 측 권한 확인** 로직입니다.
            -   메모리에 있는 `_accessToken`(JWT)을 디코딩합니다.
            -   디코딩된 payload에서 `role: 'ADMIN'`과 같은 관리자 클레임이 있는지 확인합니다.
            -   **주의**: 이 함수는 화면의 일부(예: 관리자 메뉴)를 보여주거나 숨기는 용도로만 사용됩니다. 실제 중요 데이터에 대한 접근 제어는 반드시 **백엔드**에서 이루어져야 합니다.
        6.  `initAuthFromRefresh()` (`api.ts`에서 사용): 앱이 처음 로드될 때 호출됩니다. `localStorage`의 Refresh Token을 사용해 `refreshAccessToken` API를 호출하고, 성공 시 `updateTokens`로 새로운 토큰들을 저장하여 로그인 상태를 복원합니다.

-   `keys.ts`
    -   **역할 (Role)**: `localStorage`에서 사용할 키(key)들을 상수로 정의하여 휴먼 에러를 방지합니다. (현재는 `constants/index.ts`로 통합됨)
    -   **로직 (Logic)**: `export const STORAGE_KEYS = { auth: { ... }, app: { ... } }` 와 같이 객체 형태로 키를 관리하여 자동 완성을 지원하고 오타를 방지합니다.

### 4. 기타 주요 디렉터리

-   **i18n**: 다국어 지원(Internationalization) 설정.
    -   `config.ts`: `i18next`를 초기화합니다. `localStorage`에 저장된 언어 설정을 읽어와 초기 언어를 설정하고, 언어가 변경될 때마다 `localStorage`에 저장합니다.
    -   `locales/`: `ko.json`, `lo.json` 등 언어별 번역 파일이 위치합니다.

-   **utils**: 프로젝트 전반에서 사용되는 유틸리티 함수.
    -   `cn.ts`: 여러 개의 Tailwind CSS 클래스 이름을 조건부로 결합해주는 유틸리티 함수입니다. `clsx`나 `classnames` 라이브러리와 유사한 역할을 합니다.

---

## 루트 설정 파일 (Root Config)

프로젝트의 빌드, 개발 환경, TypeScript 및 스타일링 동작을 정의하는 파일들입니다.

-   `vite.config.ts`
    -   **역할**: Vite 프로젝트의 핵심 설정 파일입니다.
    -   **프로젝트에 미치는 영향**:
        -   `plugins: [react()]`: React 코드를 브라우저가 이해할 수 있는 JavaScript로 변환하고, Fast Refresh(빠른 새로고침) 같은 개발 편의 기능을 활성화합니다.
        -   `server.proxy`: 개발 서버에서 `/api`로 시작하는 모든 요청을 `.env` 파일에 정의된 `VITE_API_BASE_URL` 주소로 전달(proxy)합니다. 이를 통해 개발 중 CORS(Cross-Origin Resource Sharing) 에러를 우회할 수 있습니다.

-   `tailwind.config.cjs`
    -   **역할**: Tailwind CSS의 동작을 설정합니다.
    -   **프로젝트에 미치는 영향**:
        -   `content: ['./index.html', './src/**/*.{ts,tsx}']`: Tailwind가 어떤 파일들을 스캔하여 사용 중인 클래스를 찾아낼지 지정합니다. 여기에 명시된 파일들에서 사용된 클래스만 최종 CSS 번들에 포함되어 파일 크기를 최적화합니다.

-   `tsconfig.json`
    -   **역할**: TypeScript 컴파일러의 전체적인 동작을 조율하는 루트 설정 파일입니다.
    -   **프로젝트에 미치는 영향**:
        -   실제 컴파일 규칙은 이 파일에 직접 명시되지 않고, `references`를 통해 `tsconfig.app.json`(애플리케이션 소스 코드용)과 `tsconfig.node.json`(Vite 설정 파일 등 Node.js 환경에서 실행되는 파일용)을 참조하도록 구성되어 있습니다. 이를 통해 각 환경에 맞는 TypeScript 규칙을 분리하여 적용할 수 있습니다.
