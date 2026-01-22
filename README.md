# Laos Flirt - 웹 애플리케이션 프런트엔드

## 1. 프로젝트 개요

**Laos Flirt**는 라오스 사용자를 위한 소셜 상호작용 웹 애플리케이션의 프런트엔드 프로젝트입니다. 사용자는 회원가입 및 로그인을 통해 시스템에 접근하고, 'Ment'라는 핵심 콘텐츠를 생성하고 다른 사용자와 공유할 수 있습니다.

이 프로젝트는 현대적인 웹 개발 기술 스택을 기반으로 구축되었으며, 깔끔하고 직관적인 사용자 인터페이스를 제공하는 것을 목표로 합니다. 또한, 한국어와 라오스어를 모두 지원하는 다국어 기능을 통해 현지 사용자의 접근성을 높였습니다.

## 2. 주요 기능

- **사용자 인증**:
  - JWT (JSON Web Token) 기반의 안전한 로그인 및 회원가입 기능.
  - Refresh Token을 활용한 자동 로그인 유지 기능 (`initAuthFromRefresh`).
  - 인증이 필요한 페이지에 접근 시 자동으로 로그인 페이지로 리디렉션하는 보호된 라우트 (`RequireAuth`).

- **Ment (멘트) 관리**:
  - 사용자는 자신만의 'Ment'를 작성, 조회, 수정할 수 있습니다 (CRUD).
  - 전체 'Ment' 목록을 볼 수 있는 리스트 페이지 (`/ments`).
  - 'Ment'의 상세 내용을 확인하는 상세 페이지 (`/ments/:id`).

- **마이페이지**:
  - 로그인한 사용자는 자신의 프로필 정보 등을 확인할 수 있는 개인화된 공간 (`/mypage`).

- **다국어 지원 (i18n)**:
  - `i18next` 라이브러리를 사용하여 한국어(ko)와 라오스어(lo)를 지원.
  - 사용자의 브라우저 설정이나 선택에 따라 언어 전환 가능.

- **반응형 UI**:
  - Tailwind CSS를 활용하여 모바일, 태블릿, 데스크톱 등 다양한 화면 크기에 대응하는 반응형 레이아웃을 제공합니다.

## 3. 기술 스택

- **프레임워크**: React (v19)
- **언어**: TypeScript
- **빌드 도구**: Vite
- **라우팅**: React Router (v7)
- **상태 관리**: React Hooks (useState, useEffect, useContext)
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios
- **다국어**: i18next, react-i18next
- **아이콘**: Lucide-React
- **코드 품질**: ESLint

## 4. 프로젝트 구조

```
src/
├── App.tsx             # 메인 애플리케이션 컴포넌트, 라우팅 정의
├── main.tsx            # 애플리케이션 진입점
├── assets/             # 이미지, 폰트 등 정적 에셋
├── components/         # 재사용 가능한 UI 컴포넌트
│   ├── common/         # 버튼, 인풋 등 범용 컴포넌트
│   └── layout/         # Header, Navbar 등 레이아웃 컴포넌트
├── constants/          # 애플리케이션 전역 상수
├── i18n/               # 다국어 설정 및 번역 파일
│   ├── config.ts       # i18next 초기화 설정
│   └── locales/        # 언어별 번역 (ko.json, lo.json)
├── pages/              # 각 라우트에 해당하는 페이지 컴포넌트
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   └── MentListPage.tsx
├── services/           # API 연동 및 비즈니스 로직
│   ├── api.ts          # Axios 인스턴스 및 API 호출 함수
│   └── authService.ts  # 인증 관련 서비스 로직
├── storage/            # 로컬 스토리지/세션 스토리지 관리
│   └── authStorage.ts  # 인증 토큰 저장/조회/삭제
├── types/              # TypeScript 타입 및 인터페이스 정의
└── utils/              # 유틸리티 함수
```

## 5. 시작하기

### 5.1. 전제 조건

- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [npm](https://www.npmjs.com/) 또는 [yarn](https://yarnpkg.com/)

### 5.2. 설치 및 실행

1.  **프로젝트 클론**:
    ```bash
    git clone <저장소_URL>
    cd Laos_Frontend_Flirt
    ```

2.  **의존성 설치**:
    ```bash
    npm install
    ```

3.  **개발 서버 실행**:
    ```bash
    npm run dev
    ```
    서버가 실행되면 브라우저에서 `http://localhost:5173` (또는 Vite가 지정한 다른 포트)으로 접속하여 애플리케이션을 확인할 수 있습니다.

### 5.3. 주요 스크립트

- `npm run dev`: 개발 모드로 Vite 서버를 시작합니다.
- `npm run build`: 프로덕션용으로 애플리케이션을 빌드합니다. 결과물은 `dist` 폴더에 생성됩니다.
- `npm run lint`: ESLint를 사용하여 코드 스타일 및 오류를 검사합니다.
- `npm run preview`: 프로덕션 빌드 결과물을 로컬에서 미리 확인합니다.

## 6. 핵심 로직 흐름

### 인증 흐름

1.  **앱 초기화**: 사용자가 앱에 처음 접속하면 `App.tsx`의 `useEffect`가 `initAuthFromRefresh` 함수를 호출합니다.
2.  **토큰 확인**: 이 함수는 스토리지(Local/Session Storage)에 저장된 Refresh Token을 백엔드 API로 보내 새로운 Access Token을 발급받으려고 시도합니다.
3.  **인증 상태 결정**: 토큰 갱신에 성공하면 사용자는 로그인 상태가 되며, 실패하면 비로그인 상태로 앱을 사용하게 됩니다. `isAuthed()` 함수를 통해 이 상태를 확인할 수 있습니다.
4.  **페이지 접근**: 사용자가 `/ments`와 같이 인증이 필요한 페이지로 이동하면 `RequireAuth` 컴포넌트가 `isAuthed()`를 호출하여 인증 상태를 검사하고, 비로그인 상태일 경우 `/login`으로 리디렉션합니다.
