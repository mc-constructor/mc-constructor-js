import { createConnection, Socket } from 'net'

import { InjectionToken, Logger, Provider } from '@dandi/core'
import { Observable, timer } from 'rxjs'
import { catchError, delay, filter, retryWhen, share, switchMap, switchMapTo, tap } from 'rxjs/operators'

import { localToken } from './local-token'
import { SocketClientConfig } from './socket-client-config'

export const SocketConnection: InjectionToken<Observable<Socket>> = localToken.opinionated('SocketConnection', {
  multi: false,
})

function socketConnectionFactory(config: SocketClientConfig, logger: Logger): Observable<Socket> {
  return new Observable<Socket>(o => {
    try {
      const conn = createConnection(config.socket, (() => {
        logger.debug('connected')
        o.next(conn)
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
    switchMap(conn => new Observable<Socket>(o => {
      conn.write(config.message.delimiter + '\n', (err: Error) => {
        if (err) {
          o.error(err)
          logger.error('error writing delimiter', err)
          return
        }
        o.next(conn)
      })
    })),
    share(),
  )
}

export const SocketConnectionProvider: Provider<Observable<Socket>> = {
  provide: SocketConnection,
  useFactory: socketConnectionFactory,
  deps: [SocketClientConfig, Logger],
}
