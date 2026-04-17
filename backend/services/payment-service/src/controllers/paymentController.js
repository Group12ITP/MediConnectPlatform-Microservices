const Stripe = require('stripe');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error('Missing STRIPE_SECRET_KEY in environment');
    err.statusCode = 500;
    throw err;
  }
  return new Stripe(key);
}

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body || {};

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number (in smallest currency unit, e.g. cents)' });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(normalizedAmount),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.status(201).json({
      success: true,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
    });
  } catch (err) {
    next(err);
  }
};

