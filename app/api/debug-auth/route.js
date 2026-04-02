import { google } from 'googleapis';

export async function GET() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const privateKey = rawKey?.replace(/\\n/g, '\n');

  const info = {
    hasEmail: !!clientEmail,
    emailPreview: clientEmail ? `${clientEmail.slice(0, 10)}...` : null,
    hasKey: !!rawKey,
    keyLength: rawKey?.length ?? 0,
    keyStartsCorrectly: privateKey?.startsWith('-----BEGIN'),
    keyEndsCorrectly: privateKey?.trimEnd().endsWith('-----'),
  };

  if (!clientEmail || !privateKey) {
    return Response.json({ ...info, error: 'Missing credentials' }, { status: 500 });
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const { token } = await auth.authorize();
    return Response.json({
      ...info,
      auth: 'success',
      hasToken: !!token,
      tokenPreview: token ? `${token.slice(0, 15)}...` : null,
    });
  } catch (err) {
    return Response.json({ ...info, auth: 'failed', error: err.message }, { status: 500 });
  }
}
