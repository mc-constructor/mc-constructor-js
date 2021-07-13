import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'

export enum GameRule {
  announceAdvancements = 'announceAdvancements',
  commandBlockOutput = 'commandBlockOutput',
  disableElytraMovementCheck = 'disableElytraMovementCheck',
  disableRaids = 'disableRaids',
  doDaylightCycle = 'doDaylightCycle',
  doEntityDrops = 'doEntityDrops',
  doFireTick = 'doFireTick',
  doInsomnia = 'doInsomnia',
  doImmediateRespawn = 'doImmediateRespawn',
  doLimitedCrafting = 'doLimitedCrafting',
  doMobLoot = 'doMobLoot',
  doMobSpawning = 'doMobSpawning',
  doPatrolSpawning = 'doPatrolSpawning',
  doTileDrops = 'doTileDrops',
  doTraderSpawning = 'doTraderSpawning',
  doWeatherCycle = 'doWeatherCycle',
  drowningDamage = 'drowningDamage',
  fallDamage = 'fallDamage',
  fireDamage = 'fireDamage',
  keepInventory = 'keepInventory',
  logAdminCommands = 'logAdminCommands',
  maxCommandChainLength = 'maxCommandChainLength',
  maxEntityCramming = 'maxEntityCramming',
  mobGriefing = 'mobGriefing',
  naturalRegeneration = 'naturalRegeneration',
  randomTickSpeed = 'randomTickSpeed',
  reducedDebugInfo = 'reducedDebugInfo',
  sendCommandFeedback = 'sendCommandFeedback',
  showDeathMessages = 'showDeathMessages',
  spawnRadius = 'spawnRadius',
  spectatorsGenerateChunks = 'spectatorsGenerateChunks',
}

type GameRuleValue = {
  [GameRule.announceAdvancements]: boolean,
  [GameRule.commandBlockOutput]: boolean,
  [GameRule.disableElytraMovementCheck]: boolean,
  [GameRule.disableRaids]: boolean,
  [GameRule.doDaylightCycle]: boolean,
  [GameRule.doEntityDrops]: boolean,
  [GameRule.doFireTick]: boolean,
  [GameRule.doInsomnia]: boolean,
  [GameRule.doImmediateRespawn]: boolean,
  [GameRule.doLimitedCrafting]: boolean,
  [GameRule.doMobLoot]: boolean,
  [GameRule.doMobSpawning]: boolean,
  [GameRule.doPatrolSpawning]: boolean,
  [GameRule.doTileDrops]: boolean,
  [GameRule.doTraderSpawning]: boolean,
  [GameRule.doWeatherCycle]: boolean,
  [GameRule.drowningDamage]: boolean,
  [GameRule.fallDamage]: boolean,
  [GameRule.fireDamage]: boolean,
  [GameRule.keepInventory]: boolean,
  [GameRule.logAdminCommands]: boolean,
  [GameRule.maxCommandChainLength]: number,
  [GameRule.maxEntityCramming]: number,
  [GameRule.mobGriefing]: boolean,
  [GameRule.naturalRegeneration]: boolean,
  [GameRule.randomTickSpeed]: number,
  [GameRule.reducedDebugInfo]: boolean,
  [GameRule.sendCommandFeedback]: boolean,
  [GameRule.showDeathMessages]: boolean,
  [GameRule.spawnRadius]: number,
  [GameRule.spectatorsGenerateChunks]: boolean,
}

const GameRuleIsBoolean = {
  [GameRule.announceAdvancements]: true,
  [GameRule.commandBlockOutput]: true,
  [GameRule.disableElytraMovementCheck]: true,
  [GameRule.disableRaids]: true,
  [GameRule.doDaylightCycle]: true,
  [GameRule.doEntityDrops]: true,
  [GameRule.doFireTick]: true,
  [GameRule.doInsomnia]: true,
  [GameRule.doImmediateRespawn]: true,
  [GameRule.doLimitedCrafting]: true,
  [GameRule.doMobLoot]: true,
  [GameRule.doMobSpawning]: true,
  [GameRule.doPatrolSpawning]: true,
  [GameRule.doTileDrops]: true,
  [GameRule.doTraderSpawning]: true,
  [GameRule.doWeatherCycle]: true,
  [GameRule.drowningDamage]: true,
  [GameRule.fallDamage]: true,
  [GameRule.fireDamage]: true,
  [GameRule.keepInventory]: true,
  [GameRule.logAdminCommands]: true,
  [GameRule.maxCommandChainLength]: false,
  [GameRule.maxEntityCramming]: false,
  [GameRule.mobGriefing]: true,
  [GameRule.naturalRegeneration]: true,
  [GameRule.randomTickSpeed]: false,
  [GameRule.reducedDebugInfo]: true,
  [GameRule.sendCommandFeedback]: true,
  [GameRule.showDeathMessages]: true,
  [GameRule.spawnRadius]: false,
  [GameRule.spectatorsGenerateChunks]: true,
}

export interface GameRuleCommandBuilderExplicit {
  <TRule extends GameRule>(rule: GameRule, value?: GameRuleValue[TRule]): CommandRequest
}

export interface GameRuleSubCommandBuilder<TRule extends GameRule> extends CommandRequest {
  (value?: GameRuleValue[TRule]): CommandRequest
}

export interface GameRuleBooleanCommandBuilder<TRule> extends CommandRequest {
  enable: CommandRequest
  disable: CommandRequest
}

export type GameRuleCommandBuilderImplicit = {
  [TRule in GameRule]: GameRuleValue[TRule] extends boolean ?
    GameRuleBooleanCommandBuilder<TRule> :
    GameRuleSubCommandBuilder<TRule>
}

export type GameRuleCommandBuilder = GameRuleCommandBuilderExplicit & GameRuleCommandBuilderImplicit

class GameRuleCommand<TRule extends GameRule> extends SimpleArgsCommandRequest {
  protected readonly command: string = 'gamerule'

  constructor(public readonly rule: TRule, public readonly value?: GameRuleValue[TRule]) {
    super(...(typeof value === 'undefined' ? [rule] : [rule, value]))
  }

}

function gameruleFn<TRule extends GameRule>(rule: TRule, value?: GameRuleValue[TRule]): CommandRequest {
  return new GameRuleCommand(rule, value)
}


export const gamerule: GameRuleCommandBuilder = Object.create(
  gameruleFn,
  Object.values(GameRule).reduce((result, rule) => {
    result[rule] = {
      get: () => {
        const queryRule = gameruleFn(rule)
        return GameRuleIsBoolean[rule] ?
          Object.assign(queryRule, {
            enable: gameruleFn(rule, true),
            disable: gameruleFn(rule, false),
          }) :
          Object.assign(gameruleFn.bind(undefined, rule), queryRule)
      }
    }
    return result
  }, {} as any)
)
