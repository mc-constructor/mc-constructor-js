import { InjectionToken, Provider } from '@dandi/core'
import { RequestClient } from '@ts-mc/core/client'
import { Observable } from 'rxjs'

import { localToken } from './local-token'
import { CommandRequest } from './command-request'

export type CommandStaticFn = <TResponse>(cmd: CommandRequest<TResponse>) => Observable<TResponse>

export function commandStaticFn(client: RequestClient): CommandStaticFn {
  return <TResponse>(cmd: CommandRequest<TResponse>): Observable<TResponse> => cmd.execute(client)
}

export const CommandStatic: InjectionToken<CommandStaticFn> = localToken.opinionated<CommandStaticFn>('CommandStatic', {
  multi: false,
})

export const CommandStaticProvider: Provider<CommandStaticFn> = {
  provide: CommandStatic,
  useFactory: commandStaticFn,
  deps: [RequestClient],
}
