import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailProvider, renderTemplate, textToHtml } from './provider';
import { enrichTrainingRecords } from '@/lib/utils/training-status';

export async function sendTrainingReminders() {
  const supabase = createAdminClient();
  const emailProvider = getEmailProvider();

  try {
    // Get all training records with employee info
    const { data: records, error: recordsError } = await supabase
      .from('training_records')
      .select('*, employees(id, name, email)')
      .order('expiry_date');

    if (recordsError || !records) {
      console.error('Error fetching records:', recordsError);
      return { sent: 0, errors: [] };
    }

    // Get grace settings
    const { data: graceSettings } = await supabase
      .from('grace_period_settings')
      .select('*');

    // Get email templates
    const { data: templates } = await supabase
      .from('email_templates')
      .select('*');

    if (!graceSettings || !templates) {
      console.error('Missing grace settings or templates');
      return { sent: 0, errors: [] };
    }

    const upcomingTemplate = templates.find(t => t.template_type === 'upcoming_reminder');
    const overdueTemplate = templates.find(t => t.template_type === 'overdue_urgent');

    if (!upcomingTemplate || !overdueTemplate) {
      console.error('Missing email templates');
      return { sent: 0, errors: [] };
    }

    // Enrich records with status
    const enrichedRecords = enrichTrainingRecords(records, graceSettings);

    let sent = 0;
    const errors: string[] = [];

    // Get today's date for checking if we already sent an email
    const today = new Date().toISOString().split('T')[0];

    for (const record of enrichedRecords) {
      const employee = (record as any).employees;
      if (!employee?.email) continue;

      // Only send for UPCOMING and OVERDUE
      if (record.calculated_status === 'SAFE') continue;

      // Check if we already sent email today for this record
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('employee_id', employee.id)
        .eq('training_type', record.training_type)
        .gte('sent_at', today)
        .single();

      if (existingLog) continue; // Already sent today

      const template = record.calculated_status === 'OVERDUE' 
        ? overdueTemplate 
        : upcomingTemplate;

      const variables = {
        employee_name: employee.name,
        training_type: record.training_type,
        expiry_date: new Date(record.expiry_date).toLocaleDateString(),
        days_until_expiry: String(Math.abs(record.days_until_expiry)),
      };

      const subject = renderTemplate(template.subject, variables);
      const body = textToHtml(renderTemplate(template.body, variables));

      const result = await emailProvider.send({
        to: employee.email,
        subject,
        html: body,
      });

      // Log the email
      await supabase.from('email_logs').insert({
        employee_id: employee.id,
        template_type: template.template_type,
        training_type: record.training_type,
        status: result.success ? 'sent' : 'failed',
      });

      if (result.success) {
        sent++;
      } else {
        errors.push(`Failed to send to ${employee.email}: ${result.error}`);
      }
    }

    return { sent, errors };
  } catch (error) {
    console.error('Error in sendTrainingReminders:', error);
    return { sent: 0, errors: [String(error)] };
  }
}
