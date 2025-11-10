import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true
})

// Subscription plans configuration
export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    features: [
      'Up to 5 facilities',
      '1,000 survey responses/month',
      'Basic analytics',
      'Email support',
      'QR code generation'
    ],
    limits: {
      facilities: 5,
      surveys: 1000
    }
  },
  PROFESSIONAL: {
    name: 'Professional', 
    price: 99,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      'Up to 25 facilities',
      '10,000 survey responses/month',
      'Advanced analytics & reporting',
      'Priority support',
      'Custom branding',
      'API access',
      'Data export'
    ],
    limits: {
      facilities: 25,
      surveys: 10000
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    features: [
      'Unlimited facilities',
      'Unlimited survey responses',
      'Custom integrations',
      'Dedicated account manager',
      'White-label solution',
      'SLA guarantee',
      'Advanced security',
      'SSO integration'
    ],
    limits: {
      facilities: -1, // unlimited
      surveys: -1     // unlimited
    }
  }
} as const

export type PlanType = keyof typeof PLANS

// Create checkout session for subscription
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  organizationId
}: {
  customerId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  organizationId: string
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId
    },
    subscription_data: {
      metadata: {
        organizationId
      }
    }
  })

  return session
}

// Create customer portal session
export async function createPortalSession({
  customerId,
  returnUrl
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })

  return session
}

// Get subscription status
export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  })
  return subscription
}

// Create customer
export async function createCustomer({
  email,
  name,
  organizationId
}: {
  email: string
  name?: string
  organizationId: string
}) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId
    }
  })

  return customer
}