import { Inject, Injectable, Logger, Provider } from '@dandi/core'
import { Observable, Subject } from 'rxjs'
import {
  filter,
  map,
  share,
  shareReplay,
  skip,
  switchMap,
  switchMapTo,
  take, tap,
} from 'rxjs/operators'

import { CompiledSimpleRequest, ExecuteResponse, RequestType, PendingRequest } from '../request'
import { RequestClient } from '../request-client'
import { ClientRawResponse, ClientResponse, isClientRawResponse, ResponseClient } from '../response-client'

import { ClientMessageConfig, SocketClientConfig } from './socket-client-config'
import { SocketConnection } from './socket-connection'

type Handled = true
const HANDLED = true

const CLIENT_READY = Symbol('SocketClient.READY')

class CompiledSocketMessage extends CompiledSimpleRequest<ClientResponse> {

  private readonly response$$: Subject<ClientResponse>

  constructor(
    private readonly config: ClientMessageConfig,
    conn$: Observable<SocketConnection>,
    public readonly type: RequestType,
    public readonly body: Uint8Array | string,
    hasResponse: boolean | number,
    debug: string,
    logger: Logger,
  ) {
    super(() => this.send(conn$), hasResponse, debug, undefined, logger)
    this.response$$ = new Subject<ClientResponse>()
  }

  public send(conn$: Observable<SocketConnection>): ExecuteResponse<ClientResponse> {
    // console.log('waiting for connection:', this.debug)
    return conn$.pipe(
      // tap(() => console.log('got connection:', this.debug)),
      switchMap(conn => new Observable<Observable<ClientResponse>>(o => {
        const newline = this.config.encoder.encode('\n')
        const id = this.config.encoder.encode(this.id.toString())
        const type = this.config.encoder.encode(this.type)
        const body = typeof this.body === 'string' ? this.config.encoder.encode(this.body) : this.body
        const content = Buffer.concat([
          id,
          newline,
          type,
          newline,
          body,
          this.config.delimiterBuffer,
        ])
        // this.logger.debug('sending to server:', content.toString('utf-8'))
        conn.write(content, (err) => {
          if (err) {
            this.logger.error(this, err)
            return o.error(err)
          }
          o.next(this.response$$.asObservable())
          o.complete()
        })
      })),
    )
  }

  public respond(responseRaw: string[]): void {
    const [successRaw, ...extras] = responseRaw
    const success = successRaw === 'true'
    const response: ClientResponse = {
      success,
      extras,
    }
    this.response$$.next(response)
    this.response$$.complete()
  }
}

@Injectable()
export class SocketClient implements RequestClient, ResponseClient {

  public readonly messages$: Observable<ClientRawResponse>

  private readonly pending = new Map<string, CompiledSocketMessage>()
  private readonly ready$: Observable<SocketConnection>

  constructor(
    @Inject(SocketConnection) private readonly conn$: Observable<SocketConnection>,
    @Inject(SocketClientConfig) private readonly config: SocketClientConfig,
    @Inject(Logger) private logger: Logger,
  ) {
    this.logger.debug('ctr')
    const incoming$ = this.initIncoming(this.conn$)
    this.ready$ = this.initReady(incoming$)
    this.messages$ = this.initMessages(incoming$)
  }

  public send(type: RequestType, buffer: Uint8Array | string, hasResponse?: boolean | number): PendingRequest<ClientResponse> {
    const msg = new CompiledSocketMessage(this.config.message, this.ready$, type, buffer, hasResponse, buffer?.toString(), this.logger)
    this.pending.set(msg.id, msg)
    return msg.pendingResponse$
  }

  private initIncoming(conn$: Observable<SocketConnection>): Observable<symbol | string> {
    return conn$.pipe(
      switchMap(conn => new Observable<symbol | string>(o => {
        conn.write(this.config.message.delimiter + '\n', (err: Error) => {
          if (err) {
            o.error(err)
            this.logger.error('error writing delimiter', err)
            return
          }
        })

        let buffer = ''
        let ready = false
        conn.on('data', chunk => {
          try {
            buffer += chunk.toString()

            // console.log('DATA CHUNK', chunk.toString().replace(/\n/g, ' '))

            const nextEnd = () => buffer.indexOf(this.config.message.delimiter)

            for (let responseEndIndex = nextEnd(); responseEndIndex >= 0; responseEndIndex = nextEnd()) {
              const response = buffer.substring(0, responseEndIndex)
              // console.log('FOUND RESPONSE', response.replace(/\n/g, ' '))
              buffer = buffer.substring(responseEndIndex + this.config.message.delimiter.length)
              if (!ready && response === '') {
                ready = true
                o.next(CLIENT_READY)
                continue
              }
              // console.log('EMITTING RESPONSE', response.replace(/\n/g, ' '))
              o.next(response)
            }
            // console.log('BUFFER', buffer.replace(/\n/g, ' '))
          } catch (err) {
            o.error(err)
          }
        })
        return () => {}
      })),
      shareReplay(1),
    )
  }

  private initReady(incoming$: Observable<symbol | string>): Observable<SocketConnection> {
    return incoming$.pipe(
      take(1),
      map(ready => {
        if (ready !== CLIENT_READY) {
          throw new Error('Received unexpected first message')
        }
        this.logger.debug('client ready')
        return undefined
      }),
      switchMapTo(this.conn$),
      shareReplay(1),
    )
  }

  private initMessages(incoming$: Observable<symbol | string>): Observable<ClientRawResponse> {
    return incoming$.pipe(
      skip(1), // skip the delimiter confirmation
      map(this.handleResponse.bind(this)),
      filter(isClientRawResponse),
      share(),
    )
  }

  private handleResponse(response: string): Handled | ClientRawResponse {
    const [id, ...parts] = response.split('\n')
    const pendingMessage = this.pending.get(id)
    // console.log('HANDLE RESPONSE', id, pendingMessage.debug)
    if (pendingMessage) {
      pendingMessage.respond(parts)
      // console.log('RESPONSE', pendingMessage.debug, parts.join(':'))
      this.pending.delete(id)
      return HANDLED
    }

    return [id, parts]
  }
}

export const RequestClientProvider: Provider<RequestClient> = {
  provide: RequestClient,
  useFactory: client => client,
  deps: [SocketClient],
}

export const ResponseClientProvider: Provider<ResponseClient> = {
  provide: ResponseClient,
  useFactory: client => client,
  deps: [SocketClient],
}
