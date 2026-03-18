const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setup() {
  console.log('Criando produtos Voku no Stripe...\n');

  const plans = [
    { name: 'Voku Starter', monthly: 14900, annual: 149000, key: 'starter' },
    { name: 'Voku Pro', monthly: 39700, annual: 397000, key: 'pro' },
    { name: 'Voku Business', monthly: 89700, annual: 897000, key: 'business' },
    { name: 'Voku Enterprise', monthly: 199700, annual: 1997000, key: 'enterprise' },
  ];

  const envVars = {};

  for (const plan of plans) {
    const product = await stripe.products.create({ name: plan.name });
    const monthly = await stripe.prices.create({
      product: product.id, unit_amount: plan.monthly, currency: 'brl',
      recurring: { interval: 'month' }, lookup_key: `voku_${plan.key}_monthly`,
    });
    const annual = await stripe.prices.create({
      product: product.id, unit_amount: plan.annual, currency: 'brl',
      recurring: { interval: 'year' }, lookup_key: `voku_${plan.key}_annual`,
    });
    envVars[`STRIPE_PRICE_${plan.key.toUpperCase()}_MONTHLY`] = monthly.id;
    envVars[`STRIPE_PRICE_${plan.key.toUpperCase()}_ANNUAL`] = annual.id;
    console.log(`✓ ${plan.name}: ${monthly.id} / ${annual.id}`);
  }

  const credits = [
    { name: 'Voku Créditos 50', amount: 4900, key: 'voku_credits_50', env: 'STRIPE_PRICE_CREDITS_50' },
    { name: 'Voku Créditos 200', amount: 14900, key: 'voku_credits_200', env: 'STRIPE_PRICE_CREDITS_200' },
    { name: 'Voku Créditos 500', amount: 29700, key: 'voku_credits_500', env: 'STRIPE_PRICE_CREDITS_500' },
  ];

  for (const credit of credits) {
    const product = await stripe.products.create({ name: credit.name });
    const price = await stripe.prices.create({
      product: product.id, unit_amount: credit.amount,
      currency: 'brl', lookup_key: credit.key,
    });
    envVars[credit.env] = price.id;
    console.log(`✓ ${credit.name}: ${price.id}`);
  }

  const fs = require('fs');
  fs.writeFileSync('.stripe-prices.json', JSON.stringify(envVars, null, 2));
  console.log('\n✓ IDs salvos em .stripe-prices.json');
}

setup().catch(console.error);
