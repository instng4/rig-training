import { NextResponse } from 'next/server';
import { sendTrainingReminders } from '@/lib/email/reminders';

// This endpoint can be called by a cron job (e.g., Vercel Cron, Railway, etc.)
// to send daily training reminder emails

export async function GET(request: Request) {
  // Verify the request is authorized (use a secret token)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendTrainingReminders();
    
    return NextResponse.json({
      success: true,
      sent: result.sent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request);
}
