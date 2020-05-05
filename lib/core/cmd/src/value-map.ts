export enum ValueMapOutput {
  map = 'map',
  set = 'set',
}

export class ValueMap<TKey, TValue> extends Map<TKey, TValue> {

  protected readonly outputMode: ValueMapOutput = ValueMapOutput.map

  public toString(): string {
    let result = ''
    if (this.size) {
      if (this.outputMode === ValueMapOutput.set) {
        result += '['
      } else if (this.outputMode === ValueMapOutput.map) {
        result += '{'
      }
      let first = false
      for (const [key, value] of this.entries()) {
        if (first) {
          result += ','
        } else {
          first = true
        }

        if (this.outputMode === ValueMapOutput.set) {
          result += value.toString()
        } else {
          result += `${key}:${value}`
        }
      }
      if (this.outputMode === ValueMapOutput.set) {
        result += ']'
      } else if (this.outputMode === ValueMapOutput.map) {
        result += '}'
      }
    }
    return result
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.toString()}]`
  }
}
