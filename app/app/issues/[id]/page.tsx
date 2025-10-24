// app/app/issues/[id]/page.tsx
import KanbanView from "@/components/views/issues/KanbanView";

/**
 * 중첩 라우팅: URL만 [id]로 바뀌고,
 * 우측 패널은 RightPanel에서 useParams로 id를 읽어 상세를 표시한다.
 * 메인은 동일하게 칸반 보드를 유지한다.
 */
export default function IssueDetailRoutePage() {
  return <KanbanView />;
}
