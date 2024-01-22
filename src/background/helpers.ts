import { Constants } from '@src/utils/constants'
import { logger } from '@src/utils/logger'

import { makeApiRequest } from '../utils/makeApiRequest'
import type { MatchedVisit } from './history'

export async function saveActivity(visits: MatchedVisit[]) {
  return makeApiRequest({
    path: `/sessions`,
    method: 'POST',
    body: { activity: visits },
  })
}

export function setUninstallUrl(userId: number) {
  chrome.runtime.setUninstallURL(
    `${Constants.extensionServerUrl}/uninstall?userId=${userId}`
  )
  logger.info(`Uninstall url set`)
}

export async function setExtensionIcon(icon: 'default' | 'warning') {
  const basePath = `/icon/32${
    import.meta.env.MODE !== 'production' ? '-staging' : ''
  }`
  return chrome.action.setIcon({
    path: `${basePath}${icon === 'default' ? '' : '-warning'}.png`,
  })
}
