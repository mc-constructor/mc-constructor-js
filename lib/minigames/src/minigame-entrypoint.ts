import { EntryPoint, Inject, Injectable, Logger } from '@dandi/core'
import { RequestClient } from '@ts-mc/core/client'
import { LoggerFactory } from '@ts-mc/common'

import { MinigameManager } from './minigame-manager'

@Injectable(EntryPoint)
export class MinigameEntrypoint implements EntryPoint {

  constructor(
    @Inject(RequestClient) private readonly client: RequestClient,
    @Inject(MinigameManager) private readonly minigames: MinigameManager,
    @Inject(Logger) private logger: Logger,
    @Inject(LoggerFactory) loggerFactory: LoggerFactory,
  ) {
    this.logger.info('ctr')
    loggerFactory.init()
  }

  public run(): void {
    this.minigames.run$.subscribe({
      next: (e) => this.logger.debug(e.source, e.event),
      error: (err: any) => this.logger.error(err),
      complete: () => this.logger.info('done'),
    })
  }

}
