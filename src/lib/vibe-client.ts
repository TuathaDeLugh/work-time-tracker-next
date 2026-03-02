import { initNotificationClient } from 'vibe-message';

const baseUrl = process.env.NEXT_PUBLIC_NOTIFICATION_BASE_URL;
const appId = process.env.NEXT_PUBLIC_NOTIFICATION_APP_ID;
const publicKey = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLIC_KEY;

// Only initialize if we have the needed variables and we are on the client side
export const vibeClient =
  typeof window !== 'undefined' && baseUrl && appId && publicKey
    ? initNotificationClient({
        baseUrl,
        appId,
        publicKey,
      })
    : null;
