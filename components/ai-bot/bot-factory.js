import { BotPlayer } from "./bot-player"

export class BotFactory {
  /**
   * Creates a new bot player with the specified difficulty level
   */
  static createBot(id, name, difficultyLevel) {
    return new BotPlayer(id, name, difficultyLevel)
  }

  /**
   * Creates multiple bots with specified difficulty levels
   */
  static createBots(count, difficultyLevel) {
    const bots = []

    for (let i = 0; i < count; i++) {
      const botId = `bot-${i + 1}`
      const botName = `Bot ${i + 1}`
      bots.push(this.createBot(botId, botName, difficultyLevel))
    }

    return bots
  }
}

