// https://minecraft.gamepedia.com/Raw_JSON_text_format

export interface Text {
  text: string
  bold?: boolean
  italic?: boolean
  underlined?: boolean
  strikethrough?: boolean
  obfuscated?: boolean
  color?: string
}

export class TextBuilder {

  private requiresObj: boolean = false
  private readonly obj: Text

  constructor(public readonly text: string) {
    this.obj = { text }
  }

  private modify(obj: Partial<Text>): this {
    this.requiresObj = true
    Object.assign(this.obj, obj)
    return this
  }

  public get bold(): this {
    return this.modify({ bold: true })
  }

  public get italic(): this {
    return this.modify({ italic: true })
  }

  public get underlined(): this {
    return this.modify({ underlined: true })
  }

  public get strikethrough(): this {
    return this.modify({ strikethrough: true })
  }

  public get obfuscated(): this {
    return this.modify({ obfuscated: true })
  }

  public color(color: string): this {
    return this.modify({ color })
  }

  public toString(): string {
    return JSON.stringify(this.requiresObj ? this.obj : this.text)
  }

  [Symbol.toStringTag](): string {
    return this.toString()
  }
}

export function text(text: string): TextBuilder {
  return new TextBuilder(text)
}
