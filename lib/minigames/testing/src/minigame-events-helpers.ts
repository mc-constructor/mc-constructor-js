import { Logger, NoopLogger } from '@dandi/core'
import { MarbleValues } from '@rxjs-stuff/marbles'
import { AnyFn, impersonate, stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClientFixture, requestClientFixture } from '@ts-mc/core/client/testing'
import { ServerEvent, ServerEvents } from '@ts-mc/core/server-events'
import { PlayerWithHeldItems } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'

export type PlayerMarbleValues = MarbleValues<PlayerWithHeldItems>
export type ServerEventMarbleValues = MarbleValues<ServerEvent>

export interface MinigameEventsHelpers<TEvents extends MinigameEvents> {
  playerValues: PlayerMarbleValues
  serverEvents: ServerEventMarbleValues
  initEvents(serverEvents: ServerEvents): TEvents
}

export interface MinigameEventsFactory<TEvents extends MinigameEvents> {
  (requestClient: RequestClientFixture, serverEvents: ServerEvents, logger: Logger): TEvents
}

const defaultMinigameEventsFactory: MinigameEventsFactory<MinigameEvents> =
  (requestClient: RequestClientFixture, serverEvents: ServerEvents, logger: Logger) =>
    new MinigameEvents(requestClient, serverEvents, logger)

export interface MinigameEventsHelpersFactoryConfig<TEvents extends MinigameEvents> {
  minigameEventsFactory: MinigameEventsFactory<TEvents>
}

export type MinigameEventsHelpersConfig<TEvents extends MinigameEvents> = {
  [TKey in keyof MinigameEventsHelpers<TEvents>]?: MinigameEventsHelpers<TEvents>[TKey] extends AnyFn ? never :
    (() => MinigameEventsHelpers<TEvents>[TKey])
}

export class MinigameEventsHelpersImpl<TEvents extends MinigameEvents> implements MinigameEventsHelpers<TEvents> {
  public playerValues: PlayerMarbleValues
  public serverEvents: ServerEventMarbleValues

  constructor(private readonly minigameEventsFactory: MinigameEventsFactory<TEvents>) {}

  public initEvents(serverEvents: ServerEvents): TEvents {
    const playerValues = this.playerValues
    const events = this.minigameEventsFactory(requestClientFixture(), serverEvents, new NoopLogger())

    impersonate(events, function(this: MinigameEvents) {
      Object.values(playerValues || {}).forEach(player => this.addPlayer(player))
    })
    events.players.push(...Object.values(playerValues || {}))
    return events
  }
}
export function minigameEventsHelpers(config?: MinigameEventsHelpersConfig<MinigameEvents> & Partial<MinigameEventsHelpersFactoryConfig<MinigameEvents>>): MinigameEventsHelpers<MinigameEvents>
export function minigameEventsHelpers<TEvents extends MinigameEvents>(config: MinigameEventsHelpersConfig<TEvents> & MinigameEventsHelpersFactoryConfig<TEvents>): MinigameEventsHelpers<TEvents>
export function minigameEventsHelpers<TEvents extends MinigameEvents = MinigameEvents>(
  config: MinigameEventsHelpersConfig<TEvents> & Partial<MinigameEventsHelpersFactoryConfig<TEvents>> = {},
): MinigameEventsHelpers<TEvents> {
  stubLoggerFactory()
  const helpers = new MinigameEventsHelpersImpl(
    config.minigameEventsFactory || defaultMinigameEventsFactory as MinigameEventsFactory<TEvents>
  )

  beforeEach(() => {
    helpers.playerValues = config.playerValues ? config.playerValues() : undefined
    helpers.serverEvents = config.serverEvents ? config.serverEvents() : undefined
  })
  afterEach(() => {
    helpers.playerValues = undefined
    helpers.serverEvents = undefined
  })

  return helpers
}
