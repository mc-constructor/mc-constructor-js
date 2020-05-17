import { CommandRequest } from '@ts-mc/core/command'
import { CompiledRequest, RequestClient } from '@ts-mc/core/client'
import { TestCompiledRequest } from '@ts-mc/core/client/testing'
import { Observable } from 'rxjs'

export class CommandRequestFixture extends CommandRequest {

  constructor(
    public readonly debug: string,
    public readonly responseFn: () => Observable<any>
  ) {
    super()
  }

  public compileRequest(client: RequestClient): CompiledRequest {
    return new TestCompiledRequest(true, this.responseFn())
  }

}
