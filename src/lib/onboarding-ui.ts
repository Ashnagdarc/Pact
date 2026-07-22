/** Shared onboarding typography & spacing (8px grid, steep hierarchy). */
export const onboardingUi = {
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30",
  chapter: {
    giveUp: "text-[13px] font-semibold uppercase tracking-[0.12em] text-white/45",
    pact: "text-[13px] font-semibold uppercase tracking-[0.12em] text-volt-500/75",
    yours: "text-[13px] font-semibold uppercase tracking-[0.12em] text-signal/80",
  },
  title:
    "font-heading text-[1.875rem] leading-[1.12] font-extrabold tracking-[-0.02em] text-white",
  body: "text-[15px] leading-[1.65] text-white/50",
  bodyGap: "mt-4",
  contentGap: "mt-8",
  cardEyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40",
  cardEyebrowOnLight:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-950/50",
  cardTitle: "font-heading mt-2.5 text-xl font-bold leading-tight tracking-tight",
  cardTitleOnLight:
    "font-heading mt-2.5 text-xl font-bold leading-tight tracking-tight text-ink-950",
  cardMeta: "mt-2 text-[13px] leading-relaxed text-white/45",
  cardMetaOnLight: "mt-2 text-[13px] leading-relaxed text-ink-950/65",
} as const;
