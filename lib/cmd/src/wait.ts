import { Command } from '../../command'
import { Client, CompiledMessage, PendingMessage } from '../../server'

class CompiledWaitMessage implements CompiledMessage {

  public readonly id = 'wait'
  public readonly pendingMessage: PendingMessage
  public sent: Promise<void>
  public readonly debug: string

  private onComplete: () => void
  private onSent: () => void

  constructor(public readonly duration: number) {
    this.pendingMessage = Object.assign(new Promise<void>(resolve => {
      this.onComplete = resolve
    }))
    this.sent = new Promise<void>(resolve => this.onSent = resolve)
    this.debug = `wait ${this.duration}`
  }

  public execute(): PendingMessage {
    setTimeout(this.onComplete, this.duration)
    return this.pendingMessage
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
