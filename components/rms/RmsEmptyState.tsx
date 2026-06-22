"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { memo, type ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
};

function RmsEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      role="status"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/35">
        <Icon size={24} aria-hidden />
      </div>
      <h2 className="mt-4 font-serif text-xl text-white/85">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default memo(RmsEmptyState);
