export abstract class BlockExtras {

  protected abstract readonly prefix: string
  protected abstract readonly suffix: string
  protected abstract readonly keyValueSeparator: string
  protected readonly entrySeparator = ','

  private readonly data: { [key: string]: any } = {}

  protected generate(): string {
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

  public toString(): string {
    return this.generate()
  }

  public [Symbol.toStringTag](): string {
    return this.toString()
  }

}
