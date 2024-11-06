import { CustomerData } from '@/app/api/webhook/types';

interface LoopsEvent {
  email: string;
  firstName?: string;
  lastName?: string;
  userId: string;
  eventName: string;
  data?: Record<string, any>;
}

export async function trackLoopsEvent({
  email,
  firstName,
  lastName,
  userId,
  eventName,
  data = {}
}: LoopsEvent) {
  try {
    const response = await fetch('https://api.loops.so/v1/events/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        eventName,
        userId,
        firstName,
        lastName,
        ...data,
      }),
    });

    if (!response.ok) {
      console.error('Loops tracking failed:', await response.text());
    }
  } catch (error) {
    // Log but don't throw to prevent webhook processing from failing
    console.error('Error tracking Loops event:', error);
  }
} 