import { defer, timer } from 'rxjs'
import { mapTo, tap } from 'rxjs/operators'

import { CommandRequest } from '@ts-mc/core/command'
import { RequestClient, CompiledRequest, CompiledSimpleRequest, ExecuteResponse } from '@ts-mc/core/client'

class CompiledWaitMessage extends CompiledSimpleRequest<void> {

  constructor(public readonly duration: number) {
    super(() => this.execute(), false, `wait ${duration}`)
  }

  public execute(): ExecuteResponse<void> {
    return defer(() => timer(this.duration).pipe(
      tap(() => console.log(this.constructor.name, this.debug, 'COMPLETE')),
      mapTo(undefined),
    ))
  }
}

class WaitCommand extends CommandRequest {
  public readonly debug = `wait ${this.duration}`
  
  constructor(public readonly duration: number) {
    super()
  }

  public compileRequest(client: RequestClient): CompiledRequest {
    return new CompiledWaitMessage(this.duration)
  }

}

export function wait(duration: number): CommandRequest {
  return new WaitCommand(duration)
}
