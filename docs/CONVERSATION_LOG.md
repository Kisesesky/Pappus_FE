# 🗂 Flowdash 개발 대화 기록 (ChatGPT × 대표님)

> 대화 기반 개발 진행 내역  
> 기간: 2025-10-18 ~ 2025-10-21  
> 작성 목적: 개발 의사결정 및 작업 흐름 기록

---

## 🧩 프로젝트 초기 설정

- Next.js 14 + TailwindCSS 기반 프론트엔드 구조 설계  
- `src` 폴더 제거 후 `` 루트 구조로 통일  
- `moduleResolution`을 `bundle → node`로 변경하여 타입 오류 해결  
- 기본 레이아웃(AppLayout) → Sidebar, Topbar, RightPanel 3단 구성 완성  

---

## 🧱 Kanban 시스템 구현

- **파일:** `components/views/issues/KanbanView.tsx`
- 주요 구현:
  - DnD-kit 기반 보드 이동
  - LocalStorage 자동 저장
  - Undo/Redo 히스토리 관리
  - 카드 추가, 완료일 자동기록, Sprint 기간 입력
- **이슈 해결:**
  - `useToast must be used within ToastProvider` 오류 → `AppShell`에 `ToastProvider` 추가  
  - `RightPanel` 중복 렌더 → IssuesLayout에서만 유지하도록 구조 수정
- **향후 개선 방향:**
  - `/issues/[id]` 중첩 라우팅  
  - 모바일 Drawer 토글  

---

## 📝 Docs(문서) 시스템

- **파일:** `components/views/docs/DocView.tsx`
- 핵심 기능:
  - TipTap Editor 기반 블록 구조  
  - 커스텀 노드: Attachment, UploadPlaceholder  
  - 자동 저장 / 스냅샷 / 복원  
  - 테이블 확장(Table, TableRow, TableCell, TableHeader)  
  - 슬래시 명령 팝업 (‘/todo’, ‘/table’, ‘/image’ 등)
- **문제 해결:**
  - `Table.configure undefined` → 런타임 가드(hasTable) 적용  
  - SSR Hydration 오류 → `immediatelyRender: false` 추가  
  - 코드 하이라이트 → Lowlight에 js/ts/md 등록  

---

## 🧩 DocsRightPanel 확장

- **파일:** `components/docs/DocsRightPanel.tsx`
- 기능 추가:
  - Outline 탭: 문서 내 Heading 자동 추출 및 클릭 이동  
  - History 탭: 스냅샷 목록 / 미리보기(Mock)
- **오류 해결:**
  - `editor.on()` 반환값 문제 (`Cannot call`) → `editor.off()`으로 cleanup 처리  

---

## 💬 Chat 모듈 구조

- **파일:** `components/chat/ChatRightPanel.tsx`
- 구성:
  - Threads 탭: 대화 목록 표시  
  - AI Summary 탭: 요약 보기 및 "재생성" 버튼  
- **반응형 대응:**  
  - 모바일 → Drawer 전환  
  - 단축키 `]`, `[` 으로 열기/닫기  

---

## 🧭 Layout 통합

- **AppShell.tsx**
  - header / sidebar / rightPanel 슬롯 구조
  - 반응형 grid → flex로 단순화
- **IssuesLayout / DocsLayout / ChatLayout**
  - 모두 `AppShell`을 래핑하여 통일된 구성
- **Drawer.tsx**
  - md 이하 화면에서 RightPanel 토글 가능
- **ToastProvider**
  - `AppLayout` → `AppShell`로 이동, 전역 Toast 오류 해결  

---

## 🪶 스크립트 자동화

- **파일:** `scripts/setup-docs.mjs`
  - `/docs/` 폴더 자동 생성
  - `README.md`, `DEVELOPMENT_GUIDE.md`, `PROJECT_LOG.md` 자동 작성
  - 실행 명령:  
    ```bash
    npm run docs:gen
    # or
    node scripts/setup-docs.mjs
    ```
- 구조:
  - 📘 README — 개요 및 목표  
  - 🧭 DEVELOPMENT_GUIDE — 기술 스택 및 설계  
  - 📜 PROJECT_LOG — 대화/개발 히스토리  

---

## 🧠 대표님 피드백 반영

| 요청 | 조치 |
|------|------|
| “코드는 생략하지 말고 전체로 달라” | 전체 파일 제공 |
| “프론트만 먼저 구현” | 모든 API Mock / LocalStorage 기반 |
| “DocsRightPanel Outline 안됨” | TipTap 이벤트 수정 (`on/off`) |
| “패널 겹침 문제” | AppShell + Drawer 구조로 해결 |
| “대화 기록 문서화” | `CONVERSATION_LOG.md` 파일 추가 |

---

## 🧾 요약

- **Frontend MVP 완성도:** 약 80%  
- **Docs / Chat / Issues 3모듈 완성**
- **AppShell / Drawer / Toast 전역화 완료**
- **문서 자동화 스크립트 (`setup-docs.mjs`) 도입**
- **버전:** Flowdash v0.5 (Frontend Skeleton Stable)

---

> 🧠 _"기능보다 흐름을 먼저 완성하고, 안정된 경험 위에 지능을 얹는다."_  
> **— Flowdash Development Team**
