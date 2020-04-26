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
- Entry/Exit requirements - make arena specified reqs optional, add global reqs (to help with ordering)                                                                                                                                                                                                                                                                                                                                                                                                                                                    

## Arena Ideas
- ice floor - with polar bears?
- "virtual insanity" - platform "moves", splits, etc
- replace random blocks with primed tnt
- something involving a volcano?

## Codslap
 - how does the codslapper level up?
 - give codslappers tiered dmg vs mobs, no dmg vs players

### Ideas:
 - collecting food drops increases satiation
 - collecting leather can grant random armor piece
 - collecting gunpowder can upgrades armor
 - can we detect missed attacks? - requires implementing a client packet to sent "left click on air" event
 - increase knockback level with successful slaps (e.g. 10 slaps = level++)
 - killing player takes a random piece of armor or fish if it is better
