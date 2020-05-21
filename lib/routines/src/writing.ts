import { readFileSync } from 'fs'
import { resolve } from 'path'

export type ObjItem = {
  id: string,
  data: boolean[][],
}
export type ObjData = { [key: string]: ObjItem }

const EOF = Symbol.for('__EOF__')

type TokenChar = string | symbol

enum Token {
  docStart = 'docStart',
  idStart = 'idStart',
  idChar = 'idChar',
  idEnd = 'idEnd',
  dataStart = 'dataStart',
  dataChar = 'dataChar',
  dataEnd = 'dataEnd',
  newline = 'newline',
  commentStart = 'commentStart',
  commentChar = 'commentChar',
  docEnd = 'docEnd',
  commentEnd = 'commendEnd',
}

type TokenMap<TValue> = { [TTrigger in Token]: TValue }

const SyntaxChars = {
  [Token.idStart]: ':',
  [Token.idChar]: /\S/,
  [Token.idEnd]: '\n',
  [Token.dataStart]: '\n',
  [Token.dataChar]: ['X', ' ', '\n'],
  [Token.newline]: '\n',
  [Token.commentStart]: '#',
  [Token.commentChar]: /[^\n]/,
  [Token.docEnd]: EOF,
}

type TokenTriggers = Partial<TokenMap<Token>>

interface TokenRules {
  allowed: Token[]
  closedWith?: Token
  triggersBefore?: TokenTriggers
  triggersAfter?: TokenTriggers
}
type Syntax = Partial<TokenMap<TokenRules>>

const Syntax: Syntax = {
  [Token.docStart]: {
    allowed: [Token.commentStart, Token.idStart, Token.newline],
    closedWith: Token.docEnd,
  },
  [Token.idStart]: {
    allowed: [Token.idChar],
    closedWith: Token.idEnd,
  },
  [Token.idChar]: {
    allowed: [Token.idEnd],
    // triggersBefore: {
    //   [Token.idEnd]: Token.dataStart,
    // },
  },
  [Token.idEnd]: {
    allowed: [Token.dataStart],
    triggersBefore: {
      [Token.dataChar]: Token.dataStart,
      [Token.commentStart]: Token.dataStart,
    }
  },
  [Token.dataStart]: {
    allowed: [Token.commentStart, Token.dataChar],
    closedWith: Token.dataEnd,
  },
  [Token.dataChar]: {
    allowed: [Token.commentStart, Token.dataChar, Token.dataEnd],
    triggersBefore: {
      [Token.idStart]: Token.dataEnd,
      [Token.docEnd]: Token.dataEnd,
    },
  },
  [Token.dataEnd]: {
    allowed: [Token.idStart, Token.commentStart, Token.docEnd],
  },
  [Token.commentStart]: {
    allowed: [Token.commentChar, Token.commentEnd],
    triggersBefore: {
      [Token.newline]: Token.commentEnd,
      [Token.docEnd]: Token.commentEnd,
    },
    closedWith: Token.commentEnd,
  },
  [Token.commentChar]: {
    allowed: [Token.commentChar, Token.newline, Token.docEnd]
  },
  // [Token.newline]: {
  //   allowed: [Token.idStart, Token.commentStart, Token.dataChar],
  //   triggersAfter: {
  //     [Token.commentChar]: Token.commentEnd,
  //   }
  // },
}

function loadData(key: string): ObjData {
  const rawData = readFileSync(resolve(__dirname, '../../../data', `${key}.txt`), 'utf-8')

  return Parser.parse(rawData)
}

type ActionHandler = (char?: TokenChar) => void
type ActionHandlerNames<TParser> = { [TMember in keyof TParser]: TParser[TMember] extends ActionHandler ? TMember : never }[keyof TParser]
type TokenActions<TParser> = { [TToken in Token]?: ActionHandlerNames<TParser> }

function debugChar(char: TokenChar): string {
  switch(char) {
    case '\n': return '[newline]'
    case ' ': return '[space]'
  }
  return `\`${char.toString()}\``
}

class Parser {

  public static parse(input: string): ObjData {
    return new Parser(input).parse()
  }

  private static readonly actions: TokenActions<Parser> = {
    [Token.idStart]: 'finalizeCurItem',
    [Token.idChar]: 'updateItemId',
    [Token.dataStart]: 'initItemData',
    [Token.dataChar]: 'processDataChar',
    [Token.dataEnd]: 'finalizeItemDataRow',
    [Token.docEnd]: 'finalizeItemDataRow',
  }

  private currentToken: Token
  private currentRules: TokenRules
  private currentItem: Partial<ObjItem>
  private waitingToCloseToken: Token
  private readonly openTokens: Token[] = []
  private readonly result: ObjData = {}

  private currentDataRow: boolean[]

  private constructor(public readonly input: string) {
    this.handleToken(Token.docStart)
  }

