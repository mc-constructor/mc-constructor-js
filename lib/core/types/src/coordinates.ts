import { SimpleAxisValue, AxisValue, isSimpleAxisValue, isAxisValue, axisValue } from './axis-value'
import { inspect } from 'util'

export interface SimpleCoordinateXYZ {
  readonly x: SimpleAxisValue
  readonly y: SimpleAxisValue
  readonly z: SimpleAxisValue
}

export type Axis = keyof SimpleCoordinateXYZ
export const Axis: ['x', 'y', 'z'] = ['x', 'y', 'z']

export interface Tuple3<TValue> extends Iterable<TValue>, ArrayLike<TValue> {
  readonly 0: TValue
  readonly 1: TValue
  readonly 2: TValue
  length: 3
  map<U>(
    callbackfn: (value: TValue, index: number, array: any) => U,
    thisArg?: any,
  ): Tuple3<U>
  join(str: string): string
}

export function tuple3<T>(a: T, b: T, c: T): Tuple3<T> {
  return [a, b, c] as unknown as Tuple3<T>
}

export type SimpleCoordinatesTuple = Tuple3<SimpleAxisValue>

export type SimpleCoordinates = SimpleCoordinateXYZ | SimpleCoordinatesTuple
export type SimpleCoordinatesOptions = Partial<SimpleCoordinateXYZ> | SimpleCoordinatesTuple

export function simpleCoordinatesTuple(loc: SimpleCoordinatesOptions): SimpleCoordinatesTuple {
  if (isSimpleCoordinatesTuple(loc)) {
    return loc
  }
  return [loc.x, loc.y, loc.z] as unknown as SimpleCoordinatesTuple
}

export function simpleCoordinatesXYZ(loc: SimpleCoordinatesOptions): SimpleCoordinateXYZ {
  return Array.isArray(loc) ?
    { x: loc[0], y: loc[1], z: loc[2] } :
    Object.assign({ x: undefined, y: undefined, z: undefined }, loc)
}

export function isSimpleCoordinatesXYZ(obj: any): obj is SimpleCoordinateXYZ {
  return obj &&
    isSimpleAxisValue(obj.x) &&
    isSimpleAxisValue(obj.y) &&
    isSimpleAxisValue(obj.z)
}

export function isSimpleCoordinatesTuple(obj: any): obj is SimpleCoordinatesTuple {
  return obj &&
    isAxisValue(obj[0]) &&
    isAxisValue(obj[1]) &&
    isAxisValue(obj[2])
}

export function isSimpleCoordinates(obj: any): obj is SimpleCoordinates {
  return isSimpleCoordinatesTuple(obj) || isSimpleCoordinatesXYZ(obj)
}

export type CoordinatesTuple = Tuple3<AxisValue>

export interface ModifyCoordinatesProps<TReturn> {
  north(value: number): TReturn
  south(value: number): TReturn
  east(value: number): TReturn
  west(value: number): TReturn
  up(value: number): TReturn
  down(value: number): TReturn
  offset(loc: SimpleCoordinatesOptions): TReturn
  subtractOffset(loc: SimpleCoordinatesOptions): TReturn
}

export interface ModifyCoordinates<TReturn> extends ModifyCoordinatesProps<TReturn> {
  (index: CoordinatesAxisIndex, value: SimpleAxisValue): TReturn
  (loc: SimpleCoordinatesOptions): TReturn
}

export interface Coordinates extends Iterable<AxisValue> {
  readonly x: AxisValue
  readonly y: AxisValue
  readonly z: AxisValue
  readonly 0: AxisValue
  readonly 1: AxisValue
  readonly 2: AxisValue
  modify: ModifyCoordinates<this>
  clone(): this
  join(str: string): string
}

export function isCoordinates(obj: any): obj is Coordinates {
  return obj &&
    typeof obj.modify === 'function' &&
    typeof obj.clone === 'function' &&
    typeof obj.join === 'function' &&
    isSimpleCoordinatesTuple(obj) &&
    isSimpleCoordinatesXYZ(obj)
}

export interface CoordinatesConstructor<TCoordinates extends Coordinates> {
  new (loc: SimpleCoordinates): TCoordinates
  new (x: AxisValue | number, y: AxisValue | number, z: AxisValue | number): TCoordinates
}

export type CoordinatesAxisIndex = 0 | 1 | 2

class CoordinatesImpl implements Iterable<any> {

  public readonly x: AxisValue
  public readonly y: AxisValue
  public readonly z: AxisValue

  public get 0(): AxisValue {
    return this.x
  }

  public get 1(): AxisValue {
    return this.y
  }

  public get 2(): AxisValue {
    return this.z
  }

