import { RequestClient } from '../request-client'

import { CompiledRequest, PendingRequest } from './compiled-request'

export enum RequestType {
  cmd = 'cmd',
  createStructure = 'createStructure',
  minigame = 'minigame',
}

export abstract class Request<TResponse extends any = any> {
  protected abstract readonly debug: string

  public execute(client: RequestClient): PendingRequest<TResponse> {
    return this.compileRequest(client).pendingResponse$
  }
  public abstract compileRequest(client: RequestClient): CompiledRequest<TResponse>

  public get [Symbol.toStringTag](): string {
    return this.debug
  }
}
