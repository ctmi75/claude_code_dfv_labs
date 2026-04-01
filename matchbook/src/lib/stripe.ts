import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

export async function createConnectAccount(email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account;
}

export async function createOnboardingLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/expert/onboarding?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/expert/onboarding?success=true`,
    type: 'account_onboarding',
  });
  return accountLink;
}

export async function createCheckoutSession(params: {
  sessionId: string;
  expertStripeAccountId: string;
  amountCents: number;
  platformFeeCents: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Expert Session',
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: params.platformFeeCents,
      transfer_data: {
        destination: params.expertStripeAccountId,
      },
      metadata: {
        session_id: params.sessionId,
      },
    },
    metadata: {
      session_id: params.sessionId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return checkoutSession;
}

export async function capturePaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

export async function createTransfer(params: {
  amount: number;
  destination: string;
  transferGroup: string;
}) {
  const transfer = await stripe.transfers.create({
    amount: params.amount,
    currency: 'usd',
    destination: params.destination,
    transfer_group: params.transferGroup,
  });
  return transfer;
}

export async function issueRefund(paymentIntentId: string) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
  return refund;
}
