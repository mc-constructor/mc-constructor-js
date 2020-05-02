import { Client } from '../client'

import { CompiledMessage, PendingMessage } from './compiled-message'

export enum MessageType {
  cmd = 'cmd',
  createStructure = 'createStructure',
  minigame = 'minigame',
}

export abstract class Message<TResponse extends any = any> {
  public abstract readonly debug: string

  public execute(client: Client): PendingMessage<TResponse> {
    // console.log(`${this.constructor.name}.execute`, this.debug)
    return this.compileMessage(client).pendingMessage$
  }
  public abstract compileMessage(client: Client): CompiledMessage<TResponse>
}
