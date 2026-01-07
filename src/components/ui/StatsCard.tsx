'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'primary' | 'safe' | 'upcoming' | 'overdue';
}

export function StatsCard({ label, value, icon: Icon, variant = 'primary' }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className={`stats-icon stats-icon-${variant}`}>
        <Icon size={20} />
      </div>
      <div className="stats-content">
        <div className="stats-label">{label}</div>
        <div className="stats-value">{value}</div>
      </div>
    </div>
  );
}
