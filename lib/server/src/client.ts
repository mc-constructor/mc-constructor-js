import { InjectionToken } from '@dandi/core'
import { localToken } from './local-token'

export type ExpectResponse<TResponse> = TResponse extends void ? false : true

export interface Client {
  send<TResponse>(cmd: string, expectResponse: ExpectResponse<TResponse>): Promise<TResponse extends void ? void : string>
}

export const Client: InjectionToken<Client> = localToken.opinionated<Client>('Client', {
  multi: false,
})
