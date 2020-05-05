import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'

class KillCommand extends SimpleArgsCommandRequest {
  protected readonly command = 'kill'
  protected readonly allowedErrorKeys: string[]

  constructor(public readonly target: string, public readonly requireMatch: boolean) {
    super(target)

    if (!requireMatch) {
      this.allowedErrorKeys = ['argument.entity.notfound.entity']
    }
  }

}

export function kill(target: string, requireMatch: boolean = false): CommandRequest {
  return new KillCommand(target, requireMatch)
}
