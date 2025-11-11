import WorkspaceWizard from "@/components/setup/WorkspaceWizard";

export default function WorkspaceSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Fourier Workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-white">워크스페이스 생성</h1>
          <p className="mt-2 text-sm text-slate-400">
            단계별 안내를 따라 새로운 팀 공간을 만들어 보세요.
          </p>
        </div>
        <WorkspaceWizard />
      </div>
    </div>
  );
}

