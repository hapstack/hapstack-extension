import { Constants } from '@src/utils/constants'
import { z } from 'zod'

import { makeApiRequest } from '../utils/makeApiRequest'
import { setExtensionIcon } from './helpers'
import { storage } from './storage'

export const providerSchema = z.enum(['google', 'microsoft'])

export function openLoginTab(context?: 'update') {
  const url = new URL(`${Constants.extensionServerUrl}/login`)
  if (context) url.searchParams.set('context', context)
  chrome.tabs.create({ url: url.toString() })
}

export async function logout() {
  await makeApiRequest({ path: '/logout', method: 'POST' })
  await storage.set.user(null)
  await setExtensionIcon('warning')
}
