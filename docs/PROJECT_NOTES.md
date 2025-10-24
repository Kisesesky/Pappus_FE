# 프로젝트 진행 로그 & 대화 요약

> Flowdash Frontend Development Journal  
> 작성일: 2025-10-21  
> 작성자: hans

---

## 📅 진행 타임라인 요약

| 날짜 | 주요 내용 |
|------|------------|
| 10/20 | 프로젝트 아이디어 및 구조 정의 |
| 10/21 | 프론트 구조 생성 (`app`, `components`, `lib`) |
| 10/21 | Tailwind 세팅 및 tsconfig 오류 수정 |
| 10/21 | TipTap SSR 오류 수정 (`immediatelyRender: false`) |
| 10/21 | Table 확장 undefined 문제 해결 및 런타임 가드 적용 |
| 10/21 | 전체 문서(`README.md`, `DEV_GUIDE.md`) 정리 완료 |

---

## 🧩 주요 오류 해결 기록

### 1️⃣ Tailwind Unknown @rule
- 원인: VSCode CSS LSP 경고
- 해결: Tailwind IntelliSense 확장 설치 또는 무시

### 2️⃣ tsconfig `resolveJsonModule` 오류
- 원인: `moduleResolution`이 `bundle`
- 해결: `"moduleResolution": "node"`

### 3️⃣ TipTap SSR Hydration 경고
- 해결: `useEditor` 옵션에 `immediatelyRender: false` 추가

### 4️⃣ `Table.configure` undefined
- 원인: @tiptap/extension-table 미설치
- 해결: 패키지 설치 후 런타임 가드(`hasTable`) 추가

### 5️⃣ Lucide 아이콘 오류
- `TypeBold` → `Bold` 로 교체

---

## 🧠 다음 작업 예정

1. Docs 뷰
   - 멘션 / 코멘트 / 블록 이동
   - 문서 내 협업 Presence 표시
2. Kanban
   - 드래그 & 드롭 / 필터 / 스프린트
3. Chat
   - 메시지 스레드 / 이모지 / 파일 첨부
   - 실시간 WebSocket 연동
4. Calendar
   - 구글 연동 + 일정 드래그 편집
5. Search
   - 통합 검색 + 키보드 탐색
6. Notification
   - 알림 스트림 + 읽음 표시


---

## 🧭 향후 백엔드 설계 방향

| 도메인 | 주요 기능 | 기술 후보 |
|--------|-----------|-----------|
| 인증 | OAuth2 (Google, GitHub) | NextAuth / Clerk |
| 데이터 | 프로젝트, 문서, 이슈, 메시지 | PostgreSQL + Prisma |
| 파일 | 첨부 업로드 | AWS S3 + pre-signed URL |
| 실시간 | 채팅/알림 | WebSocket / SSE |
| 검색 | 통합 검색 | Elasticsearch / Typesense |

---

## 💡 메모
- “프론트 단독”으로 UX 90% 완성 후 → API 어댑터 연결 예정  
- Docs/DEV_GUIDE/PROJECT_NOTES 세 문서는 `/docs/` 폴더 내에서 버전 관리  
- 이후 `API_SPEC.md`, `UI_GUIDE.md` 추가 예정

---

> **Flowdash v0.1 (Frontend Skeleton)**  
> Build the foundation first, intelligence later.
