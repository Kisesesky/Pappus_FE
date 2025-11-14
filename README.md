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

```ts
/
├─app/                               # Next.js App Router 루트 (페이지 라우팅)
│  ├─calendar/                       ├─ # 캘린더 보기용 페이지 루트
│  │  ├─layout.tsx                   │  ├─ # 캘린더 layout 컴포넌트
│  │  └─page.tsx                     │  └─ # 캘린더 페이지 컴포넌트
│  ├─chat/                           ├─ # 채팅 페이지 루트 (채팅 UI)
│  │  ├─layout.tsx                   │  ├─ # 채팅 layout 컴포넌트
│  │  └─page.tsx                     │  └─ # 채팅 페이지 컴포넌트
│  ├─dashboard/                      ├─ # 대비소드 관리 페이지
│  │  ├─layout.tsx                   │  ├─ # Kanban layout 컴포넌트
│  │  └─page.tsx                     │  └─ # 대시보드 페이지 컴포넌트
│  ├─docs/                           ├─ # 문서 관리 페이지 
│  │  ├─layout.tsx                   │  ├─ # 문서 layout 컴포넌트
│  │  └─page.tsx                     │  └─ # 문서 페이지 컴포넌트
│  ├─issues/                         ├─ # 프로젝트 관리(Kanban) 페이지
│  │  ├─[id]                         │  ├─ # 특정 이슈 상세 페이지 라우트
│  │  │  └─page.tsx                  │  │  └─ # 개별 이슈 상세 보기 페이지
│  │  ├─layout.tsx                   │  ├─ # Kanban layout 컴포넌트
│  │  └─page.tsx                     │  └─ # Kanban 페이지 컴포넌트
│  ├─members/                        ├─ # 팀 멤버 및 권한 관리 페이지
│  │  ├─layout.tsx                   │  ├─ # 멤버 관리용 레이아웃 (탭: 필터, 정렬, 통계 영역)
│  │  └─page.tsx                     │  └─ # 멤버 목록 페이지 (역할, 상태, 초대관리 UI)
│  ├─setup/                          ├─ # 초기 워크스페이스/조직 세팅 절차
│  │  └─workspace/                   │  └─ # 워크스페이스 생성 단계별 마법사 페이지
│  │     └─page.tsx                  │     └─ 워크스페이스 이름, 멤버 초대, 기본 설정 등 처리
│  ├─worksheet/                      ├─ # 워크시트(작업표/업무 템플릿) 관련 페이지
│  │  ├─[worksheetId]                │  ├─ # 개별 워크시트 상세 페이지 경로
│  │  │  └─page.tsx                  │  │  └─ # 특정 워크시트 상세 보기 컴포넌트
│  │  ├─layout.tsx                   │  ├─ # 워크시트 전용 레이아웃 (사이드바 등)
│  │  └─page.tsx                     │  └─ # 워크시트 리스트 또는 기본 페이지
│  ├─favicon.ico                     ├─ # 사이트 파비콘 아이콘
│  ├─globals.css                     ├─ # Tailwind CSS 전역 스타일 정의
│  ├─layout.tsx                      ├─ # 전체 루트 레이아웃 (앱 최상위)
│  └─page.tsx                        └─ # 최상위 루트 페이지, "/" → "/app/chat"으로 리디렉션 처리
│
├─components/                        # 앱 전반에 쓰이는 UI 컴포넌트 디렉터리
│  ├─calendar/                       ├─ # 캘린더 뷰 컴포넌트 모음
│  │  ├─components/                  │  ├─ # 캘린더 뷰 컴포넌트 모음
│  │  │  ├─AgendaView.tsx            │  │  ├─ # 선택된 날짜 범위(일/주)의 일정 리스트
│  │  │  ├─CalendarCreateModal.tsx   │  │  ├─ # 일정 생성/수정/보기 공용 모달
│  │  │  ├─CalendarDetailPanel.tsx   │  │  ├─ # 캘린더 패널
│  │  │  ├─CalendarHeader.tsx        │  │  ├─ # 상단 네비게이션 바
│  │  │  ├─CalendarManageModal.tsx   │  │  ├─ # 캘린더 설정 관리 UI
│  │  │  ├─CalendarMonthView.tsx     │  │  ├─ # 캘린더 월 뷰 랜더러
│  │  │  ├─CalendarTimeView.tsx      │  │  ├─ # 캐린더뷰 타임라인
│  │  │  ├─DayEventPill.tsx          │  │  ├─ # 캘린더 이벤트 배지
│  │  │  ├─TimelineTask.tsx          │  │  ├─ # 타임라인 일정 블록
│  │  │  └─UpcomingEventCard.tsx     │  │  └─ # 일정카드
│  │  ├─hooks/                       │  ├─ # 캘린더 상태 관리 훅
│  │  │  └─useCalendarState.ts       │  │  └─ # 캘린더 화면에 필요한 생태 관리
│  │  └─CalendarView.tsx             │  └─ # 캘린더 주 뷰 컴포넌트
│  ├─chat/                           ├─ # 채팅 관련 컴포넌트 모음
│  │  ├─view/                        │  ├─ # 채팅 뷰 컴포넌트 (메시지, 스레드 등 처리)
│  │  │  ├─hooks/                    │  │  ├─ # 채팅 상태 관리 및 메시지 단위 훅
│  │  │  │  ├─useChatLifecycle.ts    │  │  │  ├─ # 채팅 세션 초기화/정리 로직
│  │  │  │  └─useMessageSections.ts  │  │  │  └─ # 날짜별 메시지 구간 분리 로직
│  │  │  └─ChatView.tsx              │  │  └─ # 채팅 주 뷰 컴포넌트
│  │  ├─ChannelModals.tsx            │  ├─ # 채널 생성/편집/삭제용 모달
│  │  ├─ChannelSettingsModal.tsx     │  ├─ # 채널 설정 모달
│  │  ├─ChatHeader.tsx               │  ├─ # 채팅의 상단 패널
│  │  ├─ChatRightPanel.tsx           │  ├─ # 채팅의 우측 패널(스레드, 파일, 사용자 등)
│  │  ├─CodeFencePreview.tsx         │  ├─ # 코드 블록 미리보기 컴포넌트
│  │  ├─CommandPalette.tsx           │  ├─ # 채팅 내 명령 팔레트 (단축기 명령 UI)
│  │  ├─Composer.tsx                 │  ├─ # 채팅 입력창 컴포넌트
│  │  ├─EmojiPicker.tsx              │  ├─ # 이모지 선택
│  │  ├─FilesPanel.tsx               │  ├─ # 채널 내 공유 파일 목록 패널
│  │  ├─HuddleBar.tsx                │  ├─ # 음성/화상 대화 바로가기 바
│  │  ├─Lightbox.tsx                 │  ├─ # 이미지 확대 보기용 라이트박스
│  │  ├─LinkPreview.tsx              │  ├─ # 링크 미리보기 카드
│  │  ├─LiveReadersBar.tsx           │  ├─ # 현재 읽고 있는 사용자 목록 표시
│  │  ├─MarkdownText.tsx             │  ├─ # 마크다운 문자
│  │  ├─MarkdownPopover.tsx          │  ├─ # 마크다운 포맷팅 도움말 팝오버
│  │  ├─MentionPopover.tsx           │  ├─ # 사용자 멘션 자동완성 팝오버
│  │  ├─MessageContextMenu.tsx       │  ├─ # 메시지 우클릭 컨텍스트 메뉴
│  │  ├─MessageGroup.tsx             │  ├─ # 그룹핑 메시지
│  │  ├─PinManager.tsx               │  ├─ # 고정 메시지 관리 UI
│  │  ├─ProfilePopover.tsx           │  ├─ # 사용자 프로필 팝오버
│  │  ├─ReactionBar.tsx              │  ├─ # 메시지 리액션 바 컴포넌트
│  │  ├─ReadBy.tsx                   │  ├─ # 메시지 읽은 사용자 목록, 표시
│  │  ├─SavedModal.tsx               │  ├─ # 저장 메시지 전달
│  │  ├─SearchPanel.tsx              │  ├─ # 채팅 내 검색 패널
│  │  ├─SelectionBar.tsx             │  ├─ # 섹션 바
│  │  ├─SlashCommands.ts             │  ├─ # 채팅의 슬래시 명령 처리 로직
│  │  ├─ThreadTeaser.tsx             │  ├─ # 쓰레드 티져
│  │  └─types.ts                     │  └─ # 메세지 타입
│  ├─command/                        ├─ # 명령 팔레트 및 명령 관련 UI 컴포넌트
│  │  ├─CommandPalette.tsx           │  ├─ # 명령어 검색 및 실행 UI
│  │  └─Highlight.tsx                │  └─ # 텍스트 하이라이트용 UI 컴포넌트
│  ├─common/                         ├─ # 공용 유틸 UI 컴포넌트
│  │  └─Modal.tsx                    │  └─ # 기본 모달 래퍼 (전역 스타일/애니메이션 포함)
│  ├─dashboard/                      ├─ # 대시보드 뷰 컴포넌트 모음
│  │  └─DashboardView.tsx            │  └─ # 대시보드 주 뷰 컴포넌트
│  ├─docs/                           ├─ # 문서 편집/관리 관련 UI 컴포넌트
│  │  ├─note-drive/                  │  ├─ # 
│  │  │  ├─CreateFolderModal.tsx     │  │  ├─ # 
│  │  │  ├─DocumentGrid.tsx          │  │  ├─ # 
│  │  │  ├─DocumentTable.tsx         │  │  ├─ # 
│  │  │  ├─FilterMenu.tsx            │  │  ├─ # 
│  │  │  ├─FolderGrid.tsx            │  │  ├─ # 
│  │  │  ├─SortMenu.tsx              │  │  ├─ # 
│  │  │  └─utils.ts                  │  │  └─ # 
│  │  ├─DocEditorContext.tsx         │  ├─ # TipTap 문서 에디터 컨텍스트
│  │  ├─DocDashboard.tsx             │  ├─ # 문서 대시보드
│  │  ├─DocsRightPanel.tsx           │  ├─ # 문서 오른쪽 패널 (버전/댓글 등)
│  │  ├─DocView.tsx                  │  ├─ # 문서 편집 및 표시 주 뷰 컴포넌트
│  │  └─SlashMenu.tsx                │  └─ # 슬래시 명령어 메뉴(문서 내 단축명령)
│  ├─issues/                         ├─ # 프로젝트/이슈 관련 UI 컴포넌트
│  │  ├─kanban/                      │  ├─ # 칸반보드
│  │  │  ├─constants.ts              │  │  ├─ # 칸반보드 상수 모음
│  │  │  ├─date.ts                   │  │  ├─ # 일정 계산
│  │  │  ├─FilterPanel.tsx           │  │  ├─ # 보드 좌/우측 필터 UI
│  │  │  ├─JobSheetDialog.tsx        │  │  ├─ # 작업표 생성/수정 모달
│  │  │  ├─JobSheetSection.tsx       │  │  ├─ # JobSheet 공통 섹션 래퍼
│  │  │  ├─PaintingSections.tsx      │  │  ├─ # 컬러코드
│  │  │  ├─PlanningSection.tsx       │  │  ├─ # 계획 구역
│  │  │  ├─ResourceSection.tsx       │  │  ├─ # 관리 구역
│  │  │  ├─SubcontractSection.tsx    │  │  ├─ # 정보 입력
│  │  │  ├─text.ts                   │  │  ├─ # 문구
│  │  │  ├─types.ts                  │  │  ├─ # 타입
│  │  │  ├─utils.ts                  │  │  ├─ # 유틸
│  │  │  └─validation.ts             │  │  └─ # 검증
│  │  ├─IssueDetails.tsx             │  ├─ # 이슈 상세 표시 컴포넌트
│  │  ├─KanbanView.tsx               │  ├─ # Kanban 보드 뷰 
│  │  ├─NewIssueDialog.tsx           │  ├─ # 신규 이슈 생성 모달 컴포넌트
│  │  ├─RightPanel.tsx               │  ├─ # 오른쪽 판넬
│  │  └─SprintStats.tsx              │  └─ # 스프린트 진행 현황 컴포넌트
│  ├─layout/                         ├─ # 공통 레이아웃 컴포넌트
│  │  ├─AppShell.tsx                 │  ├─ # 앱의 기본 틀, 레이아웃 래퍼
│  │  ├─MobileNavHeader.tsx          │  ├─ # 
│  │  ├─Sidebar.tsx                  │  ├─ # 좌측 워크스페이스 및 채널 목록 사이드바
│  │  └─Topbar.tsx                   │  └─ # 상단 검색, 알림, 명령 팔레트 영역
│  ├─members/                        ├─ # 멤버 관리 관련 UI 컴포넌트
│  │  ├─InviteForm.tsx               │  ├─ # 새 멤버 초대 폼 (이메일 입력/ 역할 선택)
│  │  ├─MemberAvatar.tsx             │  ├─ # 멤버 프로필 이미지/상태 표시
│  │  ├─MemberCard.tsx               │  ├─ # 멤버 개별 카드 (역할, 상태, 권한버튼)
│  │  ├─MemberProfilePanel.tsx       │  ├─ # 개별 멤버 상세 패널 (활동/권한/기여도)
│  │  └─MembersView.tsx              │  └─ # 멤버 리스트 메인 뷰 (검색, 필터, 정렬 포함)
│  ├─providers/                      ├─ # 전역 상태/컨텍스트 제공 컴포넌트
│  │  └─ModalHost.tsx                │  └─ # 전역 모달 컨테이너 (React Portal)
│  ├─settings/                       ├─ # 앱 설정 관련 뷰
│  │  ├─DashboardSettingsModal.tsx   │  ├─ # 대시보드 환경 설정 모달
│  │  └─SettingsModal.tsx            │  └─ # 전역 사용자 설정(테마, 알림 등) 모달
│  ├─setup/                          ├─ # 초기 설정 관련 컴포넌트
│  │  └─WorkspaceWizard.tsx          │  └─ # 워크스페이스 설정 마법사 (단계별 UI)
│  ├─ui/                             ├─ # 각종 공용 UI 컴포넌트 (버튼, 입력창, 토스트 알림 등)
│  │  ├─button.tsx                   │  ├─ # 버튼 컴포넌트
│  │  ├─Drawer.tsx                   │  ├─ # 모바일용 드로어 패널 컴포넌트
│  │  ├─input.tsx                    │  ├─ # 입력창 컴포넌트
│  │  ├─Tabs.tsx                     │  ├─ # 탭 전환 UI 컴포넌트
│  │  ├─ThemeToggle.tsx              │  ├─ # 다크/라이트 모드 전환 토글
│  │  └─Toast.tsx                    │  └─ # 토스트 알림 컴포넌트
│  ├─worksheet/                      ├─ # 워크시트(작업 템플릿/폼) 관련 뷰
│  │  ├─shared.ts                    │  ├─ # 워크시트 공용 상수 및 스타일 유틸
│  │  ├─WorksheetListView.tsx        │  ├─ # 워크시트 목록 화면
│  │  └─WorksheetDetailView.tsx      │  └─ # 워크시트 상세 및 편집 화면
│  └─index.tsx                       └─ # Chat/Kanban/Doc/Calendar 컴포넌트 모음 및 export
│
├─docs/                              # 문서 관련 정리 및 가이드 파일들
│  └─ ...                            └─ # 상세문서는 직접 읽을수 있도록
│
├─hooks/                             # 
│  └─useSidebarCollapse.ts           └─ # 
│
├─lib/                               # 각종 유틸리티 및 헬퍼 함수 모음
│  ├─calendar/                       ├─ # 캘린더 관련 유틸 함수
│  │  └─utils.ts                     │  └─ # 일정 계산, 날짜 포맷팅 등
│  ├─mocks/                          ├─ # 더미(mock) 데이터 관리용 파일
│  │  ├─calendar.ts                  │  ├─ # 캘린더 테스트용 데이터
│  │  ├─chat.ts                      │  ├─ # 채팅 테스트용 데이터
│  │  ├─docs.ts                      │  ├─ # 문서 테스트용 데이터
│  │  ├─members.ts                   │  ├─ # 멤버 테스트용 데이터
│  │  ├─kanban.ts                    │  ├─ # Kanban 테스트용 데이터
│  │  └─worksheet.ts                 │  └─ # 워크시트 테스트용 데이터
│  ├─api.ts                          ├─ # API 호출 함수 모음
│  ├─commands.ts                     ├─ # 명령 관련 헬퍼 및 함수
│  ├─dashboardBackground.ts          ├─ # 
│  ├─docs.ts                         ├─ # 
│  ├─kanbanHistory.ts                ├─ # Kanban 보드 히스토리 처리 관련 함수
│  ├─persist.ts                      ├─ # 로컬 저장소(로컬스토리지 등) 처리 함수
│  ├─realtime.ts                     ├─ # 실시간 동기화 및 Presence 관련 유팅
│  ├─search.ts                       ├─ # 검색 기능 지원 함수
│  ├─socket.ts                       ├─ # WebSocket 통신 함수 및 설정
│  └─utils.ts                        └─ # tailwind-merge 및 clsx 같이 공용 유틸 함수
│
├─pages/                             # 구 App Router 이전의 Next.js pages 기반 API 라우트
│  ├─api/                            ├─ # Next.js API Routes (서버 함수)
│  │  ├─calendar.ts                  │  ├─ # 캘린더 관련 API
│  │  ├─channels.ts                  │  ├─ # 채널 관련 API
│  │  └─messages.ts                  │  └─ # 메시지 관련 API
│  └─_document.tsx                   └─ # Next.js 커스텀 Document (HTML 템플릿 구성)
│
├─public/                            # 정적 리소스 (이미지, 아이콘 등)
│
├─scripts/                           # 자동화 스크립트 모음
│  └─setup-docs.mjs                  └─ # 문서 초기 설정 스크립트
│
├─store/                             # 전역 상태 관리(주로 zustand 등) 상태 저장소
│  ├─chat.ts                         ├─ # 채팅 상태 관리 스토어
│  ├─issues.ts                       ├─ # 이슈 상태 관리 스토어
│  ├─members.ts                      ├─ # 멤버 상태 관리 스토어
│  └─worksheet.ts                    └─ # 워크시트 상태 관리 스토어
│
├─types/                             # TypeScript 타입 선언 모음
│  ├─calendar.ts                     ├─ # 캘린더용 타입 정의
│  ├─chat.ts                         ├─ # 채팅 관련 타입
│  ├─global.d.ts                     ├─ # 전역 타입 및 환경 선언
│  ├─issues.ts                       ├─ # Kanban/이슈 타입
│  ├─members.ts                      ├─ # 멤버 정보/권한 타입
│  ├─tiptap-table.d.ts               ├─ # TipTap 에디터 테이블 타입 확장
│  └─worksheet.ts                    └─ # 워크시트 관련 타입 정의
│
├─tailwind.config.ts                 # Tailwind CSS 설정 파일 (다크 테마 및 커스텀 설정)
├─postcss.config.js                  # PostCSS 설정 파일
├─tsconfig.json                      # TypeScript 컴파일러 설정
├─next.config.mjs                    # Next.js 설정 파일
├─package.json                       # 프로젝트 의존성 및 스크립트 정의
└─README.md                          # 프로젝트 전반 안내 문서
```

node scripts/setup-docs.mjs

