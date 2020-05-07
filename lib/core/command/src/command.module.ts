import { ModuleBuilder, Registerable } from '@dandi/core'
import { LoggerFactory } from '@ts-mc/common'

import { CommandOperatorProvider } from './command-operator'
import { localToken } from './local-token'

export class CommandModuleBuilder extends ModuleBuilder<CommandModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CommandModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CommandModule = new CommandModuleBuilder(
  CommandOperatorProvider,
  LoggerFactory,
)
