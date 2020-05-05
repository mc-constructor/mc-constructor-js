import { Uuid } from '@dandi/common'
import { map } from 'rxjs/operators'

import { RequestClient } from '../request-client'
import { ClientErrorResponse, ClientResponse, ClientSuccessResponse } from '../response-client'

import { CompiledRequest } from './compiled-request'
import { CompiledSimpleRequest, ExecuteResponse } from './compiled-simple-request'
import { Request, RequestType } from './request'
import { RequestError } from './request-error'

export abstract class SimpleRequest<TResponse extends any = any> extends Request<TResponse> {

  public abstract readonly type: RequestType
  public readonly id: string | Uuid

  protected readonly allowedErrorKeys: string[] = []
  protected readonly hasResponse: boolean | number = true

  constructor() {
    super()
  }

  public compileRequest(client: RequestClient): CompiledRequest<TResponse> {
    return new CompiledSimpleRequest(
      this.executeInternal.bind(this, client),
      this.hasResponse,
      this.debug,
      this.id?.toString(),
    )
  }

  protected executeInternal(client: RequestClient): ExecuteResponse<TResponse> {
    const body = this.getRequestBody()
    const clientReq = client.send(this.type, body, this.hasResponse)
    return clientReq.sent$.pipe(
      map(() => clientReq.pipe(
        map((response: ClientResponse) => {
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

  protected abstract getRequestBody(): string | Uint8Array

  protected parseSuccessResponse(response: ClientSuccessResponse): TResponse {
    return (response.extras.length <= 1 ? response.extras[0] : response.extras) as any
  }

  protected parseFailedResponse(response: ClientErrorResponse, body: string | Uint8Array): RequestError {
    if (!response.extras) {
      return new RequestError('malformed-response', 'Received invalid response', response as any)
    }
    const [key, message] = response.extras
    return new RequestError(key, message, body)
  }

}
