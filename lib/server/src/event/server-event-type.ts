export enum ServerEventType {
  entityLivingDeath = 'net.minecraftforge.event.entity.living.LivingDeathEvent',
  entityLivingAttack = 'net.minecraftforge.event.entity.living.LivingAttackEvent',
  entityLivingDamage = 'net.minecraftforge.event.entity.living.LivingDamageEvent',
  entityLivingFall = 'net.minecraftforge.event.entity.living.LivingFallEvent',
  playerAttackEntity = 'net.minecraftforge.event.entity.player.AttackEntityEvent',
  playerEntityItemPickup = 'net.minecraftforge.event.entity.player.EntityItemPickupEvent',
  playerLeftClickBlock = 'net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickBlock',
  playerLeftClickEmpty = 'net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickEmpty',
  playerItemPickup = 'net.minecraftforge.event.entity.player.PlayerEvent$ItemPickupEvent',
  playerJoined = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent',
  playerLeft = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedOutEvent',
  playerRespawn = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerRespawnEvent',

  minigameStart = 'net.dandoes.nodesupportmod.minigame.event.MinigameEvent$MinigameStartEvent',
}
