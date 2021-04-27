import { CommandRequest, MultiCommandRequest, parallel, SimpleArgsCommandRequest } from '@ts-mc/core/command'
import { Ticks, ticksFromSeconds } from '@ts-mc/core/types'

import { TextBuilder, TextFragmentBuilder, text } from './text'

// https://minecraft.gamepedia.com/Commands/title

export enum TitleSubcommand {
  clear = 'clear',
  reset = 'reset',
  title = 'title',
  subtitle = 'subtitle',
  actionbar = 'actionbar',
  times = 'times',
}

export interface TitleTimesTicks {
  fadeIn: Ticks
  display: Ticks
  fadeOut: Ticks
}

export class TitleTimes {

  public readonly ticks: TitleTimesTicks

  constructor(
    public readonly fadeInSeconds: number = 0.5,
    public readonly displaySeconds: number = 3.5,
    public readonly fadeOutSeconds: number = 1,
  ) {
    this.ticks = {
      fadeIn: ticksFromSeconds(this.fadeInSeconds),
      display: ticksFromSeconds(this.displaySeconds),
      fadeOut: ticksFromSeconds(this.fadeOutSeconds),
    }
  }
}

class TitleCommand extends SimpleArgsCommandRequest {
  protected readonly command: string = 'title'
  protected readonly hasResponse = 1000

  constructor(
    public readonly target: string,
    public readonly subcommand: TitleSubcommand,
    ...args: any[]
  ) {
    super(target, subcommand, ...args)
  }
}

class ShowTitleCommand extends MultiCommandRequest {

  public readonly parallel = false

  constructor(
    public target: string,
    public readonly title: TextBuilder,
    public readonly subtitle: TextBuilder,
    public readonly timing?: TitleTimes,
  ) {
    super()
  }

  public compile(): CommandRequest[] {
    const cmds = []
    const precmds = []
    if (this.timing) {
      const ticks = this.timing.ticks
      precmds.push(new TitleCommand(this.target, TitleSubcommand.times, ticks.fadeIn, ticks.display, ticks.fadeOut))
    }
    if (this.subtitle) {
      precmds.push(new TitleCommand(this.target, TitleSubcommand.subtitle, this.subtitle))
    }
    if (precmds.length > 2) {
      cmds.push(parallel('title.precmds', ...precmds))
    } else if (precmds.length) {
      cmds.push(...precmds)
    }

    cmds.push(new TitleCommand(this.target, TitleSubcommand.title, this.title))

    return cmds
  }

  public times(fadeInSeconds?: number, displaySeconds?: number, fadeOutSeconds?: number) {
    return new ShowTitleCommand(
      this.target,
      this.title,
      this.subtitle,
      new TitleTimes(fadeInSeconds, displaySeconds, fadeOutSeconds),
    )
  }

}

export function title(
  target: string,
  title: string | TextBuilder | TextFragmentBuilder,
  subtitle?: string | TextBuilder | TextFragmentBuilder,
  fadeInSeconds?: number,
  displaySeconds?: number,
  fadeOutSeconds?: number,
): ShowTitleCommand {
  if (typeof title === 'string') {
    title = text(title)
  }
  if (typeof subtitle === 'string') {
    subtitle = text(subtitle)
  }
  return new ShowTitleCommand(target, title.builder, subtitle?.builder, new TitleTimes(fadeInSeconds, displaySeconds, fadeOutSeconds))
}
export function actionbar(target: string, text: TextBuilder | TextFragmentBuilder): TitleCommand {
  return new TitleCommand(target, TitleSubcommand.actionbar, text.builder)
}
