import { Command } from './command'

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

export interface TimeCommand {
  (subCommand: TimeSubCommand.add, value: number): Command
  (subCommand: TimeSubCommand.query, type: TimeType): Command
  (subCommand: TimeSubCommand.set, value: number | TimeSpec): Command

  add(value: number): Command
  query(type: TimeType): Command
  set(value: number | TimeSpec): Command
}

function timeFn(subCommand: TimeSubCommand.add, value: number): Command
function timeFn(subCommand: TimeSubCommand.query, type: TimeType): Command
function timeFn(subCommand: TimeSubCommand.set, arg: number | TimeSpec): Command
function timeFn(subCommand: TimeSubCommand, arg: number | TimeSpec | TimeType): Command {

}

export const time: TimeCommand = Object.assign(timeFn, {
  add: timeFn.bind(undefined, TimeSubCommand.add),
})
