import { defer, NEVER, Observable, of } from 'rxjs'

import { CompiledSimpleRequest, ExecuteResponse } from '@ts-mc/core/client'

export class TestCompiledRequest<TResponse = any> extends CompiledSimpleRequest<TResponse> {

  constructor(
    hasResponse: boolean | number,
    public readonly response$: Observable<TResponse> = NEVER,
    id?: string,
    private sendFn?: () => void,
  ) {
    super(() => this.execute(), hasResponse, id?.toString(), id)
  }

  public execute(): ExecuteResponse<TResponse> {
    return defer(() => {
      if (this.sendFn) {
        this.sendFn()
      }
      return of(this.response$)
    })
  }
}
