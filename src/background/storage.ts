import { z } from 'zod'

export const destructuredDomainSchema = z.object({
  pathName: z.string().optional(),
  subdomains: z.array(z.string().optional()),
  topLevelDomains: z.string().array(),
  domain: z.string(),
  vendorId: z.number().int(),
})

export const userSchema = z.object({
  userId: z.number().int().nullish(),
  teamId: z.number().int().nullish(),
})

type User = z.infer<typeof userSchema>

export const localStorageSchema = z.object({
  cachedVendors: z
    .map(
      z.coerce.number(),
      z.object({ lastTracked: z.number().positive().default(Date.now()) })
    )
    .catch(() => new Map()),
  domains: destructuredDomainSchema.array().optional(),
})

const get = {
  cachedVendor: async (id: number) => {
    const storage = await chrome.storage.local.get('cachedVendors')
    const map = new Map(Object.entries(storage.cachedVendors || {}))
    const safeMap = localStorageSchema.shape.cachedVendors.parse(map)
    return safeMap.get(id)
  },

  cachedVendors: async () => {
    const storage = await chrome.storage.local.get('cachedVendors')
    const map = new Map(Object.entries(storage.cachedVendors || {}))
    return localStorageSchema.shape.cachedVendors.parse(map)
  },

  domains: async () => {
    const storage = await chrome.storage.local.get('domains')
    return localStorageSchema.shape.domains.parse(storage.domains)
  },

  user: async () => {
    const storage = await chrome.storage.local.get('user')
    return userSchema.optional().parse(storage.user)
  },
}

const set = {
  cachedVendor: async (vendorId: number) => {
    const vendors = await get.cachedVendors()
    vendors.set(vendorId, { lastTracked: Date.now() })
    return chrome.storage.local.set({
      cachedVendors: Object.fromEntries(vendors),
    })
  },

  domains: async (domains?: any[]) => {
    if (domains === null) return chrome.storage.local.remove('domains')
    const safeDomains = localStorageSchema.shape.domains.parse(domains)
    return chrome.storage.local.set({ domains: safeDomains })
  },

  user: async (user: User | null) => {
    if (user === null) return chrome.storage.local.remove('user')
    const safeUser = userSchema.parse(user)
    return chrome.storage.local.set({ user: safeUser })
  },
}

export const storage = {
  get,
  set,
}
