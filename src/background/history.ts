import { ALARMS, SESSION_TRACKING_COOLDOWN } from '@src/utils/constants'
import { logger } from '@src/utils/logger'
import { subMinutes } from 'date-fns'

import type { DestructuredDomain } from './domains'
import { destructureUrl, findDomainMatch } from './domains'
import { storage } from './storage'

export async function getRecentBrowserHistory() {
  const startTime = subMinutes(
    new Date(),
    ALARMS.HistoryScan.periodInMinutes + 2 // Give a little buffer
  ).getTime()

  const results = await chrome.history.search({
    startTime,
    maxResults: 1000000,
    text: '',
  })

  return results
}

type DestructuredUrl = ReturnType<typeof destructureUrl>

type DestructuredVisit = DestructuredUrl & {
  lastVisited?: number
}

export function destructureHistoryVisits(
  items: chrome.history.HistoryItem[]
): DestructuredVisit[] {
  return items.flatMap((item) => {
    if (!item.url) return []
    const destructured = destructureUrl(item.url)
    if (!destructured) return []
    return {
      ...destructured,
      lastVisited: item.lastVisitTime,
    }
  })
}

export type MatchedVisit = {
  vendorId: number
  lastVisited?: number
}

export async function findKnownDomainMatches(visits: DestructuredVisit[]) {
  const knownDomains = await storage.get.domains()
  const matches: MatchedVisit[] = []
  for (const visit of visits) {
    const match = await matchVisitWithKnownDomain(visit, knownDomains)
    if (match) matches.push({ vendorId: match, lastVisited: visit.lastVisited })
  }
  return matches
}

async function matchVisitWithKnownDomain(
  visit: DestructuredVisit,
  knownDomains?: DestructuredDomain[]
) {
  if (!knownDomains?.length) {
    logger.error('No known domains provided')
    return
  }

  const match = findDomainMatch(knownDomains, visit)

  if (!match) return

  const cachedVendor = await storage.get.cachedVendor(match.vendorId)

  if (!cacheIsExpired(cachedVendor?.lastTracked)) {
    logger.info(`App visited recently, ignoring visit`)
    return
  }

  logger.success(
    `Activity saved | Domain: ${visit.domain} | Vendor Id: ${match.vendorId}`
  )

  await storage.set.cachedVendor(match.vendorId)

  return match.vendorId
}

function cacheIsExpired(lastVisited?: number) {
  if (!lastVisited) return true
  const millisecondsElapsed = Date.now() - lastVisited
  return millisecondsElapsed > SESSION_TRACKING_COOLDOWN
}
