import { Uuid } from '@dandi/common'

import { Client, ClientMessageFailedResponse, ClientMessageResponse, ClientMessageSuccessResponse } from './client'
import { MessageError } from './message-error'

export enum MessageType {
  cmd = 'cmd',
  createStructure = 'createStructure',
  minigame = 'minigame',
}

export interface PendingMessage<TResponse = any> extends Promise<TResponse> {
  id: string | Uuid
  sent: Promise<void>
}

export function extendPendingMessage<TResponse>(pending: PendingMessage, promise: Promise<TResponse>): PendingMessage<TResponse> {
  return Object.assign(promise, {
    id: pending.id,
    sent: pending.sent,
  })
}

export type ExecuteFn<TResponse> = () => PendingMessage<TResponse>

export abstract class Message<TResponse extends any = any> {
  public execute(client: Client): PendingMessage<TResponse> {
    return this.compileMessage(client).execute()
  }
  public abstract compileMessage(client: Client): CompiledMessage
}

export interface CompiledMessage<TResponse = any> {
  id: string | Uuid
  pendingMessage: PendingMessage
  sent: Promise<void>
  execute: ExecuteFn<TResponse>
}

export class CompiledSimpleMessage<TResponse = any> implements CompiledMessage<TResponse> {

  public readonly id: string | Uuid
  public readonly pendingMessage: PendingMessage<TResponse>
  public readonly sent: Promise<void>

  protected onSent: () => void
  protected onSendErr: (err: Error) => void
  protected onResponse: (response?: TResponse) => void
  protected onAborted: (err: Error) => void

  constructor(
    protected readonly executeFn: ExecuteFn<TResponse>,
    protected readonly hasResponse: boolean | number,
    id?: string | Uuid,
  ) {
    this.id = id || Uuid.create()
    this.sent = new Promise<void>((resolve, reject) => {
      this.onSent = this.handleSent.bind(this, resolve)
      this.onSendErr = reject
    })
    this.pendingMessage = Object.assign(new Promise<TResponse>((resolve, reject) => {
      this.onResponse = (response: TResponse) => {
        resolve(response)
      }
      this.onAborted = reject
    }), {
      id: this.id,
      sent: this.sent,
    })
  }

  public execute(): PendingMessage<TResponse> {
    try {
      this.executeFn().then(this.onResponse, this.onAborted)
      this.onSent()
    } catch (err) {
      this.onSendErr(err)
      this.onAborted(err)
    }
    return this.pendingMessage
  }

  private async handleSent(resolveSent: () => void): Promise<void> {
    resolveSent()
    if (this.hasResponse === false) {
      this.onResponse()
    }
    if (typeof this.hasResponse === 'number') {
      let timeout = setTimeout(() => this.onResponse(), this.hasResponse)
      await this.pendingMessage
      clearTimeout(timeout)
    }
  }

}

export abstract class SimpleMessage<TResponse extends any = any> extends Message<TResponse> {

  public abstract readonly type: MessageType

  protected readonly hasResponse: boolean | number = true
  protected readonly allowedErrorKeys: string[] = []

  public compileMessage(client: Client): CompiledMessage {
    return new CompiledSimpleMessage(
      this.execute.bind(this, client),
      this.hasResponse,
      (this as any).id?.toString(),
    )
  }

  public execute(client: Client): PendingMessage<TResponse> {
    const body = this.getMessageBody()
    return this.makeResponse(client.send(this.type, body, this.hasResponse), body)
  }

  private makeResponse(pending: PendingMessage<ClientMessageResponse>, body: string | Uint8Array): PendingMessage<TResponse> {
    return extendPendingMessage(pending, new Promise<TResponse>(async (resolve, reject) => {
      const response = await pending
      if (!response) {
        // does not require a response, or allows a timed out response
        return resolve()
      }
      if (response.success === true) {
        return resolve(this.parseSuccessResponse(response))
      }
      const err = this.parseFailedResponse(response, body)
      if (this.allowedErrorKeys.includes(err.type)) {
        return resolve()
      }
      reject(err)
    }))
  }

  protected abstract getMessageBody(): string | Uint8Array

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): TResponse {
    return undefined
  }

  protected parseFailedResponse(response: ClientMessageFailedResponse, body: string | Uint8Array): MessageError {
    const [key, message] = response.extras
    return new MessageError(key, message, body)
  }

}

export abstract class SimpleArgsMessage<TArgs extends Array<any> = any[], TResponse extends any = any> extends SimpleMessage<TResponse> {
  protected readonly args: TArgs

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }

  protected getMessageBody(): string | Uint8Array {
    return this.formatArgs()
  }
}
