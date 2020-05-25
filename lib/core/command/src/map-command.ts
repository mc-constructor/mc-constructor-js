import { InjectionToken, Provider } from '@dandi/core'
import { RequestClient } from '@ts-mc/core/client'
import { Observable, OperatorFunction } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { CommandRequest } from './command-request'
import { localToken } from './local-token'
import { commandStaticFn } from './command-static'

/**
 * A function that generates a {@link CommandRequest} given an input
 */
export type CommandInputFn<TIn, TResponse> = (input?: TIn) => CommandRequest<TResponse>

/**
 * An value that is either a {@link CommandRequest} or a {@link CommandInputFn}
 */
export type CommandInput<TIn, TResponse> = CommandRequest<TResponse> | CommandInputFn<TIn, TResponse>

export type MapCommandOperatorFn = <TIn, TResponse>(cmd?: CommandInput<TIn, TResponse>) => OperatorFunction<TIn, TResponse>

export function commandOperator<TIn, TResponse>(client: RequestClient, cmdIn: CommandInput<TIn, TResponse>): OperatorFunction<TIn, TResponse> | Observable<TResponse> {
  return mergeMap<TIn, Observable<TResponse>>((streamIn: TIn) => {
    const cmd = typeof cmdIn === 'function' ? cmdIn(streamIn) : cmdIn
    return commandStaticFn(client)(cmd)
  })
}

export function mapCommandOperatorFn(client: RequestClient): MapCommandOperatorFn {
  return commandOperator.bind(undefined, client) as any
}

export const MapCommand: InjectionToken<MapCommandOperatorFn> = localToken.opinionated<MapCommandOperatorFn>('MapCommandOperator', {
  multi: false,
})

export const MapCommandProvider: Provider<MapCommandOperatorFn> = {
  provide: MapCommand,
  useFactory: mapCommandOperatorFn,
  deps: [RequestClient],
}