  public get modify(): ModifyCoordinates<this> {
    const { x, y, z } = this
    const modify = new ModifyCoordinatesImpl(this.ctr, x, y, z)
    return Object.defineProperties(Object.assign(modify.invoke.bind(modify), modify), {
      east: { value: ModifyCoordinatesImpl.prototype.east },
      west: { value: ModifyCoordinatesImpl.prototype.west },
      north: { value: ModifyCoordinatesImpl.prototype.north },
      south: { value: ModifyCoordinatesImpl.prototype.south },
      up: { value: ModifyCoordinatesImpl.prototype.up },
      down: { value: ModifyCoordinatesImpl.prototype.down },
      offset: { value: ModifyCoordinatesImpl.prototype.offset },
      subtractOffset: { value: ModifyCoordinatesImpl.prototype.subtractOffset },
      invoke: { value: ModifyCoordinatesImpl.prototype.invoke },
    })
  }

  protected get ctr(): CoordinatesConstructor<this> {
    return this.constructor as any
  }

  protected get tuple(): CoordinatesTuple {
    return tuple3(this.x, this.y, this.z)
  }

  constructor(simpleLoc: SimpleCoordinates)
  constructor(x: AxisValue | number, y: AxisValue | number, z: AxisValue | number)
  constructor(
    simpleLocOrX: SimpleCoordinates | AxisValue | number,
    y?: AxisValue | number,
    z?: AxisValue | number,
  ) {
    let loc: SimpleCoordinateXYZ
    if (isSimpleCoordinates(simpleLocOrX)) {
      loc = simpleCoordinatesXYZ(simpleLocOrX)
    } else {
      loc = { x: simpleLocOrX, y, z }
    }
    this.x = axisValue(loc.x)
    this.y = axisValue(loc.y)
    this.z = axisValue(loc.z)
  }

  public clone(): this {
    return new this.ctr(this.tuple)
  }

  public join(str: string): string {
    return this.tuple.join(str)
  }

  public toString(): string {
    return this.join(' ')
  }

  public [Symbol.iterator](): Iterator<any> {
    return [this.x, this.y, this.z][Symbol.iterator]()
  }

  public get [Symbol.toStringTag](): string {
    return `[Coordinates ${this.toString()}]`
  }

  [inspect.custom](): string {
    return this[Symbol.toStringTag]
  }

}

class ModifyCoordinatesImpl<TReturn extends Coordinates> implements ModifyCoordinatesProps<TReturn> {

  constructor(
    protected readonly originalCtr: CoordinatesConstructor<TReturn>,
    protected readonly x: AxisValue,
    protected readonly y: AxisValue,
    protected readonly z: AxisValue,
  ) {
  }

  public invoke(index: CoordinatesAxisIndex, value: SimpleAxisValue): TReturn
  public invoke(loc: SimpleCoordinatesOptions): TReturn
  public invoke(locOrIndex: CoordinatesAxisIndex | SimpleCoordinatesOptions, update?: SimpleAxisValue): TReturn {
    if (typeof locOrIndex === 'number') {
      const [x, y, z]: SimpleAxisValue[] =
        [this.x, this.y, this.z].map((val, index) => (locOrIndex === index ? update : val) as SimpleAxisValue)
      return new this.originalCtr(x, y, z)
    }
    let [x, y, z] = simpleCoordinatesTuple(locOrIndex)
    x = x === undefined ? this.x : x
    y = y === undefined ? this.y : y
    z = z === undefined ? this.z : z
    return new this.originalCtr(x, y, z)
  }

  // North: -Z
  // South: Z
  // West: -X
  // East: X
  // Up: Y
  // Down: -Y
  public east(value: number): TReturn {
    return this.invoke(0, this.x.plus(value))
  }

  public west(value: number): TReturn {
    return this.invoke(0, this.x.minus(value))
  }

  public south(value: number): TReturn {
    return this.invoke(2, this.z.plus(value))
  }

  public north(value: number): TReturn {
    return this.invoke(2, this.z.minus(value))
  }

  public up(value: number): TReturn {
    return this.invoke(1, this.y.plus(value))
  }

  public down(value: number): TReturn {
    return this.invoke(1, this.y.minus(value))
  }

  public offset(loc: SimpleCoordinatesOptions): TReturn {
    const offset = simpleCoordinatesXYZ(loc)
    return new this.originalCtr(
      this.x + (offset.x || 0),
      this.y + (offset.y || 0),
      this.z + (offset.z || 0),
    )
  }

  public subtractOffset(loc: SimpleCoordinatesOptions): TReturn {
    const offset = simpleCoordinatesXYZ(loc)
    return new this.originalCtr(
      this.x - (offset.x || 0),
      this.y - (offset.y || 0),
      this.z - (offset.z || 0),
    )
  }
}

export function loc(x: number, y: number, z: number): Coordinates {
  return new CoordinatesImpl(x, y, z)
}
