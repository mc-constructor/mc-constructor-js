import { SimpleCommand } from '../../command'
import { ClientMessageSuccessResponse } from '../../server'
import { fromEntityId, Item } from '../../types'

import { ItemBuilder } from './item'

export interface GiveResult<TItem> {
  count: number
  item: TItem
  playerName?: string
}

class GiveCommand<TItem extends Item> extends SimpleCommand<GiveResult<TItem>> {
  protected readonly command: string = 'give'

  constructor(
    public readonly target: string,
    public readonly item: ItemBuilder<TItem>,
    public readonly count: number = 1,
    public readonly playerCheck?: string,
  ) {
    super()
  }

  protected formatArgs(): string {
    return `${this.target} ${this.item} ${this.count}`;
  }

  private matchesItem(item: Item): item is TItem {
    return this.item.item === item
  }

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): GiveResult<TItem> {
    const [, countRaw, entityIdRaw, playerName] = response.extras
    const count = parseInt(countRaw)
    const entityId = entityIdRaw.substring(1, entityIdRaw.length - 1)
    const item = fromEntityId(entityId)
    if (!this.matchesItem(item)) {
      throw new Error(`Response contained unexpected item ${item}`)
    }
    return {
      count,
      item,
      playerName,
    }
  }
}

export function give<TItem extends Item>(target: string, item: ItemBuilder<TItem>, count: number = 1, playerCheck?: string): GiveCommand<TItem> {
  return new GiveCommand(target, item, count, playerCheck)
}
