'use client';

import { useCallback, useMemo, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Sparkles, Users, Hash, Mail, Palette, Image as ImageIcon, Smile } from "lucide-react";
import { useChat } from "@/store/chat";

const ICON_PRESETS = ["💼", "🚀", "🎨", "🛰️", "🏗️", "🧪", "🏔️", "✨"];
const COLOR_PRESETS = ["#0EA5E9", "#8B5CF6", "#F97316", "#EF4444", "#14B8A6", "#3B82F6", "#DB2777", "#111827"];

const CHANNEL_TEMPLATES = [
  { name: "기본 팀", description: "전사 공지 + 잡담", channels: ["general", "announcements", "random"] },
  { name: "프로덕트", description: "기능 개발/런칭", channels: ["general", "product", "launch", "design", "qa"] },
  { name: "커스터머", description: "CS/세일즈 협업", channels: ["general", "sales", "support"] },
];

const steps = [
  {
    id: "info",
    title: "기본 정보",
    description: "워크스페이스 이름과 주소를 정합니다.",
  },
  {
    id: "branding",
    title: "브랜딩 & 분위기",
    description: "아이콘, 색상, 채널 템플릿을 설정합니다.",
  },
  {
    id: "invites",
    title: "멤버 초대",
    description: "슬랙처럼 이메일로 동료를 초대할 수 있어요.",
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const WorkspaceWizard = () => {
  const router = useRouter();
  const { createWorkspace } = useChat();

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [customIconInput, setCustomIconInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    urlSlug: "",
    icon: ICON_PRESETS[0],
    color: COLOR_PRESETS[0],
    image: null as string | null,
    channels: ["general", "random"],
    invites: "",
  });

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const handleNameChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      urlSlug: prev.urlSlug && !prev.name ? prev.urlSlug : slugify(value),
    }));
  }, []);

  const handleSlugChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      urlSlug: slugify(value),
    }));
  }, []);

  const handleIconSelect = useCallback((icon: string) => {
    setForm((prev) => ({ ...prev, icon }));
    setCustomIconInput("");
  }, []);

  const handleCustomIconBlur = useCallback(() => {
    if (!customIconInput.trim()) return;
    const value = Array.from(customIconInput.trim()).slice(0, 2).join("");
    setForm((prev) => ({ ...prev, icon: value }));
  }, [customIconInput]);

  const handleColorSelect = useCallback((color: string) => {
    setForm((prev) => ({ ...prev, color }));
  }, []);

  const handleColorPickerChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    handleColorSelect(event.target.value);
  }, [handleColorSelect]);

  const handleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, image: null }));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      if (typeof window !== "undefined") {
        window.alert("이미지 용량은 4MB 이하만 지원합니다.");
      }
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setForm((prev) => ({ ...prev, image: null }));
        return;
      }
      setForm((prev) => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTemplateSelect = useCallback((channels: string[]) => {
    setForm((prev) => ({ ...prev, channels }));
  }, []);

  const handleInvitesChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, invites: value }));
  }, []);

  const handlePrevious = useCallback(() => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, [stepIndex, router]);

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      if (saving) return;
      setSaving(true);
      try {
        await createWorkspace({
          name: form.name || undefined,
          icon: form.icon || undefined,
          backgroundColor: form.color,
          image: form.image || undefined,
        });
        router.push("/chat");
      } finally {
        setSaving(false);
      }
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [createWorkspace, form.color, form.icon, form.image, form.name, isLastStep, router, saving]);

  const isNextDisabled = useMemo(() => {
    if (stepIndex === 0) {
      return form.name.trim().length < 2 || !form.urlSlug;
    }
    return false;
  }, [form.channels.length, form.name, form.urlSlug, stepIndex]);

  const previewStyle = form.image
    ? {
        backgroundImage: `url(${form.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: form.color };

  const summaryChannels = useMemo(() => form.channels.map((ch) => `#${ch}`), [form.channels]);
  const inviteList = useMemo(
    () =>
      form.invites
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [form.invites],
  );

  const renderStep = () => {
    switch (currentStep.id) {
      case "info":
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Workspace Name</label>
              <input
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="예: Flowdash HQ"
                className="mt-2 w-full rounded-lg border border-border bg-subtle/60 px-4 py-3 text-sm outline-none focus:border-sidebar-primary"
              />
              <p className="mt-1 text-xs text-muted">Slack처럼 팀을 대표할 이름을 입력하세요.</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Workspace URL</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-subtle/40 px-3 py-2 text-sm">
                <span className="text-muted">flowdash.app/</span>
                <input
                  value={form.urlSlug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  placeholder="team-name"
                  className="flex-1 bg-transparent text-foreground outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-muted">알파벳/숫자/하이픈만 허용됩니다.</p>
            </div>
          </div>
        );
      case "branding":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-subtle/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <Smile size={14} />
                  Icon
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ICON_PRESETS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      className={clsx(
                        "flex h-12 w-12 items-center justify-center rounded-xl border text-xl transition",
                        form.icon === icon
                          ? "border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary"
                          : "border-border hover:border-sidebar-primary/60",
                      )}
                      aria-label={`아이콘 ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  value={customIconInput}
                  onChange={(event) => setCustomIconInput(event.target.value)}
                  onBlur={handleCustomIconBlur}
                  placeholder="이모지 또는 2글자"
                  maxLength={4}
                  className="mt-3 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-sidebar-primary"
                />
              </div>
              <div className="rounded-2xl border border-border bg-subtle/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <Palette size={14} />
                  Color
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={clsx(
                        "h-9 w-9 rounded-full border transition",
                        form.color === color
                          ? "border-sidebar-primary ring-2 ring-sidebar-primary/40"
                          : "border-border hover:border-sidebar-primary/60",
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`배경색 ${color}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={handleColorPickerChange}
                    className="h-8 w-8 cursor-pointer rounded-md border border-border bg-subtle/40"
                  />
                  <span className="text-sm font-semibold text-foreground">{form.color}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-subtle/30 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                <ImageIcon size={14} />
                Cover Image
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-3 w-full text-xs text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-panel file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-subtle/80"
              />
              {form.image && <p className="mt-2 text-xs text-emerald-500">커버 이미지가 적용되었습니다.</p>}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Channel Templates</label>
              <p className="mt-1 text-xs text-muted">팀 타입에 맞춰 기본 채널을 한 번에 구성하세요.</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {CHANNEL_TEMPLATES.map((template) => {
                  const selected =
                    template.channels.length === form.channels.length &&
                    template.channels.every((ch, idx) => form.channels[idx] === ch);
                  return (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => handleTemplateSelect(template.channels)}
                      className={clsx(
                        "rounded-2xl border p-4 text-left text-sm transition",
                        selected
                          ? "border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary"
                          : "border-border bg-subtle/40 hover:border-sidebar-primary/50",
                      )}
                    >
                      <div className="font-semibold">{template.name}</div>
                      <p className="text-xs text-muted">{template.description}</p>
                      <div className="mt-2 space-y-1 text-xs text-muted">
                        {template.channels.slice(0, 3).map((ch) => (
                          <div key={ch} className="flex items-center gap-1">
                            <Hash size={12} />
                            {ch}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case "invites":
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Invite Teammates</label>
              <textarea
                value={form.invites}
                onChange={(event) => handleInvitesChange(event.target.value)}
                placeholder="이메일을 줄바꿈 혹은 쉼표로 구분해 입력하세요."
                rows={4}
                className="mt-2 w-full rounded-2xl border border-border bg-subtle/60 px-3 py-3 text-sm outline-none focus:border-sidebar-primary"
              />
              <p className="mt-1 text-xs text-muted">지금 건너뛰어도 이후에 언제든 초대할 수 있습니다.</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">빠른 추가</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["founder@flowdash.dev", "designer@flowdash.dev", "sales@flowdash.dev"].map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() =>
                      handleInvitesChange(form.invites ? `${form.invites.trim().replace(/[,\s]+$/, "")}, ${email}` : email)
                    }
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-sidebar-primary hover:text-sidebar-primary"
                  >
                    {email}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
      <aside className="rounded-2xl border border-border bg-panel/80 p-6 lg:w-72">
        <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-primary">
          <Sparkles size={16} />
          워크스페이스 설정
        </div>
        <ol className="mt-6 space-y-4 text-sm">
          {steps.map((step, index) => {
            const completed = index < stepIndex;
            const active = index === stepIndex;
            return (
              <li key={step.id} className="flex items-start gap-3">
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                    completed
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-500"
                      : active
                        ? "border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary"
                        : "border-border text-muted",
                  )}
                >
                  {completed ? <Check size={14} /> : index + 1}
                </span>
                <div>
                  <div className="font-semibold text-foreground">{step.title}</div>
                  <p className="text-xs text-muted">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 rounded-xl border border-border bg-subtle/50 p-4 text-xs text-muted">
          Slack처럼 단계별로 안내해 드릴게요. 중간에 나가도 진행 상황이 저장됩니다.
        </div>
      </aside>

      <main className="flex-1 rounded-3xl border border-border bg-panel/90 p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Step {stepIndex + 1}</div>
            <h2 className="text-xl font-semibold text-foreground">{currentStep.title}</h2>
            <p className="text-sm text-muted">{currentStep.description}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted">
            <Users size={14} />
            실제 워크스페이스 생성은 마지막 단계에서 진행됩니다.
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>{renderStep()}</div>
          <div className="rounded-2xl border border-border bg-subtle/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">미리보기</p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className={clsx(
                  "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold text-white shadow-sm",
                  form.image ? "text-transparent" : "text-white",
                )}
                style={previewStyle}
              >
                {!form.image && form.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{form.name || "새 워크스페이스"}</div>
                <div className="text-xs text-muted">flowdash.app/{form.urlSlug || "team"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-sidebar-primary" />
                {summaryChannels.slice(0, 3).join(", ") || "#general"}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-sidebar-primary" />
                {inviteList.length ? `${inviteList.length}명 초대 예정` : "초대 예정 없음"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={handlePrevious}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} />
            이전
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled || saving}
              className={clsx(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold",
                saving
                  ? "border-border text-muted"
                  : "border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20",
                (isNextDisabled || saving) && "opacity-60",
              )}
            >
              {isLastStep ? (
                <>
                  {saving ? "생성 중..." : "워크스페이스 만들기"}
                  {!saving && <Check size={14} />}
                </>
              ) : (
                <>
                  계속하기
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceWizard;
