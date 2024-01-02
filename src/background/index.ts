import { ALARMS } from '@src/utils/constants'
import { logger } from '@src/utils/logger'

import { openLoginTab } from './auth'
import { downloadAllDomains, findVendorMatch } from './domains'
import {
  isPrimaryNavigation,
  saveActivity,
  setExtensionIcon,
  setUninstallUrl,
} from './helpers'
import { storage } from './storage'
import { getCurrentUser } from './user'

chrome.runtime.onInstalled.addListener(async (details) => {
  const user = await getCurrentUser()
  await storage.set.user(user ? { userId: user.id, teamId: user.teamId } : null)

  chrome.identity.getProfileUserInfo((profile) => {
    if (profile.email) console.info(`User email: ${profile.email}`)
  })

  if (!user) {
    logger.warning('User unauthenticated')
    await setExtensionIcon('warning')
    const context = details.reason === 'update' ? 'update' : undefined
    openLoginTab(context)
  } else {
    logger.success(`User authenticated | User Id: ${user.id}`)
    await setExtensionIcon('default')
    downloadAllDomains()
  }
})

// Message sent from extension service when user logs in
// See services/extension-service/app/routes/_auth._index/route.tsx
chrome.runtime.onMessageExternal.addListener(async (request) => {
  if (request.type === 'login_success') {
    await storage.set.user({
      userId: request.payload.userId,
      teamId: request.payload.teamId,
    })
    setExtensionIcon('default')
    setUninstallUrl(request.payload.userId)
    await downloadAllDomains()
  }
})

chrome.alarms.get(ALARMS.Daily, async (alarm) => {
  if (!alarm) {
    await chrome.alarms.create(ALARMS.Hourly, { periodInMinutes: 60 })
    logger.info('Daily alarm created')
  }
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.Hourly) {
    logger.info('Daily alarm triggered')
    await downloadAllDomains()
  }
})

chrome.webNavigation.onCompleted.addListener(async (details) => {
  const user = await storage.get.user()
  if (!user?.userId) {
    logger.warning('User unauthenticated, ignoring request')
    return
  }
  if (!isPrimaryNavigation(details)) return
  const vendorId = await findVendorMatch(details.url)
  if (!vendorId) return
  await saveActivity(vendorId)
  logger.success(
    `Activity saved | Url: ${details.url} | Vendor Id: ${vendorId}`
  )
})
