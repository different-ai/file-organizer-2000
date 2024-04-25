import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  if (req === null) throw new Error(`Missing userId or request`, { cause: { req } });
  const stripeSignature = req.headers.get('stripe-signature');
  if (stripeSignature === null) throw new Error('stripeSignature is null');

  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), stripeSignature, webhookSecret);
  } catch (error) {
    if (error instanceof Error)
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
  }
  if (event === undefined) throw new Error(`event is undefined`);
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`Payment successful for session ID: ${session.id}`);
      clerkClient.users.updateUserMetadata(event.data.object.metadata?.userId as string, {
        publicMetadata: {
          stripe: {
            status: session.status,
            payment: session.payment_status,
          },
        },
      });
      break;
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ status: 200, message: 'success' });
}