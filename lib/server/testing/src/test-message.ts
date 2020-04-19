import { ClientMessageSuccessResponse, MessageType, SimpleMessage } from '../..'

export class TestMessage extends SimpleMessage {
  public readonly type = MessageType.cmd
  public readonly debug = 'test'

  constructor() {
    super()
  }

  protected getMessageBody(): string | Uint8Array {
    return 'test'
  }

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): any {
    return response.extras[0]
  }
}
