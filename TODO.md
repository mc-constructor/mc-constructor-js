# Messages

## Check
- are subsequent players detected correctly by players service?

## Command Sequencing

## Minigame Commands
- list
- reset

## Gameplay
- add objectives tracking events/observable, including getting initial scores from server
  - server does not have scoring events, so will need to stick with dummy objectives and only
    emit score updates locally
    using game-based objective criteria would require a server side score check on each server tick
    other options could include using command blocks to send a custom command once a threshold is reached?
- fix `setObjectiveDisplay` sending bad text format
- how does the codslapper level up?
