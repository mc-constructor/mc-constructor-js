import { InjectionToken } from '@dandi/core'


import { localToken } from './local-token'
import { RequestType, PendingRequest } from './request'
import { ClientResponse } from './response-client'

export interface RequestClient {
  send(type: RequestType, buffer: Uint8Array | string, hasResponse?: boolean | number): PendingRequest<ClientResponse>
}

export const RequestClient: InjectionToken<RequestClient> = localToken.opinionated('RequestClient', {
  multi: false,
})
