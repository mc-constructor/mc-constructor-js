import { of, timer } from 'rxjs'
import { map } from 'rxjs/operators'

import { Command } from '../../command'
import { Client, CompiledMessage, CompiledSimpleMessage, ExecuteResponse } from '../../server'

class CompiledWaitMessage extends CompiledSimpleMessage<void> {

  constructor(public readonly duration: number) {
    super(() => this.execute(), false, `wait ${duration}`)
  }

  public execute(): ExecuteResponse<void> {
    return of(undefined).pipe(
      map(() => timer(this.duration).pipe(() => undefined)),
    )
  }
}

class WaitCommand extends Command {
  public readonly debug = `wait ${this.duration}`
  
  constructor(public readonly duration: number) {
    super()
  }

  public compileMessage(client: Client): CompiledMessage {
    return new CompiledWaitMessage(this.duration)
  }

}

export function wait(duration: number): Command {
  return new WaitCommand(duration)
}
