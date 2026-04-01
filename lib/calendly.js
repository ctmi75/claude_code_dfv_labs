const CALENDLY_BASE = 'https://api.calendly.com';

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Cache event type URIs per scheduling URL so we don't look them up on every request
const eventTypeUriCache = new Map();

async function getUserUri(token) {
  const res = await fetch(`${CALENDLY_BASE}/users/me`, {
    headers: authHeaders(token),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Calendly /users/me failed: ${res.status}`);
  const { resource } = await res.json();
  return resource.uri;
}

// Given a full Calendly scheduling URL (e.g. https://calendly.com/username/event-slug),
// returns the event type URI from the Calendly API.
export async function resolveEventTypeUri(token, schedulingUrl) {
  const normalized = schedulingUrl.replace(/\/$/, '').toLowerCase();
  if (eventTypeUriCache.has(normalized)) return eventTypeUriCache.get(normalized);

  const userUri = await getUserUri(token);
  const res = await fetch(
    `${CALENDLY_BASE}/event_types?user=${encodeURIComponent(userUri)}&count=50`,
    { headers: authHeaders(token), next: { revalidate: 3600 } },
  );
  if (!res.ok) throw new Error(`Calendly /event_types failed: ${res.status}`);
  const { collection } = await res.json();

  const match = collection.find((et) => {
    const etUrl = et.scheduling_url.replace(/\/$/, '').toLowerCase();
    return etUrl === normalized;
  });

  if (!match) {
    const available = collection.map((et) => et.scheduling_url).join(', ');
    throw new Error(
      `No event type found for "${schedulingUrl}". Available: ${available}`,
    );
  }

  eventTypeUriCache.set(normalized, match.uri);
  return match.uri;
}

// Returns available time slots for the next `days` days (max 7 per Calendly request,
// so we batch into two requests for 14-day coverage).
export async function fetchAvailableSlots(token, eventTypeUri, days = 14) {
  const now = new Date();

  async function fetchRange(start, end) {
    const params = new URLSearchParams({
      event_type: eventTypeUri,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
    const res = await fetch(
      `${CALENDLY_BASE}/event_type_available_times?${params}`,
      { headers: authHeaders(token), next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const { collection } = await res.json();
    return collection.filter((s) => s.status === 'available');
  }

  const midpoint = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const [first, second] = await Promise.all([
    fetchRange(now, midpoint),
    fetchRange(midpoint, end),
  ]);

  return [...first, ...second];
}
