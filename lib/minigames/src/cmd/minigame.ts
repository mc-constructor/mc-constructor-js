import { RequestType, SimpleArgsRequest } from '@ts-mc/core/client'

export abstract class MinigameMessage<TArgs extends any[] = any[], TResponse extends any = any>
  extends SimpleArgsRequest<[string, ...any[]], TResponse> {

  public readonly type = RequestType.minigame

  protected constructor(protected readonly command: string, ...args: TArgs) {
    super(command, ...args)
  }

  // protected formatArgs(): string {
  //   return `${this.args.join(' ')}`
  // }
}
