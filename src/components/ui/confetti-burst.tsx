"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type ConfettiBurstProps = {
  burstKey: number;
  className?: string;
  particleCount?: number;
};

const colors = ["#ff5226", "#9eb5ff", "#ff6b45", "#b8e0a8", "#ffffff"];

export function ConfettiBurst({
  burstKey,
  className,
  particleCount = 72,
}: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (burstKey === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rotation: number;
      spin: number;
      color: string;
      life: number;
      ttl: number;
    };

    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 7;
      return {
        x: width * 0.5 + (Math.random() - 0.5) * 40,
        y: height * 0.28 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        life: 0,
        ttl: 90 + Math.random() * 50,
      };
    });

    let frame = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.life += 1;
        particle.vy += 0.11;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.992;
        particle.rotation += particle.spin;

        const alpha = 1 - particle.life / particle.ttl;
        if (alpha <= 0) continue;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        ctx.restore();
      }

      frame += 1;
      if (frame < 120) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [burstKey, particleCount]);

  if (burstKey === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-30", className)}
    />
  );
}
