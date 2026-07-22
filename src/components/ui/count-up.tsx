"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";
import { playUiSound } from "@/lib/ui-sounds";

type CountUpProps = {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
  onComplete?: () => void;
};

export function CountUp({
  value,
  suffix = "",
  className,
  duration = 1.2,
  onComplete,
}: CountUpProps) {
  const spring = useSpring(0, { stiffness: 90, damping: 18 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [shown, setShown] = useState("0");

  useEffect(() => {
    spring.set(value);
    const timeout = window.setTimeout(() => {
      playUiSound("reveal");
      onComplete?.();
    }, duration * 1000);
    const unsubscribe = display.on("change", (latest) => {
      setShown(String(latest));
    });
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [value, spring, display, duration, onComplete]);

  return (
    <motion.p
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={cn("font-heading text-4xl font-extrabold tracking-tight text-volt-500", className)}
    >
      {shown}
      {suffix}
    </motion.p>
  );
}
