import { Uuid } from '@dandi/common'
import { map } from 'rxjs/operators'

import { Client, ClientMessageFailedResponse, ClientMessageResponse, ClientMessageSuccessResponse } from '../client'

import { CompiledMessage } from './compiled-message'
import { CompiledSimpleMessage, ExecuteResponse } from './compiled-simple-message'
import { Message, MessageType } from './message'
import { MessageError } from './message-error'

export abstract class SimpleMessage<TResponse extends any = any> extends Message<TResponse> {

  public abstract readonly type: MessageType
  public readonly id: string | Uuid

  protected readonly allowedErrorKeys: string[] = []
  protected readonly hasResponse: boolean | number = true

  constructor() {
    super()
  }

  public compileMessage(client: Client): CompiledMessage<TResponse> {
    return new CompiledSimpleMessage(
      this.executeInternal.bind(this, client),
      this.hasResponse,
      this.debug,
      this.id?.toString(),
    )
  }

  protected executeInternal(client: Client): ExecuteResponse<TResponse> {
    const body = this.getMessageBody()
    const clientMsg = client.send(this.type, body, this.hasResponse)
    return clientMsg.sent$.pipe(
      map(() => clientMsg.pipe(
        map((response: ClientMessageResponse) => {
          if (!response) {
            // does not require a response, or allows a timed out response
            return undefined
          }
          if (response.success === true) {
            return this.parseSuccessResponse(response)
          }
          const err = this.parseFailedResponse(response, body)
          if (this.allowedErrorKeys?.includes(err.type)) {
            return undefined
          }
          throw err
        }),
      )),
    )
  }

  protected abstract getMessageBody(): string | Uint8Array

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): TResponse {
    return (response.extras.length <= 1 ? response.extras[0] : response.extras) as any
  }

  protected parseFailedResponse(response: ClientMessageFailedResponse, body: string | Uint8Array): MessageError {
    if (!response.extras) {
      return new MessageError('malformed-response', 'Received invalid response', response as any)
    }
    const [key, message] = response.extras
    return new MessageError(key, message, body)
  }

}
