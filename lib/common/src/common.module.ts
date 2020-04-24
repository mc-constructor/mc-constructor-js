import { ModuleBuilder, Registerable } from '@dandi/core'

import { CommandOperatorProvider, SubscriptionTrackerProvider } from '../rxjs'

import { localToken } from './local-token'
import { LoggerFactory } from './logger'

export class CommonModuleBuilder extends ModuleBuilder<CommonModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CommonModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CommonModule = new CommonModuleBuilder(
  CommandOperatorProvider,
  SubscriptionTrackerProvider,

  LoggerFactory,
)
