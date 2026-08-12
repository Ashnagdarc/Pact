"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Loader2, Share2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-demo-user";
import {
  frequencyLabel,
  styleLabel,
} from "@/lib/validation/pact";

type InviteScreenProps = {
  token: string;
};

export function InviteScreen({ token }: InviteScreenProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <InviteScreenConnected token={token} />;
}

function InviteScreenConnected({ token }: InviteScreenProps) {
  const router = useRouter();
  const preview = useQuery(api.invitations.getByToken, { token });
  const accept = useMutation(api.invitations.accept);
  const decline = useMutation(api.invitations.decline);
  const {
    userId,
    user,
    loading: userLoading,
    isAuthenticated,
  } = useCurrentUser();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (preview === undefined || userLoading) {
    return (
      <AppShell showTabs={false}>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  if (!preview || !preview.pact) {
    return (
      <AppShell showTabs={false}>
        <SurfaceCard tone="coral" className="mt-8">
          <p className="font-heading text-2xl font-bold">Invite not found</p>
          <p className="mt-2 text-sm opacity-80">
            This link may be invalid or revoked.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/sign-in">Go to sign in</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const { invitation, pact, owner } = preview;
  const inactive = invitation.status !== "pending";

  function onAccept() {
    if (!isAuthenticated || !userId) {
      router.push(`/sign-in?next=/invite/${token}`);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await accept({
          token,
          displayName: name.trim() || user?.displayName || "Partner",
        });
        router.push(`/app/pacts/${result.pactId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not accept invite");
      }
    });
  }

  function onDecline() {
    setError(null);
    startTransition(async () => {
      try {
        await decline({ token, displayName: name || undefined });
        router.push("/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not decline invite");
      }
    });
  }

  return (
    <AppShell showTabs={false}>
      <p className="pt-2 text-sm font-medium text-white/55">You&apos;re invited</p>
      <h1 className="font-heading mt-1 text-4xl font-extrabold tracking-tight">
        Join this Pact
      </h1>

      <SurfaceCard
        tone={pact.tone ?? "volt"}
        padding="lg"
        className="mt-6 rounded-[2rem]"
      >
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
          From {owner?.displayName ?? "a partner"}
        </p>
        <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight">
          {pact.title}
        </h2>
        {pact.description ? (
          <p className="mt-3 text-sm font-medium leading-relaxed opacity-80">
            {pact.description}
          </p>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase opacity-55">Style</dt>
            <dd className="mt-1 font-bold">
              {pact.accountabilityStyle
                ? styleLabel[
                    pact.accountabilityStyle as keyof typeof styleLabel
                  ] ?? pact.accountabilityStyle
                : "Supportive"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase opacity-55">
              Check-ins
            </dt>
            <dd className="mt-1 font-bold">
              {pact.checkInFrequency
                ? frequencyLabel[
                    pact.checkInFrequency as keyof typeof frequencyLabel
                  ] ?? pact.checkInFrequency
                : "Daily"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase opacity-55">Role</dt>
            <dd className="mt-1 font-bold capitalize">{invitation.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase opacity-55">
              Privacy
            </dt>
            <dd className="mt-1 font-bold">Invite only</dd>
          </div>
        </dl>
      </SurfaceCard>

      {inactive ? (
        <SurfaceCard tone="ink" className="mt-4 border border-white/10">
          <p className="text-sm text-white/70">
            This invite is <span className="font-semibold">{invitation.status}</span>.
            Ask the owner for a fresh link.
          </p>
        </SurfaceCard>
      ) : !isAuthenticated ? (
        <SurfaceCard tone="volt" className="mt-4">
          <p className="text-sm font-medium opacity-80">
            Sign in to accept this invite as yourself.
          </p>
          <Button asChild className="mt-4 rounded-full bg-ink-950 text-volt-500">
            <Link href={`/sign-in?next=/invite/${token}`}>Sign in to join</Link>
          </Button>
        </SurfaceCard>
      ) : (
        <>
          <SurfaceCard tone="ink" className="mt-4 border border-white/10">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/65">
              Your name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={user?.displayName ?? "Maya"}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
            />
          </SurfaceCard>

          {error ? (
            <p className="mt-3 text-sm font-medium text-coral-400">{error}</p>
          ) : null}

          <div className="mt-4 grid gap-3">
            <Button
              type="button"
              disabled={
                isPending ||
                (name.trim().length < 2 &&
                  !(user?.displayName && user.displayName.length >= 2))
              }
              onClick={onAccept}
              className="h-14 rounded-full bg-volt-500 text-base font-bold text-white hover:bg-volt-500/90"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Accept Pact"
              )}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              variant="ghost"
              onClick={onDecline}
              className="h-12 rounded-full border border-white/15 text-white/70"
            >
              Decline
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}

export function InviteShareCard({
  token,
  autoFocus,
  pactTitle,
}: {
  token: string;
  autoFocus?: boolean;
  pactTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const url = useMemo(() => {
    if (typeof window === "undefined") return `/invite/${token}`;
    return `${window.location.origin}/invite/${token}`;
  }, [token]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pactTitle
            ? `Join my Pact: ${pactTitle}`
            : "Join my Pact",
          text: pactTitle
            ? `Support me on “${pactTitle}” on Pact`
            : "Support me on Pact",
          url,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyLink();
  }

  async function sendInviteEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSent(false);
    setEmailBusy(true);
    try {
      const response = await fetch("/api/invite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          token,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not send invite email");
      }
      setEmailSent(true);
      setInviteEmail("");
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Could not send invite email"
      );
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <SurfaceCard
      tone="volt"
      className={`rounded-[1.75rem] ${autoFocus ? "ring-2 ring-white/40" : ""}`}
    >
      <p className="font-heading text-xl font-bold">Invite link ready</p>
      <p className="mt-1 text-sm font-medium text-ink-950/70">
        Share this with someone you trust. They sign in, then join your Pact.
      </p>
      <p className="mt-3 truncate rounded-2xl bg-black/10 px-3 py-2 text-xs font-semibold">
        {url}
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          onClick={copyLink}
          className="h-11 flex-1 rounded-full bg-ink-950 text-white hover:bg-ink-950/90"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button
          type="button"
          onClick={shareLink}
          className="h-11 flex-1 rounded-full border border-ink-950/20 bg-transparent text-ink-950 hover:bg-black/5"
        >
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      <form onSubmit={sendInviteEmail} className="mt-4 grid gap-2">
        <p className="text-xs font-semibold text-ink-950/55">Or email the invite</p>
        <Input
          type="email"
          required
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="partner@email.com"
          className="h-11 rounded-2xl border-ink-950/15 bg-white/70 text-ink-950"
        />
        <Button
          type="submit"
          disabled={emailBusy || !inviteEmail.trim()}
          className="h-11 rounded-full bg-ink-950 text-white hover:bg-ink-950/90"
        >
          {emailBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Send invite email"
          )}
        </Button>
        {emailError ? (
          <p className="text-xs font-medium text-coral-400">{emailError}</p>
        ) : null}
        {emailSent ? (
          <p className="text-xs font-medium text-ink-950/70">
            Invite email sent.
          </p>
        ) : null}
      </form>
    </SurfaceCard>
  );
}
