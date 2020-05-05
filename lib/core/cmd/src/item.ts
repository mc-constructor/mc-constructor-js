import { Enchantment, Item } from '@ts-mc/core/types'

import { MultiTextBuilder, TextBuilder, TextFragmentBuilder } from './text'
import { TagMap } from './tag-map'
import { ValueMap, ValueMapOutput } from './value-map'

export enum HideFlags {
  display = 2,
  hidden = 4,
  otherFlags = 32,
}

export interface ItemEnchantmentMap {
  id: Enchantment
  lvl: number
}

export class ItemEnchantment extends TagMap<ItemEnchantmentMap> {
  constructor(id: Enchantment, level: number) {
    super()
    this.set('id', id).set('lvl', level)
  }
  public toString(): string {
    return `{id:"${this.get('id')}",lvl:${this.get('lvl')}}`
  }
}

export class Enchantments extends ValueMap<Enchantment, ItemEnchantment> {
  protected readonly outputMode = ValueMapOutput.set
}

export interface ItemDisplayMap {
  Name: TextBuilder
  Lore: MultiTextBuilder
  color: string | number
}

export interface ItemExtrasMap {
  display: TagMap<ItemDisplayMap>
  Enchantments: Enchantments
  Unbreakable: 1
  Damage: number
  HideFlags: HideFlags
}

export class ItemExtras extends TagMap<ItemExtrasMap> {

  public unbreakable(): this {
    return this.set('Unbreakable', 1)
  }

  public damage(value: number): this {
    return this.set('Damage', value)
  }

  public enchant(type: Enchantment, level: number): this {
    const enchantments = this.get('Enchantments') || new Enchantments()
    enchantments.set(type, new ItemEnchantment(type, level))
    return this.set('Enchantments', enchantments)
  }

  public hideOtherFlags(): this {
    return this.setHideFlag(HideFlags.otherFlags)
  }

  public hidden(): this {
    return this.setHideFlag(HideFlags.hidden)
  }

  public hideDisplay(): this {
    return this.setHideFlag(HideFlags.display)
  }

  public color(color: string | number): this {
    return this.setDisplayProp('color', color)
  }

  public lore(...lore: (TextBuilder | TextFragmentBuilder)[]): this {
    return this.setDisplayProp('Lore', new MultiTextBuilder(lore))
  }

  public name(name: TextBuilder | TextFragmentBuilder): this {
    return this.setDisplayProp('Name',  name instanceof TextFragmentBuilder ? name.builder : name)
  }

  private setHideFlag(flag: HideFlags): this {
    const hideFlags = this.get('HideFlags') || 0
    return this.set('HideFlags', hideFlags | flag)
  }

  private setDisplayProp<TKey extends keyof ItemDisplayMap>(key: TKey, value: ItemDisplayMap[TKey]): this {
    const display = this.get('display') || new TagMap<ItemDisplayMap>()
    display.set(key, value)
    return this.set('display', display)
  }
}

export class ItemBuilder<TItem extends Item> extends ItemExtras {

  constructor(public readonly item: Item) {
    super()
  }

  public toString(): string {
    return `${this.item}${super.toString()}`
  }

}

export class ItemTagBuilder<TItem extends Item> extends ItemBuilder<TItem> {
  public toString(): string {
    const tag = super.toString()
    return `{id:${this.item}${tag ? ',' : ''}${tag}}`
  }
}

export function item<TItem extends Item>(item: TItem): ItemBuilder<TItem> {
  return new ItemBuilder<TItem>(item)
}

export function itemTag<TItem extends Item>(item: TItem): ItemTagBuilder<TItem> {
  return new ItemBuilder<TItem>(item)
}
