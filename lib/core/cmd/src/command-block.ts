import { CommandRequest } from '@ts-mc/core/command'
import { Coordinates, Block } from '@ts-mc/core/types'

import { BlockDataBase, BlockStateBase } from './block-extras'
import { SetBlockCommand } from './set-block'

export interface CommandBlockTypeStatic {
  readonly chain: Block.chainCommandBlock
  readonly impulse: Block.commandBlock
  readonly repeating: Block.repeatingCommandBlock
}
export const CommandBlockType: CommandBlockTypeStatic = Object.freeze({
  chain: Block.chainCommandBlock,
  impulse: Block.commandBlock,
  repeating: Block.repeatingCommandBlock,
})

export type CommandBlockType = Block.chainCommandBlock | Block.commandBlock | Block.repeatingCommandBlock

export enum AutoSignal {
  alwaysActive = 1,
  requiresRedstone = 0,
}

export class CommandBlockState extends BlockStateBase {

  public conditional(conditional: boolean): this {
    return this.setData('conditional', conditional)
  }
}

export class CommandBlockData extends BlockDataBase {
  public autoSignal(autoSignal: AutoSignal): this {
    return this.setData('auto', autoSignal)
  }
  public command(cmd: string | CommandRequest): this {
    if (typeof cmd === 'string') {
      return this.setData('Command', `"${cmd.replace(/"/g, '\\"')}"`)
    }
    this.setData('Command', cmd)
    return this
  }
}

export class SetCommandBlockCommand extends SetBlockCommand<CommandBlockType> {

  public constructor(cmd: string | CommandRequest, loc: Coordinates, type: CommandBlockType) {
    super(type, new CommandBlockState(), new CommandBlockData(), loc)
    this.data.command(cmd)
  }

  public conditional(conditional: boolean): this {
    this.state.conditional(conditional)
    return this
  }

  public autoSignal(autoSignal: AutoSignal): this {
    this.data.autoSignal(autoSignal)
    return this
  }
}
