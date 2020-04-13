import { Command, parallel } from '../../../command'

import { TextBuilder, TextFragmentBuilder } from '../text'

import { ScoreboardCommand, ScoreboardSubCommand } from './scoreboard'

enum ObjectivesSubCommand {
  add = 'add',
  list = 'list',
  modify = 'modify',
  remove = 'remove',
  setDisplay = 'setdisplay',
}

export enum ObjectiveDisplaySlot {
  list = 'list',
  sidebar = 'sidebar',
  sidebarTeam = 'sidebar.team',
  belowName = 'belowName'
}

export enum TeamColor {
  aqua = 'aqua',
  black = 'black',
  blue = 'blue',
  darkBlue = 'dark_blue',
  darkGreen = 'dark_green',
  darkAqua = 'dark_aqua',
  darkGray = 'dark_gray',
  darkRed = 'dark_red',
  darkPurple = 'dark_purple',
  gold = 'gold',
  green = 'green',
  lightPurple = 'light_purple',
  red = 'red',
  white = 'white',
  yellow = 'yellow',
}

abstract class ObjectivesCommand<TResponse = void> extends ScoreboardCommand<ObjectivesSubCommand, TResponse> {
  protected readonly scoreboardCommand: ScoreboardSubCommand = ScoreboardSubCommand.objectives
}

abstract class ObjectiveCommand<TResult> extends ObjectivesCommand<TResult> {

  protected constructor(public readonly id: string) {
    super()
  }
  protected formatSubCommandArgs(): string {
    const args = this.formatObjectiveCommandArgs()
    return `${this.id}${args ? ' ' : ''}${args}`
  }

  protected formatObjectiveCommandArgs(): string {
    return ''
  }
}

class AddObjectiveCommand extends ObjectiveCommand<boolean> {
  protected readonly subCommand = ObjectivesSubCommand.add

  constructor(
    id: string,
    public readonly criterion: string,
    public readonly displayName?: TextBuilder | TextFragmentBuilder,
  ) {
    super(id)
  }

  protected formatObjectiveCommandArgs(): string {
    return `${this.criterion} ${this.displayName}`
  }
}

class RemoveObjectiveCommand extends ObjectiveCommand<boolean> {
  protected readonly subCommand = ObjectivesSubCommand.remove

  constructor(id: string) {
    super(id)
  }
}

class UpdateObjectiveDisplayNameCommand extends ObjectiveCommand<boolean> {
  protected readonly subCommand = ObjectivesSubCommand.modify

  constructor(id: string, public readonly displayName: TextBuilder | TextFragmentBuilder) {
    super(id)
  }

  protected formatObjectiveCommandArgs(): string {
    return `displayName ${this.displayName}`
  }
}

class UpdateObjectiveDisplayCommand extends ObjectivesCommand<boolean> {
  protected readonly subCommand = ObjectivesSubCommand.setDisplay

  public readonly teamColor: TeamColor
  public readonly id: string

  constructor(
    public readonly slot: ObjectiveDisplaySlot,
    teamColorOrId?: TeamColor | string,
    id?: string,
  ) {
    super()
    if (slot === ObjectiveDisplaySlot.sidebarTeam) {
      this.teamColor = teamColorOrId as TeamColor
      this.id = id
    } else {
      this.id = teamColorOrId
    }
  }

  protected formatSubCommandArgs(): string {
    const args = []
    if (this.teamColor) {
      args.push(`${this.slot}.${this.teamColor}`)
    } else {
      args.push(this.slot)
    }
    if (this.id) {
      args.push(this.id)
    }
    return args.join(' ')
  }
}

class ObjectivesListCommand extends ObjectivesCommand {
  protected readonly subCommand = ObjectivesSubCommand.list
}

export function addObjective(id: string, criterion: string, displayName?: TextBuilder | TextFragmentBuilder): Command {
  return new AddObjectiveCommand(id, criterion, displayName)
}

export function listObjectives(): Command {
  return new ObjectivesListCommand()
}

export function removeObjectives(...ids: string[]): Command {
  if (ids.length === 1) {
    return new RemoveObjectiveCommand(ids[0])
  }
  return parallel(
    ...ids.map(id => new RemoveObjectiveCommand(id)),
  )
}

export function setObjectiveDisplayName(id: string, displayName: TextBuilder | TextFragmentBuilder): Command {
  return new UpdateObjectiveDisplayNameCommand(id, displayName);
}

export function setObjectiveDisplay(slot: Exclude<ObjectiveDisplaySlot, 'sidebarTeam'>, id: string): Command
export function setObjectiveDisplay(slot: ObjectiveDisplaySlot.sidebarTeam, teamColor: TeamColor, id: string): Command
export function setObjectiveDisplay(slot: ObjectiveDisplaySlot, teamColorOrId?: TeamColor | string, id?: string): Command {
  return new UpdateObjectiveDisplayCommand(slot, teamColorOrId, id)
}

export function clearObjectiveDisplay(slot: ObjectiveDisplaySlot.sidebarTeam, teamColor: TeamColor): Command
export function clearObjectiveDisplay(slot: Exclude<ObjectiveDisplaySlot, 'sidebarTeam'>, teamColor: TeamColor): Command
export function clearObjectiveDisplay(slot: ObjectiveDisplaySlot, teamColor?: TeamColor): Command {
  return new UpdateObjectiveDisplayCommand(slot, teamColor)
}

