import { createConnection, Socket } from 'net'
import { TextEncoder } from 'util'

import { Uuid } from '@dandi/common'
import { Inject, Injectable, Logger } from '@dandi/core'
import { Observable } from 'rxjs'
import { share } from 'rxjs/operators'

import { Client, ClientMessage, ClientMessageResponse } from './client'
import { CompiledSimpleMessage, MessageType, PendingMessage } from './message'

const enc = new TextEncoder()
const PORT_INDEX = process.argv.indexOf('--port')
const PORT = parseInt(process.argv[PORT_INDEX + 1], 10)
const DELIMITER = '------------------------------------------'
const DELIMITER_BUF = enc.encode(DELIMITER)

class CompiledSocketMessage extends CompiledSimpleMessage<ClientMessageResponse> {

  constructor(
    private logger: Logger,
    conn: Socket,
    public readonly type: MessageType,
    public readonly body: Uint8Array | string,
    hasResponse: boolean | number,
  ) {
    super(() => {
      this.send(conn)
      return this.pendingMessage
    }, hasResponse)
  }

  public send(conn: Socket): void {
    const newline = enc.encode('\n')
    const id = enc.encode(this.id.toString())
    const type = enc.encode(this.type)
    const body = typeof this.body === 'string' ? enc.encode(this.body) : this.body
    const content = Buffer.concat([
      id,
      newline,
      type,
      newline,
      body,
      DELIMITER_BUF
    ])
    this.logger.debug('sending to server:', content.toString('utf-8'))
    conn.write(content, (err) => {
      if (err) {
        this.logger.error(this, err)
        return this.onSendErr(err)
      }

      this.onSent()
    })
  }

  public respond(responseRaw: string[]) {
    const [successRaw, ...extras] = responseRaw
    const success = successRaw === 'true'
    const response: ClientMessageResponse = {
      success,
      extras,
    }
    this.onResponse(response)
  }
}

@Injectable(Client)
export class SocketClient implements Client {

  public readonly messages$: Observable<ClientMessage>

  private conn: Socket
  private onConnected: () => void
  private onReady: () => void
  private isConnected: boolean = false
  private isReady: boolean = false
  private readonly connected: Promise<void> = new Promise<void>(resolve => this.onConnected = resolve)
  private readonly ready: Promise<void> = new Promise<void>(resolve => this.onReady = resolve)

  private readonly outgoing: CompiledSocketMessage[] = []
  private readonly pending = new Map<Uuid, CompiledSocketMessage>()

  private next: (item: [Uuid, string[]]) => void
  private error: (err: Error) => void

  private buffer = ''

  constructor(
    @Inject(Logger) private logger: Logger,
  ) {
    this.messages$ = new Observable<[Uuid, string[]]>(o => {
      this.next = o.next.bind(o)
      this.error = o.error.bind(o)
      this.conn = createConnection({ port: PORT }, this.onConnected)
      this.conn.on('end', () => {
        logger.debug('connection closed')
        o.complete()
      })
      this.conn.on('data', chunk => {
        const data = chunk.toString()
        this.buffer += data
        this.checkBuffer()
      })

      return () => {
        this.conn.end()
        this.conn = undefined
      }
    }).pipe(share())

    this.checkBuffer = this.checkBuffer.bind(this)
    this.checkQueue = this.checkQueue.bind(this)

    this.init()
  }

  public send(type: MessageType, buffer?: Uint8Array | string, hasResponse?: boolean | number): PendingMessage {
    const msg = new CompiledSocketMessage(this.logger, this.conn, type, buffer, hasResponse)
    this.outgoing.push(msg)
    this.checkQueue()
    return msg.pendingMessage
  }

  private async init(): Promise<void> {
    await this.connected
    this.logger.info('connected.')
    this.isConnected = true
    this.conn.write(DELIMITER + '\n', (err: Error) => {
      if (err) {
        this.error(err)
        this.logger.error('error writing delimiter', err);
      }
    })
  }

  private async checkQueue(): Promise<void> {
    const msg = this.outgoing.shift()
    if (!msg) {
      return
    }

    this.pending.set(msg.id, msg)
    if (!this.isReady) {
      await this.ready
    }
    msg.send(this.conn)
  }

  private checkBuffer(): void {
    const responseEndIndex = this.buffer.indexOf(DELIMITER)
    if (responseEndIndex < 0) {
      return
    }

    const response = this.buffer.substring(0, responseEndIndex)
    this.buffer = this.buffer.substring(responseEndIndex + DELIMITER.length)
    this.handleResponse(response)
    setTimeout(this.checkBuffer, 0)
  }

  private handleResponse(response: string): void {
    if (!this.isReady) {
      this.isReady = true
      this.onReady()
      this.logger.debug('client ready')
    }

    if (!response) {
      return
    }

    const [idRaw, ...parts] = response.split('\n')
    const id = Uuid.for(idRaw)
    const pendingMessage = this.pending.get(id)
    if (pendingMessage) {
      pendingMessage.respond(parts)
      this.pending.delete(id)

    } else {
      this.next([id, parts])
    }
  }
}
