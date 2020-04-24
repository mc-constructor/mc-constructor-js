import { Block, Coordinates } from '../../types'

import { BlockData } from './block-data'
import { BlockState } from './block-state'
import { BlockExtras } from './block-extras'
import { BoxCommand } from './box-command'
import { FillCommand, FillMethod } from './fill'
import { SetBlockCommand } from './set-block'

export type BlockStateModifiers<TBlock extends Block> = {
  [TMember in keyof BlockState[TBlock]]: TMember extends (...args: any[]) => BlockState[TBlock] ? BlockState[TBlock][TMember] : never
}

export type BlockDataModifiers<TBlock extends Block> = {
  [TMember in keyof BlockData[TBlock]]: TMember extends (...args: any[]) => BlockData[TBlock] ? BlockData[TBlock][TMember] : never
}

export type BlockCommandStateModifiers<TBlock extends Block, TBlockState extends BlockState[TBlock] = BlockState[TBlock]> = {
  [TMember in keyof TBlockState]: TBlockState[TMember] extends (...args: any[]) => BlockState[TBlock] ?
    (...args: Parameters<TBlockState[TMember]>) => BlockCommandBuilder<TBlock> :
    never
}

export type BlockCommandDataModifiers<TBlock extends Block, TBlockData extends BlockData[TBlock] = BlockData[TBlock]> = {
  [TMember in keyof TBlockData]: TBlockData[TMember] extends (...args: any[]) => BlockData[TBlock] ?
    (...args: Parameters<TBlockData[TMember]>) => BlockCommandBuilder<TBlock> :
    never
}

export interface BlockCommandBuilderCommands<TBlock extends Block> {
  set(loc: Coordinates, ): SetBlockCommand<TBlock>
  fill(start: Coordinates, end: Coordinates, method?: FillMethod): FillCommand<TBlock>
  box(start: Coordinates, end: Coordinates): BoxCommand<TBlock>
}

export type BlockCommandBuilder<TBlock extends Block> =
  BlockCommandBuilderCommands<TBlock> &
  BlockCommandStateModifiers<TBlock> &
  BlockCommandDataModifiers<TBlock>

const IGNORED_MODS = [
  'constructor',
  '_generate',
  'getData',
  'setData',
  'toString',
  'valueOf',
]

class BlockCommandBuilderImpl<
  TBlock extends Block,
  TBlockData extends BlockData[TBlock] = BlockData[TBlock],
  TBlockState extends BlockState[TBlock] = BlockState[TBlock],
> {

  public static create<
    TBlock extends Block,
    TBlockData extends BlockData[TBlock] = BlockData[TBlock],
    TBlockState extends BlockState[TBlock] = BlockState[TBlock],
  >(
    block: TBlock,
    BlockState: new () => TBlockState,
    BlockData: new () => TBlockData,
  ): BlockCommandBuilder<TBlock> {
    return new BlockCommandBuilderImpl(block, BlockState, BlockData).proxy as any
  }

  private readonly stateModifiers: ReadonlySet<keyof TBlockState>
  private readonly dataModifiers: ReadonlySet<keyof TBlockData>
  private readonly modifiers: ReadonlyMap<any, (arg?: any) => any>

  private readonly state: TBlockState
  private readonly data: TBlockData

  private readonly proxy: this

  private constructor(
    public readonly block: TBlock,
    BlockState: new () => TBlockState,
    BlockData: new () => TBlockData,
  ) {
    this.state = new BlockState()
    this.data = new BlockData()

    this.stateModifiers = this.getModifiers(BlockState)
    this.dataModifiers = this.getModifiers(BlockData)

    const modifiers = new Map<any, (...args: any[]) => any>()
    modifiers.set('set', this.setBlockCommand.bind(this))
    modifiers.set('fill', this.fillBlockCommand.bind(this))
    modifiers.set('box', this.boxBlockCommand.bind(this))
    this.bindModifiers(modifiers, this.stateModifiers, this.state)
    this.bindModifiers(modifiers, this.dataModifiers, this.data)

    this.modifiers = modifiers

    this.proxy = new Proxy(this, this)
  }

  private getModifiers<TObj extends TBlockData | TBlockState>(cls: new () => TObj): ReadonlySet<keyof TObj> {
    const mods = Object.entries(Object.getOwnPropertyDescriptors(cls.prototype))
      // FIXME: actually ignore protected methods from base classes, figure out a cleaner way to ignore "generate"
      .filter(([name, desc]) => !name.startsWith('_') && !IGNORED_MODS.includes(name) && typeof desc.value === 'function')
      .map(([name]) => name) as (keyof TObj)[]
    const parent = Object.getPrototypeOf(cls)
    if (parent === Function.prototype || parent === BlockExtras.prototype) {
      return new Set<keyof TObj>(mods)
    }
    return new Set(mods.concat(...this.getModifiers(parent)))
  }

  private bindModifiers(
    mappedModifiers: Map<string, (args?: any) => any>,
    mods: ReadonlySet<any>,
    obj: any,
  ): void {
    mods.forEach(mod => {
      if (mappedModifiers.has(mod)) {
        throw new Error(`Name conflict between state and data modifiers: '${mod}'`)
      }
      mappedModifiers.set(mod, (arg?: any) => {
        obj[mod](arg)
        return this.proxy
      })
    })
  }

  public get(obj: this, prop: string): any {
    return obj.modifiers.get(prop)
  }

  private setBlockCommand(loc: Coordinates): SetBlockCommand<TBlock> {
    return new SetBlockCommand(this.block, this.state, this.data, loc)
  }

  private fillBlockCommand(start: Coordinates, end: Coordinates, method: FillMethod): FillCommand<TBlock> {
    return new FillCommand(this.block, this.state, this.data, method, start, end)
  }

  private boxBlockCommand(start: Coordinates, end: Coordinates): BoxCommand<TBlock> {
    return new BoxCommand(this.block, this.state, this.data, start, end)
  }
}

export function block<
  TBlock extends Block,
  TBlockData extends BlockData[TBlock] = BlockData[TBlock],
  TBlockState extends BlockState[TBlock] = BlockState[TBlock],
>(
  block: TBlock,
): BlockCommandBuilder<TBlock> {
  return BlockCommandBuilderImpl.create(block, BlockState[block] as any, BlockData[block] as any)
}
