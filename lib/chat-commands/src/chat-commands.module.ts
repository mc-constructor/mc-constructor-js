import { ModuleBuilder, Registerable } from '@dandi/core'

import { ChatCommands } from './chat-commands'
import { GamesCommands } from './games'
import { localToken } from './local-token'

export class ChatCommandsModuleBuilder extends ModuleBuilder<ChatCommandsModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ChatCommandsModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ChatCommandsModule = new ChatCommandsModuleBuilder(
  ChatCommands,
  GamesCommands,
)
