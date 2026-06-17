import { redirect } from 'next/navigation'

// RoboLedger's legal docs are consolidated under the canonical RoboSystems
// terms (RFS LLC), which explicitly covers RoboLedger and RoboInvestor. This
// route is kept as a redirect so existing /pages/terms links keep working.
export default function TermsOfService() {
  const base =
    process.env.NEXT_PUBLIC_ROBOSYSTEMS_APP_URL || 'https://robosystems.ai'
  redirect(`${base}/pages/terms`)
}
