import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Matchbook <noreply@matchbook.app>';

export async function sendSessionBooked(params: {
  clientEmail: string;
  expertEmail: string;
  expertName: string;
  sessionDate: string;
  calendlyLink: string;
  clientContext: string | null;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.clientEmail,
    subject: `Session booked with ${params.expertName}`,
    html: `
      <h2>Your session is booked!</h2>
      <p>You have a session scheduled with <strong>${params.expertName}</strong> on <strong>${params.sessionDate}</strong>.</p>
      ${params.clientContext ? `<p><strong>Your context:</strong> ${params.clientContext}</p>` : ''}
      <p><a href="${params.calendlyLink}">View your booking details</a></p>
    `,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.expertEmail,
    subject: 'New session booked',
    html: `
      <h2>You have a new session!</h2>
      <p>A client has booked a session with you on <strong>${params.sessionDate}</strong>.</p>
      ${params.clientContext ? `<p><strong>Client context:</strong> ${params.clientContext}</p>` : ''}
    `,
  });
}

export async function sendSessionReminder(params: {
  email: string;
  name: string;
  sessionDate: string;
  role: 'client' | 'expert';
}) {
  const subject =
    params.role === 'client'
      ? 'Reminder: Your upcoming session'
      : 'Reminder: You have an upcoming session';

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.email,
    subject,
    html: `
      <h2>Session Reminder</h2>
      <p>Hi ${params.name},</p>
      <p>This is a reminder that you have a session scheduled on <strong>${params.sessionDate}</strong>.</p>
    `,
  });
}

export async function sendSessionCompleted(params: {
  clientEmail: string;
  clientName: string;
  expertName: string;
  sessionId: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.clientEmail,
    subject: `Your session with ${params.expertName} is complete`,
    html: `
      <h2>Session Complete</h2>
      <p>Hi ${params.clientName},</p>
      <p>Your session with <strong>${params.expertName}</strong> has been completed.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/sessions/${params.sessionId}/review">Leave a review</a></p>
    `,
  });
}

export async function sendRefundIssued(params: {
  clientEmail: string;
  clientName: string;
  amount: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.clientEmail,
    subject: 'Refund issued for your session',
    html: `
      <h2>Refund Issued</h2>
      <p>Hi ${params.clientName},</p>
      <p>A refund of <strong>${params.amount}</strong> has been issued to your original payment method. Please allow 5-10 business days for processing.</p>
    `,
  });
}

export async function sendExpertApproved(params: {
  expertEmail: string;
  expertName: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.expertEmail,
    subject: 'Your expert profile has been approved!',
    html: `
      <h2>Congratulations, ${params.expertName}!</h2>
      <p>Your expert profile on Matchbook has been approved. You can now receive session bookings from clients.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/expert/dashboard">Go to your dashboard</a></p>
    `,
  });
}

export async function sendInvite(params: {
  email: string;
  inviteLink: string;
  role: 'expert' | 'client';
}) {
  const roleLabel = params.role === 'expert' ? 'an expert' : 'a client';

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.email,
    subject: `You're invited to join Matchbook as ${roleLabel}`,
    html: `
      <h2>You've been invited to Matchbook!</h2>
      <p>You've been invited to join Matchbook as ${roleLabel}.</p>
      <p><a href="${params.inviteLink}">Accept your invitation</a></p>
      <p>This invitation link will expire, so be sure to sign up soon.</p>
    `,
  });
}
