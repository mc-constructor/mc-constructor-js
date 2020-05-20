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

export type SimpleAxisValue = number | AxisValue

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

  /**
   * Returns `true` if the instance value is between `a` and `b`, inclusively; otherwise, `false`
   * @param a
   * @param b
   */
  public between(a: SimpleAxisValue, b: SimpleAxisValue): boolean {
    return (a >= this.value && this.value >= b) ||
      (b >= this.value && this.value >= a)
  }

  public toString(): string {
    return this.display
  }

  public valueOf(): any {
    return this.value
  }

  public get [Symbol.toStringTag]() {
    return this.toString()
  }
}

export const AxisValue: AxisValueConstructor = AxisValueImp as any

export function isSimpleAxisValue(obj: any): obj is number | AxisValue {
  return typeof obj === 'number' || isAxisValue(obj)
}

export function axisValue(value: number | AxisValue): AxisValue {
  return typeof value === 'number' ? new AxisValue(value) : value
}
