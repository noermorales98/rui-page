import Stripe from 'stripe'

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

let _client: Stripe | null = null

export function stripe(): Stripe {
  if (!_client) _client = getStripeClient()
  return _client
}
