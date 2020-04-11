import { createConnection, Socket } from 'net'
import { TextEncoder } from 'util'

import { Uuid } from '@dandi/common'
import { Injectable } from '@dandi/core'
import { Observable } from 'rxjs'
import { share } from 'rxjs/operators'

import { MessageType } from './message'

const enc = new TextEncoder()
const PORT_INDEX = process.argv.indexOf('--port')
const PORT = parseInt(process.argv[PORT_INDEX + 1], 10)
const DELIMITER = '------------------------------------------'
const DELIMITER_BUF = enc.encode(DELIMITER)

export interface MessageResponseContent {
  extras: string[]
}

export interface MessageSuccessResponse extends MessageResponseContent {
  success: true
}

export interface MessageFailedResponse extends MessageResponseContent {
  success: false
}

export type MessageResponse = MessageSuccessResponse | MessageFailedResponse

export interface PendingMessage<TResponse = any> extends Promise<TResponse> {
  id: string | Uuid
  sent: Promise<void>
}

export type ExecuteFn<TResponse> = () => PendingMessage<TResponse>

export interface CompiledMessage<TResponse = any> {
  id: string | Uuid
  pendingMessage: PendingMessage
  sent: Promise<void>
  execute: ExecuteFn<TResponse>
}

export type MakeResponseFn<TResponse> = (pending: PendingMessage) => Promise<TResponse> & PendingMessage

class OutgoingMessage {

  public readonly id: string | Uuid = Uuid.create()
  public readonly sent: Promise<void>
  public readonly pendingMessage: PendingMessage

  private onSent: () => void
  private onSendErr: (err: Error) => void
  public onResponse: (response: string[]) => void

  constructor(
    public readonly type: MessageType,
    public readonly body: Uint8Array | string,
    public readonly hasResponse: boolean | number,
  ) {
    this.pendingMessage = Object.assign(new Promise<MessageResponse>((resolve, reject) => {
      this.onResponse = (responseRaw: string[]): void => {
        const [successRaw, ...extras] = responseRaw
        const success = successRaw === 'true'
        const response: MessageResponse = {
          success,
          extras,
        }
        // if (success) {
        resolve(response)
        // } else {
        //   reject(response)
        // }
      }
    }), {
      id: this.id,
      sent: new Promise<void>(async (resolve, reject) => {
        // TODO: log warning for commands waiting on responses for a long time
        this.onSent = async () => {
          resolve()
          if (this.hasResponse === false) {
            this.onResponse(['true'])
          }
          if (typeof this.hasResponse === 'number') {
            let timeout = setTimeout(() => this.onResponse(['true']), this.hasResponse)
            await this.pendingMessage
            clearTimeout(timeout)
          }
        }
        this.onSendErr = reject
      })
    })
  }

  public send(conn: Socket): Promise<void> {
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
    console.log('sending to server:', content.toString('utf-8'))
    conn.write(content, (err) => {
      if (err) {
        console.error('error', this, err)
        return this.onSendErr(err)
      }

      this.onSent()
    })
    return this.sent
  }
}

@Injectable()
export class Client {

  public readonly messages$: Observable<[Uuid, string[]]>
  private readonly _messages$: Observable<[Uuid, string[]]>

  private conn: Socket
  private onConnected: () => void
  private onReady: () => void
  private isConnected: boolean = false
  private isReady: boolean = false
  private readonly connected: Promise<void> = new Promise<void>(resolve => this.onConnected = resolve)
  private readonly ready: Promise<void> = new Promise<void>(resolve => this.onReady = resolve)

  private readonly outgoing: OutgoingMessage[] = []
  private readonly pending: Map<Uuid, OutgoingMessage> = new Map<Uuid, OutgoingMessage>()

  private next: (item: [Uuid, string[]]) => void
  private error: (err: Error) => void

  private buffer = ''

  constructor() {
    this._messages$ = new Observable<[Uuid, string[]]>(o => {
      this.next = o.next.bind(o)
      this.error = o.error.bind(o)
      this.conn = createConnection({ port: PORT }, this.onConnected)
      this.conn.on('end', () => {
        console.log('connection closed')
        o.complete()
      })
      this.conn.on('data', chunk => {
        const data = chunk.toString()
        // console.log('received chunk', data)
        this.buffer += data
        this.checkBuffer()
      })

      return () => {
        this.conn.end()
        this.conn = undefined
      }
    })
    this.messages$ = this._messages$.pipe(share())

    this.checkBuffer = this.checkBuffer.bind(this)
    this.checkQueue = this.checkQueue.bind(this)

    this.init()
  }

  public send(type: MessageType, buffer?: Uint8Array | string, hasResponse?: boolean | number): PendingMessage {
    const msg = new OutgoingMessage(type, buffer, hasResponse)
    this.outgoing.push(msg)
    this.checkQueue()
    return msg.pendingMessage
  }

  private async init(): Promise<void> {
    await this.connected
    console.log('connected.')
    this.isConnected = true
    // console.log('writing delimiter');
    this.conn.write(DELIMITER + '\n', (err: Error) => {
      if (err) {
        this.error(err)
        console.error('error writing delimiter', err);
      }
      // console.log('wrote delimiter')
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
    return await msg.send(this.conn)
  }

  private checkBuffer(): void {
    // console.log('checking buffer')
    const responseEndIndex = this.buffer.indexOf(DELIMITER)
    if (responseEndIndex < 0) {
      // console.log('no delimiter yet')
      return
    }

    const response = this.buffer.substring(0, responseEndIndex)
    // console.log('found response:', response)
    this.buffer = this.buffer.substring(responseEndIndex + DELIMITER.length)
    // console.log('reassigned buffer', this.buffer)
    this.handleResponse(response)
    setTimeout(this.checkBuffer, 0)
  }

  private handleResponse(response: string): void {
    if (!this.isReady) {
      this.isReady = true
      this.onReady()
      console.log('client ready')
    }

    if (!response) {
      return
    }

    const [idRaw, ...parts] = response.split('\n')
    const id = Uuid.for(idRaw)
    const pendingMessage = this.pending.get(id)
    if (pendingMessage) {
      pendingMessage.onResponse(parts)
      this.pending.delete(id)

    } else {
      this.next([id, parts])
    }
  }
}
