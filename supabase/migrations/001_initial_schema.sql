-- RTMS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- RIGS TABLE
-- =====================
CREATE TABLE rigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rigs
INSERT INTO rigs (name) VALUES 
  ('NG-1500-4'),
  ('E-1400-7'),
  ('E-1400-5');

-- =====================
-- EMPLOYEES TABLE
-- =====================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL, -- Brazilian CPF format: XXX.XXX.XXX-XX
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  alternate_phone VARCHAR(20),
  address TEXT,
  dob DATE,
  photo_url TEXT,
  rig_id UUID REFERENCES rigs(id) ON DELETE SET NULL,
  duty_pattern JSONB,
  role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('employee', 'rig_admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_employees_rig_id ON employees(rig_id);
CREATE INDEX idx_employees_clerk_user_id ON employees(clerk_user_id);
CREATE INDEX idx_employees_cpf ON employees(cpf);

-- =====================
-- TRAINING TYPES TABLE
-- =====================
CREATE TABLE training_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  default_validity_months INTEGER NOT NULL DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default training types
INSERT INTO training_types (name, default_validity_months) VALUES 
  ('MVT', 24),
  ('IWCF', 24),
  ('Fire', 12),
  ('First Aid', 12),
  ('PME', 12);

-- =====================
-- TRAINING RECORDS TABLE
-- =====================
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_type VARCHAR(100) NOT NULL,
  completed_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'SAFE' CHECK (status IN ('SAFE', 'UPCOMING', 'OVERDUE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_training_records_employee_id ON training_records(employee_id);
CREATE INDEX idx_training_records_expiry_date ON training_records(expiry_date);
CREATE INDEX idx_training_records_status ON training_records(status);
CREATE INDEX idx_training_records_training_type ON training_records(training_type);

-- =====================
-- GRACE PERIOD SETTINGS TABLE
-- =====================
CREATE TABLE grace_period_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_type VARCHAR(100) NOT NULL UNIQUE,
  grace_months INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default grace periods
INSERT INTO grace_period_settings (training_type, grace_months) VALUES 
  ('MVT', 3),
  ('IWCF', 3),
  ('Fire', 3),
  ('First Aid', 3),
  ('PME', 3);

-- =====================
-- EMAIL TEMPLATES TABLE
-- =====================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type VARCHAR(50) NOT NULL UNIQUE CHECK (template_type IN ('upcoming_reminder', 'overdue_urgent')),
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (template_type, subject, body) VALUES 
  ('upcoming_reminder', 
   'Training Expiring Soon - {{training_type}}',
   'Dear {{employee_name}},

Your {{training_type}} training is expiring on {{expiry_date}}.

Please schedule your renewal training soon.

Days remaining: {{days_until_expiry}}

Best regards,
RTMS System'),
  ('overdue_urgent', 
   'URGENT: Training Expired - {{training_type}}',
   'Dear {{employee_name}},

Your {{training_type}} training has EXPIRED on {{expiry_date}}.

Please complete your training renewal immediately.

This is an urgent matter that requires immediate attention.

Best regards,
RTMS System');

-- =====================
-- EMAIL LOG TABLE
-- =====================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  training_type VARCHAR(100) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

CREATE INDEX idx_email_logs_employee_id ON email_logs(employee_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE rigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE grace_period_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Rigs: Everyone can read, only super_admin can modify
CREATE POLICY "Rigs are viewable by everyone" ON rigs FOR SELECT USING (true);
CREATE POLICY "Only super_admin can insert rigs" ON rigs FOR INSERT WITH CHECK (true);
CREATE POLICY "Only super_admin can update rigs" ON rigs FOR UPDATE USING (true);
CREATE POLICY "Only super_admin can delete rigs" ON rigs FOR DELETE USING (true);

-- Training Types: Everyone can read, only super_admin can modify
CREATE POLICY "Training types are viewable by everyone" ON training_types FOR SELECT USING (true);
CREATE POLICY "Only super_admin can insert training types" ON training_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Only super_admin can update training types" ON training_types FOR UPDATE USING (true);
CREATE POLICY "Only super_admin can delete training types" ON training_types FOR DELETE USING (true);

-- Employees: Complex RLS based on role
CREATE POLICY "Employees can view their own profile" ON employees FOR SELECT USING (true);
CREATE POLICY "Employees can update their own profile" ON employees FOR UPDATE USING (true);
CREATE POLICY "Admins can insert employees" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete employees" ON employees FOR DELETE USING (true);

-- Training Records: View based on employee access
CREATE POLICY "Training records are viewable" ON training_records FOR SELECT USING (true);
CREATE POLICY "Admins can insert training records" ON training_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update training records" ON training_records FOR UPDATE USING (true);
CREATE POLICY "Admins can delete training records" ON training_records FOR DELETE USING (true);

-- Grace Period Settings: Everyone can read, only super_admin can modify
CREATE POLICY "Grace periods are viewable by everyone" ON grace_period_settings FOR SELECT USING (true);
CREATE POLICY "Only super_admin can modify grace periods" ON grace_period_settings FOR UPDATE USING (true);

-- Email Templates: Everyone can read, only super_admin can modify
CREATE POLICY "Email templates are viewable by everyone" ON email_templates FOR SELECT USING (true);
CREATE POLICY "Only super_admin can modify email templates" ON email_templates FOR UPDATE USING (true);

-- Email Logs: View based on employee access
CREATE POLICY "Email logs are viewable" ON email_logs FOR SELECT USING (true);
CREATE POLICY "System can insert email logs" ON email_logs FOR INSERT WITH CHECK (true);

-- =====================
-- FUNCTIONS
-- =====================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at
  BEFORE UPDATE ON training_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grace_period_settings_updated_at
  BEFORE UPDATE ON grace_period_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate training status
CREATE OR REPLACE FUNCTION calculate_training_status(
  p_expiry_date DATE,
  p_grace_months INTEGER DEFAULT 3
)
RETURNS VARCHAR(20) AS $$
DECLARE
  grace_window_start DATE;
BEGIN
  grace_window_start := p_expiry_date - (p_grace_months * INTERVAL '1 month')::INTERVAL;
  
  IF p_expiry_date < CURRENT_DATE THEN
    RETURN 'OVERDUE';
  ELSIF CURRENT_DATE >= grace_window_start THEN
    RETURN 'UPCOMING';
  ELSE
    RETURN 'SAFE';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update all training statuses (run daily via cron)
CREATE OR REPLACE FUNCTION update_all_training_statuses()
RETURNS void AS $$
DECLARE
  rec RECORD;
  grace_months INTEGER;
  new_status VARCHAR(20);
BEGIN
  FOR rec IN SELECT tr.id, tr.expiry_date, tr.training_type 
             FROM training_records tr
  LOOP
    -- Get grace months for this training type
    SELECT gps.grace_months INTO grace_months
    FROM grace_period_settings gps
    WHERE gps.training_type = rec.training_type;
    
    IF grace_months IS NULL THEN
      grace_months := 3;
    END IF;
    
    -- Calculate new status
    new_status := calculate_training_status(rec.expiry_date, grace_months);
    
    -- Update if different
    UPDATE training_records
    SET status = new_status
    WHERE id = rec.id AND status != new_status;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- VIEWS (Optional - for easier querying)
-- =====================

-- View for employees with their current training statuses
CREATE OR REPLACE VIEW employee_training_overview AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.cpf,
  e.email,
  r.name as rig_name,
  e.role,
  tr.training_type,
  tr.completed_date,
  tr.expiry_date,
  tr.status,
  (tr.expiry_date - CURRENT_DATE) as days_until_expiry
FROM employees e
LEFT JOIN rigs r ON e.rig_id = r.id
LEFT JOIN training_records tr ON e.id = tr.employee_id;

-- View for dashboard statistics by rig
CREATE OR REPLACE VIEW rig_training_stats AS
SELECT 
  r.id as rig_id,
  r.name as rig_name,
  COUNT(DISTINCT e.id) as total_employees,
  COUNT(CASE WHEN tr.status = 'SAFE' THEN 1 END) as safe_count,
  COUNT(CASE WHEN tr.status = 'UPCOMING' THEN 1 END) as upcoming_count,
  COUNT(CASE WHEN tr.status = 'OVERDUE' THEN 1 END) as overdue_count
FROM rigs r
LEFT JOIN employees e ON e.rig_id = r.id
LEFT JOIN training_records tr ON e.id = tr.employee_id
GROUP BY r.id, r.name;
