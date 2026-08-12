import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type AvatarPerson = {
  name: string;
  src?: string;
};

type AvatarStackProps = {
  people: AvatarPerson[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
} as const;

export function AvatarStack({
  people,
  max = 3,
  size = "md",
  className,
}: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = Math.max(0, people.length - max);

  return (
    <div className={cn("flex items-center -space-x-2.5", className)}>
      {visible.map((person) => (
        <Avatar
          key={person.name}
          className={cn(
            sizeMap[size],
            "border-2 border-ink-950 ring-0"
          )}
        >
          {person.src ? <AvatarImage src={person.src} alt={person.name} /> : null}
          <AvatarFallback className="bg-signal font-semibold text-ink-950">
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            sizeMap[size],
            "inline-flex items-center justify-center rounded-full border-2 border-ink-950 bg-white font-bold text-ink-950"
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
