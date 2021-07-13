import { Request } from '@ts-mc/core/client'
import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'
import { defineObject } from '@ts-mc/common'

export enum Weather {
  clear = 'clear',
  rain = 'rain',
  thunder = 'thunder',
  tornado = 'tornado',
}

export type WeatherSubCommandBuilder = CommandRequest & ((duration?: number) => CommandRequest)

export type WeatherCommandBuilder = {
  [TWeather in Weather]: WeatherSubCommandBuilder
} & { (subCommand: Weather, duration?: number): CommandRequest }

class WeatherCommand extends SimpleArgsCommandRequest {
  protected readonly command: string = 'weather'

  constructor(subcommand: Weather, duration?: number) {
    super(...(duration ? [subcommand, duration] : [subcommand]))
  }
}

function weatherFn(subCommand: Weather, duration?: number): CommandRequest {
  return new WeatherCommand(subCommand, duration)
}

type RequestFacade = { [TProp in keyof Request]: Request[TProp] }

export const weather: WeatherCommandBuilder = defineObject(weatherFn,
  Object.values(Weather).reduce((result, subCommand) => {
    result[subCommand] = {
      get: () => {
        const cmd = new WeatherCommand(subCommand)
        const cmdRequestFacade: RequestFacade = Object.create({
          compileRequest: cmd.compileRequest.bind(cmd),
          execute: cmd.execute.bind(cmd),
        }, {
          [Symbol.toStringTag]: {get: () => cmd[Symbol.toStringTag]},
        })
        return Object.assign(weatherFn.bind(undefined, subCommand), cmdRequestFacade)
      }
    }
    return result
  }, {} as any)
)
