/**
 * Landing-page constants.
 *
 * Single source of truth for the marketing cross-links used across the splash
 * sections, header, and footer. Harbinger FinLab runs the Finance AI Deployment:
 * RoboSystems on the deployment the customer chooses, on their books, with three agent
 * workflows, at a fixed fee. It never signs in to or posts on a customer's
 * books. It is deliberately NOT a RoboSystems "app" (it isn't in core's
 * APP_CONFIGS), so its URL lives here rather than in the shared footer's
 * Applications column.
 */

export const HARBINGER_URL =
  process.env.NEXT_PUBLIC_HARBINGER_URL || 'https://harbinger.finance'

export const ROBOSYSTEMS_URL =
  process.env.NEXT_PUBLIC_ROBOSYSTEMS_APP_URL || 'https://robosystems.ai'

export const GITHUB_URL = 'https://github.com/RoboFinSystems/roboledger-app'

// Intuit affiliate/referral link for QuickBooks sign-ups (outbound partner link,
// mark the anchor rel="sponsored"). Not a RoboSystems app, so it lives here.
export const QUICKBOOKS_AFFILIATE_URL =
  'https://quickbooks.intuit.com/partners/affiliates?cid=par_pim_4TcakSEFQs73'

export const REGISTER_PATH = '/register'
export const LOGIN_PATH = '/login'
export const APP_HOME_PATH = '/home'

// Redirects to the Zoom scheduler (next.config.js), so link it with a plain <a>,
// not <Link>: the destination is another site.
export const BOOK_PATH = '/book'

// RoboSystems' Mercury partner page, the referral link from the OAuth partnership (the
// same address as MercurySetupForm's). Marked rel="sponsored" wherever it is linked.
export const MERCURY_PARTNER_URL = 'https://mercury.com/partner/robosystems'
