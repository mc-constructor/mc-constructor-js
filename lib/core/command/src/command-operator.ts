import { InjectionToken, Provider } from '@dandi/core'
import { Observable, OperatorFunction } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import { CommandRequest } from '../index'
import { RequestClient } from '../../client'

import { localToken } from './local-token'

export type CommandInput<TResponse> = CommandRequest<TResponse> | (() => CommandRequest<TResponse>)
export type CommandStaticFn = <TResponse>(cmd: CommandInput<TResponse>) => Observable<TResponse>
export type CommandOperatorFn = <TResponse>(cmd?: CommandInput<TResponse>) => OperatorFunction<any, TResponse>

export function execCommand(client: RequestClient): CommandStaticFn {
  return <TResponse>(cmdIn: CommandInput<TResponse>): Observable<TResponse> => {
    const cmd = typeof cmdIn === 'function' ? cmdIn() : cmdIn
    return cmd.execute(client)
  }
}

export function commandOperator<TResponse>(client: RequestClient, explicitCmdIn: CommandInput<TResponse>): OperatorFunction<any, TResponse>
export function commandOperator<TResponse>(client: RequestClient): OperatorFunction<CommandInput<TResponse>, TResponse>
export function commandOperator<TIn, TResponse>(client: RequestClient, explicitCmdIn?: CommandInput<TResponse>): OperatorFunction<TIn, TResponse> {
  return switchMap<TIn, Observable<TResponse>>((streamCmdIn: TIn) => execCommand(client)(explicitCmdIn || streamCmdIn as any))
}


export function command(client: RequestClient): CommandOperatorFn {
  return commandOperator.bind(undefined, client) as any
}

export const CommandOperator: InjectionToken<CommandOperatorFn> = localToken.opinionated<CommandOperatorFn>('CommandOperator', {
  multi: false,
})

export const CommandOperatorProvider: Provider<CommandOperatorFn> = {
  provide: CommandOperator,
  useFactory: command,
  deps: [RequestClient],
}
