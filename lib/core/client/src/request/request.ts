import { RequestClient } from '../request-client'

import { CompiledRequest, PendingResponse } from './compiled-request'

export enum RequestType {
  cmd = 'cmd',
  eventSubscription = 'eventSubscription',
  createStructure = 'createStructure',
  minigame = 'interop:dandoes_minigame',
}

export abstract class Request<TResponse extends any = any> {
  protected abstract readonly debug: string

  public execute(client: RequestClient): PendingResponse<TResponse> {
    // console.log(this.constructor.name, 'execute', this.debug)
    return this.compileRequest(client).pendingResponse$
  }
  public abstract compileRequest(client: RequestClient): CompiledRequest<TResponse>

  public get [Symbol.toStringTag](): string {
    return this.debug
  }
}
