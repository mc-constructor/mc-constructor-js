import { Uuid } from '@dandi/common'
import { InjectionToken } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'
import { MessageType, PendingMessage } from './message'

export interface ClientMessageResponseContent {
  extras: string[]
}

export interface ClientMessageSuccessResponse extends ClientMessageResponseContent {
  success: true
}

export interface ClientMessageFailedResponse extends ClientMessageResponseContent {
  success: false
}

export type ClientMessageResponse = ClientMessageSuccessResponse | ClientMessageFailedResponse

export type ClientMessage = [Uuid, string[]]

export interface Client {
  send(type: MessageType, buffer?: Uint8Array | string, hasResponse?: boolean | number): PendingMessage<ClientMessageResponse>
  readonly messages$: Observable<ClientMessage>
}

export const Client: InjectionToken<Client> = localToken.opinionated('Client', {
  multi: false,
})
