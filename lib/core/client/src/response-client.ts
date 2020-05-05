import { Uuid } from '@dandi/common'
import { InjectionToken } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface ClientResponseContent {
  extras: string[]
}

export interface ClientSuccessResponse extends ClientResponseContent {
  success: true
}

export interface ClientErrorResponse extends ClientResponseContent {
  success: false
}

export type ClientResponse = ClientSuccessResponse | ClientErrorResponse

export type ClientRawResponse = [Uuid, string[]]

export function isClientRawResponse(obj: any): obj is ClientRawResponse {
  if (!(obj && Array.isArray(obj) && obj.length == 2)) {
    return false
  }
  const [id, parts] = obj
  if (!(typeof id === 'string' || id instanceof Uuid)) {
    return false
  }
  return Array.isArray(parts) && parts.every(part => typeof part === 'string')
}

export interface ResponseClient {
  readonly messages$: Observable<ClientRawResponse>
}

export const ResponseClient: InjectionToken<ResponseClient> = localToken.opinionated('ResponseClient', {
  multi: false,
})
