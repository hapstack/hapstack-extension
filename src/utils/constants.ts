import { getAppConstants } from 'app-constants'

export const ALARMS = {
  Daily: 'daily',
  Hourly: 'hourly',
} as const
export const SESSION_TRACKING_COOLDOWN = 1000 * 60 * 60 * 24 // 24 hours

const appEnv =
  import.meta.env.MODE === 'production'
    ? 'production'
    : import.meta.env.MODE === 'staging'
      ? 'staging'
      : 'local'

export const AppConstants = getAppConstants(appEnv)
