import { BotManager } from "../ai-bot/bot-manager"
import { SpeechService } from "../../services/speech-service"

export class GameController {
  constructor(initialGameState, botCount, botDifficulty, onGameStateChange, onBotAction) {
    this.gameState = initialGameState
    this.onGameStateChange = onGameStateChange
    this.onBotAction = onBotAction
    this.botManager = new BotManager()
    this.botActionTimeouts = new Map()

    // Initialize bots
    const bots = this.botManager.initializeBots(botCount, botDifficulty)

    // Update game state with bots
    this.gameState = {
      ...this.gameState,
      players: [
        ...this.gameState.players,
        ...bots.map((bot) => ({
          id: bot.id,
          name: bot.name,
          cardCount: 0,
          cards: [],
          isBot: true,
          isActive: true,
        })),
      ],
    }

    // Update bot manager with initial game state
    this.botManager.updateGameState(this.gameState)
  }

  /**
   * Starts the game and deals cards to all players
   */
  startGame(deck) {
    // Deal cards to all players
    const playerCount = this.gameState.players.length
    const cardsPerPlayer = Math.floor(deck.length / playerCount)

    const updatedPlayers = []

    for (let i = 0; i < playerCount; i++) {
      const player = this.gameState.players[i]
      const playerCards = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer)

      updatedPlayers.push({
        ...player,
        cardCount: playerCards.length,
        cards: player.isBot ? playerCards : undefined, // Only store cards for bots
      })
    }

    // Update game state
    this.gameState = {
      ...this.gameState,
      players: updatedPlayers,
      gameStage: "playing",
    }

    // Update bot manager
    this.botManager.updateGameState(this.gameState)

    // Notify listeners
    this.onGameStateChange(this.gameState)

