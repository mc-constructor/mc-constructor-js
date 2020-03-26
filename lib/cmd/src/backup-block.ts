import { SetBlockCommand } from './setblock'
import { AutoSignal, CommandBlockType, SetCommandBlockCommand } from './command-block'

class BackupBlockCommand<TBlock extends SetBlockCommand<any, any>> extends SetCommandBlockCommand {
  public static for<TBlock extends SetBlockCommand<any, any>>(block: TBlock): BackupBlockCommand<TBlock> {
    return new BackupBlockCommand(block)
  }

  private constructor(public readonly block: TBlock) {
    super(block.compile(), block.location.modify(1, 0), CommandBlockType.repeating)
    this
      .autoSignal(AutoSignal.alwaysActive)
      .conditional(false)
  }
}

export function backup<TBlock extends SetBlockCommand<any, any>>(block: TBlock): BackupBlockCommand<TBlock> {
  return BackupBlockCommand.for(block)
}
