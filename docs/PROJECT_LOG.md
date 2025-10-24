# 📜 프로젝트 로그 & 개발 히스토리 (2025-10-21 기준)

---

## 🧭 진행 타임라인

| 날짜 | 주요 내용 |
|------|------------|
| 10/19 | 프로젝트 구조 설계 |
| 10/20 | Next.js + Tailwind 세팅 |
| 10/20 | TipTap 초기 구성 및 SSR 오류 수정 |
| 10/21 | Table 확장 undefined 가드 처리 |
| 10/21 | KanbanView / IssuesLayout 완성 |
| 10/21 | Docs Outline + History 패널 구축 |
| 10/21 | ChatRightPanel 탭 추가 |
| 10/21 | Drawer + 단축키 시스템 통합 |
| 10/21 | 전체 문서 자동 생성 스크립트 작성 (본 파일) |

---

## 🧩 주요 개선 포인트

1. **ToastProvider 전역화**
   - RootLayout에서만 제공하던 Toast를 AppShell로 이관.
2. **RightPanel 중복 제거**
   - IssuesLayout, DocsLayout에서 Drawer 기반으로 분리.
3. **AppShell 통합 구조**
   - header / sidebar / rightPanel prop으로 구성.
4. **OutlineView 안정화**
   - editor.on → editor.off 방식으로 수정.

---

## 🧠 다음 단계 계획

| 항목 | 설명 |
|------|------|
| Docs 협업 | Presence, Mentions, Commenting |
| Kanban 확장 | Sprint / Filter / Chart |
| Chat 확장 | Thread / Reaction / File Upload |
| Layout 개선 | Collapse Button, Dynamic Width |
| State 통합 | Zustand Store 기반 전환 |

---

> **Flowdash Frontend v0.5 — UX Skeleton Stable**
> “기능보다 흐름을 먼저 완성하라.”
