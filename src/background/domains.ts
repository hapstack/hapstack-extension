import { SESSION_TRACKING_COOLDOWN } from '@src/utils/constants'
import { logger } from '@src/utils/logger'
import { parseDomain, ParseResultType, Validation } from 'parse-domain'
import { z } from 'zod'

import { makeApiRequest } from './server'
import type { destructuredDomainSchema } from './storage'
import { storage } from './storage'

const domainSchema = z.object({
  name: z.string().min(1),
  vendorId: z.number().int(),
})

export type DestructuredDomain = z.infer<typeof destructuredDomainSchema>
export type DestructuredDomainToTest = Omit<DestructuredDomain, 'vendorId'>

export function destructureUrl(url: string) {
  const urlObject = new URL(url.startsWith('http') ? url : `https://${url}`)
  const parsedDomain = parseDomain(urlObject.hostname, {
    validation: Validation.Lax,
  })
  if (parsedDomain.type !== ParseResultType.Listed)
    throw new Error(`Unable to parse invalid url: ${url}`)
  const { subDomains, domain, topLevelDomains } = parsedDomain

  if (!domain) throw new Error('Domain is required')

  return {
    subdomains: subDomains.filter((subDomain) => subDomain !== 'www'),
    domain,
    topLevelDomains,
    pathName: urlObject.pathname === '/' ? undefined : urlObject.pathname,
  }
}

export async function findVendorMatch(url: string) {
  const domainList = await storage.get.domains()
  if (!domainList || domainList?.length === 0) {
    logger.error('No domains cached')
    return
  }
  const visitedDomain = destructureUrl(url)
  const match = findDomainMatch(domainList, visitedDomain)
  if (!match) {
    logger.info(`No app match found, ignoring request`)
    return
  }
  const cachedVendor = await storage.get.cachedVendor(match.vendorId)
  if (!cacheIsExpired(cachedVendor?.lastTracked)) {
    // Visited recently, don't track
    logger.info(`App visited recently, ignoring request`)
    return
  }
  await storage.set.cachedVendor(match.vendorId) // Only update last tracked timestamp we're going to track
  return match.vendorId
}

export function findDomainMatch(
  domainList: DestructuredDomain[],
  visitedDomain: DestructuredDomainToTest
) {
  return domainList.find((trackedDomain) => {
    if (!domainsAreEqual(trackedDomain, visitedDomain)) return false
    if (!tldsAreEqual(trackedDomain, visitedDomain)) return false
    if (hasWildCardSubdomain(trackedDomain))
      return visitedDomain.subdomains.length > 0
    if (subdomainsAreEqual(trackedDomain, visitedDomain)) {
      if (!trackedDomain.pathName) return true
      return isPartialPathnameMatch(trackedDomain, visitedDomain)
    }
    return false
  })
}

function domainsAreEqual(a: DestructuredDomain, b: DestructuredDomainToTest) {
  return a.domain === b.domain
}

function tldsAreEqual(a: DestructuredDomain, b: DestructuredDomainToTest) {
  return a.topLevelDomains.join() === b.topLevelDomains.join()
}

function hasWildCardSubdomain(domain: DestructuredDomain) {
  return Boolean(
    domain.subdomains.find(
      (subdomain) => subdomain && ['*', '%2A'].includes(subdomain)
    ) // Encoded asterisk
  )
}

function subdomainsAreEqual(
  a: DestructuredDomain,
  b: DestructuredDomainToTest
) {
  return a.subdomains.join() === b.subdomains.join()
}

function isPartialPathnameMatch(
  trackedDomain: DestructuredDomain,
  testDomain: DestructuredDomainToTest
) {
  if (!trackedDomain.pathName) throw new Error('Pathname is required')
  const trackedPathSegments = trackedDomain.pathName.split('/')
  const testPathSegments = testDomain.pathName?.split('/')
  return trackedPathSegments.at(1) === testPathSegments?.at(1)
}

export async function downloadAllDomains() {
  const domains = await makeApiRequest(
    {
      path: '/domains',
      method: 'GET',
    },
    domainSchema.array()
  )

  const destructuredDomains = domains.map((domain) => ({
    ...destructureUrl(domain.name),
    vendorId: domain.vendorId,
  }))
  await storage.set.domains(destructuredDomains)
  logger.success('Downloaded updated domain list')
}

function cacheIsExpired(lastVisited?: number) {
  if (!lastVisited) return true
  const millisecondsElapsed = Date.now() - lastVisited
  return millisecondsElapsed > SESSION_TRACKING_COOLDOWN
}
