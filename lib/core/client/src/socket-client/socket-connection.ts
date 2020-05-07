import { createConnection, Socket } from 'net'

import { InjectionToken, Logger, Provider } from '@dandi/core'
import { Observable } from 'rxjs'
import { delay, filter, retryWhen, share, shareReplay, tap } from 'rxjs/operators'

import { localToken } from '../local-token'
import { SocketClientConfig } from './socket-client-config'

export interface SocketConnection {
  write: typeof Socket.prototype.write
  on: typeof Socket.prototype.on
}

export const SocketConnection: InjectionToken<Observable<SocketConnection>> = localToken.opinionated('SocketConnection', {
  multi: false,
})

let connId = 0

function socketConnectionFactory(config: SocketClientConfig, logger: Logger): Observable<SocketConnection> {
  return new Observable<SocketConnection>(o => {
    try {
      const conn = createConnection(config.socket, (() => {
        logger.debug('connected')
        o.next(Object.assign(conn, { _id: connId++ }))
      }))
      conn.on('error', err => {
        o.error(err)
      })
      conn.on('end', () => {
        logger.debug('connection closed')
        o.complete()
      })
      return () => conn.end()
    } catch (err) {
      o.error(err)
      return () => {}
    }
  }).pipe(
    retryWhen(errors => errors.pipe(
      filter(err => err && err.code === 'ECONNREFUSED'),
      tap(() => logger.warn('connection refused, trying again...')),
      delay(500),
    )),
    shareReplay(1),
  )
}

export const SocketConnectionProvider: Provider<Observable<SocketConnection>> = {
  provide: SocketConnection,
  useFactory: socketConnectionFactory,
  deps: [SocketClientConfig, Logger],
}
