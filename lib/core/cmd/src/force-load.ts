import { CommandRequest, SimpleCommandRequest } from '@ts-mc/core/command'
import { Area, Coordinates, isArea } from '@ts-mc/core/types'

export enum ForceLoadCommand {
  add= 'add',
  remove = 'remove',
  query = 'query',
}


class ForceLoadCommandRequest extends SimpleCommandRequest {
  protected readonly command = 'forceload'
  protected readonly allowedErrorKeys = ['commands.forceload.added.failure']

  constructor(
    public readonly cmd: ForceLoadCommand.add,
    public readonly from: Coordinates,
    public readonly to?: Coordinates,
  ) {
    super()
  }

  protected formatArgs(): string {
    const args = [this.cmd, this.from.x, this.from.z]
    if (this.to) {
      args.push(this.to.x, this.to.z)
    }
    return args.join(' ')
  }
}

export function forceLoadAdd(fromOrArea: Coordinates | Area, to?: Coordinates): CommandRequest {
  let from: Coordinates
  if (isArea(fromOrArea)) {
    from = fromOrArea.start
    to = fromOrArea.end
  } else {
    from = fromOrArea
  }
  return new ForceLoadCommandRequest(ForceLoadCommand.add, from, to)
}
