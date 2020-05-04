import { Uuid } from '@dandi/common'
import {
  Client,
  ClientMessageSuccessResponse,
  CompiledMessage,
  CompiledSimpleMessage,
  MessageType,
  SimpleMessage
} from '../..'

export class TestSimpleMessage extends SimpleMessage<string> {
  public readonly type = MessageType.cmd
  public readonly debug = `${this.constructor.name}: ${this.msg}`
  public readonly id: string | Uuid

  constructor(public readonly msg: string, protected readonly hasResponse: boolean | number) {
    super()
    this.id = this.debug
  }

  public compileMessage(client: Client): CompiledMessage<string> {
    return new CompiledSimpleMessage(
      this.executeInternal.bind(this, client),
      this.hasResponse,
      this.debug,
      this.id?.toString(),
    )
  }

  protected getMessageBody(): string | Uint8Array {
    return this.msg.toString()
  }

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): any {
    return response.extras[0]
  }
}
