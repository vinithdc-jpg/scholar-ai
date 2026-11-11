import type { HTMLAttributes, ReactNode } from "react";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Surface({ children, className = "", ...props }: SurfaceProps) {
  return (
    <div
      className={`workspace-surface rounded-2xl border border-[#ddd6fe] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#312e81]">
      {children}
    </p>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[18px] font-bold tracking-[-0.025em] text-[#0f172a] dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="workspace-muted mt-1 text-[13px] text-[#858ca0]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "purple";
}) {
  const tones = {
    neutral: "bg-[#f1f5f9] text-[#475569]",
    green: "bg-[#e0e7ff] text-[#312e81]",
    blue: "bg-[#e0e7ff] text-[#312e81]",
    amber: "bg-[#fef3c7] text-[#92400e]",
    purple: "bg-[#e0e7ff] text-[#312e81]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  color = "bg-[#6366f1]",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[#ddd6fe]"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
