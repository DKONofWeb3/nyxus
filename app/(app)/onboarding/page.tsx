"use client";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { TagSelector } from "@/components/ui/TagSelector";
import { createClient } from "@/lib/supabase/client";
import { PartnershipGoal, ProjectCategory, ProjectStage } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES: ProjectCategory[] = [
  "Meme coin", "DeFi", "Gaming / GameFi", "Protocol",
  "Trading bot", "AI + Crypto", "NFT", "Casino / Gambling",
  "Infrastructure", "Other",
];

const STAGES: ProjectStage[] = [
  "Pre-launch", "Just launched", "Early growth", "Established",
];

const GOALS: PartnershipGoal[] = [
  "Co-marketing campaigns",
  "Token integration",
  "Liquidity sharing",
  "KOL introductions",
  "Technical integration",
  "Community cross-pollination",
];

interface FormData {
  name: string;
  twitter_handle: string;
  telegram_handle: string;
  website: string;
  category: ProjectCategory | "";
  narrative: string;
  stage: ProjectStage | "";
  goals: PartnershipGoal[];
}

const EMPTY_FORM: FormData = {
  name: "", twitter_handle: "", telegram_handle: "", website: "",
  category: "", narrative: "", stage: "", goals: [],
};

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
            i < current ? "bg-accent" : i === current ? "bg-accent/40" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = (field: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (step === 0 && !form.name.trim()) errs.name = "Project name is required";
    if (step === 1) {
      if (!form.category) errs.category = "Pick a category";
      if (!form.narrative.trim()) errs.narrative = "Tell us about your project";
      if (form.narrative.trim().length < 20) errs.narrative = "Be a bit more specific (min 20 chars)";
    }
    if (step === 2) {
      if (!form.stage) errs.stage = "Select your current stage";
      if (form.goals.length === 0) errs.goals = "Pick at least one goal";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: form.name.trim(),
      category: form.category,
      narrative: form.narrative.trim(),
      stage: form.stage,
      goals: form.goals,
      twitter_handle: form.twitter_handle.trim().replace("@", "") || null,
      telegram_handle: form.telegram_handle.trim().replace("@", "") || null,
      website: form.website.trim() || null,
    });

    if (error) {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="h-12 flex items-center px-6 border-b border-border bg-surface flex-shrink-0">
        <Logo size="sm" />
        <span className="ml-auto font-mono text-[10px] text-text-3 uppercase tracking-widest">
          Step {step + 1} of 4
        </span>
      </header>

      {/* Scrollable content — pb-24 leaves room for pinned footer */}
      <div className="flex-1 overflow-y-auto px-4 pt-10 pb-24">
        <div className="w-full max-w-lg mx-auto">
          <ProgressBar current={step} total={4} />

          {/* STEP 0 */}
          {step === 0 && (
            <StepWrap>
              <p className="section-label-mono mb-2">Step 1</p>
              <h1 className="font-syne text-2xl font-extrabold tracking-tight mb-1">
                Tell us about your project
              </h1>
              <p className="text-sm text-text-2 mb-8">
                Start with the basics — you can always update this later.
              </p>
              <div className="flex flex-col gap-4">
                <Input
                  label="Project name *"
                  placeholder="e.g. MoonFi, ApeDAO, SolBot..."
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="X / Twitter handle"
                  placeholder="@yourproject"
                  value={form.twitter_handle}
                  onChange={(e) => set("twitter_handle", e.target.value)}
                />
                <Input
                  label="Telegram channel / group"
                  placeholder="@yourchannel or t.me/..."
                  value={form.telegram_handle}
                  onChange={(e) => set("telegram_handle", e.target.value)}
                />
                <Input
                  label="Website"
                  placeholder="https://yourproject.xyz"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                />
              </div>
            </StepWrap>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <StepWrap>
              <p className="section-label-mono mb-2">Step 2</p>
              <h1 className="font-syne text-2xl font-extrabold tracking-tight mb-1">
                What&apos;s your project about?
              </h1>
              <p className="text-sm text-text-2 mb-8">
                This shapes every match and insight we give you. Be specific — it matters.
              </p>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="input-label">Category *</label>
                  <TagSelector
                    options={CATEGORIES}
                    selected={form.category ? [form.category] : []}
                    onChange={(v) => set("category", v[0] ?? "")}
                    multi={false}
                  />
                  {errors.category && (
                    <p className="text-[11px] text-brand-red mt-2">{errors.category}</p>
                  )}
                </div>
                <Textarea
                  label="Your narrative (in your own words) *"
                  placeholder="What's the story? What problem does it solve, what's the vibe, what makes it different?"
                  value={form.narrative}
                  onChange={(e) => set("narrative", e.target.value)}
                  className="min-h-[120px]"
                  error={errors.narrative}
                />
              </div>
            </StepWrap>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <StepWrap>
              <p className="section-label-mono mb-2">Step 3</p>
              <h1 className="font-syne text-2xl font-extrabold tracking-tight mb-1">
                Where are you at?
              </h1>
              <p className="text-sm text-text-2 mb-8">
                Your stage affects which partnerships are realistic right now.
              </p>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="input-label">Current stage *</label>
                  <TagSelector
                    options={STAGES}
                    selected={form.stage ? [form.stage] : []}
                    onChange={(v) => set("stage", v[0] ?? "")}
                    multi={false}
                  />
                  {errors.stage && (
                    <p className="text-[11px] text-brand-red mt-2">{errors.stage}</p>
                  )}
                </div>
                <div>
                  <label className="input-label">Partnership goals *</label>
                  <p className="text-xs text-text-3 mb-2">Select all that apply</p>
                  <TagSelector
                    options={GOALS}
                    selected={form.goals}
                    onChange={(v) => set("goals", v as PartnershipGoal[])}
                    multi={true}
                  />
                  {errors.goals && (
                    <p className="text-[11px] text-brand-red mt-2">{errors.goals}</p>
                  )}
                </div>
              </div>
            </StepWrap>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <StepWrap>
              <p className="section-label-mono mb-2">Step 4</p>
              <h1 className="font-syne text-2xl font-extrabold tracking-tight mb-1">
                Looks good?
              </h1>
              <p className="text-sm text-text-2 mb-8">
                Review your project profile before we start finding matches.
              </p>
              <div className="card divide-y divide-border">
                <ReviewRow label="Project" value={form.name} />
                {form.twitter_handle && (
                  <ReviewRow label="X / Twitter" value={`@${form.twitter_handle.replace("@", "")}`} />
                )}
                {form.telegram_handle && (
                  <ReviewRow label="Telegram" value={form.telegram_handle} />
                )}
                {form.website && <ReviewRow label="Website" value={form.website} />}
                <ReviewRow label="Category" value={form.category} />
                <ReviewRow label="Stage" value={form.stage} />
                <div className="px-4 py-3">
                  <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-1">Narrative</p>
                  <p className="text-sm text-text leading-relaxed">{form.narrative}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Goals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.goals.map((g) => (
                      <span key={g} className="tag selected text-[11px] px-2.5 py-1">{g}</span>
                    ))}
                  </div>
                </div>
              </div>
              {saveError && (
                <p className="text-xs text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg mt-4">
                  {saveError}
                </p>
              )}
            </StepWrap>
          )}
        </div>
      </div>

      {/* Pinned bottom bar — always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-border px-6 py-4 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-5 bg-accent" : i < step ? "w-1.5 bg-accent/40" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" onClick={back}>← Back</Button>
            )}
            {step < 3 ? (
              <Button onClick={next}>
                {step === 2 ? "Review →" : "Next →"}
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={saving}>
                🚀 Launch my profile →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  );
}