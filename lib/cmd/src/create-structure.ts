import { readFile } from 'fs'
import { resolve } from 'path'

import { MessageType, SimpleMessage } from '../../client'

// class CreateStructureCommand extends SimpleMessage {
//   public readonly type: MessageType = MessageType.createStructure
//
//   constructor(public readonly path: string) {
//     super()
//   }
//
//   protected getMessageBody(): Promise<Uint8Array> {
//     return this.loadFile()
//   }
//
//   private loadFile(): Promise<Uint8Array> {
//     return new Promise<Uint8Array>((resolve, reject) => {
//       readFile(this.path, (err: Error, buffer: Uint8Array) => {
//         if (err) {
//           return reject(err)
//         }
//         resolve(buffer)
//       })
//     })
//   }
//
// }
//
// export function createStructure(section: string, name: string): CreateStructureCommand {
//   const path = resolve(__dirname, '../../../data', section, 'structures', `${name}.nbt`)
//   return new CreateStructureCommand(path)
// }
