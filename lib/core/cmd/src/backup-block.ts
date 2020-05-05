import { RequestClient, CompiledRequest, Request, RequestType } from '@ts-mc/core/client'
import { Block, Coordinates } from '@ts-mc/core/types'

import { AutoSignal, CommandBlockType, SetCommandBlockCommand } from './command-block'
import { SetBlockCommand } from './set-block'

export class BackupBlockCommand<TTargetBlock extends Block> extends Request {
  public readonly type: RequestType = RequestType.cmd

  public readonly loc: Coordinates
  public readonly block: Block

  constructor(public readonly target: SetBlockCommand<TTargetBlock>) {
    super()
    this.block = target.block
    this.loc = target.loc
  }

  public get debug() {
    return 'backup block'
  }

  public compileRequest(client: RequestClient): CompiledRequest {
    const backup = new SetCommandBlockCommand(this.target, this.loc.modify(1, 1), CommandBlockType.repeating)
    backup.autoSignal(AutoSignal.alwaysActive)
    backup.conditional(false)
    // explicitly create just the backup to save sending an extra command -
    // the backup will automatically create the target in game
    return backup.compileRequest(client)

  }
}
