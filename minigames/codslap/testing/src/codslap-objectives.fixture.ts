import { stub } from '@dandi/core/testing'
import { ObservableServiceFixture } from '@minecraft/core/common/testing'
import { Objective } from '@minecraft/core/scoreboard'

import { CodslapObjectives } from '../../src/codslap-objectives'

export type CodslapObjectivesFixture = ObservableServiceFixture<CodslapObjectives>

export function codslapObjectivesFixture(): CodslapObjectivesFixture {
  return {
    codslap: new Objective('codslap'),
    codslapPlayerKill: new Objective('codslap_p_kill'),
    codslapMobKill: new Objective('codslap_m_kill'),
    dispose: stub(),
  }
}
