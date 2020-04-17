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

export type NonTeamDisplaySlot = Exclude<ObjectiveDisplaySlot, ObjectiveDisplaySlot.sidebarTeam>
export type SlotTeamColor<TSlot extends ObjectiveDisplaySlot> = TSlot extends ObjectiveDisplaySlot.sidebarTeam ? TeamColor : never

export interface ObjectiveDisplayObj<TSlot extends ObjectiveDisplaySlot> {
  slot: TSlot
  color: TSlot extends ObjectiveDisplaySlot.sidebarTeam ? never : TeamColor,
}

export type ObjectiveDisplay = ObjectiveDisplayObj<any> | ObjectiveDisplaySlot

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
    return `${this.criterion}${this.displayName ? ' ' : ''}${this.displayName || ''}`
  }
}

class RemoveObjectiveCommand extends ObjectiveCommand<boolean> {
  protected readonly subCommand = ObjectivesSubCommand.remove
  protected readonly allowedErrorKeys = ['arguments.objective.notFound']

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
  protected readonly allowedErrorKeys: string[]

  public readonly slot: ObjectiveDisplaySlot
  public readonly teamColor: TeamColor
  public readonly id: string

  constructor({ slot, color, id }: ObjectiveDisplayArgs) {
    super()
    this.slot = slot
    this.teamColor = color
    this.id = id
    if (!id) {
      this.allowedErrorKeys = ['commands.scoreboard.objectives.display.alreadyEmpty']
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

export interface ObjectiveDisplayArgs {
  slot: ObjectiveDisplaySlot
  color?: TeamColor
  id?: string
}

export function objectiveDisplayArgs(slot: NonTeamDisplaySlot, id: string): ObjectiveDisplayArgs
export function objectiveDisplayArgs<TSlot extends ObjectiveDisplaySlot>(display: ObjectiveDisplayObj<TSlot>, id: string): ObjectiveDisplayArgs
export function objectiveDisplayArgs<TSlot extends ObjectiveDisplaySlot>(slot: TSlot, teamColor: SlotTeamColor<TSlot>, id: string): ObjectiveDisplayArgs
export function objectiveDisplayArgs<TSlot extends ObjectiveDisplaySlot>(displayOrSlot: TSlot | ObjectiveDisplayObj<TSlot>, teamColorOrId: SlotTeamColor<TSlot> | string, id?: string): ObjectiveDisplayArgs
export function objectiveDisplayArgs<TSlot extends ObjectiveDisplaySlot>(displayOrSlot: TSlot | ObjectiveDisplayObj<TSlot>, teamColorOrId: SlotTeamColor<TSlot> | string, id?: string): ObjectiveDisplayArgs {
  let display: ObjectiveDisplayObj<TSlot>
  if (typeof displayOrSlot === 'object') {
    display = displayOrSlot
    id = teamColorOrId
  } else if (displayOrSlot === ObjectiveDisplaySlot.sidebarTeam) {
    display = {
      slot: displayOrSlot,
      color: teamColorOrId as ObjectiveDisplayObj<TSlot>['color'],
    }
  } else {
    display = {
      slot: displayOrSlot,
    } as ObjectiveDisplayObj<TSlot>
    id = teamColorOrId
  }
  return Object.assign(display, { id })
}

export function setObjectiveDisplayName(id: string, displayName: TextBuilder | TextFragmentBuilder): Command {
  return new UpdateObjectiveDisplayNameCommand(id, displayName);
}

export function setObjectiveDisplay(slot: NonTeamDisplaySlot, id: string): Command
export function setObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(display: ObjectiveDisplay, id: string): Command
export function setObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(display: ObjectiveDisplayObj<TSlot>, id: string): Command
export function setObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(slot: TSlot, teamColor: SlotTeamColor<TSlot>, id: string): Command
export function setObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(displayOrSlot: TSlot | ObjectiveDisplayObj<TSlot>, teamColorOrId: SlotTeamColor<TSlot> | string, id?: string): Command {
  return new UpdateObjectiveDisplayCommand(objectiveDisplayArgs(displayOrSlot, teamColorOrId, id))
}

export function clearObjectiveDisplay(slot: NonTeamDisplaySlot): Command
export function clearObjectiveDisplay(display: ObjectiveDisplay): Command
export function clearObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(display: ObjectiveDisplayObj<TSlot>): Command
export function clearObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(slot: TSlot, teamColor: SlotTeamColor<TSlot>): Command
export function clearObjectiveDisplay<TSlot extends ObjectiveDisplaySlot>(displayOrSlot: TSlot, teamColor?: SlotTeamColor<TSlot>): Command {
  return new UpdateObjectiveDisplayCommand(objectiveDisplayArgs(displayOrSlot, teamColor))
}

