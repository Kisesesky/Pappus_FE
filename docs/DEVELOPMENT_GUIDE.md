# 📘 Flowdash Frontend 개발 가이드

---

## 1️⃣ 개발 철학
- **"프론트 단독 MVP"** : 백엔드 없이 UX 완성
- **모듈화된 레이아웃** : Sidebar / Topbar / RightPanel의 유기적 구성
- **Context 기반 상태** : DocEditor / ChatStore 등 전역 상태 공유
- **SSR 안정성** : TipTap은 always `immediatelyRender: false`

---

## 2️⃣ 기술 스택
| 항목 | 기술 |
|------|------|
| Framework | Next.js 14 App Router |
| Editor | TipTap + Lowlight |
| Styling | TailwindCSS |
| State | React Context + LocalStorage |
| Icons | Lucide-react |
| Build/Deploy | Vercel |
| Test | Vitest / Playwright |

---

## 3️⃣ 주요 도메인별 설명

### 📝 Docs (문서 에디터)
- 기반: TipTap
- 구성 요소:
  - `DocView.tsx` : 에디터 본체
  - `DocEditorContext.tsx` : 전역 Editor Provider
  - `DocsRightPanel.tsx` : Outline / History 탭
- `app/docs/layout.tsx` : 전용 Drawer Shell
- 주요 기능:
  - / 명령 팝업 (todo, ul, ol, code, table, image, file)
  - 테이블 편집 + 셀 스타일링
  - 이미지/파일 업로드 + 업로드 플레이스홀더
  - 자동 스냅샷 (60초/200자 기준)
  - Outline 탭: 문서 헤딩 자동 추출
  - History 탭: 버전 리스트/복원(Mock)
  - 단축키: `[`, `]` (패널 토글)

### 💬 Chat
- 구성 요소:
  - `ChatRightPanel.tsx` : Thread / AI Summary 탭
- `app/chat/layout.tsx` : Drawer + 단축키 Shell
- 특징:
  - 채널별 스레드 / 미리보기 / 요약
  - 모바일 Drawer 전환
  - 향후 WebSocket 연동 예정

### 📋 Issues (Kanban)
- `KanbanView.tsx`: DnD 칸반 보드
 - `app/issues/layout.tsx`: AppShell + Drawer 구조
- 기능:
  - LocalStorage 기반 보드 저장
  - Undo/Redo 히스토리
  - 카드 생성/이동/완료일 자동 기입
  - 향후 /app/issues/[id] 중첩라우팅 예정

---

## 4️⃣ 상태 관리 & 스토리지
| 도메인 | 저장소 | 키 |
|--------|--------|----|
| Docs | localStorage | fd.docs.content:{id} |
| Docs Snapshots | localStorage | fd.docs.snapshots:{id} |
| Kanban | localStorage | fd.kanban.board |
| Sprint Days | localStorage | fd.kanban.sprintDays |

---

## 5️⃣ UI 구성 원칙
- 모든 뷰는 `AppShell`을 기반으로 함
- RightPanel은 반응형 Drawer로 전환
- ToastProvider는 항상 `AppLayout`에 포함
- TableExtension은 런타임 가드(hasTable) 필수

---

## 6️⃣ 반응형 패널 구조
| 모드 | 구조 |
|------|------|
| Desktop | Sidebar + Main + RightPanel |
| Tablet | Sidebar + Main |
| Mobile | Drawer로 RightPanel 토글 |

---

## 7️⃣ 향후 개선
| 범주 | 기능 | 상태 |
|------|------|------|
| Docs | Heading 자동 ID(slugify) | 예정 |
| Docs | Outline 직접 편집 | 예정 |
| Docs | Snapshot 복원(localStorage) | 예정 |
| Chat | Thread → Sidebar 연동 | 예정 |
| Layout | Panel Collapse Button | 예정 |
| Issues | 중첩 라우팅 연결 | 예정 |

---

## 8️⃣ 단축키 요약
| 키 | 기능 |
|----|------|
| `]` | 우측 패널 열기 |
| `[` | 우측 패널 닫기 |
| `/` | 슬래시 명령 호출 |
| `Ctrl+S` | 문서 저장 |
| `Esc` | 슬래시 메뉴 닫기 |

---

## 9️⃣ 배포 / 환경 변수
```
NEXT_PUBLIC_AUTOSAVE_MS=60000
NEXT_PUBLIC_MAX_FILE_MB=20
NEXT_PUBLIC_API_URL=https://api.flowdash.dev
```

---

## ✅ 완료 기준 (DoD)
- SSR/CSR 일관성
- TypeScript 오류 0
- 반응형 대응
- 접근성 준수
- 전역 상태 안정
