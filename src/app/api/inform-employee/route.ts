import { NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/email/provider';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, training_type, schedule } = body;

    if (!employee_id || !training_type || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('name, email')
      .eq('id', employee_id)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (!employee.email) {
      return NextResponse.json({ error: 'Employee does not have an email address' }, { status: 400 });
    }

    // Build email content
    const startDate = new Date(schedule.start_date + 'T00:00:00').toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const endDate = new Date(schedule.end_date + 'T00:00:00').toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const subject = `Training Selected: ${training_type} — ${startDate} to ${endDate}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">RTMS — Training Notification</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${employee.name}</strong>,</p>
          <p>The following training has been selected for you:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Training Type</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${training_type}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Start Date</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${startDate}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">End Date</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Location</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${schedule.location}</td>
            </tr>
            ${schedule.dutyStatus ? `
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Duty Status</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${schedule.dutyStatus}</td>
            </tr>` : ''}
          </table>

          <p>If you need any assistance or have questions regarding this training, please contact your:</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Shift In-Charge</strong></li>
            <li><strong>Assistant DIC</strong></li>
            <li><strong>Safety Officer</strong></li>
            <li><strong>Storekeeper</strong></li>
          </ul>
          <p style="margin-top: 16px;">as applicable.</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            This is an automated message from the Rig Training Management System (RTMS).<br/>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email
    const emailProvider = getEmailProvider();
    const result = await emailProvider.send({
      to: employee.email,
      subject,
      html,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: `Email sent to ${employee.email}` });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Inform employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
