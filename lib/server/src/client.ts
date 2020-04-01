import { InjectionToken } from '@dandi/core'

import { localToken } from './local-token'

export interface Client {
  send(cmd: string): void
}

export const Client: InjectionToken<Client> = localToken.opinionated<Client>('Client', {
  multi: false,
})
