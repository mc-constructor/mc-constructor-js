import { Item } from '../../types'

import { SimpleCommand } from './command'
import { ItemBuilder } from './item'

class GiveCommand<TItem extends Item> extends SimpleCommand {
  protected readonly command: string = 'give'

  constructor(
    public readonly target,
    public readonly item: ItemBuilder<TItem>,
    public readonly count: number = 1,
    public readonly playerCheck?: string,
  ) {
    super()
  }

  protected formatArgs(): string {
    return `${this.target} ${this.item} ${this.count}`;
  }

  protected parseResponse(responseText: string): void {
    if (!responseText.match('Gave')) {
      throw new Error(responseText)
    }
    if (this.playerCheck && !responseText.match(new RegExp(`Gave \\d+ .+ to ${this.playerCheck}`))) {
      console.log('wrong player')
      throw new Error('wrong player')
    }
  }
}

export function give<TItem extends Item>(target: string, item: ItemBuilder<TItem>, count: number = 1, playerCheck?: string): GiveCommand<TItem> {
  return new GiveCommand(target, item, count, playerCheck)
}
