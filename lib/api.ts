// lib/api.ts
export type ID = string;

export type Priority = "low" | "medium" | "high" | "urgent";
export type IssueStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface Issue {
  id: ID;
  key: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: Priority;
  assignee?: string;
  reporter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: ID;
  issueId: ID;
  author: string;
  body: string;
  createdAt: string;
}

export type ActivityType = "status" | "assignee" | "comment" | "system";

export interface IssueActivity {
  id: ID;
  issueId: ID;
  type: ActivityType;
  text: string;
  createdAt: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
}

/** ─ Mock DB ─ */
const users: User[] = [
  { id: "U1", name: "Dev.A", email: "dev.a@flowdash.dev" },
  { id: "U2", name: "Dev.B", email: "dev.b@flowdash.dev" },
  { id: "U3", name: "Dev.C", email: "dev.c@flowdash.dev" },
  { id: "U4", name: "QA.1",  email: "qa.1@flowdash.dev" },
  { id: "U5", name: "PO",    email: "po@flowdash.dev" },
  { id: "U6", name: "You",   email: "you@flowdash.dev" },
];

const issues: Issue[] = [
  { id: "ISSUE-1", key: "ISSUE-1", title: "로그인 에러 조사", description: "재현 조건 정리 필요", status: "in_progress", priority: "high", assignee: "Dev.A", reporter: "QA.1", createdAt: iso(), updatedAt: iso() },
  { id: "ISSUE-2", key: "ISSUE-2", title: "칸반 카드 드래그", description: "모바일 스크롤 충돌", status: "todo",        priority: "medium", assignee: "Dev.B", reporter: "PO",   createdAt: iso(), updatedAt: iso() },
  { id: "ISSUE-3", key: "ISSUE-3", title: "Docs 표 병합 버그", description: "헤더 토글 시 스타일 유실", status: "review",      priority: "urgent", assignee: "Dev.C", reporter: "Dev.A", createdAt: iso(), updatedAt: iso() },
];

const comments: IssueComment[] = [
  { id: "C1", issueId: "ISSUE-1", author: "PO",   body: "재현영상 업로드 완료",  createdAt: iso() },
  { id: "C2", issueId: "ISSUE-1", author: "Dev.A", body: "원인 추정: 세션 만료", createdAt: iso() },
  { id: "C3", issueId: "ISSUE-2", author: "QA.1", body: "iOS Safari에서만 발생", createdAt: iso() },
];

const activities: IssueActivity[] = [
  { id: "A1", issueId: "ISSUE-1", type: "status",   text: "상태: todo → in_progress", createdAt: iso() },
  { id: "A2", issueId: "ISSUE-1", type: "assignee", text: "담당자: Dev.A 할당",       createdAt: iso() },
  { id: "A3", issueId: "ISSUE-2", type: "system",   text: "우선순위: medium 설정",    createdAt: iso() },
  { id: "A4", issueId: "ISSUE-1", type: "comment",  text: "PO가 댓글을 남겼습니다",    createdAt: iso() },
];

/** ─ API-like helpers ─ */
export async function listIssues(): Promise<Issue[]> {
  await delay(100);
  return issues;
}

export async function getIssueById(id: ID): Promise<Issue | null> {
  await delay(80);
  return issues.find(i => i.id === id) || null;
}

export async function listComments(issueId: ID): Promise<IssueComment[]> {
  await delay(60);
  return comments.filter(c => c.issueId === issueId);
}

export async function addComment(issueId: ID, author: string, body: string): Promise<IssueComment> {
  await delay(60);
  const c: IssueComment = { id: `C${rand()}`, issueId, author, body, createdAt: iso() };
  comments.push(c);
  // 활동 로그도 남긴다
  activities.push({ id: `A${rand()}`, issueId, type: "comment", text: `${author}가 댓글을 남겼습니다`, createdAt: iso() });
  return c;
}

export async function listActivities(issueId: ID, type?: ActivityType): Promise<IssueActivity[]> {
  await delay(60);
  const base = activities.filter(a => a.issueId === issueId);
  return type ? base.filter(a => a.type === type) : base;
}

/** 멘션 검색 */
export async function searchUsers(q: string, limit = 8): Promise<User[]> {
  await delay(50);
  const qq = q.trim().toLowerCase();
  const arr = users.filter(u =>
    u.name.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq)
  );
  return arr.slice(0, limit);
}

/** utils */
function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
function iso() { return new Date().toISOString(); }
function rand() { return Math.random().toString(36).slice(2, 8); }
