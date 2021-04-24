export enum ServerEventType {

  entityJoinWorld = 'net.minecraftforge.event.entity.EntityJoinWorldEvent',
  livingDeath = 'net.minecraftforge.event.entity.living.LivingDeathEvent',
  livingAttack = 'net.minecraftforge.event.entity.living.LivingAttackEvent',
  livingDamage = 'net.minecraftforge.event.entity.living.LivingDamageEvent',
  livingFall = 'net.minecraftforge.event.entity.living.LivingFallEvent',
  playerAttackEntity = 'net.minecraftforge.event.entity.player.AttackEntityEvent',
  playerEntityItemPickup = 'net.minecraftforge.event.entity.player.EntityItemPickupEvent',
  playerLeftClickBlock = 'net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickBlock',
  playerLeftClickEmpty = 'net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickEmpty',
  playerItemPickup = 'net.minecraftforge.event.entity.player.PlayerEvent$ItemPickupEvent',
  playerJoined = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent',
  playerLeft = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedOutEvent',
  playerRespawn = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerRespawnEvent',

  minigameStart = 'net.dandoes.minecraft.minigame.event.MinigameGameClientEvent$MinigameStartGameClientEvent',
}
