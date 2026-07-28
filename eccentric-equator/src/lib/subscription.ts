import { sendTelegram } from './telegram';

export interface SubscribeResult {
  success: boolean;
  message: string;
}

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const ok = await sendTelegram('subscribe', { email, source: 'newsletter' });
  if (ok) {
    return { success: true, message: 'Successfully subscribed!' };
  }
  return { success: false, message: 'Error. Please try again.' };
}
