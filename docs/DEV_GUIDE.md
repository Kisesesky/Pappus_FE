# 개발 가이드 & 로드맵 (Flowdash Frontend)

---

## 1️⃣ 개발 철학
- 백엔드 의존 없이도 완전한 UX 제공 (Mock / LocalStorage 기반)
- 컴포넌트 단위의 독립성 유지
- 인터페이스 우선 설계로 이후 백엔드 연동 최소화
- SSR과 CSR 병행 대응 (Next.js App Router)

---

## 2️⃣ 기술 스택
| 항목 | 사용 기술 |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Editor | TipTap + Highlight.js |
| Icons | Lucide-react |
| State | LocalStorage / Zustand (차후) |
| Test | Vitest / Playwright |
| Lint | ESLint / Prettier |
| Deploy | Vercel / GitHub Actions |

---

## 3️⃣ 주요 도메인 및 구현 순서

### 📄 문서 (Docs)
- TipTap 블록 기반 에디터
- 지원 기능:
  - Bold / Italic / Code / List / Task / CodeBlock / Table / Image / File
  - 슬래시 명령(`/todo`, `/table`, `/image`, `/file`)
  - 표 병합, 셀 스타일, 폰트 크기, 색상, 정렬
  - 이미지/파일 업로드(진행률 표시, Local URL 저장)
  - 스냅샷 자동저장 (60초 / 200자 이상 변경 시)
  - 버전 복원 / 히스토리 관리
- 향후 추가:
  - 멘션(@user), 코멘트, 협업 편집, 드래그 블록 이동

### 📋 프로젝트 관리 (Kanban)
- 칸반 보드: 컬럼별 상태 (Backlog / In Progress / Done)
- 카드 추가/편집/삭제
- 필터링(담당자, 우선순위)
- 이후 추가 예정:
  - 드래그앤드롭
  - 스프린트 관리
  - 차트 및 리포트

### 💬 채팅
- 서버 → 채널 → 스레드 구조
- 텍스트/파일/이모지
- 음성·영상통화(추후)
- 실시간 WebSocket 기반 메시징

### 📆 캘린더
- 프로젝트 일정 시각화
- Google Calendar 연동
- 드래그 이동 및 이벤트 편집

---

## 4️⃣ 파일 구조 가이드

```
components/
├─ layout/Sidebar.tsx
├─ layout/Topbar.tsx
├─ views/
│  ├─ docs/DocView.tsx
│  ├─ kanban/KanbanView.tsx
│  ├─ chat/ChatView.tsx
│  └─ calendar/CalendarView.tsx
lib/
├─ api/
├─ store/
└─ utils/
```

---

## 5️⃣ 상태 관리
- 초기: LocalStorage 기반 (프론트 단독)
- 추후: Zustand or Jotai로 통합 상태 관리
- 자동 동기화(Offline → Online)
- Optimistic UI 패턴 적용 예정

---

## 6️⃣ 설계 원칙
- 모든 View는 Layout에서 독립적으로 렌더링 가능해야 함
- TipTap은 SSR 환경에서 `immediatelyRender: false`
- Tailwind Token(`bg-panel`, `text-muted`, `border-border`) 유지
- 모듈별 책임 분리
- Types는 항상 `/lib/types/`로 정리

---

## 7️⃣ 향후 로드맵 (6단계)

| 단계 | 목표 | 세부 내용 |
|------|------|-----------|
| 1 | 프론트 UI 뼈대 완성 | Sidebar / Topbar / Router / Docs 기본 |
| 2 | 문서 편집기 고도화 | 이미지/파일/표/스냅샷 |
| 3 | 칸반 CRUD 구현 | 카드 이동, 스프린트 추가 |
| 4 | 채팅 베타 | 서버/채널/메시지 Mock 연결 |
| 5 | 캘린더 + 구글 연동 | 일정 동기화, 달력 컴포넌트 완성 |
| 6 | 통합 검색 + 알림 + AI | Elastic-like 검색, Slack형 알림, AI 요약 |

---

## 8️⃣ 테스트 전략
- Unit Test: Vitest + React Testing Library
- E2E: Playwright (Docs/Board 시나리오)
- 자동화: GitHub Actions → Lint + Test + Build

---

## 9️⃣ 배포
- 기본 배포: Vercel (Next.js)
- `.env` 구성 예시:
  ```
  NEXT_PUBLIC_API_URL=https://api.flowdash.dev
  NEXT_PUBLIC_WS_URL=wss://ws.flowdash.dev
  NEXT_PUBLIC_AUTOSAVE_MS=60000
  NEXT_PUBLIC_MAX_FILE_MB=20
  ```

---

## 🔚 품질 기준 (DoD)
- [ ] SSR/CSR 정상 렌더
- [ ] 상태/저장 기능 정상
- [ ] 반응형 대응
- [ ] 접근성(ARIA)
- [ ] 타입 경고 0개
- [ ] 테스트 통과
