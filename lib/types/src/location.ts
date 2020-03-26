export interface CoordinateWrapper {

  make(value: number): this
  plus(value: number): this
  minus(vluae: number): this
  valueOf(): number

}
export type Coordinate = CoordinateWrapper & number

export function isCoordinate(obj: any): obj is Coordinate {
  return obj instanceof CoordinateImpl ||
    (typeof obj === 'object' && typeof obj.make === 'function' && typeof obj.valueOf() === 'number')
}

export interface CoordinateConstructor {
  new (value: number): Coordinate
}

export class CoordinateImpl extends Number {

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

  public toString(): string {
    return this.display
  }

  public valueOf(): any {
    return this.value
  }
}

export const Coordinate: CoordinateConstructor = CoordinateImpl as any

export function coord(value: number | Coordinate): Coordinate {
  return typeof value === 'number' ? new Coordinate(value) : value
}

export class RelativeCoordinate extends CoordinateImpl {

  constructor(value) {
    super(value)
  }

  protected formatDisplay(value: number): string {
    return `~${value}`
  }

}

export type SimpleLocationValue = number | Coordinate

export interface SimpleLocationXYZ {
  x: SimpleLocationValue
  y: SimpleLocationValue
  z: SimpleLocationValue
}

// export type TupleIndexAccessor<TValue> = { [TIndex in keyof [TValue, TValue, TValue]]: TValue }

export interface Tuple3<TValue> extends Iterable<TValue>, ArrayLike<TValue> {
  0: TValue
  1: TValue
  2: TValue
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

export type SimpleLocationTuple = Tuple3<SimpleLocationValue>

export type SimpleLocation = SimpleLocationXYZ | SimpleLocationTuple
export type SimpleLocationOptions = Partial<SimpleLocationXYZ> | SimpleLocationTuple

export function simpleLocationTuple(loc: SimpleLocationOptions): SimpleLocationTuple {
  if (isSimpleLocationTuple(loc)) {
    return loc
  }
  return [loc.x, loc.y, loc.z] as unknown as SimpleLocationTuple
}

export function simpleLocationXYZ(loc: SimpleLocationOptions): SimpleLocationXYZ {
  return Array.isArray(loc) ?
    { x: loc[0], y: loc[1], z: loc[2] } :
    Object.assign({ x: undefined, y: undefined, z: undefined }, loc)
}

export function isSimpleLocationValue(obj: any): obj is number | Coordinate {
  return typeof obj === 'number' || isCoordinate(obj)
}

export function isSimpleLocationXYZ(obj: any): obj is SimpleLocationXYZ {
  return obj &&
    isSimpleLocationValue(obj.x) &&
    isSimpleLocationTuple(obj.y) &&
    isSimpleLocationTuple(obj.z)
}

export function isSimpleLocationTuple(obj: any): obj is SimpleLocationTuple {
  return obj && Array.isArray(obj) && obj.length === 3 &&
    isCoordinate(obj[0])
}

export function isSimpleLocation(obj: any): obj is SimpleLocation {
  return isSimpleLocationTuple(obj) || isSimpleLocationXYZ(obj)
}

export type LocationTuple = Tuple3<Coordinate>

export interface Location extends Iterable<Coordinate> {
  x: Coordinate
  y: Coordinate
  z: Coordinate
  0: Coordinate
  1: Coordinate
  2: Coordinate
  modify(index: LocationCoordinateIndex, value: SimpleLocationValue): this
  modify(loc: SimpleLocationOptions): this
  clone(): this
  join(str: string): string
}

export interface LocationConstructor<TLocation extends Location> {
  new (loc: SimpleLocation): TLocation
  new (x: Coordinate | number, y: Coordinate | number, z: Coordinate | number): TLocation
}

export type LocationCoordinateIndex = 0 | 1 | 2

export class LocationImpl implements Iterable<any> {

  public get 0(): Coordinate {
    return this.x
  }

  public get 1(): Coordinate {
    return this.y
  }

  public get 2(): Coordinate {
    return this.z
  }

  public readonly x: Coordinate
  public readonly y: Coordinate
  public readonly z: Coordinate

  protected readonly ctr: LocationConstructor<this> = this.constructor as any
  protected readonly tuple: LocationTuple

  constructor(simpleLoc: SimpleLocation)
  constructor(x: Coordinate | number, y: Coordinate | number, z: Coordinate | number)
  constructor(
    simpleLocOrX: SimpleLocation | Coordinate | number,
    y?: Coordinate | number,
    z?: Coordinate | number,
  ) {
    let loc: SimpleLocationXYZ
    if (isSimpleLocation(simpleLocOrX)) {
      loc = simpleLocationXYZ(simpleLocOrX)
    } else {
      loc = { x: simpleLocOrX, y, z }
    }
    this.x = coord(loc.x)
    this.y = coord(loc.y)
    this.z = coord(loc.z)
    this.tuple = tuple3(this.x, this.y, this.z)
  }

  public modify(index: LocationCoordinateIndex, value: SimpleLocationValue): this
  public modify(loc: SimpleLocationOptions): this
  public modify(locOrIndex: LocationCoordinateIndex | SimpleLocationOptions, update?: SimpleLocationValue): this {
    if (typeof locOrIndex === 'number') {
      const loc: SimpleLocationTuple =
        this.tuple.map((val, index) => (locOrIndex === index ? update : val) as SimpleLocationValue)
      return new this.ctr(loc)
    }
    let [x, y, z] = simpleLocationTuple(locOrIndex)
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

  [Symbol.iterator](): Iterator<any> {
    return [this.x, this.y, this.z][Symbol.iterator]()
  }

  [Symbol.toStringTag](): string {
    return this.toString()
  }

}

import * as util from 'util'

export function loc(x: number, y: number, z: number): Location {
  return new LocationImpl(x, y, z)
}
