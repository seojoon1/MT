# FM (Ment) — 프로젝트 개요 및 주요 로직

간단 설명
- 멘트(Ment)를 등록/조회/북마크하고, 관리자가 승인/거절하는 웹 애플리케이션입니다. 등록된 멘트는 제미나이 api를 통해 자동 번역됩니다.
- 기술 스택: React + TypeScript + Vite + TailwindCSS
- 중앙 API 클라이언트: `src/services/api.ts` (Axios 기반)

빠른 시작
- 개발 서버

```bash
npm install
npm run dev
```

- 빌드

```bash
npm run build
```

환경 변수
- `VITE_API_BASE_URL`을 설정해야 백엔드 API에 연결됩니다.

핵심 파일 및 역할
- `src/services/api.ts` — Axios 클라이언트를 생성하고 전역 API 호출을 관리합니다.
  - 인증 토큰 자동 추가 및 401 발생 시 Refresh Token으로 자동 갱신 로직 포함
  - 번역 응답의 다양한 포맷(plain string, JSON 문자열, fenced code block)을 안정적으로 파싱하는 `parseTranslationContent` 보유
  - 주요 함수: `apiRequest`, `getMentList`, `getPendingMents`, `translateComment`, `initAuthFromRefresh`
- `src/storage/authStorage.ts` — Access/Refresh 토큰 및 사용자 정보 저장·조회 로직
- `src/pages/*` — 앱의 화면 구성 (로그인, 멘트 목록, 멘트 작성, 상세, 관리자 대기 목록 등)
- `src/components/*` — 재사용 UI 컴포넌트 및 레이아웃

중요 로직 요약

1) 인증 및 세션 복원
- 앱 초기화 시 `initAuthFromRefresh`를 통해 로컬의 Refresh Token으로 Access Token 재발급을 시도합니다.
- Access Token은 요청 헤더에 자동 첨부되며, 만료 시 인터셉터가 재발급 후 실패했던 요청을 자동 재시도합니다.

2) 번역(content) 파싱 안정성
- 백엔드에서 반환하는 `content` 필드는 여러 형태로 올 수 있습니다:
  - 단순 문자열
  - JSON 문자열: `{"translation":"..."}`
  - fenced code block (```json ... ```)
  - 중첩 이스케이프된 JSON
- 이를 안전하게 처리하기 위해 `parseTranslationContent`가 도입되었습니다. 이 유틸은 코드블록을 벗겨내고(```json ... ```), 중첩된 JSON을 최대 수 회까지 언랩하여 최종 번역 문자열을 반환합니다.

3) 멘트 목록 전처리
- `getMentList`와 `getPendingMents`는 서버 응답의 `contentLo`를 받아 `parseTranslationContent`로 정리한 후 반환합니다. UI는 항상 정제된 문자열을 기대할 수 있습니다.

4) 관리자 워크플로우
- 관리자 전용 엔드포인트(`getPendingMents`, `approveMent`, `rejectMent`)를 통해 승인/거절 작업을 수행합니다.
- 클라이언트는 관리자 여부를 간단히 체크하여 UI를 분기하지만, 실제 권한 검증은 서버가 책임집니다.

개발·운영 팁
- 로컬 개발 시 Vite의 프록시 설정을 확인하여 API 호출이 올바르게 전달되는지 확인하세요 (`vite.config.ts`).
- i18n 설정은 `src/i18n/*`에 있으며, 언어별 문자열은 `src/i18n/locales`에 위치합니다.
- 번역 API 응답 샘플이 다양하므로, 새로운 응답 형태가 생기면 `parseTranslationContent`를 확장해 주세요.

테스트 및 검증 권장 절차
- 변경 후 `npm run dev`로 앱을 띄운 다음, 멘트 목록과 관리자 대기 목록에서 `contentLo`가 올바르게 표시되는지 확인하세요.
- 자동화된 유닛 테스트 추가 권장: `parseTranslationContent`에 대해 다양한 포맷(plain, JSON string, fenced block, nested JSON)에 대한 테스트를 작성하세요.

참고 파일
- `src/services/api.ts`
- `src/storage/authStorage.ts`
- `src/pages/MentListPage.tsx`
- `src/pages/MentDetailPage.tsx`
- `vite.config.ts`
