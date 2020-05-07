import { stub } from '@dandi/core/testing'
import { RequestClient, RequestType } from '@ts-mc/core/client'
import { NEVER, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SinonStub } from 'sinon'

import { TestCompiledRequest } from './test-compiled-request'

export type ClientSendStubReturn =ReturnType<RequestClient['send']> & { compiled: TestCompiledRequest }
export type ClientSendStub = SinonStub<Parameters<RequestClient['send']>, ClientSendStubReturn>

export interface RequestClientFixture extends RequestClient {
  send: ClientSendStub
  readonly lastSent: TestCompiledRequest
  config(response$: ClientFixtureResponse, responseValues?: { [key: string]: any }): void
}

export type ClientFixtureResponse = Observable<any> | Observable<any>[]

export function requestClientFixture(response$?: ClientFixtureResponse): RequestClientFixture
export function requestClientFixture(response$: ClientFixtureResponse, responseValues?: { [key: string ]: any }): RequestClientFixture
export function requestClientFixture(response$?: ClientFixtureResponse, responseValues?: { [key: string]: any }): RequestClientFixture {
  let lastSent: TestCompiledRequest
  let count = 0
  return Object.defineProperties({
    send: stub().callsFake((type: RequestType, cmd: Uint8Array | string, hasResponse: boolean | number = true) => {
      const callResponse$ = Array.isArray(response$) ? response$[count] : (response$ || NEVER)
      const mappedResponse$ = callResponse$.pipe(
        map(key => {
          const responseValue = responseValues ? responseValues[key] : key
          // console.log(`client.send response`, compiled.id, responseValue)
          return { success: true, extras: [responseValue] }
        }),
      )
      const compiled = new TestCompiledRequest(hasResponse, mappedResponse$, `clientFixture#${count++}`)
      // console.log(`client.send#${compiled.id}`, cmd, callResponse$ !== NEVER)
      lastSent = compiled
      return Object.assign(compiled.pendingResponse$, { compiled })
    }) as ClientSendStub,
    config(configResponse$: ClientFixtureResponse, configResponseValues?: { [key: string]: any }): void {
      response$ = configResponse$
      responseValues = configResponseValues
    },
  }, {
    lastSent: { get: () => lastSent }
  })
}
