const CALENDLY_API_BASE = 'https://api.calendly.com';
const CALENDLY_AUTH_BASE = 'https://auth.calendly.com';

const CALENDLY_CLIENT_ID = process.env.CALENDLY_CLIENT_ID!;
const CALENDLY_CLIENT_SECRET = process.env.CALENDLY_CLIENT_SECRET!;
const CALENDLY_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendly/callback`;

export function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CALENDLY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: CALENDLY_REDIRECT_URI,
  });
  return `${CALENDLY_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: CALENDLY_CLIENT_ID,
      client_secret: CALENDLY_CLIENT_SECRET,
      redirect_uri: CALENDLY_REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Calendly token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: CALENDLY_CLIENT_ID,
      client_secret: CALENDLY_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Calendly token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
  };
}

export async function getEventTypes(accessToken: string) {
  const user = await getCurrentUser(accessToken);
  const params = new URLSearchParams({ user: user.uri });

  const response = await fetch(
    `${CALENDLY_API_BASE}/event_types?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch event types: ${response.statusText}`);
  }

  const data = await response.json();
  return data.collection as Array<{
    uri: string;
    name: string;
    slug: string;
    active: boolean;
    duration: number;
  }>;
}

export async function getScheduledEvents(
  accessToken: string,
  userUri: string
) {
  const params = new URLSearchParams({
    user: userUri,
    status: 'active',
  });

  const response = await fetch(
    `${CALENDLY_API_BASE}/scheduled_events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch scheduled events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.collection as Array<{
    uri: string;
    name: string;
    status: string;
    start_time: string;
    end_time: string;
  }>;
}

export async function createSchedulingLink(
  accessToken: string,
  eventTypeUri: string
) {
  const response = await fetch(`${CALENDLY_API_BASE}/scheduling_links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_event_count: 1,
      owner: eventTypeUri,
      owner_type: 'EventType',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scheduling link: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    booking_url: data.resource.booking_url as string,
    owner: data.resource.owner as string,
  };
}

export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Calendly user: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    uri: data.resource.uri as string,
    name: data.resource.name as string,
    email: data.resource.email as string,
    scheduling_url: data.resource.scheduling_url as string,
  };
}
