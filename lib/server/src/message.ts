import { Uuid } from '@dandi/common'
import {
  Client,
  CompiledMessage,
  ExecuteFn,
  MessageFailedResponse,
  MessageSuccessResponse,
  PendingMessage
} from './client'
import { MessageError } from './message-error'

export enum MessageType {
  cmd = 'cmd',
  createStructure = 'createStructure',
}

export abstract class Message<TResponse extends any = any> {
  public execute(client: Client): Promise<any> & PendingMessage {
    return this.compileMessage(client).execute()
  }
  public abstract compileMessage(client: Client): CompiledMessage
}

export class CompiledSimpleMessage<TResponse = any> implements CompiledMessage<TResponse> {

  public readonly id: string | Uuid
  public readonly pendingMessage: PendingMessage
  public readonly sent: Promise<void>

  protected onSent: () => void
  protected onSendErr: (err: Error) => void
  protected onResponse: (response: TResponse) => void
  protected onAborted: (err: Error) => void

  constructor(protected readonly executeFn: ExecuteFn<TResponse>, id?: string | Uuid) {
    this.id = id || Uuid.create()
    this.sent = new Promise<void>((resolve, reject) => {
      this.onSent = resolve
      this.onSendErr = reject
    })
    this.pendingMessage = Object.assign(new Promise<TResponse>((resolve, reject) => {
      this.onResponse = resolve
      this.onAborted = reject
    }), {
      id: this.id,
      sent: this.sent,
    })
  }

  public execute(): PendingMessage {
    try {
      this.executeFn().then(this.onResponse, this.onAborted)
      this.onSent()
    } catch (err) {
      this.onSendErr(err)
      this.onAborted(err)
    }
    return this.pendingMessage
  }

}

export abstract class SimpleMessage<TResponse extends any = any> extends Message<TResponse> {

  public abstract readonly type: MessageType

  protected readonly hasResponse: boolean | number = true
  protected readonly allowedErrorKeys: string[] = []

  public compileMessage(client: Client): CompiledMessage {
    return new CompiledSimpleMessage(
      this.execute.bind(this, client),
    )
  }

  public execute(client: Client): Promise<TResponse> & PendingMessage {
    return this.makeResponse(client.send(this.type, this.getMessageBody(), this.hasResponse))
  }

  private makeResponse(pending: PendingMessage): Promise<TResponse> & PendingMessage {
    return Object.assign(new Promise<TResponse>(async (resolve, reject) => {
      const response = await pending
      if (response.success === true) {
        return resolve(this.parseSuccessResponse(response))
      }
      const err = this.parseFailedResponse(response)
      if (this.allowedErrorKeys.includes(err.type)) {
        return resolve()
      }
      reject(err)
    }), pending)
  }

  protected abstract getMessageBody(): string | Uint8Array // | Promise<string> | Promise<Uint8Array>

  protected parseSuccessResponse(response: MessageSuccessResponse): TResponse {
    return undefined
  }

  protected parseFailedResponse(response: MessageFailedResponse): MessageError {
    const [key, message] = response.extras
    return new MessageError(key, message)
  }

}