    // Start bot turns if a bot goes first
    this.checkForBotTurn()
  }

  /**
   * Handles a player action
   */
  handlePlayerAction(action) {
    // Update game state
    this.gameState = {
      ...this.gameState,
      lastAction: action,
    }

    // Process the action
    this.processAction(action)

    // Update bot manager
    this.botManager.updateGameState(this.gameState)

    // Notify listeners
    this.onGameStateChange(this.gameState)

    // Check if a bot needs to act next
    this.checkForBotTurn()
  }

  /**
   * Processes an action and updates the game state
   */
  processAction(action) {
    switch (action.type) {
      case "place":
        this.processPlaceAction(action)
        break
      case "raise":
        this.processRaiseAction(action)
        break
      case "pass":
        this.processPassAction(action)
        break
    }

    // Check for game end
    this.checkGameEnd()
  }

  /**
   * Processes a 'place' action
   */
  processPlaceAction(action) {
    if (!action.cards || action.cards.length === 0) return

    // Update player's cards
    const playerIndex = this.gameState.players.findIndex((p) => p.id === action.playerId)
    if (playerIndex === -1) return

    const player = this.gameState.players[playerIndex]

    // Remove cards from player's hand
    if (player.isBot && player.cards) {
      const cardIds = action.cards.map((c) => c.id)
      player.cards = player.cards.filter((c) => !cardIds.includes(c.id))
    }

    // Update card count
    const updatedPlayers = [...this.gameState.players]
    updatedPlayers[playerIndex] = {
      ...player,
      cardCount: player.cardCount - action.cards.length,
      cards: player.cards,
    }

    // Add cards to discard pile
    const updatedDiscardPile = [...this.gameState.discardPile, ...action.cards]

    // Move to next player
    const nextPlayerIndex = this.getNextPlayerIndex(playerIndex)

    this.gameState = {
      ...this.gameState,
      players: updatedPlayers,
      currentPlayerId: this.gameState.players[nextPlayerIndex].id,
      discardPile: updatedDiscardPile,
    }
  }

  /**
   * Process a challenge result and announce it
   */
  processChallengeResult(action, wasSuccessful) {
    const speechService = SpeechService.getInstance()

    // Get player names
    const challengerName = this.gameState.players.find((p) => p.id === action.playerId)?.name || "Unknown"
    const targetName = this.gameState.players.find((p) => p.id === action.targetPlayerId)?.name || "Unknown"

    if (wasSuccessful) {
      // Challenge was successful - target was bluffing
      speechService.announceChallengeResult(true, targetName)
    } else {
      // Challenge failed - target was telling the truth
      speechService.announceChallengeResult(false, challengerName)
    }
  }

  /**
   * Processes a 'raise' (challenge) action
   */
  processRaiseAction(action) {
    if (!this.gameState.lastAction || this.gameState.lastAction.type !== "place") return

    const lastAction = this.gameState.lastAction
    const targetPlayerId = lastAction.playerId
    const targetPlayerIndex = this.gameState.players.findIndex((p) => p.id === targetPlayerId)
    if (targetPlayerIndex === -1) return

    const challengerIndex = this.gameState.players.findIndex((p) => p.id === action.playerId)
    if (challengerIndex === -1) return

    // Check if the challenge was successful
    const wasSuccessful = this.checkChallengeSuccess(lastAction)

    // Update the action with the result
    action.wasSuccessful = wasSuccessful
    action.targetPlayerId = targetPlayerId

    // Announce the challenge result
    this.processChallengeResult(action, wasSuccessful)

    const updatedPlayers = [...this.gameState.players]

    if (wasSuccessful) {
      // Challenge succeeded - target player takes the cards
      const targetPlayer = updatedPlayers[targetPlayerIndex]

      // Add cards to target player's hand
      if (targetPlayer.isBot && targetPlayer.cards && lastAction.cards) {
        targetPlayer.cards = [...targetPlayer.cards, ...lastAction.cards]
      }

      updatedPlayers[targetPlayerIndex] = {
        ...targetPlayer,
        cardCount: targetPlayer.cardCount + (lastAction.cards?.length || 0),
      }

      // Remove cards from discard pile
      const discardPile = this.gameState.discardPile.slice(0, -1 * (lastAction.cards?.length || 0))

      this.gameState = {
        ...this.gameState,
        players: updatedPlayers,
        discardPile,
        currentPlayerId: targetPlayerId, // Target player goes next
      }
    } else {
      // Challenge failed - challenger takes the cards
      const challenger = updatedPlayers[challengerIndex]

      // Add cards to challenger's hand
      if (challenger.isBot && challenger.cards && lastAction.cards) {
        challenger.cards = [...challenger.cards, ...lastAction.cards]
      }

      updatedPlayers[challengerIndex] = {
        ...challenger,
        cardCount: challenger.cardCount + (lastAction.cards?.length || 0),
      }

      // Remove cards from discard pile
      const discardPile = this.gameState.discardPile.slice(0, -1 * (lastAction.cards?.length || 0))

      this.gameState = {
        ...this.gameState,
        players: updatedPlayers,
        discardPile,
        currentPlayerId: action.playerId, // Challenger goes next
      }
    }
  }

  /**
   * Processes a 'pass' action
   */
  processPassAction(action) {
    const playerIndex = this.gameState.players.findIndex((p) => p.id === action.playerId)
    if (playerIndex === -1) return

    // Check if all players have passed
    const lastAction = this.gameState.lastAction
    if (lastAction && lastAction.type === "pass") {
      // Count consecutive passes
      let passCount = 1 // Start with this pass
      let currentIndex = playerIndex - 1
      if (currentIndex < 0) currentIndex = this.gameState.players.length - 1

      while (currentIndex !== playerIndex) {
        const player = this.gameState.players[currentIndex]
        const playerLastAction = this.findLastActionByPlayer(player.id)

        if (playerLastAction && playerLastAction.type === "pass") {
          passCount++
        } else {
          break
        }

        currentIndex--
        if (currentIndex < 0) currentIndex = this.gameState.players.length - 1
      }

      // If all players have passed, clear the discard pile and start a new round
      if (passCount >= this.gameState.players.length) {
        this.gameState = {
          ...this.gameState,
          discardPile: [],
          lastAction: null,
        }
      }
    }

    // Move to next player
    const nextPlayerIndex = this.getNextPlayerIndex(playerIndex)

    this.gameState = {
      ...this.gameState,
      currentPlayerId: this.gameState.players[nextPlayerIndex].id,
    }
  }

  /**
   * Checks if a challenge was successful
   */
  checkChallengeSuccess(placeAction) {
    if (!placeAction.cards || !placeAction.bluffText) return false

    // Check if all cards match the claimed value
    for (const card of placeAction.cards) {
      // Jokers can be any value
      if (card.isJoker) continue

      // If any card doesn't match the claimed value, the challenge is successful
      if (card.value !== placeAction.bluffText) {
        return true
      }
    }

    // All cards matched the claimed value, so the challenge failed
    return false
  }

  /**
   * Finds the last action by a specific player
   */
  findLastActionByPlayer(playerId) {
    // Search through game history to find the last action by this player
    // This is a simplified version - in a real implementation, you'd have a proper game history
    if (this.gameState.lastAction && this.gameState.lastAction.playerId === playerId) {
      return this.gameState.lastAction
    }

    return null
  }

  /**
   * Gets the index of the next player
   */
  getNextPlayerIndex(currentIndex) {
    let nextIndex = (currentIndex + 1) % this.gameState.players.length

    // Skip inactive or blacklisted players
    while (!this.gameState.players[nextIndex].isActive || this.gameState.players[nextIndex].isBlacklisted) {
      nextIndex = (nextIndex + 1) % this.gameState.players.length

      // Prevent infinite loop if all players are inactive
      if (nextIndex === currentIndex) break
    }

    return nextIndex
  }

  /**
   * Checks if a bot needs to take a turn
   */
  checkForBotTurn() {
    const currentPlayer = this.gameState.players.find((p) => p.id === this.gameState.currentPlayerId)

    if (currentPlayer && currentPlayer.isBot) {
      // Clear any existing timeouts for this bot
      if (this.botActionTimeouts.has(currentPlayer.id)) {
        clearTimeout(this.botActionTimeouts.get(currentPlayer.id))
      }

      // Add a small delay before the bot acts
      const timeout = setTimeout(
        async () => {
          const botAction = await this.botManager.getBotAction(currentPlayer.id)

          if (botAction) {
            // Notify listeners
            this.onBotAction(currentPlayer.id, botAction)

            // Process the action
            this.handlePlayerAction(botAction)
          }
        },
        1500 + Math.random() * 1500,
      ) // Random delay between 1.5-3 seconds

      this.botActionTimeouts.set(currentPlayer.id, timeout)
    }
  }

  /**
   * Checks if the game has ended
   */
  checkGameEnd() {
    // Check if any player has no cards left
    for (const player of this.gameState.players) {
      if (player.cardCount === 0) {
        this.gameState = {
          ...this.gameState,
          gameStage: "finished",
          winner: player.id,
        }

        // Clear all bot action timeouts
        for (const [_, timeout] of this.botActionTimeouts) {
          clearTimeout(timeout)
        }

        break
      }
    }
  }

  /**
   * Updates a player's activity status
   */
  updatePlayerActivity(playerId, isActive, isBlacklisted = false) {
    const playerIndex = this.gameState.players.findIndex((p) => p.id === playerId)
    if (playerIndex === -1) return

    const updatedPlayers = [...this.gameState.players]
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      isActive,
      isBlacklisted,
    }

    this.gameState = {
      ...this.gameState,
      players: updatedPlayers,
    }

    // If the current player is now inactive, move to the next player
    if (playerId === this.gameState.currentPlayerId && !isActive) {
      const nextPlayerIndex = this.getNextPlayerIndex(playerIndex)
      this.gameState.currentPlayerId = this.gameState.players[nextPlayerIndex].id
    }

    // Update bot manager
    this.botManager.updateGameState(this.gameState)

    // Notify listeners
    this.onGameStateChange(this.gameState)

    // Check if a bot needs to act next
    this.checkForBotTurn()
  }

  /**
   * Cleans up resources when the game ends
   */
  cleanup() {
    // Clear all bot action timeouts
    for (const [_, timeout] of this.botActionTimeouts) {
      clearTimeout(timeout)
    }
    this.botActionTimeouts.clear()
  }
}

