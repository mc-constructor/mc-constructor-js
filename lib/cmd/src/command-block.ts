import { Location, Facing } from '../../types'
import { BlockData, BlockState, SetBlockCommand } from './setblock'

export enum CommandBlockType {
  chain = 'minecraft:chain_command_block',
  impulse = 'minecraft:command_block',
  repeating = 'minecraft:repeating_command_block',
}

export enum AutoSignal {
  alwaysActive = 1,
  requiresRedstone = 0,
}

export function commandBlock(
  cmd: string,
  loc: Location,
  type: CommandBlockType = CommandBlockType.impulse,
  extras: string = ''): string {
  return `setblock ${loc} ${type}{Command:"${cmd}"}${extras}`
}

export class CommandBlockState extends BlockState {

  public facing(facing: Facing): this {
    return this.setData('facing', facing)
  }

  public conditional(conditional: boolean): this {
    return this.setData('conditional', conditional)
  }
}

export class CommandBlockData extends BlockData {
  public autoSignal(autoSignal: AutoSignal): this {
    return this.setData('auto', autoSignal)
  }
  public command(cmd: string): this {
    return this.setData('Command', `"${cmd.replace(/"/g, '\\"')}"`)
  }
}

export class SetCommandBlockCommand extends SetBlockCommand<CommandBlockState, CommandBlockData> {
  public static create(cmd: string, loc: Location, type: CommandBlockType = CommandBlockType.impulse): SetCommandBlockCommand {
    return new SetCommandBlockCommand(cmd, loc, type)
  }

  protected constructor(blockCmd: string, location: Location, type: CommandBlockType) {
    super(CommandBlockState, CommandBlockData, location, type)
    this.data.command(blockCmd)
  }

  public facing(facing: Facing): this {
    this.state.facing(facing)
    return this
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
