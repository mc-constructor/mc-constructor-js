import { Socket } from 'net'

import { stub } from '@dandi/core/testing'
import { silence } from '@ts-mc/common/rxjs'
import { combineLatest, defer, merge, NEVER, Observable, of, Subject } from 'rxjs'
import { map, mapTo, shareReplay, switchMap, tap } from 'rxjs/operators'

import { SinonStub } from 'sinon'

import { SocketConnection } from '../../src/socket-client'

export interface SocketConnectionFixture extends SocketConnection {
  on: SinonStub<any[], ReturnType<typeof Socket.prototype.on>>
  write: SinonStub<any[], ReturnType<typeof Socket.prototype.write>>
}

export interface SocketConnectionFixtureFactory {
  conn$: Observable<SocketConnectionFixture>
  fixture: SocketConnectionFixture
  write$: Observable<any>
}

export interface SocketConnectionFixtureScript {
  conn$?: Observable<any>
  data$?: Observable<any>
  dataValues?: { [key: string]: any }
}

export function socketConnectionFixtureFactory(scriptFn?: () => SocketConnectionFixtureScript): SocketConnectionFixtureFactory {
  const write$$ = new Subject()
  let onData: (chunk: string) => void
  const fixture = {
    on: stub().callsFake((event: string, cb: (chunk: string) => void) => {
      if (event === 'data') {
        onData = cb
      }
    }),
    write: stub().callsFake((buffer: Uint8Array | string, cb?: (err?: Error) => void) => {
      write$$.next(buffer.toString())
      cb()
    }),
  }
  const script$ = defer(() => of(scriptFn ? scriptFn() : {})).pipe(shareReplay(1))
  const data$: Observable<any> = script$.pipe(
    switchMap(script => combineLatest([script.data$ || NEVER, of(script.dataValues)])),
    // tap(data => console.log('DATA!', data)),
    map(([data, values]) => {
      if (!onData) {
        return
      }
      onData(values ? values[data] : data)
    }),
    silence(),
  )
  const conn$ = script$.pipe(
    switchMap(script => script.conn$ ? script.conn$.pipe(mapTo(fixture)) : of(fixture)),
  )
  return {
    conn$: merge(conn$, data$).pipe(
      // IMPORTANT: required to prevent duplicated processing
      shareReplay(1),
    ),
    fixture,
    write$: write$$.asObservable(),
  }
}
