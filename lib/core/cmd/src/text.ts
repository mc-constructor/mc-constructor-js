import { inspect } from 'util'

import { SimpleArgsCommandRequest } from '@ts-mc/core/command'

// https://minecraft.gamepedia.com/Raw_JSON_text_format

export interface TextFragment {
  text: string
  bold?: boolean
  italic?: boolean
  underlined?: boolean
  strikethrough?: boolean
  obfuscated?: boolean
  color?: string
}

export class TextFragmentBuilder {

  private requiresObj: boolean = false
  private readonly obj: TextFragment

  constructor(public readonly builder: TextBuilder, public readonly text: string) {
    this.obj = { text }
  }

  private modify(obj: Partial<TextFragment>): this {
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

  public add(fragment: string): TextFragmentBuilder
  public add(fragment: TextFragmentBuilder): TextBuilder
  public add(fragment: string | TextFragmentBuilder): TextBuilder | TextFragmentBuilder {
    return this.builder.add(fragment as any)
  }

  public toString(): string {
    return JSON.stringify(this)
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.toString()}]`
  }

  public toJSON(): string | TextFragment {
    return this.requiresObj ? this.obj : this.text
  }

  [inspect.custom](): string {
    return this.text
  }
}

export class TextBuilder {

  public readonly builder: this = this

  // start with an empty string so that any styling does not apply to the rest of the fragments
  // TODO: allow disabling this behavior
  private readonly fragments: (string | TextFragmentBuilder)[] = ['']

  public add(fragment: string): TextFragmentBuilder
  public add(fragment: TextFragmentBuilder): this
  public add(fragment: string | TextFragmentBuilder): this | TextFragmentBuilder {
    if (typeof fragment === 'string') {
      const fragmentBuilder = new TextFragmentBuilder(this, fragment)
      this.fragments.push(fragmentBuilder)
      return fragmentBuilder
    }
    this.fragments.push(fragment)
    return this
  }

  public toJSON(): (string | TextFragmentBuilder)[] {
    if (this.fragments.length === 2) { // first fragment is empty
      return [this.fragments[1]]
    }
    return this.fragments
  }

  public toString(): string {
    return JSON.stringify(this)
  }

  [inspect.custom](): string {
    return this.fragments.map(frag => {
      if (typeof frag === 'string') {
        return frag
      }
      return frag.text
    }).join('')
  }

}

export class MultiTextBuilder {

  private readonly entries: TextBuilder[] = []


  constructor(entries: (TextBuilder | TextFragmentBuilder)[]) {
    this.entries.push(...entries.map(entry => entry instanceof TextFragmentBuilder ? entry.builder : entry))
  }

  public toString(): string {
    const entries = this.entries.map(entry => entry.toString())
    return `[${entries.join(',')}]`
  }
}

export function text(): TextBuilder
export function text(text: string): TextFragmentBuilder
export function text(text?: string): TextBuilder | TextFragmentBuilder {
  const builder = new TextBuilder()
  if (typeof text !== 'undefined') {
    return builder.add(text)
  }
  return builder
}

export abstract class TextCommand extends SimpleArgsCommandRequest {

  constructor(public readonly target: string, public readonly text: TextBuilder) {
    super()
  }

  protected formatArgs(): string {
    return `${this.target} [${this.text}]`;
  }
}

export type TextComponent = TextBuilder | TextFragmentBuilder

export function isTextComponent(obj: any): obj is TextComponent {
  return obj instanceof TextBuilder || obj instanceof TextFragmentBuilder
}
