'use client';

import { TrainingStatus } from '@/lib/types/database';

interface StatusBadgeProps {
  status: TrainingStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showDot = true, size = 'md' }: StatusBadgeProps) {
  const statusLabels: Record<TrainingStatus, string> = {
    'SAFE': 'Valid',
    'UPCOMING': 'Expiring Soon',
    'OVERDUE': 'Expired',
  };

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : '';

  return (
    <span className={`status-badge status-badge-${status.toLowerCase()} ${sizeClasses}`}>
      {showDot && <span className={`status-dot status-dot-${status.toLowerCase()}`} />}
      {statusLabels[status]}
    </span>
  );
}

interface StatusDotProps {
  status: TrainingStatus;
}

export function StatusDot({ status }: StatusDotProps) {
  return <span className={`status-dot status-dot-${status.toLowerCase()}`} />;
}
