import {
  RequestClient,
  ClientSuccessResponse,
  CompiledRequest,
  CompiledSimpleRequest,
  RequestType,
  SimpleRequest
} from '@ts-mc/core/client'

export class TestSimpleRequest extends SimpleRequest<string> {
  public readonly type = RequestType.cmd
  public readonly debug = `${this.constructor.name}: ${this.msg}`
  public readonly id: string

  constructor(public readonly msg: string, protected readonly hasResponse: boolean | number) {
    super()
    this.id = this.debug
  }

  public compileRequest(client: RequestClient): CompiledRequest<string> {
    return new CompiledSimpleRequest(
      this.executeInternal.bind(this, client),
      this.hasResponse,
      this.debug,
      this.id?.toString(),
    )
  }

  protected getRequestBody(): string | Uint8Array {
    return this.msg.toString()
  }

  protected parseSuccessResponse(response: ClientSuccessResponse): any {
    return response.extras[0]
  }
}
