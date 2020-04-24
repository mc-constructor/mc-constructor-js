# Messages

## Check
- are subsequent players detected correctly by players service?

## Minigame Commands
- list
- reset

## Gameplay
- ~add objectives tracking events/observable, including getting initial scores from server~
  - server does not have scoring events, so will need to stick with dummy objectives and only
    emit score updates locally
    using game-based objective criteria would require a server side score check on each server tick
    other options could include using command blocks to send a custom command once a threshold is reached?

## Minigames
- what subscriptions aren't getting cleaned up between instances? (e.g. codslap level check is leaking)

## Arenas
- 

## Arena Ideas
- ice floor - with polar bears?
- "king of the hill" - with step block (may require adding support to set block facing direction?)
- "virtual insanity" - platform "moves"

## Codslap
 - how does the codslapper level up?
 - give codslappers tiered dmg vs mobs, no dmg vs players

### Ideas:
 - ice platform
 - platform shrinks
 - randomly spawn creepers / tnt minecart (use data to make it less explosive?)
 - collecting food drops increases satiation
 - collecting leather can grant random armor piece
 - collecting gunpowder can upgrades armor
 - can we detect missed attacks? - requires implementing a client packet to sent "left click on air" event
 - increase knockback level with successful slaps (e.g. 10 slaps = level++)
 - killing player takes a random piece of armor or fish if it is better
