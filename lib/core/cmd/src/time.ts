import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'

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
  readonly [TSpec in TimeSpec]: CommandRequest
}

export interface TimeSetCommandBuilder extends TimeSetCommandBuilderBySpec {
  (value: number | TimeSpec): CommandRequest
}

export interface TimeCommandBuilder {
  (subCommand: TimeSubCommand.add, value: number): CommandRequest
  (subCommand: TimeSubCommand.query, type: TimeType): CommandRequest
  (subCommand: TimeSubCommand.set, value: number | TimeSpec): CommandRequest

  add(value: number): CommandRequest
  query(type: TimeType): CommandRequest
  set: TimeSetCommandBuilder
}

class TimeCommand extends SimpleArgsCommandRequest {
  public readonly hasResponse = true
  protected readonly command: string = 'time'

  constructor(protected readonly subCommand: TimeSubCommand, protected readonly arg: number | TimeType | TimeSpec) {
    super(subCommand, arg)
  }

}

function timeFn(subCommand: TimeSubCommand.add, value: number): CommandRequest
function timeFn(subCommand: TimeSubCommand.query, type: TimeType): CommandRequest
function timeFn(subCommand: TimeSubCommand.set, arg: number | TimeSpec): CommandRequest
function timeFn(subCommand: TimeSubCommand, arg: number | TimeSpec | TimeType): CommandRequest {
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
