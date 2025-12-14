import type { AppConfig } from './types'

export const APP_CONFIGS: Record<string, AppConfig> = {
  roboinvestor: {
    name: 'roboinvestor',
    displayName: 'RoboInvestor',
    url:
      process.env.NEXT_PUBLIC_ROBOINVESTOR_APP_URL || 'https://roboinvestor.ai',
    description: 'Portfolio Management Agent',
    initials: 'RI',
    colorClass: 'bg-primary-600 dark:bg-primary-500',
  },
  roboledger: {
    name: 'roboledger',
    displayName: 'RoboLedger',
    url: process.env.NEXT_PUBLIC_ROBOLEDGER_APP_URL || 'https://roboledger.ai',
    description: 'Accounting and FP&A Agent',
    initials: 'RL',
    colorClass: 'bg-secondary-600 dark:bg-secondary-500',
  },
  robosystems: {
    name: 'robosystems',
    displayName: 'RoboSystems',
    url:
      process.env.NEXT_PUBLIC_ROBOSYSTEMS_APP_URL || 'https://robosystems.ai',
    description: 'Knowledge Graph Platform',
    initials: 'RS',
    colorClass: 'bg-accent-600 dark:bg-accent-500',
  },
}

export const getAppConfig = (appName: string): AppConfig => {
  return APP_CONFIGS[appName] || APP_CONFIGS.robosystems
}
