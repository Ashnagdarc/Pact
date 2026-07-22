"use client";

import { memo } from "react";
import {
  AnimatePresence,
  motion,
  type Variants,
  type DOMMotionComponents,
  type MotionProps,
} from "motion/react";

import { cn } from "@/lib/utils";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown";

const motionElements = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

type MotionElementType = Extract<
  keyof DOMMotionComponents,
  keyof typeof motionElements
>;

interface TextAnimateProps extends Omit<MotionProps, "children"> {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  duration?: number;
  variants?: Variants;
  as?: MotionElementType;
  by?: AnimationType;
  startOnView?: boolean;
  once?: boolean;
  animation?: AnimationVariant;
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const animationVariants: Record<
  AnimationVariant,
  { container: Variants; item: Variants }
> = {
  fadeIn: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    },
  },
  blurIn: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(10px)" },
      show: {
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.35 },
      },
    },
  },
  blurInUp: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(8px)", y: 18 },
      show: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: { duration: 0.4 },
      },
    },
  },
  blurInDown: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(8px)", y: -18 },
      show: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: { duration: 0.4 },
      },
    },
  },
  slideUp: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    },
  },
  slideDown: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: -20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    },
  },
  slideLeft: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, x: 20 },
      show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
    },
  },
  slideRight: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, x: -20 },
      show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
    },
  },
  scaleUp: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.82 },
      show: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 280, damping: 22 },
      },
    },
  },
  scaleDown: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 1.12 },
      show: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 280, damping: 22 },
      },
    },
  },
};

function TextAnimateBase({
  children,
  delay = 0,
  duration = 0.3,
  className,
  segmentClassName,
  as: Component = "p",
  startOnView = false,
  once = true,
  by = "word",
  animation = "blurInUp",
  ...props
}: TextAnimateProps) {
  const MotionComponent = motionElements[Component];

  const segments =
    by === "word"
      ? children.split(/(\s+)/)
      : by === "character"
        ? children.split("")
        : by === "line"
          ? children.split("\n")
          : [children];

  const preset = animationVariants[animation];

  return (
    <MotionComponent
      variants={{
        ...preset.container,
        show: {
          ...preset.container.show,
          transition: {
            delayChildren: delay,
            staggerChildren: duration / Math.max(segments.length, 1),
          },
        },
      }}
      initial="hidden"
      animate="show"
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={`${by}-${segment}-${index}`}
          variants={preset.item}
          className={cn(
            by === "line" ? "block" : "inline-block whitespace-pre",
            segmentClassName,
          )}
          aria-hidden={segment.trim() === ""}
        >
          {segment}
        </motion.span>
      ))}
    </MotionComponent>
  );
}

export const TextAnimate = memo(TextAnimateBase);
