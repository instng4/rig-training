-- Training Schedules Table
-- Stores available training sessions that admins can create
-- Run this in Supabase SQL Editor

CREATE TABLE training_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_schedules_type ON training_schedules(training_type);
CREATE INDEX idx_training_schedules_dates ON training_schedules(start_date, end_date);

-- Enable RLS
ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Training schedules viewable by all" ON training_schedules FOR SELECT USING (true);
CREATE POLICY "Admins can insert schedules" ON training_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update schedules" ON training_schedules FOR UPDATE USING (true);
CREATE POLICY "Admins can delete schedules" ON training_schedules FOR DELETE USING (true);
