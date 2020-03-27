import { Client } from '../../server'
import { Block, Coordinates } from '../../types'

import { Command,  } from './command'
import { SetBlockCommand } from './set-block'
import { AutoSignal, CommandBlockType, SetCommandBlockCommand } from './command-block'

export class BackupBlockCommand<TTargetBlock extends Block> extends Command {

  public readonly loc: Coordinates
  public readonly block: Block

  constructor(public readonly target: SetBlockCommand<TTargetBlock>) {
    super()
    this.block = target.block
    this.loc = target.loc
  }

  public execute(client: Client): Promise<void> {
    const backup = new SetCommandBlockCommand(this.target, this.loc.modify(1, 1), CommandBlockType.repeating)
    backup.autoSignal(AutoSignal.alwaysActive)
    backup.conditional(false)
    // explicitly create just the backup to save sending an extra command -
    // the backup will automatically create the target in game
    return backup.execute(client)
  }
}
