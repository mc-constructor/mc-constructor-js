import { AnyEntity, EntityData, isNbtData, NbtData } from '@ts-mc/core/types'

function snbtArray(data: any[]): string {
  const snbt = ['[']
  for (const entry of data) {
    if (entry === undefined) {
      continue
    }
    if (snbt.length > 1) {
      snbt.push(',')
    }
    snbt.push(snbtObject(entry))
  }
  snbt.push(']')
  return snbt.join('')
}

function snbtObject(data: any): string {
  if (isNbtData(data)) {
    return data.toNbtString()
  }
  const snbt = ['{']
  for (const key of Object.keys(data)) {
    const value = data[key]
    if (value === undefined) {
      continue
    }
    if (snbt.length > 1) {
      snbt.push(',')
    }
    snbt.push(key, ':')
    if (typeof value === 'object') {
      snbt.push(Array.isArray(value) ? snbtArray(value) : snbtObject(value))
    } else {
      snbt.push(value.toString())
    }
  }
  snbt.push('}')
  return snbt.join('')
}

export class StringNamedBinaryTag<TEntity extends AnyEntity> implements NbtData {
  constructor(public readonly data: EntityData[TEntity]) {}

  public toString(): string {
    return snbtObject(this.data)
  }

  public toNbtString(): string {
    return this.toString()
  }
}

export function snbt<TEntity extends AnyEntity>(data: EntityData[TEntity]): StringNamedBinaryTag<TEntity> {
  if (typeof data === 'undefined') {
    return undefined
  }
  return new StringNamedBinaryTag(data)
}
