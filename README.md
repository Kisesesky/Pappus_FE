This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
/
├─ app/                            # Next.js App Router 루트 (페이지 라우팅)
│   ├─ api/                        ├─ # 서버 API 라우트 디렉터리
│   │   ├─ channels/               │  ├─ # 채널 관련 API 라우트 (예: 채널 목록, 생성, 수정)
│   │   │   └─ route.ts            │  │  └─ # channels API 엔드포인트 구현
│   │   └─ messages/               │  ├─ # 메시지 관련 API 라우트
│   │       └─ route.ts            │  │  └─ # messages API 엔드포인트 구현
│   ├─ app/                        ├─ # 실제 앱 대시보드 내부 페이지 루트
│   │   ├─ chat/                   │  ├─ # 채팅 페이지 루트 (채팅 UI)
│   │   │   ├─ layout.tsx          │  │  ├─ # 채팅 layout 컴포넌트
│   │   │   └─ page.tsx            │  │  └─ # 채팅 페이지 컴포넌트
│   │   ├─ issues/                 │  ├─ # 프로젝트 관리(Kanban) 페이지
│   │   │   ├─ [id]                │  │  ├─ # 특정 이슈 상세 페이지 라우트
│   │   │   │   └─ page.tsx        │  │  │  └─ # 개별 이슈 상세 보기 페이지
│   │   │   ├─ layout.tsx          │  │  ├─ # Kanban layout 컴포넌트
│   │   │   └─ page.tsx            │  │  └─ # Kanban 페이지 컴포넌트
│   │   ├─ dashboard/              │  ├─ # 대비소드 관리 페이지
│   │   │   ├─ layout.tsx          │  │  ├─ # Kanban layout 컴포넌트
│   │   │   └─ page.tsx            │  │  └─ # 대시보드 페이지 컴포넌트
│   │   ├─ docs/                   │  ├─ # 문서 관리 (노션 스타일) 페이지 
│   │   │   ├─ layout.tsx          │  │  ├─ # 문서 layout 컴포넌트
│   │   │   └─ page.tsx            │  │  └─ # 문서 페이지 컴포넌트
│   │   ├─ calendar/               │  ├─ # 캘린더 보기용 페이지 루트
│   │   │   ├─ layout.tsx          │  │  ├─ # 캘린더 layout 컴포넌트
│   │   │   └─ page.tsx            │  │  └─ # 캘린더 페이지 컴포넌트
│   │   └─ layout.tsx              │  └─ # Sidebar, Topbar, RightPanel 포함한 앱 레이아웃 컴포넌트
│   ├─ favicon.ico                 ├─ # 사이트 파비콘 아이콘
│   ├─ globals.css                 ├─ # Tailwind CSS 전역 스타일 정의
│   ├─ layout.tsx                  ├─ # 전체 루트 레이아웃 (앱 최상위)
│   └─ page.tsx                    └─ # 최상위 루트 페이지, "/" → "/app/chat"으로 리디렉션 처리
│
├─ components/                     # 앱 전반에 쓰이는 UI 컴포넌트 디렉터리
│   ├─ chat/                       ├─ # 채팅 관련 컴포넌트 모음
│   │   ├─ ChannelModals.tsx       │  ├─ # 채널 생성/편집/삭제용 모달
│   │   ├─ ChannelSettingsModal.tsx│  ├─ # 채널 설정 모달
│   │   ├─ ChatRightPanel.tsx      │  ├─ # 채팅의 우측 패널(스레드, 파일, 사용자 등)
│   │   ├─ CodeFencePreview.tsx    │  ├─ # 코드 블록 미리보기 컴포넌트
│   │   ├─ CommandPalette.tsx      │  ├─ #채팅 내 명령 팔레트 (단축기 명령 UI)
│   │   ├─ Composer.tsx            │  ├─ # 채팅 입력창 컴포넌트
│   │   ├─ EmojiPicker.tsx         │  ├─ # 이모지 선택
│   │   ├─ FilesPanel.tsx          │  ├─ # 채널 내 공유 파일 목록 패널
│   │   ├─ HuddleBar.tsx           │  ├─ # 음성/화상 대화 바로가기 바
│   │   ├─ Lightbox.tsx            │  ├─ # 이미지 확대 보기용 라이트박스
│   │   ├─ LinkPreview.tsx         │  ├─ # 링크 미리보기 카드
│   │   ├─ LiveReadersBar.tsx      │  ├─ # 현재 읽고 있는 사용자 목록 표시
│   │   ├─ MarkdownPopover.tsx     │  ├─ # 마크다운 포맷팅 도움말 팝오버
│   │   ├─ MentionPopover.tsx      │  ├─ # 사용자 멘션 자동완성 팝오버
│   │   ├─ MessageContextMenu.tsx  │  ├─ # 메시지 우클릭 컨텍스트 메뉴
│   │   ├─ PinManager.tsx          │  ├─ # 고정 메시지 관리 UI
│   │   ├─ ProfilePopover.tsx      │  ├─ # 사용자 프로필 팝오버
│   │   ├─ ReactionBar.tsx         │  ├─ # 메시지 리액션 바 컴포넌트
│   │   ├─ ReadBy.tsx              │  ├─ # 메시지 읽은 사용자 목록, 표시
│   │   ├─ SavedModal.tsx          │  ├─ # 저장 메시지 전달
│   │   ├─ SearchPanel.tsx         │  ├─ # 채팅 내 검색 패널
│   │   └─ SlashCommands.ts        │  └─ #  채티이 슬래시 명령 처리 로직
│   ├─ command/                    ├─ # 명령 팔레트 및 명령 관련 UI 컴포넌트
│   │   ├─ CommandPalette.tsx      │  ├─ # 명령어 검색 및 실행 UI
│   │   └─ Highlight.tsx           │  └─ # 텍스트 하이라이트용 UI 컴포넌트
│   ├─ common/                     ├─ # 
│   │   └─ Modal.tsx               │  └─ 
│   ├─ docs/                       ├─ # 문서 편집/관리 관련 UI 컴포넌트
│   │   ├─ DocEditorContext.tsx    │  ├─ # TipTap 문서 에디터 컨텍스트
│   │   ├─ DocsRightPanel.tsx      │  ├─ # 문서 오른쪽 패널 (버전/댓글 등)
│   │   └─ SlashMenu.tsx           │  └─ # 슬래시 명령어 메뉴(문서 내 단축명령)
│   ├─ issues/                     ├─ # 프로젝트/이슈 관련 UI 컴포넌트
│   │   ├─ IssueDetails.tsx        │  ├─ # 이슈 상세 표시 컴포넌트
│   │   ├─ NewIssueDialog.tsx      │  ├─ # 신규 이슈 생성 모달 컴포넌트
│   │   └─ SprintStats.tsx         │  └─ # 스프린트 진행 현황 컴포넌트
│   ├─ layout/                     ├─ # 공통 레이아웃 컴포넌트
│   │   └─ AppShell.tsx            │  └─ # 앱의 기본 틀, 레이아웃 래퍼
│   ├─ providers/                  ├─ # 
│   │   └─ ModalHost.tsx           │  └─ # 
│   ├─ ui/                         ├─ # 각종 공용 UI 컴포넌트 (버튼, 입력창, 토스트 알림 등)
│   │   ├─ button.tsx              │  ├─ # 버튼 컴포넌트
│   │   ├─ Drawer.tsx              │  ├─ # 모바일용 드로어 패널 컴포넌트
│   │   ├─ input.tsx               │  ├─ # 입력창 컴포넌트
│   │   ├─ Tabs.tsx                │  ├─ # 탭 전환 UI 컴포넌트
│   │   ├─ ThemeToggle.tsx         │  ├─ # 다크/라이트 모드 전환 토글
│   │   └─ Toast.tsx               │  └─ # 토스트 알림 컴포넌트
│   ├─ views/                      ├─ # 페이지별 핵심 뷰 컴포넌트 모음 (각 기능별 주 뷰)
│   │   ├─ calendar/               │  ├─ # 캘린더 뷰 컴포넌트 모음
│   │   │   └─ CalendarView.tsx    │  │  └─ # 캘린더 주 뷰 컴포넌트
│   │   ├─ chat/                   │  ├─ # 채팅 뷰 컴포넌트 모음
│   │   │   └─ ChatView.tsx        │  │  └─ # 채팅 주 뷰 컴포넌트
│   │   ├─ dashboard/              │  ├─ # 대시보드 뷰 컴포넌트 모음
│   │   │   └─ DashboardView.tsx   │  │  └─ # 대시보드 주 뷰 컴포넌트
│   │   ├─ docs/                   │  ├─ # 문서 뷰 컴포넌트 모음
│   │   │   └─ DocView.tsx         │  │  └─ # 문서 편집 및 표시 주 뷰 컴포넌트
│   │   ├─ issues/                 │  ├─ # 이슈(프로젝트 관리) 뷰 컴포넌트 모음
│   │   │   └─ KanbanView.tsx      │  │  └─ # Kanban 보드 뷰 
│   │   ├─ settings/               │  ├─ # 
│   │   │   ├─ DashboardSett       │  │  │
│   │   │   │  ingsModal.tsx       │  │  ├─ # 
│   │   │   └─ SettingsModal.tsx   │  │  └─ # 
│   │   └─ index.tsx               │  └─ # Chat/Kanban/Doc/Calendar 컴포넌트 모음 및 export
│   ├─ Sidebar.tsx                 ├─ # 좌측 워크스페이스 및 채널 목록 사이드바
│   ├─ Topbar.tsx                  ├─ # 상단 검색, 알림, 명령 팔레트 영역
│   └─ RightPanel.tsx              └─ # 우측 스레드 및 AI 패널 영역
│
├─ docs/                           # 문서 관련 정리 및 가이드 파일들
│   └─ ...                          └─ # 상세문서는 직접 읽을수 있도록
│
├─ lib/                            # 각종 유틸리티 및 헬퍼 함수 모음
│   ├─ api.ts                      ├─ # API 호출 함수 모음
│   ├─ commands.ts                 ├─ # 명령 관련 헬퍼 및 함수
│   ├─ kanbanHistory.ts            ├─ # Kanban 보드 히스토리 처리 관련 함수
│   ├─ persist.ts                  ├─ # 로컬 저장소(로컬스토리지 등) 처리 함수
│   ├─ realtime.ts                 ├─ # 실시간 동기화 및 Presence 관련 유팅
│   ├─ search.ts                   ├─ # 검색 기능 지원 함수
│   ├─ socket.ts                   ├─ # WebSocket 통신 함수 및 설정
│   └─ utils.ts                    └─ # tailwind-merge 및 clsx 같이 공용 유틸 함수
│
├─ public/                         # 정적 리소스 (이미지, 아이콘 등)
│
├─ scripts/                        # 자동화 스크립트 모음
│   └─ setup-docs.mjs              └─ # 문서 초기 설정 스크립트
│
├─ store/                          # 전역 상태 관리(주로 zustand 등) 상태 저장소
│   └─ chat.ts                     └─ # 채팅 상태 관리 스토어
│
├─ types/                          # TypeScript 타입 선언 모음
│   ├─ global.d.ts                 ├─ # 전역 타입 선언 및 모듈 선언
│   └─ tiptap-table.d.ts           └─ # TipTap 테이블 관련 타입 선언
│
├─ tailwind.config.ts              # Tailwind CSS 설정 파일 (다크 테마 및 커스텀 설정)
├─ postcss.config.js               # PostCSS 설정 파일
├─ tsconfig.json                   # TypeScript 컴파일러 설정
├─ next.config.mjs                 # Next.js 설정 파일
├─ package.json                    # 프로젝트 의존성 및 스크립트 정의
└─ README.md                       # 프로젝트 전반 안내 문서
```

node scripts/setup-docs.mjs