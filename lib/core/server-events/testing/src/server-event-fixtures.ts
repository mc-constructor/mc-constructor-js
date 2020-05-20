import { attackedByPlayerEventFixture } from './attacked-by-player-event.fixture'
import { attackedEntityEventFixture } from './attacked-entity-event.fixture'
import { serverEventFixture } from './server-event.fixture'
import { playerEventFixture } from './player-event.fixture'

export const ServerEventFixtures = {
  event: serverEventFixture,
  attackedEntity: attackedEntityEventFixture,
  attackedByPlayer: attackedByPlayerEventFixture,
  player: playerEventFixture,
}
