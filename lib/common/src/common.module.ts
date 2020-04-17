import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { LoggerFactory } from './logger'
import { SubscriptionTrackerProvider } from './subscription-tracker'

export class CommonModuleBuilder extends ModuleBuilder<CommonModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CommonModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CommonModule = new CommonModuleBuilder(
  LoggerFactory,
  SubscriptionTrackerProvider,
)
