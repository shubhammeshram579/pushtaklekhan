/**
 * Central config for subscription plans and AI credit costs.
 * Change prices/limits here — nothing else needs to change.
 */

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: null,
    aiCreditsPerMonth: 100,
    features: [
      '100 AI credits / month',
      'All core AI writing tools',
      'Up to 3 books',
      'Auto-save & version history',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 499, // INR per month
    currency: 'INR',
    interval: 'month',
    aiCreditsPerMonth: 1500,
    features: [
      '1,500 AI credits / month',
      'All AI writing tools',
      'Unlimited books',
      'Priority AI response time',
      'Full version history & diff',
      'Priority email support',
    ],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    price: 1299, // INR per month
    currency: 'INR',
    interval: 'month',
    aiCreditsPerMonth: 5000,
    features: [
      '5,000 AI credits / month',
      'Everything in Pro',
      'Larger AI context window',
      'Early access to new features',
      'Dedicated support',
    ],
  },
};

// Cost per AI action, in credits. Tune based on real token cost once you have usage data.
const CREDIT_COSTS = {
  'fix-grammar': 1,
  'rewrite': 2,
  'continue-writing': 3,
  'summarize': 1,
  'expand': 2,
  'simplify': 1,
  'tone': 2,
  'writers-block': 2,
  'custom': 2,
};

const getPlan = (planId) => PLANS[planId] || PLANS.free;
const getCreditCost = (action) => CREDIT_COSTS[action] ?? 1;

module.exports = { PLANS, CREDIT_COSTS, getPlan, getCreditCost };
