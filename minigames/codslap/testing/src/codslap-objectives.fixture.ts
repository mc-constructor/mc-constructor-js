import { stub } from '@dandi/core/testing'
import { ObservableServiceFixture } from '@ts-mc/common/testing'
import { Objective } from '@ts-mc/core/scoreboard'

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
