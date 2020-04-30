import { ClientMessageResponse, CompiledSimpleMessage } from '../..'

export class TestCompiledMessage extends CompiledSimpleMessage {
  constructor(
    hasResponse: boolean | number,
  ) {
    super(() => this.pendingMessage$, hasResponse, 'test')
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
