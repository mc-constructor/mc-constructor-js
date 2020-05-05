# @ts-mc/core/scoreboard

Services for working with the Minecraft scoreboard. Note that these services are *write-only* - the server does not
emit events when scores are updated, so scoring logic must exist within the *ts-mc* application. These services are
primarily to allow the Minecraft scoreboard to be used for the in-game display.
