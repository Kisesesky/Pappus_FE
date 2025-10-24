# Flowdash 발전 방향 제안 (Docs · Chat · Flow.team 통합 관점)

## 1. 제품 비전
- **Flow.team 스타일의 통합 Work OS**  
  - 하나의 워크스페이스에서 문서, 커뮤니케이션, 프로젝트 관리, 일정이 끊김 없이 연결되는 경험 제공.
  - 조직과 팀이 자연스럽게 협업하면서도 개인이 원하는 정보 흐름만 추려볼 수 있는 “스마트 워크 허브” 지향.
- **Docs = Notion 수준의 블록 문서 플랫폼**  
  - 협업 문서 편집, 지식 베이스, 프로젝트 문서화를 한 번에 해결.  
  - 실시간 편집, 블록 이동/복사, 데이터베이스-like 뷰, 템플릿 지원을 통해 생산성 강화.
- **Chat = Discord/Slack형 커뮤니케이션**  
  - 채널/DM/스레드 중심의 고급 메시징 + 음성/영상, Presence, 봇 자동화 지원.  
  - Slack의 업무 자동화 + Discord의 커뮤니티/스테이지 경험을 혼합한 유연한 커뮤니케이션 공간.

## 2. 도메인별 로드맵

### Docs (Notion 지향)
1. **블록 시스템 확장**: 데이터베이스, 칸반, 타임라인, 코드/수식, callout 등 추가 블록 지원.  
2. **협업 기능**: Presence 커서, 댓글/멘션/토픽 관리, 버전 비교 & 히스토리 복원.  
3. **템플릿 & 워크플로우**: 페이지 템플릿, 블록 묶음 저장, 자동 스니펫.  
4. **외부 연동**: GitHub, Figma, Google Drive 임베드 및 실시간 미리보기.  
5. **검색/AI**: 문서 내 자연어 검색, AI Summarization, 문서 간 링크 추천.

### Chat (Slack/Discord 지향)
1. **워크스페이스 다중 지원**: Slack처럼 워크스페이스 전환, 게스트/외부 공유 채널.  
2. **통화 & 스테이지**: Discord의 Stage Channel + Voice Chat, 화면 공유.  
3. **자동화/봇**: 슬래시 명령, Workflow Builder, Webhook 연동, AI 요약/태스크 추출.  
4. **고급 Thread/DM 경험**: 메시지 인용, 폴링, 설문, 워크플로우 카드 등.  
5. **Presence & 알림**: 실시간 상태, 데스크톱/모바일 구분, Smart Notification Feed.

### Flow.team 느낌의 통합
1. **공용 AppShell**: Docs, Chat, Issues, Calendar 가 동일한 데이터/Permission 모델과 함께 동작.  
2. **프로젝트 허브**: 문서, 채팅, 이슈, 캘린더를 프로젝트 단위로 묶어 Flow.team의 “Flow”처럼 보드화.  
3. **미팅/노트/액션 연계**: 회의 → 노트 → 액션 아이템을 자동 연결, Docs & Chat & Issues 연동.  
4. **Cross-surface 검색**: 통합 검색창에서 문서 내용, 채팅 메시지, 태스크, 일정까지 한 번에 검색.  
5. **레코드 기반 권한/감사**: Flow.team처럼 조직/팀 단위 퍼미션, 작업 이력 감사로그 제공.

## 3. 기술/아키텍처 고려 사항
- **상태 관리**: 현재 Zustand + 로컬스토리지 → 이후 서버 연동 시 Supabase/Firebase/Custom API + optimistic UI 설계.  
- **실시간 통신**: WebSocket/SSE로 Presence, 메시지, 문서 협업 동기화.  
- **확장 가능한 데이터 모델**: 문서(블록), 메시지, 칸반카드, 일정 이벤트를 통합할 공통 ID/메타 구조 설계 필요.  
- **모듈화 전략**: Docs/Chat/Issues/Calendar가 공통 컴포넌트(Comments, Activity, Members 등)를 공유하도록 컨벤션 정립.  
- **테스트/품질**: E2E(Playwright), 단위(Vitest), ESLint/TypeScript 규칙 보강, 시나리오 자동화 필요.

## 4. 단기 우선 과제 (권장)
1. **Presence & Realtime 리팩터링**: BroadcastChannel → WebSocket 추상 레이어 전환.  
2. **Docs 협업 기능**: 멘션/댓글/Presence 커서, 스냅샷 복원, 블록 이동.  
3. **Chat 자동화**: 슬래시 명령 스키마 확장, 워크플로우/봇 훅 도입.  
4. **검색/알림**: 통합 검색 API 설계 및 최소 MVP, Notification Stream UI.  
5. **ESLint 설정 보완**: `next/typescript` 프리셋 문제 해결 + 공통 규칙 확립.

## 5. 장기 방향
- **AI 어시스트**: 문서 요약, 회의록 자동 생성, 채팅 → 태스크 추출, Docs ↔ Issues ↔ Calendar 동기화 추천.  
- **Flow Automation**: Flow.team처럼 흐름 기반 자동화 빌더(조건/트리거 → 액션).  
- **오픈 플랫폼**: Slash command, Webhook, Custom bot, App Marketplace 지원.  
- **Enterprise 기능**: SSO, 감사로그, 역할 기반 권한, 데이터 레이크 내보내기.

---

> 목표: “문서(노션) + 커뮤니케이션(디스코드/슬랙) + 프로젝트 운영(Flow.team)”을 하나의 일관된 UX로 제공하는 Work OS.  
> 단계별 기능 설계와 기술 기반 리팩터링을 병행해, 프론트 단독 MVP에서 실서비스 수준까지 확장하는 로드맵을 유지합니다.
