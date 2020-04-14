import { stub } from '@dandi/core/testing'
import { SinonStub } from 'sinon'
import {
  Client,
  ClientMessageResponse,
  ClientMessageSuccessResponse,
  CompiledSimpleMessage,
  MessageType,
  SimpleMessage
} from '../lib/server'

export class TestMessage extends SimpleMessage {
  public readonly type = MessageType.cmd

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

export class TestCompiledMessage extends CompiledSimpleMessage {

  constructor(
    hasResponse: boolean | number,
  ) {
    super(() => this.pendingMessage, hasResponse)
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

export interface ClientFixture extends Client {
  lastSent(): TestCompiledMessage
  send: SinonStub
}

export function clientFixture(): ClientFixture {
  let clientCompiled: TestCompiledMessage
  return {
    messages$: undefined,
    send: stub().callsFake((type, cmd, hasResponse) => {
      clientCompiled = new TestCompiledMessage(hasResponse)
      return clientCompiled.pendingMessage
    }),
    lastSent() { return clientCompiled },
  }
}
