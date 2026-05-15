"use client";

import { getStatusConfig, StatusType } from "@/lib/status-colors";

interface StatusBadgeProps {
  type: StatusType;
  value: string;
  className?: string;
  showLabel?: boolean;
}

export default function StatusBadge({ 
  type, 
  value, 
  className = "", 
  showLabel = true 
}: StatusBadgeProps) {
  const config = getStatusConfig(type, value);

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border
      ${config.colorClass}
      ${className}
    `}>
      {showLabel ? config.label : value}
    </span>
  );
}
