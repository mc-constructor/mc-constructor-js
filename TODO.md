# Commands
- MultiCommandRequest: update timeout warning to be cleared by updates from child multi commands
- MultiCommandRequest: improve debugging
  - use Symbol.toStringTag
  - include debug/toStringTag text from contained commands (e.g. `[MultiCommandRequest: 'setblock etc etc', 'fill etc etc']`)

# Marbles testing
- 

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
- limit holding area spawning to inner area (don't spawn near edges)                                                            
- use a generator to automatically create incremental entry/exit requirements
- Arena change sequence with title countdown
- end sequence
    - arena descriptor updates:
        - define winning objective
        - define broadcasted objectives
    - teleport back to holding area
    - use title (is there something better?) to show overall / objective winners
    - use DMs to show objective scores to each player                                                                                                                                                                                                                                                                                                                                                                                  

## Arena Ideas
- ice floor - with polar bears?
- "virtual insanity" - platform "moves", splits, etc
- something involving a volcano?
- multiple separated platforms
    - connect via bridges and/or teleporting?

## Codslap
 - how does the codslapper level up?
 - give codslappers tiered dmg vs mobs, no dmg vs players

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
 - Use creepers on destroyable surfaces
    - See EntityExplode event for list of blocks that are destroyed/damaged for spawn blacklisting

### NEXT:
- why is setblock failing?
- Default/global hooks (e.g. cow spawning)  
  - probably needs server mod to add a count command
- Update Shrinky Dinks to use timing pattern from Primed and Ready
- Fix codslap kills not getting counted if a player is dead
    - was this fixed by separating playerDeath$ and playerLimbo$ ?
    - might be due to the event not coming from the server?  
