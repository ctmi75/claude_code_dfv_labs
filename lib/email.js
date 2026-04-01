import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Dragon Fruit Ventures <bookings@dfruitventures.com>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://claude-code-dfv-labs.vercel.app';

function humanTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
    timeZoneName: 'short',
  });
}

function buildHTML({
  advisorName,
  advisorEmail,
  customerName,
  packageName,
  packageDuration,
  packagePrice,
  startTime,
  meetLink,
}) {
  const time = humanTime(startTime);
  const meetSection = meetLink
    ? `
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${meetLink}"
         style="display:inline-block;background:#7C3AED;color:#FAFAFA;font-size:14px;font-weight:600;padding:12px 28px;border-radius:9999px;text-decoration:none;">
        Join Google Meet
      </a>
      <p style="color:#52525B;font-size:12px;margin-top:8px;">
        Link also added to your Google Calendar invite.
      </p>
    </div>`
    : `
    <p style="color:#71717A;font-size:14px;margin-bottom:32px;">
      A Google Calendar invite has been sent to your email — accept it to add the session to your calendar.
    </p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090B;color:#FAFAFA;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:48px 24px;">
    <img src="${BASE_URL}/logo.png" alt="Dragon Fruit Ventures" style="height:36px;margin-bottom:40px;" />

    <div style="width:56px;height:56px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <span style="color:#7C3AED;font-size:24px;">✓</span>
    </div>

    <h1 style="font-size:28px;font-weight:700;color:#FAFAFA;margin:0 0 8px;">Session confirmed</h1>
    <p style="color:#A1A1AA;font-size:16px;margin:0 0 32px;">
      Your advisory session is booked. See details below.
    </p>

    <div style="background:#18181B;border:1px solid #27272A;border-radius:16px;overflow:hidden;margin-bottom:32px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #27272A;">
        <span style="color:#71717A;font-size:14px;">Session</span>
        <span style="color:#FAFAFA;font-size:14px;font-weight:600;">${packageName} (${packageDuration} min)</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #27272A;">
        <span style="color:#71717A;font-size:14px;">With</span>
        <span style="color:#FAFAFA;font-size:14px;font-weight:600;">${advisorName}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #27272A;">
        <span style="color:#71717A;font-size:14px;">Time</span>
        <span style="color:#FAFAFA;font-size:14px;font-weight:600;">${time}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;">
        <span style="color:#71717A;font-size:14px;">Total paid</span>
        <span style="color:#FAFAFA;font-size:18px;font-weight:700;">$${packagePrice} USD</span>
      </div>
    </div>

    ${meetSection}

    <div style="background:#18181B;border:1px solid #27272A;border-radius:16px;padding:20px;margin-bottom:32px;">
      <p style="color:#FAFAFA;font-weight:600;font-size:14px;margin:0 0 8px;">Cancellation policy</p>
      <ul style="color:#71717A;font-size:13px;margin:0;padding-left:16px;line-height:1.8;">
        <li>Calls can be rescheduled up to 2 hours before the session.</li>
        <li>Cancellations must be submitted at least 24 hours in advance.</li>
      </ul>
    </div>

    <p style="color:#52525B;font-size:13px;">
      Questions? <a href="mailto:${advisorEmail}" style="color:#8B5CF6;text-decoration:none;">${advisorEmail}</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * Sends a payment-confirmation email to the customer.
 * Google Calendar handles the calendar invite separately (via createCalendarEvent).
 */
export async function sendBookingConfirmation({
  customerEmail,
  customerName,
  advisorEmail,
  advisorName,
  startTime,
  packageName,
  packageDuration,
  packagePrice,
  meetLink = null,
}) {
  const summary = `${packageDuration}-min Advisory Session with ${advisorName}`;

  const html = buildHTML({
    advisorName,
    advisorEmail,
    customerName: customerName || 'Guest',
    packageName,
    packageDuration,
    packagePrice,
    startTime,
    meetLink,
  });

  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Confirmed: ${summary} — ${humanTime(startTime)}`,
    html,
  });
}
