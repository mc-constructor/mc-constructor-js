# Messages
- disambiguate "response" terminology

# Commands
- MultiCommandRequest: update timeout warning to be cleared by updates from child multi commands
- MultiCommandRequest: improve debugging
  - use Symbol.toStringTag
  - include debug/toStringTag text from contained commands (e.g. `[MultiCommandRequest: 'setblock etc etc', 'fill etc etc']`)
- Deferred command - command that generates another command upon execution

# Marbles testing
- 

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
- Default/global hooks (e.g. cow spawning)                                                            
- use a generator to automatically create incremental entry/exit requirements                                                                                                                                                                                                                                                                                                                                                                                        

## Arena Ideas
- ice floor - with polar bears?
- "virtual insanity" - platform "moves", splits, etc
- something involving a volcano?

## Codslap
 - how does the codslapper level up?
 - give codslappers tiered dmg vs mobs, no dmg vs players
 
## Bugs
- fixed? spawn blacklist on bedrock pit
- fixed? spawn blacklist on removed rows of shrinky dinks

## Balance/Gameplay fixes
- enabled limiting hook-based spawns (e.g. total number of cows spawned)
- time based cow spawns if max is not reached
- remove fire effect?

### Ideas:
 - collecting food drops increases satiation
 - collecting leather can grant random armor piece
 - collecting gunpowder can upgrades armor
 - can we detect missed attacks? - requires implementing a client packet to send "left click on air" event
 - increase knockback level with successful slaps (e.g. 10 slaps = level++)
 - killing player takes a random piece of armor or fish if it is better

### NEXT:
- arenaAvailable$ doesn't work correctly when adding new subscriptions? - prevents primed and ready from working correctly
- why is setblock failing?
- Finish arena change sequence (add countdown)
- Default/global hooks (e.g. cow spawning)  
- Fix codslap kills not getting counted if a player is dead - might be due to the event not coming from the server?  
