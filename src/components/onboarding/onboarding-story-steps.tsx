"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Briefcase,
  Dumbbell,
  HandHeart,
  Handshake,
  Palette,
  Sunrise,
  Target,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { AvatarStack } from "@/components/feedback/avatar-stack";
import { OnboardingActBadge } from "@/components/onboarding/onboarding-act-badge";
import { OnboardingChoice } from "@/components/onboarding/onboarding-choice";
import { WelcomePreviewStack } from "@/components/screens/welcome-preview-stack";
import { SurfaceCard } from "@/components/cards/surface-card";
import { CountUp } from "@/components/ui/count-up";
import { Input } from "@/components/ui/input";
import { TextAnimate } from "@/components/ui/text-animate";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { getOnboardingStepMeta } from "@/lib/onboarding-story";
import { onboardingUi } from "@/lib/onboarding-ui";
import { playFeedback } from "@/lib/feedback";
import type { OnboardingDraft } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import {
  frequencyLabel,
  goalTypeLabel,
  styleLabel,
  type CreatePactValues,
} from "@/lib/validation/pact";

const goalOptions: {
  id: CreatePactValues["goalType"];
  icon: typeof Target;
  description: string;
}[] = [
  { id: "habits", icon: Sunrise, description: "Daily routines that stick" },
  { id: "fitness", icon: Dumbbell, description: "Training, health, movement" },
  { id: "career", icon: Briefcase, description: "Work goals and milestones" },
  { id: "study", icon: Target, description: "Learning and exams" },
  { id: "creative", icon: Palette, description: "Making and shipping" },
  { id: "other", icon: Users, description: "Something else entirely" },
];

const styleOptions: {
  id: CreatePactValues["accountabilityStyle"];
  description: string;
}[] = [
  { id: "gentle", description: "Soft reminders, no pressure" },
  { id: "supportive", description: "Encouraging nudges and check-ins" },
  { id: "firm", description: "Direct accountability, clear expectations" },
  { id: "competitive", description: "Friendly rivalry and scorekeeping" },
];

const frequencyOptions: CreatePactValues["checkInFrequency"][] = [
  "daily",
  "weekdays",
  "weekly",
];

function StoryShell({
  step,
  title,
  description,
  titleAnimation = "blurInUp",
  align = "center",
  children,
}: {
  step: number;
  title: string;
  description: string;
  titleAnimation?: "blurInUp" | "slideLeft" | "scaleUp" | "blurIn";
  /** Center short story beats; keep selection screens top-aligned. */
  align?: "center" | "top";
  children?: ReactNode;
}) {
  const meta = getOnboardingStepMeta(step);
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        centered ? "justify-center py-2" : "justify-start overflow-y-auto",
      )}
    >
      <div className="w-full shrink-0">
        <OnboardingActBadge act={meta.act} chapter={meta.chapter} />
        <TextAnimate
          as="h2"
          animation={titleAnimation}
          by="word"
          delay={0.08}
          className={cn(onboardingUi.title, onboardingUi.bodyGap)}
        >
          {title}
        </TextAnimate>
        <TextAnimate
          as="p"
          animation="blurIn"
          by="word"
          delay={0.18}
          className={cn(onboardingUi.body, "max-w-[21rem]")}
        >
          {description}
        </TextAnimate>
        {children ? (
          <div className={onboardingUi.contentGap}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}

export function StoryStepMonday() {
  return (
    <StoryShell
      step={0}
      title="You said this week would be different."
      description="Monday feels possible. The goal is clear. You're sure this time."
      titleAnimation="scaleUp"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.2 }}
      >
        <SurfaceCard tone="volt" className="rounded-[1.5rem] px-5 py-5">
          <p className={onboardingUi.cardEyebrowOnLight}>This week&apos;s pact</p>
          <p className={onboardingUi.cardTitleOnLight}>Ship the landing page</p>
          <p className={onboardingUi.cardMetaOnLight}>Feeling: unstoppable</p>
        </SurfaceCard>
      </motion.div>
    </StoryShell>
  );
}

export function StoryStepWednesday() {
  const excuses = [
    "I'll start tomorrow",
    "Too tired today",
    "No one will notice",
  ];

  return (
    <StoryShell
      step={1}
      title="By Wednesday, the goal gets quieter."
      description="Life fills the space. The commitment is still there — but it's easier to ignore."
      titleAnimation="blurIn"
    >
      <div className="space-y-2.5">
        <motion.div
          animate={{ opacity: [1, 0.45, 0.45] }}
          transition={{ duration: 2, delay: 0.3 }}
        >
          <SurfaceCard tone="cream" className="rounded-[1.5rem] px-5 py-5 opacity-90">
            <p className={onboardingUi.cardEyebrowOnLight}>Still due</p>
            <p
              className={cn(
                onboardingUi.cardTitleOnLight,
                "line-through decoration-coral-400/70",
              )}
            >
              Ship the landing page
            </p>
          </SurfaceCard>
        </motion.div>
        {excuses.map((line, index) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.15 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] leading-snug text-white/45"
          >
            &ldquo;{line}&rdquo;
          </motion.p>
        ))}
      </div>
    </StoryShell>
  );
}

