import { logger } from '@src/utils/logger'
import { z } from 'zod'

import { makeApiRequest } from './server'
import { storage } from './storage'

const userSchema = z.object({
  id: z.number().int(),
  fullName: z.string().nullish(),
  email: z.string().email(),
  avatarUrl: z.string().nullish(),
  isTracked: z.boolean(),
  teamName: z.string().nullish(),
  teamId: z.number().int().nullish(),
})

export type User = z.infer<typeof userSchema>

export async function getCurrentUser() {
  try {
    const user = await makeApiRequest(
      {
        path: `/me`,
        method: 'GET',
      },
      userSchema
    )

    await storage.set.user({ userId: user.id, teamId: user.teamId })

    return user
  } catch (e) {
    logger.warning(`Could not fetch current user`)
    return null
  }
}
