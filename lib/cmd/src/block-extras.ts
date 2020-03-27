import { Coordinates, Direction, facing } from '../../types'

import { SetBlockCommand } from './set-block'

export abstract class BlockExtras {

  protected abstract readonly prefix: string
  protected abstract readonly suffix: string
  protected abstract readonly keyValueSeparator: string
  protected readonly entrySeparator = ','

  private readonly data: { [key: string]: any } = {}

  protected generate(block?: SetBlockCommand<any>): string {
    const keys = Object.keys(this.data)
    if (!keys.length) {
      return ''
    }
    return `${this.prefix}${keys.map(key => `${key}${this.keyValueSeparator}${this.data[key]}`).join(this.entrySeparator)}${this.suffix}`
  }

  protected setData(key: string, value: any): this {
    this.data[key] = value
    return this
  }

  protected getData(key: string): any {
    return this.data.get(key)
  }

  public toString(): string {
    return this.generate()
  }

  public [Symbol.toStringTag](): string {
    return this.toString()
  }

}

export class BlockStateBase extends BlockExtras {
  protected readonly keyValueSeparator: string = '='
  protected readonly prefix: string = '['
  protected readonly suffix: string = ']'

  public facing(direction: Direction | Coordinates): this {
    return this.setData('facing', direction)
  }

  protected generate(block?: SetBlockCommand<any>): string {
    if (block) {
      const direction = this.getData('facing')
      if (typeof direction !== 'string') {
        this.setData('facing', facing(direction, block.loc))
      }
    }
    return super.generate(block)
  }
}

export class BlockDataBase extends BlockExtras {
  protected readonly keyValueSeparator: string = ':'
  protected readonly prefix = '{'
  protected readonly suffix = '}'
}
