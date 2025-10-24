# 🧩 Flowdash — 통합 워크 플랫폼 (Frontend Prototype)

> **Flow.team + Notion + Discord + Jira** 기능을 하나로 결합한 통합 Work OS  
> 현재 단계: 백엔드 없이 프론트엔드 UI/UX 완성 중심 MVP 구축

---

## 🎯 프로젝트 핵심 목표

| 영역 | 기능 |
|------|------|
| Chat | 채널/스레드/AI요약 |
| Docs | 블록 기반 문서 + 협업 에디터 |
| Issues | 칸반/스프린트 관리 |
| Calendar | 일정 뷰 + 연동 |
| Global | 알림 + 검색 + 단축키 시스템 |

---

## 🧰 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Editor | TipTap + Lowlight(Highlight.js) |
| State | Context API + LocalStorage |
| Icons | Lucide-react |
| Test | Vitest + Playwright |
| Deploy | Vercel / GitHub Actions |

---

## 📂 디렉터리 구조

```
app/
 ├─ layout.tsx
 ├─ app/
 │   ├─ docs/
 │   │   ├─ layout.tsx
 │   │   └─ page.tsx
 │   ├─ issues/
 │   │   ├─ layout.tsx
 │   │   └─ page.tsx
 │   ├─ chat/
 │   │   ├─ layout.tsx
 │   │   └─ page.tsx
 │   └─ calendar/
 │       └─ page.tsx
components/
 ├─ layout/AppShell.tsx
 ├─ Sidebar.tsx / Topbar.tsx / RightPanel.tsx
 ├─ docs/
 │   ├─ DocEditorContext.tsx
 │   ├─ DocsRightPanel.tsx
 │   └─ SlashMenu.tsx
 ├─ chat/ChatRightPanel.tsx
 ├─ issues/KanbanView.tsx
 ├─ ui/
 │   ├─ Tabs.tsx / Toast.tsx / Drawer.tsx / button.tsx / input.tsx
 └─ views/
     ├─ docs/DocView.tsx
     ├─ chat/ChatView.tsx
     ├─ issues/KanbanView.tsx
     └─ calendar/CalendarView.tsx
lib/
 ├─ persist.ts / api.ts / utils.ts
 ├─ kanbanHistory.ts
 └─ socket.ts
docs/
 ├─ README.md
 ├─ DEVELOPMENT_GUIDE.md
 └─ PROJECT_LOG.md
```

---

## 🚀 실행 방법

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## 🧭 향후 로드맵
1. Chat / Docs / Issues 실시간 연동
2. AI Summarization 및 Task Extraction
3. Presence 기반 협업 에디팅
4. GitHub / Google Calendar 연동
5. 통합 검색 & Notification Stream
