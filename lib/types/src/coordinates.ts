import { inspect } from 'util'

export interface AxisValueWrapper {

  make(value: number): this
  plus(value: number): this
  minus(value: number): this
  valueOf(): number
  between(a: number, b: number): boolean

}
export type AxisValue = AxisValueWrapper & number

export function isAxisValue(obj: any): obj is AxisValue {
  return typeof obj === 'number' || obj instanceof AxisValueImp ||
    (typeof obj === 'object' && typeof obj.make === 'function' && typeof obj.valueOf() === 'number')
}

export interface AxisValueConstructor {
  new (value: number): AxisValue
}

class AxisValueImp extends Number implements AxisValueWrapper {

  protected readonly display: string
  protected readonly ctr = this.constructor as any

  constructor(public readonly value: number) {
    super(value)
    this.display = this.formatDisplay(value)
  }

  protected formatDisplay(value: number): string {
    return value.toString()
  }

  public make(value: number): this {
    return new this.ctr(value)
  }

  public plus(value: number): this {
    return this.make(this.valueOf() + value)
  }

  public minus(value: number): this {
    return this.make(this.valueOf() - value)
  }

  public between(a: SimpleAxisValue, b: SimpleAxisValue): boolean {
    return (a > this.value && this.value > b) ||
      (b > this.value && this.value > a)
  }

  public toString(): string {
    return this.display
  }

  public valueOf(): any {
    return this.value
  }
}

export const AxisValue: AxisValueConstructor = AxisValueImp as any

export function axisValue(value: number | AxisValue): AxisValue {
  return typeof value === 'number' ? new AxisValue(value) : value
}

export type SimpleAxisValue = number | AxisValue

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

export function isSimpleAxisValue(obj: any): obj is number | AxisValue {
  return typeof obj === 'number' || isAxisValue(obj)
}

export function isSimpleCoordinatesXYZ(obj: any): obj is SimpleCoordinateXYZ {
  return obj &&
    isSimpleAxisValue(obj.x) &&
    isSimpleAxisValue(obj.y) &&
    isSimpleAxisValue(obj.z)
}

export function isSimpleCoordinatesTuple(obj: any): obj is SimpleCoordinatesTuple {
  return obj && Array.isArray(obj) && obj.length === 3 &&
    isAxisValue(obj[0])
}

export function isSimpleSimpleCoordinates(obj: any): obj is SimpleCoordinates {
  return isSimpleCoordinatesTuple(obj) || isSimpleCoordinatesXYZ(obj)
}

export type CoordinatesTuple = Tuple3<AxisValue>

export interface ModifyCoordinates<TReturn> {
  (index: CoordinatesAxisIndex, value: SimpleAxisValue): TReturn
  (loc: SimpleCoordinatesOptions): TReturn
  north(value: number): TReturn
  south(value: number): TReturn
  east(value: number): TReturn
  west(value: number): TReturn
  up(value: number): TReturn
  down(value: number): TReturn
  offset(loc: SimpleCoordinatesOptions): TReturn
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

export interface CoordinatesConstructor<TCoordinates extends Coordinates> {
  new (loc: SimpleCoordinates): TCoordinates
  new (x: AxisValue | number, y: AxisValue | number, z: AxisValue | number): TCoordinates
}

export type CoordinatesAxisIndex = 0 | 1 | 2

class CoordinatesImpl implements Iterable<any> {

  public get 0(): AxisValue {
    return this.x
  }

  public get 1(): AxisValue {
    return this.y
  }

  public get 2(): AxisValue {
    return this.z
  }

  public readonly x: AxisValue
  public readonly y: AxisValue
  public readonly z: AxisValue

  public readonly modify: ModifyCoordinates<this>

  protected readonly ctr: CoordinatesConstructor<this> = this.constructor as any
  protected readonly tuple: CoordinatesTuple

  constructor(simpleLoc: SimpleCoordinates)
  constructor(x: AxisValue | number, y: AxisValue | number, z: AxisValue | number)
  constructor(
    simpleLocOrX: SimpleCoordinates | AxisValue | number,
    y?: AxisValue | number,
    z?: AxisValue | number,
  ) {
    let loc: SimpleCoordinateXYZ
    if (isSimpleSimpleCoordinates(simpleLocOrX)) {
      loc = simpleCoordinatesXYZ(simpleLocOrX)
    } else {
      loc = { x: simpleLocOrX, y, z }
    }
    this.x = axisValue(loc.x)
    this.y = axisValue(loc.y)
    this.z = axisValue(loc.z)
    this.tuple = tuple3(this.x, this.y, this.z)

    // North: -Z
    // South: Z
    // West: -X
    // East: X
    // Up: Y
    // Down: -Y
    this.modify = Object.defineProperties(this.modifyInternal.bind(this), {
      east: { value: (value: number) => this.modify(0, this.x.plus(value)) },
      west: { value: (value: number) => this.modify(0, this.x.minus(value)) },
      south: { value: (value: number) => this.modify(2, this.z.plus(value)) },
      north: { value: (value: number) => this.modify(2, this.z.minus(value)) },
      up: { value: (value: number) => this.modify(1, this.y.plus(value)) },
      down: { value: (value: number) => this.modify(1, this.y.minus(value)) },
      offset: { value: (loc: SimpleCoordinatesOptions) => {
        const offset = simpleCoordinatesXYZ(loc)
          return new CoordinatesImpl(
            this.x + (offset.x || 0),
            this.y + (offset.y || 0),
            this.z + (offset.z || 0),
          )
      }}
    })
  }

  private modifyInternal(index: CoordinatesAxisIndex, value: SimpleAxisValue): this
  private modifyInternal(loc: SimpleCoordinatesOptions): this
  private modifyInternal(locOrIndex: CoordinatesAxisIndex | SimpleCoordinatesOptions, update?: SimpleAxisValue): this {
    if (typeof locOrIndex === 'number') {
      const loc: SimpleCoordinatesTuple =
        this.tuple.map((val, index) => (locOrIndex === index ? update : val) as SimpleAxisValue)
      return new this.ctr(loc)
    }
    let [x, y, z] = simpleCoordinatesTuple(locOrIndex)
    x = x === undefined ? this.x : x
    y = y === undefined ? this.y : y
    z = z === undefined ? this.z : z
    return new this.ctr(x, y, z)
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
    return `[${this.constructor.name} ${this.toString()}]`
  }

  public [inspect.custom](): string {
    return this.toString()
  }

}

export function loc(x: number, y: number, z: number): Coordinates {
  return new CoordinatesImpl(x, y, z)
}
