import { redirect } from 'next/navigation'

// RoboLedger's legal docs are consolidated under the canonical RoboSystems
// policy (RFS LLC), which explicitly covers RoboLedger and RoboInvestor. This
// route is kept as a redirect so existing /pages/privacy links keep working.
export default function PrivacyPolicy() {
  const base =
    process.env.NEXT_PUBLIC_ROBOSYSTEMS_APP_URL || 'https://robosystems.ai'
  redirect(`${base}/pages/privacy`)
}
