export type UserRole = 'employee' | 'rig_admin' | 'super_admin';

export type TrainingStatus = 'SAFE' | 'UPCOMING' | 'OVERDUE';

export type TrainingType = 'MVT' | 'IWCF' | 'Fire' | 'First Aid' | 'PME';

export interface Rig {
  id: string;
  name: string;
  created_at: string;
}

export interface Employee {
  id: string;
  auth_user_id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  alternate_phone: string | null;
  address: string | null;
  dob: string | null;
  photo_url: string | null;
  rig_id: string;
  duty_pattern: DutyPattern | null;
  role: UserRole;
  created_at: string;
  rig?: Rig;
}

export interface DutyPattern {
  start_date: string; // ISO date string of first on-duty day
  on_duty_days: number; // always 14
  off_duty_days: number; // always 14
}

export interface TrainingSchedule {
  id: string;
  training_type: string;
  start_date: string;
  end_date: string;
  location: string;
  created_at: string;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  training_type: string;
  completed_date: string;
  expiry_date: string;
  status: TrainingStatus;
  created_at: string;
}

export interface GracePeriodSetting {
  id: string;
  training_type: string;
  grace_months: number;
  updated_at: string;
}

export interface TrainingTypeConfig {
  id: string;
  name: string;
  default_validity_months: number;
  is_active: boolean;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  template_type: 'upcoming_reminder' | 'overdue_urgent';
  subject: string;
  body: string;
  updated_at: string;
}

export interface TrainingWithStatus extends TrainingRecord {
  days_until_expiry: number;
  calculated_status: TrainingStatus;
}

export interface EmployeeWithTraining extends Employee {
  training_records: TrainingWithStatus[];
  overall_status: TrainingStatus;
}

export interface DashboardStats {
  total_employees: number;
  safe_count: number;
  upcoming_count: number;
  overdue_count: number;
}

export interface BatchSuggestion {
  employee: Employee;
  training_type: string;
  expiry_date: string;
  days_until_expiry: number;
  priority: 'overdue' | 'upcoming' | 'near_expiry';
}
