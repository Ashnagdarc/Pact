import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const surfaceVariants = cva(
  "relative overflow-hidden rounded-[1.75rem] p-5 transition-transform duration-300 will-change-transform",
  {
    variants: {
      tone: {
        ink: "bg-ink-800 text-white",
        volt: "bg-volt-500 text-ink-950",
        signal: "bg-signal text-white",
        coral: "bg-coral-400 text-ink-950",
        cream: "bg-cream-200 text-ink-950",
        mint: "bg-mint-300 text-ink-950",
        paper: "bg-paper-100 text-ink-950",
        glass: "bg-white/8 text-white backdrop-blur-md border border-white/10",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      tone: "ink",
      padding: "md",
    },
  }
);

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
} & VariantProps<typeof surfaceVariants> &
  Omit<ComponentPropsWithoutRef<"div">, "children">;

export function SurfaceCard({
  children,
  className,
  tone,
  padding,
  as: Comp = "article",
  ...props
}: SurfaceCardProps) {
  return (
    <Comp
      className={cn(surfaceVariants({ tone, padding }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { surfaceVariants };