  public parse(): ObjData {
    let lineNumber = 1
    let charNumber = 1;
    for (let index = 0; index < this.input.length; index++) {
      const char = this.input[index];
      // console.debug(`\nnext char ${debugChar(char)} with current token ${this.currentToken}, current item id ${this.currentItem?.id || '[none]'}`)
      console.debug(`\nchar ${debugChar(char)}:`)
      try {
        this.processNext(char)
        if (char === '\n') {
          lineNumber++
          charNumber = 1
        } else {
          charNumber++
        }
      } catch (err) {
        throw new Error(`Parsing error at line ${lineNumber}, char ${charNumber}: ${err}`)
      }
    }
    this.processNext(EOF)
    this.finalizeResult()
    return this.result
  }

  private processNext(char: TokenChar): void {
    const triggerTokens = Object.keys(this.currentRules.triggersBefore || {}) as Token[]
    const triggerToken = this.findToken(char, triggerTokens)
    if (triggerToken) {
      console.debug(`found trigger token ${triggerToken} from ${this.currentToken} with char ${debugChar(char)}`)
      const triggeredToken = this.currentRules.triggersBefore[triggerToken]
      console.debug(`triggering token ${triggeredToken} from ${this.currentToken} with char ${debugChar(char)}`)
      this.handleToken(triggeredToken, char)
      return this.processNext(char)
    }
    const nextToken = this.findToken(char, this.currentRules.allowed)
    if (!nextToken) {
      throw new Error(`Unexpected token ${debugChar(char)} - expected one of ${this.currentRules.allowed.concat(triggerTokens)}`)
    }
    this.handleToken(nextToken, char)
  }

  private handleToken(token: Token, char: TokenChar = ''): void {
    const rules = Syntax[token]
    // console.debug(`handling token ${token}, char ${debugChar(char)}`)
    this.invokeHandler(token, char)

    if (this.waitingToCloseToken === token) {
      this.openTokens.pop()
      this.waitingToCloseToken = this.openTokens[this.openTokens.length - 1]
    }

    if (rules?.closedWith) {
      this.openTokens.push(rules.closedWith)
      this.waitingToCloseToken = rules.closedWith
    }

    // console.debug(`${this.currentToken} -> ${token}, current item id ${this.currentItem?.id || '[none]'}`)
    console.debug(`token ${this.currentToken} -> ${token}`)

    this.currentToken = token
    this.currentRules = rules
  }

  private invokeHandler(nextToken: Token, char: TokenChar): void {
    const handlerName = Parser.actions[nextToken]
    if (handlerName) {
      this[handlerName](char)
    }
  }

  public finalizeCurItem(): void {
    if (this.currentToken !== Token.docStart) {
      this.result[this.currentItem.id] = this.currentItem as ObjItem
    }
    this.currentItem = { id: '', data: [] }
  }

  public updateItemId(char: TokenChar): void {
    if (typeof char === 'string') {
      // console.debug(`updating current item id from ${this.currentItem.id || '[none]'} to ${this.currentItem.id + char}`)
      console.debug(`current item id ${this.currentItem.id || '[none]'} -> ${this.currentItem.id + char}`)
      this.currentItem.id += char
    } else {
      throw new Error(`Expected string, got ${typeof char}`)
    }
  }

  public initItemData(): void {
    this.currentDataRow = []
  }

  public processDataChar(char: TokenChar): void {
    if (char === '\n') {
      this.finalizeItemDataRow()
      console.debug(`starting new data item row`)
      this.currentDataRow = []
      return
    }

    if (char !== ' ' && char !== 'X') {
      throw new Error('wtf bad char')
    }

    console.debug(`recording char ${debugChar(char)}`)
    this.currentDataRow.push(char === 'X')
  }

  public finalizeItemDataRow(): void {
    this.currentItem.data.push(this.currentDataRow)
    this.currentDataRow = undefined
  }

  public finalizeResult(): void {
    if (this.openTokens.length) {
      throw new Error(`Unexpected end of file - still have open token ${this.openTokens}`)
    }
  }

  private findToken(char: TokenChar, allowedTokens: Token[]): Token {
    return allowedTokens.find(token => this.matchToken(token, char))
  }

  private matchToken(token: Token, char: TokenChar): boolean {
    // @ts-ignore
    const tokenChar = SyntaxChars[token]

    if (!tokenChar) {
      return false
    }
    if (typeof char === 'symbol' || typeof tokenChar === 'symbol') {
      return char === tokenChar
    }
    if (tokenChar instanceof RegExp) {
      return tokenChar.test(char)
    }
    if (Array.isArray(tokenChar)) {
      return tokenChar.includes(char)
    }
    if (typeof tokenChar === 'string') {
      return char === tokenChar
    }
    throw new Error(`Unexpected SyntaxChar type: ${tokenChar.toString()}`)
  }

}

// export const ASCII = loadData('ascii')
