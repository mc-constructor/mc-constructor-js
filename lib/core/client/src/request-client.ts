import { InjectionToken } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'
import { RequestType, PendingResponse, CompiledRequest } from './request'
import { ClientResponse } from './response-client'

export interface RequestClient {
  send(type: RequestType, buffer: Uint8Array | string, hasResponse?: boolean | number): PendingResponse<ClientResponse>
  sent$: Observable<CompiledRequest<ClientResponse>>
  getPendingMessage(id: string): CompiledRequest<ClientResponse>
}

export const RequestClient: InjectionToken<RequestClient> = localToken.opinionated('RequestClient', {
  multi: false,
})
