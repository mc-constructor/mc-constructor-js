import { Command, SimpleArgsCommand, SimpleCommand } from './command'

export enum Weather {
  clear = 'clear',
  rain = 'rain',
  thunder = 'thunder',
  tornado = 'tornado',
}

export type WeatherSubCommandBuilder = Command & ((duration?: number) => Command)

export type WeatherCommandBuilder = {
  [TWeather in Weather]: WeatherSubCommandBuilder
} & { (subCommand: Weather, duration?: number): Command }

class WeatherCommand extends SimpleArgsCommand {
  protected readonly command: string = 'weather'

  constructor(subcommand: Weather, duration?: number) {
    super(...(duration ? [subcommand, duration] : [subcommand]))
  }
}

function weatherFn(subCommand: Weather, duration?: number): Command {
  return new WeatherCommand(subCommand, duration)
}

export const weather: WeatherCommandBuilder = Object.defineProperties(weatherFn,
  Object.values(Weather).reduce((result, subCommand) => {
    result[subCommand] = {
      get: () => Object.assign(weatherFn.bind(undefined, subCommand, new WeatherCommand(subCommand)))
    }
    return result
  }, {})
)
