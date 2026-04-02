import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

async function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Calendar credentials not configured');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
  await auth.authorize();
  return auth;
}

// Generate 30-min-boundary slots within working hours (9am–5pm ET, Mon–Fri)
// ET offset: UTC-5 (EST). Simplified — does not auto-adjust for DST.
const ET_OFFSET_HOURS = -5;

function toETHour(date) {
  return ((date.getUTCHours() + ET_OFFSET_HOURS) % 24 + 24) % 24;
}

function generateWorkingSlots(startDate, endDate, durationMinutes) {
  const slots = [];

  // Start at the next 30-min boundary, at least 1 h from now
  const cursor = new Date(startDate);
  cursor.setSeconds(0, 0);
  const minStart = new Date(startDate.getTime() + 60 * 60 * 1000);
  if (cursor < minStart) cursor.setTime(minStart.getTime());

  const remainder = cursor.getMinutes() % 30;
  if (remainder !== 0) cursor.setMinutes(cursor.getMinutes() + (30 - remainder));

  while (cursor < endDate) {
    const dow = cursor.getDay(); // 0=Sun … 6=Sat
    const etHour = toETHour(cursor);

    if (dow >= 1 && dow <= 5 && etHour >= 9 && etHour < 17) {
      const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
      const slotEndEtHour = toETHour(slotEnd);

      // Keep slot fully within the working day (doesn't cross midnight or past 5 pm ET)
      const sameDayET =
        Math.floor((cursor.getTime() + ET_OFFSET_HOURS * 3600000) / 86400000) ===
        Math.floor((slotEnd.getTime() + ET_OFFSET_HOURS * 3600000) / 86400000);

      if (sameDayET && slotEndEtHour <= 17) {
        slots.push({
          start_time: cursor.toISOString(),
          end_time: slotEnd.toISOString(),
        });
      }
    }

    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  return slots;
}

/**
 * Returns available time slots for `calendarId` over the next `daysAhead` days.
 * Slots are 30-min-aligned within 9am–5pm ET, Mon–Fri.
 */
export async function getAvailableSlots(calendarId, durationMinutes, daysAhead = 14) {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busyPeriods = data.calendars?.[calendarId]?.busy ?? [];

  const allSlots = generateWorkingSlots(now, timeMax, durationMinutes);

  return allSlots.filter(({ start_time, end_time }) => {
    const sStart = new Date(start_time);
    const sEnd = new Date(end_time);
    return !busyPeriods.some(
      ({ start: bStart, end: bEnd }) =>
        sStart < new Date(bEnd) && sEnd > new Date(bStart),
    );
  });
}

/**
 * Creates a Google Calendar event on `calendarId` and sends invites to all attendees.
 * Returns the created event object (includes hangoutLink if Meet was created).
 */
export async function createCalendarEvent({
  calendarId,
  summary,
  description,
  startTime,
  endTime,
  attendees, // [{ email, name }]
}) {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const { data: event } = await calendar.events.insert({
    calendarId,
    sendUpdates: 'all',
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: { dateTime: startTime, timeZone: 'America/Toronto' },
      end: { dateTime: endTime, timeZone: 'America/Toronto' },
      attendees: attendees.map(({ email, name }) => ({
        email,
        displayName: name,
      })),
      conferenceData: {
        createRequest: {
          requestId: `dfv-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  return event;
}
