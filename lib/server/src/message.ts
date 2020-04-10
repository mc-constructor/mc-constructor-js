import { Client, MessageFailedResponse, MessageSuccessResponse, PendingMessage } from './client'
import { MessageError } from './message-error'

export enum MessageType {
  cmd = 'cmd',
  createStructure = 'createStructure',
}

export abstract class Message<TResponse extends any = any> {
  public abstract execute(client: Client): Promise<TResponse> & PendingMessage
}

export abstract class SimpleMessage<TResponse extends any = any> extends Message<TResponse> {

  public abstract readonly type: MessageType

  protected readonly hasResponse: boolean | number = true
  protected readonly allowedErrorKeys: string[] = []

  public execute(client: Client): Promise<TResponse> & PendingMessage {
    const pending = client.send(this.type, this.getMessageBody(), this.hasResponse)
    return this.makeResponse(pending)
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
