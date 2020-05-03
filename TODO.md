# Messages
- Convert "Message" to "ClientRequest"
- disambiguate "response" terminology

# Marbles testing
- figure out how to get stack trace pointing to the failed test expectation,
  but still preserve the marbles diff - maybe instantiate an exception at the
  call site?

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
- add check for player count?

## Arenas
- Entry/Exit requirements - make arena specified reqs optional, add global reqs (to help with ordering)
- Default/global hooks (e.g. cow spawning)                                                                                                                                                                                                                                                                                                                                                                                                                                                    

## Arena Ideas
- ice floor - with polar bears?
- "virtual insanity" - platform "moves", splits, etc
- replace random blocks with primed tnt
- something involving a volcano?

## Codslap
 - how does the codslapper level up?
 - give codslappers tiered dmg vs mobs, no dmg vs players
 
## Bugs
- spawn blacklist on bedrock pit
- spawn blacklist on removed rows of shrinky dinks
- primed and ready - fix general tnt logic
- hooks stop working on the last arena after exit reqs are met

## Balance/Gameplay fixes
- scale random spawns with # of players
- enabled limiting hook-based spawns (e.g. total number of cows spawned)
- heal/feed player on moving to arena
- remove fire effect?

### Ideas:
 - collecting food drops increases satiation
 - collecting leather can grant random armor piece
 - collecting gunpowder can upgrades armor
 - can we detect missed attacks? - requires implementing a client packet to sent "left click on air" event
 - increase knockback level with successful slaps (e.g. 10 slaps = level++)
 - killing player takes a random piece of armor or fish if it is better
