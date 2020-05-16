import { CommandRequest, SimpleCommandRequest } from '@ts-mc/core/command'
import { Coordinates } from '@ts-mc/core/types'

class TeleportCommandRequest extends SimpleCommandRequest {
  protected readonly command = 'teleport'

  // TODO: add rotation and facingAnchor
  constructor(
    public readonly target: string,
    public readonly locOrDest: Coordinates | string,
    public readonly facing: Coordinates | string) {
    super()
  }

  protected formatArgs(): string {
    const args = [this.target, this.locOrDest]
    if (this.facing) {
      args.push('facing')
      if (typeof this.facing === 'string') {
        args.push('entity')
      }
      args.push(this.facing)
    }
    return args.join(' ')
  }
}

export function teleport(target: string, locOrDest: Coordinates | string, facing?: Coordinates | string): CommandRequest {
  return new TeleportCommandRequest(target, locOrDest, facing)
}
