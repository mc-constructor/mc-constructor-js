import { Request } from '@ts-mc/core/client'
import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'

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

export const weather: WeatherCommandBuilder = Object.defineProperties(weatherFn,
  Object.values(Weather).reduce((result, subCommand) => {
    result[subCommand] = {
      get: () => {
        const cmd = new WeatherCommand(subCommand)
        const cmdRequestFacade: RequestFacade = {
          compileRequest: cmd.compileRequest.bind(cmd),
          execute: cmd.execute.bind(cmd),
        }
        return Object.assign(weatherFn.bind(undefined, subCommand), cmdRequestFacade)
      }
    }
    return result
  }, {} as any)
)
