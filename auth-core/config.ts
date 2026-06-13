import type { AppConfig, AppName } from './types'

export const CURRENT_APP: AppName =
  (process.env.NEXT_PUBLIC_APP_NAME as AppName) || 'robosystems'

/**
 * Each app's fixed brand hex. Cross-app safe: unlike the Tailwind `primary`
 * tokens (which only ever resolve to the *currently-running* app's palette),
 * these literals correctly represent any app from inside any other app — used
 * by the colored AnimatedLogo and the AppSwitcher so each product's mark shows
 * in its own brand color.
 */
export const BRAND_COLORS: Record<AppName, string> = {
  robosystems: '#3B7AF5', // blue
  roboledger: '#8B5CF6', // violet
  roboinvestor: '#10B981', // emerald
}

/**
 * Per-app brand gradient (CSS) for the LogoBadge chip — a white mark on a
 * brand-gradient rounded square. Cross-app safe literals (NOT tokens), so each
 * product's chip renders its own gradient from inside any app (e.g. the
 * AppSwitcher). Mirrors each app's landing hero gradient.
 */
export const BRAND_GRADIENTS: Record<AppName, string> = {
  robosystems: 'linear-gradient(135deg, #06B6D4, #3B7AF5 55%, #6366F1)', // cyan → blue → indigo
  roboledger: 'linear-gradient(135deg, #8B5CF6, #A855F7 55%, #D946EF)', // violet → purple → fuchsia
  roboinvestor: 'linear-gradient(135deg, #10B981, #14B8A6 55%, #06B6D4)', // emerald → teal → cyan
}

export const APP_CONFIGS: Record<string, AppConfig> = {
  roboinvestor: {
    name: 'roboinvestor',
    displayName: 'RoboInvestor',
    url:
      process.env.NEXT_PUBLIC_ROBOINVESTOR_APP_URL || 'https://roboinvestor.ai',
    description: 'Portfolio Management Agent',
    initials: 'RI',
    colorClass: 'bg-emerald-600 dark:bg-emerald-500',
    brandColor: BRAND_COLORS.roboinvestor,
  },
  roboledger: {
    name: 'roboledger',
    displayName: 'RoboLedger',
    url: process.env.NEXT_PUBLIC_ROBOLEDGER_APP_URL || 'https://roboledger.ai',
    description: 'Accounting & Reporting Agent',
    initials: 'RL',
    colorClass: 'bg-violet-600 dark:bg-violet-500',
    brandColor: BRAND_COLORS.roboledger,
  },
  robosystems: {
    name: 'robosystems',
    displayName: 'RoboSystems',
    url:
      process.env.NEXT_PUBLIC_ROBOSYSTEMS_APP_URL || 'https://robosystems.ai',
    description: 'Financial Intelligence Platform',
    initials: 'RS',
    colorClass: 'bg-blue-600 dark:bg-blue-500',
    brandColor: BRAND_COLORS.robosystems,
  },
}

export const getAppConfig = (appName: string): AppConfig => {
  return APP_CONFIGS[appName] || APP_CONFIGS.robosystems
}
