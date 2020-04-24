import { Command, SimpleArgsCommand } from '../../command'

export enum TimeSubCommand {
  add = 'add',
  set = 'set',
  query = 'query',
}

export enum TimeSpec {
  day = 'day',
  midnight = 'midnight',
  night = 'night',
  noon = 'noon',
}

export enum TimeType {
  day = 'day',
  daytime = 'daytime',
  gametime = 'gametime',
}

export type TimeSetCommandBuilderBySpec = {
  readonly [TSpec in TimeSpec]: Command
}

export interface TimeSetCommandBuilder extends TimeSetCommandBuilderBySpec {
  (value: number | TimeSpec): Command
}

export interface TimeCommandBuilder {
  (subCommand: TimeSubCommand.add, value: number): Command
  (subCommand: TimeSubCommand.query, type: TimeType): Command
  (subCommand: TimeSubCommand.set, value: number | TimeSpec): Command

  add(value: number): Command
  query(type: TimeType): Command
  set: TimeSetCommandBuilder
}

class TimeCommand extends SimpleArgsCommand {
  public readonly expectResponse = true
  protected readonly command: string = 'time'

  constructor(protected readonly subCommand: TimeSubCommand, protected readonly arg: number | TimeType | TimeSpec) {
    super(subCommand, arg)
  }

}

function timeFn(subCommand: TimeSubCommand.add, value: number): Command
function timeFn(subCommand: TimeSubCommand.query, type: TimeType): Command
function timeFn(subCommand: TimeSubCommand.set, arg: number | TimeSpec): Command
function timeFn(subCommand: TimeSubCommand, arg: number | TimeSpec | TimeType): Command {
  return new TimeCommand(subCommand, arg)
}

export const time: TimeCommandBuilder = Object.defineProperties(timeFn, {
  add: { get: () => timeFn.bind(undefined, TimeSubCommand.add) },
  query: { get: () => timeFn.bind(undefined, TimeSubCommand.query) },
  set: {
    get: () => Object.defineProperties(
      timeFn.bind(undefined, TimeSubCommand.set),
      Object.values(TimeSpec).reduce((result, spec) => {
        result[spec] = { get: () => timeFn(TimeSubCommand.set, spec) }
        return result
      }, {} as any),
    )
  },
})
