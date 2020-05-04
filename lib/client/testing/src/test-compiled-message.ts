import { Uuid } from '@dandi/common'
import { NEVER, Observable, of } from 'rxjs'

import { CompiledSimpleMessage, ExecuteResponse } from '../..'

export class TestCompiledMessage<TResponse = any> extends CompiledSimpleMessage<TResponse> {

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
