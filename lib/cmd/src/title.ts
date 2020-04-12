import { Command, MultiCommand, parallel, SimpleArgsCommand } from '../../command'
import { TextBuilder, TextFragmentBuilder } from './text'

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
  fadeIn: number
  display: number
  fadeOut: number
}

export class TitleTimes {

  private static readonly TICKS_PER_SECOND = 20

  public readonly ticks: TitleTimesTicks

  constructor(
    public readonly fadeInSeconds: number = 0.5,
    public readonly displaySeconds: number = 3.5,
    public readonly fadeOutSeconds: number = 1,
  ) {
    this.ticks = {
      fadeIn: this.fadeInSeconds * TitleTimes.TICKS_PER_SECOND,
      display: this.displaySeconds * TitleTimes.TICKS_PER_SECOND,
      fadeOut: this.fadeOutSeconds * TitleTimes.TICKS_PER_SECOND,
    }
  }
}

class TitleCommand extends SimpleArgsCommand {
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

class ShowTitleCommand extends MultiCommand {

  public readonly parallel = false

  constructor(
    public target: string,
    public readonly title: TextBuilder,
    public readonly subtitle: TextBuilder,
    public readonly timing?: TitleTimes,
  ) {
    super()
  }

  public compile(): Command[] {
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
      cmds.push(parallel(...precmds))
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
  title: TextBuilder | TextFragmentBuilder,
  subtitle?: TextBuilder | TextFragmentBuilder,
  fadeInSeconds?: number,
  displaySeconds?: number,
  fadeOutSeconds?: number,
): ShowTitleCommand {
  return new ShowTitleCommand(target, title.builder, subtitle?.builder, new TitleTimes(fadeInSeconds, displaySeconds, fadeOutSeconds))
}
export function actionbar(target: string, text: TextBuilder | TextFragmentBuilder): TitleCommand {
  return new TitleCommand(target, TitleSubcommand.actionbar, text.builder)
}
