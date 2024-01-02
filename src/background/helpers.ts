import { AppConstants } from '@src/utils/constants'
import { logger } from '@src/utils/logger'

import { makeApiRequest } from './server'

export function isPrimaryNavigation(
  details: chrome.webNavigation.WebNavigationFramedCallbackDetails
) {
  return details.frameId === 0
}

export async function saveActivity(vendorId: number) {
  return makeApiRequest({
    path: `/sessions/${vendorId}`,
    method: 'POST',
  })
}

export function setUninstallUrl(userId: number) {
  chrome.runtime.setUninstallURL(
    `${AppConstants.extensionServerUrl}/uninstall?userId=${userId}`
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
