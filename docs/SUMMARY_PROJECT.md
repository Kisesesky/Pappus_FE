# Flowdash Frontend — 프로젝트 전반 요약

## 1. 아키텍처 개요
- **Next.js 14 (App Router)** 기반 SPA/SSR 혼합 구조, `/app` 폴더에 각 도메인별 레이아웃·페이지 배치.
- **TypeScript + TailwindCSS**로 UI 레이어 구성, 공통 다크 톤 색상은 `tailwind.config.ts`에서 정의.
- 전역 상태는 **Zustand(store/chat.ts)**로 관리, 로컬스토리지 퍼시스트(`lib/persist.ts`)를 통해 백엔드 없이 데이터 유지.
- 문서 작업/빌드 로그는 `/docs` 폴더에 관리(`README`, `DEVELOPMENT_GUIDE`, `PROJECT_NOTES`, `2025-10-23_summary` 등).

## 2. 라우팅 & 레이아웃
- `/app/layout.tsx` → 전역 `<html lang="ko">` 래퍼.
- `/app/app/layout.tsx` → 하위 페이지에 공통적으로 AppShell을 입히기 위한 중간 레이아웃.
- 도메인별 라우트  
  - `/app/chat`: 채팅 뷰 (실제 UI 중심), `ChatLayout`에서 AppShell + Drawer + Right Panel 구성.  
  - `/app/docs`: 문서 에디터, TipTap 기반 뷰.  
  - `/app/issues`: 칸반 보드, DnD-kit 기반.  
  - `/app/calendar`: 일정 페이지(현재 정적).  
- Routes 외에도 `/api/*` mock 핸들러가 존재하며 프론트 전용 개발 흐름을 지원.

## 3. 핵심 UI 컴포넌트
- `components/layout/AppShell.tsx` : Sidebar / Topbar / RightPanel 슬롯을 받아 레이아웃 구성.
- `components/Sidebar.tsx` : 워크스페이스·채널 섹션 UI, 섹션 접힘 상태와 DM 생성 등을 지원.
- `components/views/chat/ChatView.tsx` : 메시지 리스트, Thread, CommandPalette, Pin/Saved 관리 등 주요 UX가 집중된 파일.
- `components/chat/*` : 채팅 관련 세부 컴포넌트(Composer, EmojiPicker, MentionPopover, ReactionBar, FilesPanel 등) 분리 구현.
- `components/views/docs/DocView.tsx` : TipTap 에디터 확장(테이블, 코드 블록, 히스토리 등) 포함.
- `components/views/issues/KanbanView.tsx` : 로컬스토리지 기반 칸반 + undo/redo.

## 4. 상태 관리(store/chat.ts)
- `workspaceId`, `workspaces`, `allChannels` 등 Slack 스타일 구조 도입.  
  - 섹션(`WorkspaceSection`) 단위로 즐겨찾기·채널·DM 관리, collapsed 상태를 저장.
- `channels`, `channelMembers`, `messages`, `threadFor`, `pinnedByChannel`, `savedByUser` 등을 관리하며 `BroadcastChannel`로 기본 실시간 동기화.
- `setWorkspace`, `setChannel`, `createChannel`, `inviteToChannel`, `toggleSectionCollapsed` 등 고수준 액션 다수 제공.
- 메시지 전송/수정/삭제, 리액션, 핀, 저장, 타이핑 표시, 하들 상태 등 채팅 전반 기능 포함.

## 5. 라이브러리 & 도구
- **UI/UX**: Tailwind, lucide-react 아이콘, Radix UI 컴포넌트(Modal, Popover 등).  
- **에디터**: TipTap + lowlight(Highlight.js), 커스텀 노드/명령(Attachment, SlashMenu 등).  
- **DnD**: @dnd-kit/core (Issues 보드).  
- **상태/저장**: zustand + 브라우저 LocalStorage.  
- **빌드/도구**: ESLint, TypeScript, PostCSS.  
- **테스트 프레임워크 정의**: package.json에 Vitest/Playwright 의존성은 아직 없음(향후 계획 문서화).  
- **스크립트**: `scripts/setup-docs.mjs` — 문서 자동 생성(mkdocs 느낌).

## 6. 최근 작업(2025-10-23)
- 채팅 헤더/메시지 인터랙션을 Slack/Discord 스타일로 리디자인 (부드러운 Hover·애니메이션, DM/멤버 정보 강화).  
- 워크스페이스/채널 구조를 store + Sidebar에서 지원하도록 리팩터링.  
- SSR 안전성 확보: `localStorage`/`window` 접근에 typeof 검사 적용.  
- TipTap Table import 방식 정리, `EmojiPicker` 트리거 커스터마이즈 지원.  
- `npm run build` 성공 (ESLint `next/typescript` 프리셋 누락은 별도 해결 필요).

## 7. 문서 & 유지보수 노트
- **docs/**:  
  - `README.md` : 프로젝트 개요/목표/디렉터리 구조/로드맵.  
  - `DEV_GUIDE.md`, `DEVELOPMENT_GUIDE.md`: 기술 스택, 도메인별 구현 가이드, 상태 스토리지 키, 테스트 전략 등.  
  - `PROJECT_LOG.md`, `PROJECT_NOTES.md`, `CONVERSATION_LOG.md`: 작업/대화 히스토리.  
  - `2025-10-23_summary.md`: 최근 변경(채팅 UI 리팩터링 등).  
  - `SUMMARY_PROJECT.md` (본 문서): 코드 구조/의존성 요약.
- **빌드/검증**: `npm run build` → 성공. 단, ESLint 실행 시 `next/typescript` 프리셋을 찾지 못하는 이슈가 있으므로 설정 보완 필요.

## 8. 향후 제안
1. ESLint 설정 보정 (`next/typescript` 프리셋 제공 or config 조정).  
2. 실시간 Presence/WebSocket 교체 설계 적용, BroadcastChannel mock 유지.  
3. QA: 브라우저에서 새 채팅 헤더/호버/애니메이션 시각 검수.  
4. Docs 보강: API 스펙, UI 스타일 가이드 추가 예정(`PROJECT_NOTES.md` 참고).  
5. 테스트 자동화 도입(Playwright 시나리오, Vitest 컴포넌트 테스트).
