import { differenceInDays, parseISO, isAfter, isBefore, addMonths } from 'date-fns';
import type { TrainingStatus, TrainingRecord, TrainingWithStatus, GracePeriodSetting } from '@/lib/types/database';

// Default grace periods (in months)
const DEFAULT_GRACE_PERIODS: Record<string, number> = {
  'MVT': 3,
  'IWCF': 3,
  'Fire': 3,
  'First Aid': 3,
  'PME': 3,
};

/**
 * Calculate the training status based on expiry date and grace period
 */
export function calculateTrainingStatus(
  expiryDate: string,
  gracePeriodMonths: number = 3,
  today: Date = new Date()
): TrainingStatus {
  const expiry = parseISO(expiryDate);
  const graceWindowStart = addMonths(expiry, -gracePeriodMonths);

  // If expiry is in the past, it's OVERDUE
  if (isBefore(expiry, today)) {
    return 'OVERDUE';
  }

  // If we're within the grace window (expiry is coming up), it's UPCOMING
  if (isAfter(today, graceWindowStart) || today >= graceWindowStart) {
    return 'UPCOMING';
  }

  // Otherwise, it's SAFE
  return 'SAFE';
}

/**
 * Get the status color for UI display
 */
export function getStatusColor(status: TrainingStatus): string {
  switch (status) {
    case 'SAFE':
      return '#22c55e'; // green-500
    case 'UPCOMING':
      return '#f97316'; // orange-500
    case 'OVERDUE':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Get the status background color for UI display
 */
export function getStatusBgColor(status: TrainingStatus): string {
  switch (status) {
    case 'SAFE':
      return '#dcfce7'; // green-100
    case 'UPCOMING':
      return '#ffedd5'; // orange-100
    case 'OVERDUE':
      return '#fee2e2'; // red-100
    default:
      return '#f3f4f6'; // gray-100
  }
}

/**
 * Get the status label for UI display
 */
export function getStatusLabel(status: TrainingStatus): string {
  switch (status) {
    case 'SAFE':
      return 'Valid';
    case 'UPCOMING':
      return 'Expiring Soon';
    case 'OVERDUE':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: string, today: Date = new Date()): number {
  return differenceInDays(parseISO(expiryDate), today);
}

/**
 * Enrich a training record with calculated status and days
 */
export function enrichTrainingRecord(
  record: TrainingRecord,
  gracePeriodMonths: number = DEFAULT_GRACE_PERIODS[record.training_type] || 3,
  today: Date = new Date()
): TrainingWithStatus {
  return {
    ...record,
    days_until_expiry: getDaysUntilExpiry(record.expiry_date, today),
    calculated_status: calculateTrainingStatus(record.expiry_date, gracePeriodMonths, today),
  };
}

/**
 * Enrich multiple training records using grace period settings
 */
export function enrichTrainingRecords(
  records: TrainingRecord[],
  graceSettings: GracePeriodSetting[],
  today: Date = new Date()
): TrainingWithStatus[] {
  const graceMap = new Map(graceSettings.map(s => [s.training_type, s.grace_months]));
  
  return records.map(record => {
    const graceMonths = graceMap.get(record.training_type) || DEFAULT_GRACE_PERIODS[record.training_type] || 3;
    return enrichTrainingRecord(record, graceMonths, today);
  });
}

/**
 * Get the overall status for an employee based on their training records
 * Returns the worst status among all trainings
 */
export function getOverallStatus(trainings: TrainingWithStatus[]): TrainingStatus {
  if (trainings.length === 0) return 'SAFE';
  
  const hasOverdue = trainings.some(t => t.calculated_status === 'OVERDUE');
  if (hasOverdue) return 'OVERDUE';
  
  const hasUpcoming = trainings.some(t => t.calculated_status === 'UPCOMING');
  if (hasUpcoming) return 'UPCOMING';
  
  return 'SAFE';
}

/**
 * Sort training records by priority (overdue first, then upcoming, then by expiry date)
 */
export function sortByPriority(trainings: TrainingWithStatus[]): TrainingWithStatus[] {
  return [...trainings].sort((a, b) => {
    // Priority order: OVERDUE (0) > UPCOMING (1) > SAFE (2)
    const priorityMap: Record<TrainingStatus, number> = { 'OVERDUE': 0, 'UPCOMING': 1, 'SAFE': 2 };
    const priorityDiff = priorityMap[a.calculated_status] - priorityMap[b.calculated_status];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by nearest expiry first
    return a.days_until_expiry - b.days_until_expiry;
  });
}

/**
 * Get suggested employees for a training batch
 */
export interface BatchEmployee {
  employee_id: string;
  employee_name: string;
  training_type: string;
  expiry_date: string;
  days_until_expiry: number;
  status: TrainingStatus;
  priority: number;
}

export function getSuggestedBatch(
  trainings: TrainingWithStatus[],
  employees: Map<string, string>, // employee_id -> name
  trainingType?: string
): BatchEmployee[] {
  let filtered = trainings;
  
  if (trainingType) {
    filtered = trainings.filter(t => t.training_type === trainingType);
  }
  
  // Only include OVERDUE and UPCOMING
  filtered = filtered.filter(t => t.calculated_status !== 'SAFE');
  
  // Sort by priority and expiry
  const sorted = sortByPriority(filtered);
  
  return sorted.map((t, index) => ({
    employee_id: t.employee_id,
    employee_name: employees.get(t.employee_id) || 'Unknown',
    training_type: t.training_type,
    expiry_date: t.expiry_date,
    days_until_expiry: t.days_until_expiry,
    status: t.calculated_status,
    priority: index + 1,
  }));
}
