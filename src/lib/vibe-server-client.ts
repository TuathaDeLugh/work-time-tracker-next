import { initServerClient } from 'vibe-message';

const baseUrl = process.env.NEXT_PUBLIC_NOTIFICATION_BASE_URL;
const appId = process.env.NEXT_PUBLIC_NOTIFICATION_APP_ID;
const secretKey = process.env.NOTIFICATION_SECRET_KEY;

// Ensure we have the required keys
export const vibeServerClient =
  baseUrl && appId && secretKey
    ? initServerClient({
        baseUrl,
        appId,
        secretKey,
      })
    : null;