export function StoryStepSunday() {
  return (
    <StoryShell
      step={2}
      title="Sunday arrives. Nobody saw you almost quit."
      description="Not because you're lazy — because accountability was invisible."
      titleAnimation="blurInUp"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 20 }}
        className="flex flex-col"
      >
        <CountUp
          value={67}
          suffix="%"
          className="text-[5.5rem] leading-none tracking-[-0.04em] text-volt-500"
        />
        <TextAnimate
          as="p"
          animation="fadeIn"
          by="word"
          delay={0.9}
          className={cn(onboardingUi.body, "mt-4 max-w-[18rem]")}
        >
          of goals lose momentum within three weeks when no one is checking in.
        </TextAnimate>
      </motion.div>
    </StoryShell>
  );
}

export function StoryStepTurn() {
  return (
    <StoryShell
      step={3}
      title="What if someone was in it with you?"
      description="Not a coach. Not a crowd. One person who knows what you promised."
      titleAnimation="scaleUp"
    >
      <SurfaceCard tone="glass" className="rounded-[1.5rem] px-5 py-6">
        <TypewriterText
          text="That's the whole idea behind a pact."
          className="font-heading text-[1.375rem] font-bold leading-snug tracking-[-0.02em] text-white"
          speed={24}
          delay={300}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className={cn(onboardingUi.cardMeta, "mt-4")}
        >
          Show up. Check in. Recover together.
        </motion.p>
      </SurfaceCard>
    </StoryShell>
  );
}

export function StoryStepPact() {
  return (
    <StoryShell
      step={4}
      title="Name what you'll do today."
      description="Small, clear commitments beat vague resolutions. One signal: done, slipping, or blocked."
      titleAnimation="slideLeft"
    >
      <WelcomePreviewStack />
    </StoryShell>
  );
}

export function StoryStepTogether() {
  return (
    <StoryShell
      step={5}
      title="Invite someone who keeps you honest."
      description="Share a pact board. They see your progress. You see theirs."
      titleAnimation="scaleUp"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
      >
        <SurfaceCard tone="signal" className="rounded-[1.5rem] px-5 py-5">
          <AvatarStack
            people={[{ name: "You" }, { name: "Alex" }]}
            size="md"
          />
          <p className={cn(onboardingUi.cardTitle, "mt-4")}>Studio sprint pact</p>
          <p className={onboardingUi.cardMeta}>
            Alex nudged you 2h ago · you&apos;re still on track
          </p>
        </SurfaceCard>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 flex items-center gap-2.5 text-[13px] text-white/40"
      >
        <Handshake className="size-3.5 shrink-0 text-volt-500/80" />
        Real-time updates, not weekly guilt trips
      </motion.div>
    </StoryShell>
  );
}

export function StoryStepRecover() {
  return (
    <StoryShell
      step={6}
      title="Miss a day? Recover — don't restart."
      description="Rescue mode shrinks the goal, reschedules it, or asks for help. The pact stays alive."
      titleAnimation="blurInUp"
    >
      <motion.div
        initial={{ opacity: 0, rotate: -4, y: 20 }}
        animate={{ opacity: 1, rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.25 }}
      >
        <SurfaceCard tone="coral" className="rounded-[1.5rem] px-5 py-5">
          <p className={onboardingUi.cardEyebrowOnLight}>Rescue plan</p>
          <p className={onboardingUi.cardTitleOnLight}>Ship a smaller version tonight</p>
          <p className={onboardingUi.cardMetaOnLight}>
            Alex: &ldquo;Still counts. Let&apos;s adjust.&rdquo;
          </p>
        </SurfaceCard>
      </motion.div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="mt-4 flex items-center gap-2.5 text-[13px] text-white/40"
      >
        <HandHeart className="size-3.5 shrink-0 text-volt-500/80" />
        Progress over perfection
      </motion.div>
    </StoryShell>
  );
}

export function StoryStepGoal({
  value,
  onChange,
}: {
  value: CreatePactValues["goalType"];
  onChange: (value: CreatePactValues["goalType"]) => void;
}) {
  return (
    <StoryShell
      step={7}
      align="top"
      title="What are you building toward?"
      description="We'll tailor examples and defaults to your world."
    >
      <div className="grid gap-2">
        {goalOptions.map((option, index) => (
          <OnboardingChoice
            key={option.id}
            index={index}
            selected={value === option.id}
            title={goalTypeLabel[option.id]}
            description={option.description}
            icon={<option.icon className="size-4" />}
            onSelect={() => onChange(option.id)}
          />
        ))}
      </div>
    </StoryShell>
  );
}

