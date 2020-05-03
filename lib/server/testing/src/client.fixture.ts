import { stub } from '@dandi/core/testing'
import { NEVER, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SinonStub } from 'sinon'

import { Client, MessageType } from '../..'

import { TestCompiledMessage } from './test-compiled-message'

export type ClientSendStubReturn =ReturnType<Client['send']> & { compiled: TestCompiledMessage }
export type ClientSendStub = SinonStub<Parameters<Client['send']>, ClientSendStubReturn>

export interface ClientFixture extends Client {
  send: ClientSendStub
  readonly lastSent: TestCompiledMessage
  config(response$: ClientFixtureResponse, responseValues?: { [key: string]: any }): void
}

export type ClientFixtureResponse = Observable<any> | Observable<any>[]

export function clientFixture(response$?: ClientFixtureResponse): ClientFixture
export function clientFixture(response$: ClientFixtureResponse, responseValues?: { [key: string ]: any }): ClientFixture
export function clientFixture(response$?: ClientFixtureResponse, responseValues?: { [key: string]: any }): ClientFixture {
  let lastSent: TestCompiledMessage
  let count = 0
  return Object.defineProperties({
    messages$: undefined,
    send: stub().callsFake((type: MessageType, cmd: Uint8Array | string, hasResponse: boolean | number = true) => {
      const callResponse$ = Array.isArray(response$) ? response$[count] : (response$ || NEVER)
      const mappedResponse$ = callResponse$.pipe(
        map(key => {
          const responseValue = responseValues ? responseValues[key] : key
          // console.log(`client.send response`, compiled.id, responseValue)
          return { success: true, extras: [responseValue] }
        }),
      )
      const compiled = new TestCompiledMessage(hasResponse, mappedResponse$, `clientFixture#${count++}`)
      // console.log(`client.send#${compiled.id}`, cmd, callResponse$ !== NEVER)
      lastSent = compiled
      return Object.assign(compiled.pendingMessage$, { compiled })
    }) as ClientSendStub,
    config(configResponse$: ClientFixtureResponse, configResponseValues?: { [key: string]: any }): void {
      response$ = configResponse$
      responseValues = configResponseValues
    },
  }, {
    lastSent: { get: () => lastSent }
  })
}
