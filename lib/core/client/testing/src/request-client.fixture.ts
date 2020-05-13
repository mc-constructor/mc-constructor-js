import { stub } from '@dandi/core/testing'
import { ClientResponse, isClientResponse, RequestClient, RequestType } from '@ts-mc/core/client'
import { NEVER, Observable, ReplaySubject } from 'rxjs'
import { map } from 'rxjs/operators'
import { SinonStub } from 'sinon'

import { TestCompiledRequest } from './test-compiled-request'

export type ClientSendStubReturn =ReturnType<RequestClient['send']> & { compiled: TestCompiledRequest }
export type ClientSendStub = SinonStub<Parameters<RequestClient['send']>, ClientSendStubReturn>

export interface RequestClientFixture extends RequestClient {
  readonly send: ClientSendStub
  readonly lastSent: TestCompiledRequest
  readonly write$: Observable<string>
  config(response$: ClientFixtureResponse, responseValues?: { [key: string]: any }): void
}

export type ClientFixtureResponse = Observable<any> | Observable<any>[] | ((cmd: string) => Observable<ClientResponse>)

export function requestClientFixture(response$?: ClientFixtureResponse): RequestClientFixture
export function requestClientFixture(response$: ClientFixtureResponse, responseValues?: { [key: string ]: any }): RequestClientFixture
export function requestClientFixture(response$?: ClientFixtureResponse, responseValues?: { [key: string]: any }): RequestClientFixture {
  let lastSent: TestCompiledRequest
  let count = 0
  // use a ReplaySubject so that ordering of marbles expectations doesn't matter
  const write$$ = new ReplaySubject<string>()
  return Object.defineProperties({
    send: stub().callsFake((type: RequestType, cmd: Uint8Array | string, hasResponse: boolean | number = true) => {
      const callResponse$ = typeof response$ === 'function' ?
        response$(cmd.toString()) :
          Array.isArray(response$) ?
            response$[count] :
              (response$ || NEVER)
      const mappedResponse$: Observable<ClientResponse> = callResponse$.pipe(
        map(key => {
          const responseValue = responseValues ? responseValues[key] : key
          return isClientResponse(responseValue) ? responseValue : {
            success: true,
            extras: Array.isArray(responseValue) ? responseValue : [responseValue] }
        }),
      )
      const sendFn = () => write$$.next(cmd.toString())
      const compiled = new TestCompiledRequest(hasResponse, mappedResponse$, `clientFixture#${count++}`, sendFn)
      // console.log(`client.send#${compiled.id}`, cmd, callResponse$ !== NEVER)
      lastSent = compiled
      return Object.assign(compiled.pendingResponse$, { compiled })
    }) as ClientSendStub,
    config(configResponse$: ClientFixtureResponse, configResponseValues?: { [key: string]: any }): void {
      response$ = configResponse$
      responseValues = configResponseValues
    },
    write$: write$$.asObservable(),
  }, {
    lastSent: { get: () => lastSent },
  })
}