export function StoryStepRhythm({
  style,
  frequency,
  onStyleChange,
  onFrequencyChange,
}: {
  style: CreatePactValues["accountabilityStyle"];
  frequency: CreatePactValues["checkInFrequency"];
  onStyleChange: (value: CreatePactValues["accountabilityStyle"]) => void;
  onFrequencyChange: (value: CreatePactValues["checkInFrequency"]) => void;
}) {
  return (
    <StoryShell
      step={8}
      align="top"
      title="How do you want to be held?"
      description="Pick your default style and check-in rhythm. You can change these per pact."
      titleAnimation="slideLeft"
    >
      <div className="space-y-5">
        <div className="grid gap-2">
          {styleOptions.map((option, index) => (
            <OnboardingChoice
              key={option.id}
              index={index}
              selected={style === option.id}
              title={styleLabel[option.id]}
              description={option.description}
              onSelect={() => onStyleChange(option.id)}
            />
          ))}
        </div>
        <p className={onboardingUi.eyebrow}>Check-in rhythm</p>
        <div className="grid gap-2">
          {frequencyOptions.map((option, index) => (
            <OnboardingChoice
              key={option}
              index={index + styleOptions.length}
              selected={frequency === option}
              title={frequencyLabel[option]}
              description={
                option === "daily"
                  ? "A quick signal every day"
                  : option === "weekdays"
                    ? "Monday through Friday"
                    : "Once a week is enough"
              }
              onSelect={() => onFrequencyChange(option)}
            />
          ))}
        </div>
      </div>
    </StoryShell>
  );
}

export function StoryStepYourPact({
  draft,
  notificationsEnabled,
  onNameChange,
  onToggleNotifications,
}: {
  draft: OnboardingDraft;
  notificationsEnabled: boolean;
  onNameChange: (value: string) => void;
  onToggleNotifications: (value: boolean) => void;
}) {
  const rows = [
    ["Focus", goalTypeLabel[draft.goalFocus]],
    ["Style", styleLabel[draft.accountabilityStyle]],
    ["Check-ins", frequencyLabel[draft.checkInFrequency]],
  ] as const;

  return (
    <StoryShell
      step={9}
      align="top"
      title="Name yourself. Start your first pact."
      description="Partners will see this on shared boards and check-ins."
      titleAnimation="blurInUp"
    >
      <div className="grid gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Input
            value={draft.displayName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-base focus-visible:border-volt-500/50 focus-visible:ring-volt-500/20"
          />
        </motion.div>

        <SurfaceCard tone="glass" padding="sm" className="rounded-2xl px-4 py-4">
          <p className={onboardingUi.cardEyebrow}>Your pact setup</p>
          <dl className="mt-3.5 grid gap-2.5 text-[14px]">
            {rows.map(([label, value], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.08 }}
                className="flex justify-between gap-4"
              >
                <dt className="text-white/40">{label}</dt>
                <dd className="font-semibold text-white/90">{value}</dd>
              </motion.div>
            ))}
          </dl>
        </SurfaceCard>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            playFeedback({ haptic: "select" });
            onToggleNotifications(!notificationsEnabled);
          }}
          className="w-full text-left"
        >
          <SurfaceCard
            tone={notificationsEnabled ? "volt" : "glass"}
            padding="sm"
            className="rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  notificationsEnabled
                    ? "inline-flex size-10 items-center justify-center rounded-xl bg-ink-950/10 text-ink-950"
                    : "inline-flex size-10 items-center justify-center rounded-xl bg-white/8 text-volt-500"
                }
              >
                <Bell className="size-4" />
              </span>
              <div>
                <p className="font-heading text-base font-bold tracking-tight">
                  Gentle reminders
                </p>
                <p
                  className={
                    notificationsEnabled
                      ? "mt-0.5 text-xs text-ink-950/70"
                      : "mt-0.5 text-xs text-white/50"
                  }
                >
                  {notificationsEnabled
                    ? "We'll nudge you on check-in days"
                    : "You can enable this later in settings"}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </motion.button>
      </div>
    </StoryShell>
  );
}

export function renderStoryStep(
  step: number,
  props: {
    draft: OnboardingDraft;
    onGoalChange: (value: CreatePactValues["goalType"]) => void;
    onStyleChange: (value: CreatePactValues["accountabilityStyle"]) => void;
    onFrequencyChange: (value: CreatePactValues["checkInFrequency"]) => void;
    onNameChange: (value: string) => void;
    onToggleNotifications: (value: boolean) => void;
  },
) {
  switch (step) {
    case 0:
      return <StoryStepMonday />;
    case 1:
      return <StoryStepWednesday />;
    case 2:
      return <StoryStepSunday />;
    case 3:
      return <StoryStepTurn />;
    case 4:
      return <StoryStepPact />;
    case 5:
      return <StoryStepTogether />;
    case 6:
      return <StoryStepRecover />;
    case 7:
      return (
        <StoryStepGoal value={props.draft.goalFocus} onChange={props.onGoalChange} />
      );
    case 8:
      return (
        <StoryStepRhythm
          style={props.draft.accountabilityStyle}
          frequency={props.draft.checkInFrequency}
          onStyleChange={props.onStyleChange}
          onFrequencyChange={props.onFrequencyChange}
        />
      );
    case 9:
      return (
        <StoryStepYourPact
          draft={props.draft}
          notificationsEnabled={props.draft.notificationsEnabled}
          onNameChange={props.onNameChange}
          onToggleNotifications={props.onToggleNotifications}
        />
      );
    default:
      return null;
  }
}
