import { getConstants } from '@hapstack/constants'

export const ALARMS = {
  DomainRefresh: {
    name: 'DomainRefresh',
    periodInMinutes: 60 * 24,
  },
  HistoryScan: {
    name: 'HistoryScan',
    periodInMinutes: 10,
  },
} as const

export const SESSION_TRACKING_COOLDOWN = 1000 * 60 * 60 * 24 // 24 hours

const appEnv =
  import.meta.env.MODE === 'production'
    ? 'production'
    : import.meta.env.MODE === 'staging'
      ? 'staging'
      : 'local'

export const Constants = getConstants(appEnv)
