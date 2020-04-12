import { MessageType, SimpleArgsMessage } from '@minecraft/core/server'

export abstract class MinigameMessage<TArgs extends any[] = any[], TResponse extends any = any>
  extends SimpleArgsMessage<[string, ...any[]], TResponse> {

  public readonly type = MessageType.minigame

  protected constructor(protected readonly command: string, ...args: TArgs) {
    super(command, ...args)
  }

  // protected formatArgs(): string {
  //   return `${this.args.join(' ')}`
  // }
}
