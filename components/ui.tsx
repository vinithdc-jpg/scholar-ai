import type { HTMLAttributes, ReactNode } from "react";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Surface({ children, className = "", ...props }: SurfaceProps) {
  return (
    <div
      className={`workspace-surface rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#047857]">
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
    green: "bg-[#d1fae5] text-[#047857]",
    blue: "bg-[#d1fae5] text-[#047857]",
    amber: "bg-[#fff5e3] text-[#b77719]",
    purple: "bg-[#d1fae5] text-[#047857]",
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
  color = "bg-[#059669]",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]"
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
