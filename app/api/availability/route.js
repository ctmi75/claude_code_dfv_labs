import { getAvailableSlots } from '../../../lib/google-calendar';
import { getAdvisor } from '../../../lib/advisors';
import { packages } from '../../../lib/packages';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const advisorId = searchParams.get('advisorId');
  const packageSlug = searchParams.get('packageSlug');

  const advisor = getAdvisor(advisorId);
  if (!advisor) {
    return Response.json({ error: 'Advisor not found' }, { status: 404 });
  }

  const pkg = packages.find((p) => p.id === packageSlug);
  if (!pkg) {
    return Response.json({ error: 'Package not found' }, { status: 404 });
  }

  const calendarId = advisor.googleCalendarId;
  if (!calendarId) {
    return Response.json({ error: 'Calendar not configured for this advisor' }, { status: 500 });
  }

  try {
    const slots = await getAvailableSlots(calendarId, pkg.duration);
    return Response.json({ slots });
  } catch (err) {
    console.error('[availability]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
