// ─────────────────────────────────────────────
// Azmarino — API Configuration
// ─────────────────────────────────────────────

// Backend URL. Set to e.g. 'http://10.0.2.2:5000' to use a local server from Android emulator.
// Leave null to use production: https://api.azmarino.online
// Backend URL override. Set to a local URL for development:
// Android emulator:    'http://10.0.2.2:5000'
// Physical device:     'http://YOUR_PC_IP:5000'
// iOS simulator:       'http://localhost:5000'
// Production:          null  (uses https://api.azmarino.online)
export const API_BASE_URL_OVERRIDE = null;

// ── Stripe ────────────────────────────────────────────────────────────────────
// TEST key  → starts with pk_test_  (no real money, use card 4242 4242 4242 4242)
// LIVE key  → starts with pk_live_  (real money charged — only use when ready!)
// Get your keys from: https://dashboard.stripe.com/apikeys
export const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51T0YR3Hlp6fyEyWIcf8FctOiro3bZO7NXi3QSb9C45YhlcaTsMQCJWXXbWKSAM4xEfW5qCHWDuGgd7IzJW94CHBp00iIe2YRCs';
// ─────────────────────────────────────────────────────────────────────────────

// Anthropic (for camera search when not using backend proxy)
export const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
