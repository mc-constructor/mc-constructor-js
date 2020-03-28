import { Item } from '../../types'

import { SimpleCommand } from './command'

class GiveCommand extends SimpleCommand {
  protected readonly command: string = 'give'

  constructor(public readonly target, public readonly item: Item, public readonly extras?: string) {
    super()
  }

  protected formatArgs(): string {
    return `${this.target} ${this.item}${this.extras || ''}`;
  }

  protected parseResponse(responseText: string): void {
    if (!responseText.match('Gave')) {
      throw new Error(responseText)
    }
  }
}

export function give(target: string, item: Item, extras?: string): GiveCommand {
  return new GiveCommand(target, item, extras)
}
