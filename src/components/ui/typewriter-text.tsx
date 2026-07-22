"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type TypewriterTextProps = {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
};

export function TypewriterText({
  text,
  className,
  speed = 28,
  delay = 0,
  cursor = true,
  onComplete,
}: TypewriterTextProps) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    setVisible("");
    let index = 0;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setVisible(text.slice(0, index));
        if (index >= text.length) {
          if (intervalId) window.clearInterval(intervalId);
          onComplete?.();
        }
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <p className={cn(className)}>
      {visible}
      {cursor ? (
        <motion.span
          aria-hidden
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-0.5 inline-block text-volt-500"
        >
          |
        </motion.span>
      ) : null}
    </p>
  );
}
