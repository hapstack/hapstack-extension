import { logger } from '@src/utils/logger'
import { parseDomain, ParseResultType, Validation } from 'parse-domain'
import { z } from 'zod'

import { makeApiRequest } from '../utils/makeApiRequest'
import type { destructuredDomainSchema } from './storage'
import { storage } from './storage'

const domainSchema = z.object({
  name: z.string().min(1),
  vendorId: z.number().int(),
})

export type DestructuredDomain = z.infer<typeof destructuredDomainSchema>

export type DestructuredDomainToTest = Omit<DestructuredDomain, 'vendorId'>

export function destructureUrl(rawUrl: string) {
  const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)

  const parsed = parseDomain(url.hostname, { validation: Validation.Lax })

  if (parsed.type !== ParseResultType.Listed) {
    logger.warning(`Unable to parse domain: ${rawUrl}`)
    return
  }

  const { subDomains, domain, topLevelDomains } = parsed

  if (!domain) {
    logger.warning(`Invalid URL: ${rawUrl}`)
    return
  }

  return {
    subdomains: subDomains.filter((subDomain) => subDomain !== 'www'),
    domain,
    topLevelDomains,
    pathName: url.pathname === '/' ? undefined : url.pathname,
  }
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

export async function refreshDomainCache() {
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
