import { Socket } from 'net'

import { Uuid } from '@dandi/common'
import { Inject, Injectable, Logger, Provider } from '@dandi/core'
import { Observable, Subject } from 'rxjs'
import {
  filter,
  first,
  map,
  share,
  shareReplay,
  switchMap,
  switchMapTo,
} from 'rxjs/operators'
import { RequestClient } from '../request-client'

import { ClientRawResponse, ClientResponse, isClientRawResponse, ResponseClient } from '../response-client'
import { CompiledSimpleRequest, ExecuteResponse, RequestType, PendingRequest } from '../request'

import { ClientMessageConfig, SocketClientConfig } from './socket-client-config'
import { SocketConnection } from './socket-connection'

type Handled = true
const HANDLED = true

class CompiledSocketMessage extends CompiledSimpleRequest<ClientResponse> {

  private readonly response$$: Subject<ClientResponse>

  constructor(
    private readonly logger: Logger,
    private readonly config: ClientMessageConfig,
    conn$: Observable<Socket>,
    public readonly type: RequestType,
    public readonly body: Uint8Array | string,
    hasResponse: boolean | number,
    debug: string,
  ) {
    super(() => this.send(conn$), hasResponse, debug)
    this.response$$ = new Subject<ClientResponse>()
  }

  public send(conn$: Observable<Socket>): ExecuteResponse<ClientResponse> {
    return conn$.pipe(
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
        this.logger.debug('sending to server:', content.toString('utf-8'))
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
  private readonly pending = new Map<Uuid, CompiledSocketMessage>()

  constructor(
    @Inject(SocketConnection) private readonly conn$: Observable<Socket>,
    @Inject(SocketClientConfig) private readonly config: SocketClientConfig,
    @Inject(Logger) private logger: Logger,
  ) {
    const incoming$ = this.initIncoming(this.conn$)
    const ready$ = this.initReady(incoming$)
    this.messages$ = this.initMessages(ready$, incoming$)
  }

  public send(type: RequestType, buffer: Uint8Array | string, hasResponse?: boolean | number): PendingRequest<ClientResponse> {
    const msg = new CompiledSocketMessage(this.logger, this.config.message, this.conn$, type, buffer, hasResponse, buffer?.toString())
    this.pending.set(msg.id, msg)
    return msg.pendingResponse$
  }

  private initIncoming(conn$: Observable<Socket>): Observable<string> {
    return conn$.pipe(
      switchMap(conn => new Observable<string>(o => {
        let buffer = ''
        conn.on('data', chunk => {
          try {
            buffer += chunk.toString()

            const responseEndIndex = buffer.indexOf(this.config.message.delimiter)
            if (responseEndIndex < 0) {
              return
            }

            const response = buffer.substring(0, responseEndIndex)
            buffer = buffer.substring(responseEndIndex + this.config.message.delimiter.length)
            o.next(response)
          } catch (err) {
            o.error(err)
          }
        })
        return () => {}
      })),
      share(),
    )
  }

  private initReady(incoming$: Observable<string>): Observable<void> {
    return incoming$.pipe(
      first(),
      map(() => this.logger.debug('client ready')),
      shareReplay(1),
    )
  }

  private initMessages(ready$: Observable<void>, incoming$: Observable<string>): Observable<ClientRawResponse> {
    return ready$.pipe(
      switchMapTo(incoming$),
      map(this.handleResponse.bind(this)),
      filter(isClientRawResponse),
      share(),
    )
  }

  private handleResponse(response: string): Handled | ClientRawResponse {
    const [idRaw, ...parts] = response.split('\n')
    const id = Uuid.for(idRaw)
    const pendingMessage = this.pending.get(id)
    if (pendingMessage) {
      pendingMessage.respond(parts)
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
