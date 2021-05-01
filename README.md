# MC Constructor

A framework for interacting with a Minecraft server using NodeJS.

> **warning:** MC Constructor is still very much experimental - use at your own risk

## Requirements

### Client
- Minecraft v1.16.5
- Minecraft Forge for v1.16.5

### Server
#### Minecraft

*Note:* This mod will modify the world it is loaded on. It is recommended to only use it on a new world.

- Minecraft server running v1.16.5 (tested only on Vanilla / MSM)
- Minecraft Forge for v1.16.5
- Codslap! mod (https://www.curseforge.com/minecraft/mc-mods/codslap)
- Server access to either run additional processes on the server, or open additional TCP ports

#### NodeJS
- NodeJS v14.16+
- Optional: Yarn v1.x (Yarn Classic)

### Client
- Install the MinecraftForge mod loader: https://files.minecraftforge.net/net/minecraftforge/forge/
- It should create a profile for itself in your Minecraft launcher
- In the Minecraft launcher, click the "Installations" tab at the top
- Click the folder icon for the "forge" installation. This should open the installation folder.
- Download the Codslap! mod (https://www.curseforge.com/minecraft/mc-mods/codslap) and copy the `.jar` file into the
  `mods` folder located in the installation folder

### Server
#### Minecraft
- To install MinecraftForge, download and run the installer on a new server: https://files.minecraftforge.net/net/minecraftforge/forge/
  - See https://blog.za3k.com/running-a-forge-server-on-headless-linux/ for additional installation instructions
- Download the Codslap! mod (https://www.curseforge.com/minecraft/mc-mods/codslap) and copy the `.jar` file into the
    `mods` directory located in the server directory
- Start the server normally once the mod's .jar file is copied
- If the NodeJS server will be run on a different machine than the Minecraft server, ensure your network configuration
  allows port 8888 to be routed to the Minecraft server

#### NodeJS
- Clone this repository in a separate directory on the same machine as the Minecraft server, or on a machine that has
  network access to port 8888 on the Minecraft server
- In the cloned repository directory, run `yarn` or `npm install`

##### Running NodeJS and Minecraft servers on the same machine
Run `yarn start` or `npm run start`

##### Running NodeJS and Minecraft servers on different machines
Run `yarn start --host HOSTNAME` or `npm run start --host HOSTNAME`

`HOSTNAME` can be the IP address or FQDN for the Minecraft server.

Example:

```bash
# FQDN
yarn start --host my-awesome-minecraft-server.some-domain.com

# IP Address
yarn start --host 192.168.1.2
```

## Usage

Once both the Minecraft and NodeJS servers are running, operators can initiate minigames using the in-game commands:

- `minigame list` - lists available minigames
- `minigame start [minigame_name]` - starts the specified minigame
- `minigame stop [minigame_name]` - stops the specified minigame - all scores are deleted
- `minigame reset [minigame_name]` - resets a game in progress

For now, only one minigame is available:

`minigame start codslap`

Once the game is started, all players will be moved to a "holding area" while the minigame arenas are generated. Players
will be moved to the arena, and the game will progress automatically.

### Troubleshooting

If the minigame appears to stop working - Codslaps are no longer being counted, or it is not switching arenas in a
reasonable amount of time, the NodeJS server may need to be restarted. Quit the NodeJS process by hitting CTRL+C twice,
and start it again.
