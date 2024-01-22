import { Constants } from '@src/utils/constants'
import { logger } from '@src/utils/logger'
import type { TypeOf, z } from 'zod'

type RequestOptions = {
  path: string
  method: RequestInit['method']
  body?: any
}

export async function makeApiRequest(options: RequestOptions): Promise<void>

export async function makeApiRequest<T extends z.ZodTypeAny>(
  options: RequestOptions,
  schema: T
): Promise<TypeOf<T>>

export async function makeApiRequest<T extends z.ZodTypeAny>(
  options: RequestOptions,
  schema?: T
): Promise<T | void> {
  try {
    const response = await fetch(
      `${Constants.extensionServerUrl}${options.path}`,
      {
        credentials: 'include',
        method: options.method || 'GET',
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: { 'X-Extension-Version': __EXT_VERSION__ },
      }
    )

    if (!response.ok) {
      logger.error(
        `API response error | Path: ${options.path} | Status: ${response.status} | Message: ${response.statusText}`
      )
      throw new Error(response.statusText)
    }

    const json = await response.json()
    if (schema) return schema.parse(json)
  } catch (e) {
    logger.error(
      e instanceof Error
        ? `API request failed | Path: ${options.path} | Message: ${e.message}`
        : `Unknown API error | Path: ${options.path}`
    )
    throw e
  }
}
