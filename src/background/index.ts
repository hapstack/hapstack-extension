import { ALARMS } from '@src/utils/constants'
import { logger } from '@src/utils/logger'

import { openLoginTab } from './auth'
import { refreshDomainCache } from './domains'
import { saveActivity, setExtensionIcon, setUninstallUrl } from './helpers'
import {
  destructureHistoryVisits,
  findKnownDomainMatches,
  getRecentBrowserHistory,
} from './history'
import { storage } from './storage'
import { getCurrentUser, isAuthenticated } from './user'

chrome.runtime.onInstalled.addListener(async (details) => {
  const user = await getCurrentUser()
  await storage.set.user(user ? { userId: user.id, teamId: user.teamId } : null)

  chrome.identity.getProfileUserInfo((profile) => {
    if (profile.email) console.info(`User email: ${profile.email}`)
  })

  if (user) {
    logger.success(`User authenticated | User Id: ${user.id}`)
    await setExtensionIcon(user.isTracked ? 'default' : 'warning')
    refreshDomainCache()
  } else {
    logger.warning('User unauthenticated')
    await setExtensionIcon('warning')
    const context = details.reason === 'update' ? 'update' : undefined
    openLoginTab(context)
  }
})

// Message sent from extension service when user logs in
// See services/extension-service/app/routes/_auth._index/route.tsx
chrome.runtime.onMessageExternal.addListener(
  async (request, sender, sendResponse) => {
    sendResponse({ received: true })

    if (request.type === 'login_success') {
      await storage.set.user({
        userId: request.payload.userId,
        teamId: request.payload.teamId,
      })
      setExtensionIcon('default')
      setUninstallUrl(request.payload.userId)
      await refreshDomainCache()
    }
  }
)

chrome.alarms.get(ALARMS.DomainRefresh.name, async (alarm) => {
  if (alarm) return
  await chrome.alarms.create(ALARMS.DomainRefresh.name, {
    periodInMinutes: ALARMS.DomainRefresh.periodInMinutes,
  })
  logger.info(`${ALARMS.DomainRefresh.name} alarm created`)
})

chrome.alarms.get(ALARMS.HistoryScan.name, async (alarm) => {
  if (alarm) return
  await chrome.alarms.create(ALARMS.HistoryScan.name, {
    periodInMinutes: ALARMS.HistoryScan.periodInMinutes,
  })
  logger.info(`${ALARMS.HistoryScan.name} alarm created`)
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.DomainRefresh.name) {
    const user = await storage.get.user()
    if (user?.teamId) {
      await refreshDomainCache()
    }
  }

  if (alarm.name === ALARMS.HistoryScan.name) {
    const isLoggedIn = await isAuthenticated()
    if (!isLoggedIn) {
      logger.warning('User unauthenticated, skipping scan')
      return
    }
    const history = await getRecentBrowserHistory()
    const visits = destructureHistoryVisits(history)
    const matches = await findKnownDomainMatches(visits)
    if (!matches.length) return
    await saveActivity(matches)
  }
})
