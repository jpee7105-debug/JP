import { getUncachableStripeClient } from './stripeClient';

async function seedStripeProducts() {
  const stripe = await getUncachableStripeClient();

  const products = await stripe.products.search({ query: "name:'Rabbit Hole Pro'" });
  if (products.data.length > 0) {
    console.log('Pro Plan already exists:', products.data[0].id);
    const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
    for (const price of prices.data) {
      console.log(`  Price: ${price.id} — $${(price.unit_amount || 0) / 100}/${price.recurring?.interval}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'Rabbit Hole Pro',
    description: 'Full access to all depth nodes, investigations, saved views, and advanced graph filters.',
    metadata: {
      plan: 'Pro',
      tier: 'premium',
    },
  });
  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { interval: 'monthly' },
  });
  console.log('Created monthly price:', monthlyPrice.id, '— $9/month');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 7900,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { interval: 'yearly' },
  });
  console.log('Created yearly price:', yearlyPrice.id, '— $79/year');
}

seedStripeProducts().catch(console.error);
