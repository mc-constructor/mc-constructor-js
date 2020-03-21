export class Coordinate {

  protected readonly display: string
  protected readonly ctr = this.constructor as any

  constructor(public readonly value: number) {
    this.display = this.formatDisplay(value)
  }

  protected formatDisplay(value: number): string {
    return value.toString()
  }

  public plus(value: number): this {
    return new this.ctr(this.value + value)
  }

  public minus(value: number): this {
    return new this.ctr(this.value - value)
  }

  public toString(): string {
    return this.display
  }

  public valueOf(): any {
    return this.value
  }
}

export function coord(value: number): Coordinate {
  return new Coordinate(value)
}

export class RelativeCoordinate extends Coordinate {

  constructor(value) {
    super(value)
  }

  protected formatDisplay(value: number): string {
    return `~${value}`
  }

}

export type Location = [Coordinate, Coordinate, Coordinate]

export function loc(x: number, y: number, z: number): Location {
  return [coord(x), coord(y), coord(z)]
}
