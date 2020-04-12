import { text, TextBuilder } from '@minecraft/core/cmd/src/text'
import { MinigameDescriptor } from '../minigame'

import { MinigameMessage } from './minigame'

function getMinigameMetaArgs(game: MinigameDescriptor): (string | TextBuilder)[] {
  const args = [
    game.key,
    text(game.title).builder,
  ]
  if (game.description) {
    // const [firstLine, ...parts] = game.description.split('\n');
    // const description = parts.reduce((builder, line) => builder.add(line), text(firstLine))
    // args.push(text(game.description).builder)
    // TODO: implement set description command
  }
  return args
}

class RegisterMinigameMessage extends MinigameMessage {
  constructor(public readonly game: MinigameDescriptor) {
    super('register', ...getMinigameMetaArgs(game))
  }
}

class UnregisterMinigameMessage extends MinigameMessage {
  constructor(public readonly game: MinigameDescriptor) {
    super('unregister', game.key)
  }
}

export function register(game: MinigameDescriptor): MinigameMessage {
  return new RegisterMinigameMessage(game)
}

export function unregister(game: MinigameDescriptor): MinigameMessage {
  return new UnregisterMinigameMessage(game)
}
