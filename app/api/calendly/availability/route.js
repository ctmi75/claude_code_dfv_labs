import { resolveEventTypeUri, fetchAvailableSlots } from '../../../../lib/calendly';
import { getAdvisor } from '../../../../lib/advisors';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const advisorId = searchParams.get('advisorId');
  const packageSlug = searchParams.get('packageSlug');

  const advisor = getAdvisor(advisorId);
  if (!advisor) {
    return Response.json({ error: 'Advisor not found' }, { status: 404 });
  }

  const schedulingUrl = advisor.calendlyUrls?.[packageSlug];
  if (!schedulingUrl) {
    return Response.json({ error: 'No scheduling URL configured for this session type' }, { status: 404 });
  }

  // Each advisor can have their own token; fall back to the shared token
  const token =
    process.env[`CALENDLY_API_TOKEN_${advisorId.toUpperCase()}`] ||
    process.env.CALENDLY_API_TOKEN;

  if (!token) {
    return Response.json({ error: 'Calendly API token not configured' }, { status: 500 });
  }

  try {
    const eventTypeUri = await resolveEventTypeUri(token, schedulingUrl);
    const slots = await fetchAvailableSlots(token, eventTypeUri);
    return Response.json({ slots });
  } catch (err) {
    console.error('[calendly/availability]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
