import { Uuid } from '@dandi/common'
import { NEVER, Observable, of } from 'rxjs'

import { CompiledSimpleRequest, ExecuteResponse } from '../../index'

export class TestCompiledRequest<TResponse = any> extends CompiledSimpleRequest<TResponse> {

  constructor(
    hasResponse: boolean | number,
    public readonly response$: Observable<TResponse> = NEVER,
    id?: string | Uuid,
  ) {
    super(() => this.execute(), hasResponse, id?.toString(), id)
  }

  public execute(): ExecuteResponse<TResponse> {
    return of(this.response$)
  }
}
