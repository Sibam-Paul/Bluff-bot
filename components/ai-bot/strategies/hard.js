// strategies/hard.js
const hardStrategy = {
  makeMove: (gameState) => {
    const { previousMoves, possibleMoves, opponentBluffPatterns } = gameState

    // Identify bluff patterns and counter them
    const counterMove = opponentBluffPatterns.find((pattern) => possibleMoves.includes(pattern.counterMove))

    if (counterMove) {
      return counterMove.counterMove
    }

    // If no counter-move is found, use the safest option
    return possibleMoves[0]
  },

  shouldChallenge: (gameState, botCards) => {
    if (!gameState.lastAction || gameState.lastAction.type !== "place") return false

    // Get the claimed card value and the number of cards placed
    const claimedValue = gameState.lastAction.bluffText
    const numCardsPlaced = gameState.lastAction.cards.length

    // Advanced bots use sophisticated analysis
    let challengeProbability = 0.4

    // Calculate suspicion level
    const suspicionLevel = calculateSuspicionLevel(claimedValue, numCardsPlaced, gameState, botCards)
    challengeProbability += suspicionLevel * 0.3

    // Check if we have cards of the claimed value
    const cardsOfClaimedValue = botCards.filter((card) => card.value === claimedValue).length
    if (cardsOfClaimedValue > 0) {
      challengeProbability += 0.1 * cardsOfClaimedValue
    }

    // Analyze player history
    if (gameState.previousMoves && gameState.previousMoves.length > 0) {
      const playerMoves = gameState.previousMoves.filter((move) => move.playerId === gameState.lastAction.playerId)

      // Calculate bluff ratio
      const bluffCount = playerMoves.filter((move) => move.wasBluff).length
      const bluffRatio = playerMoves.length > 0 ? bluffCount / playerMoves.length : 0

      challengeProbability += bluffRatio * 0.4
    }

    // Adjust based on game stage
    const gameStage = calculateGameStage(gameState)
    if (gameStage > 0.7) {
      // Late game - challenge more
      challengeProbability += 0.1
    }

    return Math.random() < Math.min(0.9, challengeProbability)
  },

  selectCardsAndBluff: (gameState, botCards) => {
    const lastPlayedValue = gameState.lastAction?.bluffText || null

    // Group cards by value
    const cardGroups = {}
    for (const card of botCards) {
      if (!cardGroups[card.value]) {
        cardGroups[card.value] = []
      }
      cardGroups[card.value].push(card)
    }

    // Calculate the optimal play based on game state
    const gameStage = calculateGameStage(gameState)
    const otherPlayerCards = estimateOtherPlayerCards(gameState, botCards)

    // Early game strategy: try to get rid of singles and pairs
    if (gameStage < 0.3) {
      // Find singles and pairs to play
      const smallGroups = Object.entries(cardGroups)
        .filter(([_, cards]) => cards.length <= 2)
        .sort(([_, cardsA], [__, cardsB]) => cardsA.length - cardsB.length)

      if (smallGroups.length > 0) {
        const [value, cards] = smallGroups[0]
        const selectedCards = [...cards]

        // Decide whether to bluff based on game context
        const shouldBluff = Math.random() < 0.4

        if (shouldBluff || (lastPlayedValue && value !== lastPlayedValue)) {
          const bluffValue = chooseOptimalBluffValue(gameState, otherPlayerCards, botCards)
          return { selectedCards, bluffText: bluffValue }
        } else {
          return { selectedCards, bluffText: value }
        }
      }
    }

    // Mid to late game: more strategic plays
    // Try to play cards that match the last played value if possible
    if (lastPlayedValue && cardGroups[lastPlayedValue] && cardGroups[lastPlayedValue].length > 0) {
      const cardsOfValue = cardGroups[lastPlayedValue]

      // Advanced bots might play more cards at once in later stages
      const numToPlay = Math.min(cardsOfValue.length, 1 + Math.floor(Math.random() * Math.min(3, gameStage * 5)))

      const selectedCards = cardsOfValue.slice(0, numToPlay)

      // Strategic decision to bluff or not
      const shouldBluff = Math.random() < 0.3

      if (shouldBluff) {
        const bluffValue = chooseOptimalBluffValue(gameState, otherPlayerCards, botCards)
        return { selectedCards, bluffText: bluffValue }
      } else {
        return { selectedCards, bluffText: lastPlayedValue }
      }
    }

    // If we need to play something else, find the optimal group
    const valueScores = new Map()

    for (const [value, cards] of Object.entries(cardGroups)) {
      if (cards.length === 0) continue

      // Calculate a score for each card group based on various factors
      let score = cards.length * 2 // Prefer groups with more cards

      // Adjust score based on estimated cards in play
      if (otherPlayerCards[value]) {
        score -= otherPlayerCards[value] * 0.5 // Lower score if many of this value are out
      }

      // Adjust score based on game stage
      if (gameStage > 0.7 && cards.length >= 3) {
        score += 3 // In late game, prefer to get rid of large groups
      }

      valueScores.set(value, score)
    }

    // Sort values by score
    const sortedValues = Array.from(valueScores.entries())
      .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)
      .map(([value, _]) => value)

    if (sortedValues.length > 0) {
      const bestValue = sortedValues[0]

      // Advanced bots might play more cards at once in later stages
      const numToPlay = Math.min(
        cardGroups[bestValue].length,
        1 + Math.floor(Math.random() * Math.min(3, gameStage * 5)),
      )

      const selectedCards = cardGroups[bestValue].slice(0, numToPlay)

      // Strategic decision to bluff or not
      const shouldBluff = Math.random() < 0.6

      if (shouldBluff || (lastPlayedValue && bestValue !== lastPlayedValue)) {
        const bluffValue = lastPlayedValue || chooseOptimalBluffValue(gameState, otherPlayerCards, botCards)
        return { selectedCards, bluffText: bluffValue }
      } else {
        return { selectedCards, bluffText: bestValue }
      }
    }

    // Fallback
    return {
      selectedCards: [botCards[0]],
      bluffText: lastPlayedValue || chooseOptimalBluffValue(gameState, otherPlayerCards, botCards),
    }
  },
}

// Helper functions
function calculateSuspicionLevel(claimedValue, numCardsPlaced, gameState, botCards) {
  // Base suspicion level
  let suspicion = 0.2

  // Increase suspicion if the player placed many cards of the same value
  if (numCardsPlaced >= 3) {
    suspicion += 0.1 * (numCardsPlaced - 2)
  }

  // Increase suspicion if we have cards of the claimed value
  const cardsOfClaimedValue = botCards.filter((card) => card.value === claimedValue).length
  if (cardsOfClaimedValue > 0) {
    suspicion += 0.1 * cardsOfClaimedValue
  }

  // Cap suspicion at 0.8
  return Math.min(suspicion, 0.8)
}

function calculateGameStage(gameState) {
  // Estimate game stage based on cards left
  const initialCardsPerPlayer = 52 / gameState.players.length
  const averageCardsLeft =
    gameState.players.reduce((sum, player) => sum + player.cardCount, 0) / gameState.players.length

  // Game stage from 0 (start) to 1 (end)
  return 1 - averageCardsLeft / initialCardsPerPlayer
}

function estimateOtherPlayerCards(gameState, botCards) {
  const cardCounts = {}
  const cardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

  // Initialize with 4 of each value (standard deck)
  for (const value of cardValues) {
    cardCounts[value] = 4
  }

  // Subtract our own cards
  for (const card of botCards) {
    if (cardCounts[card.value]) {
      cardCounts[card.value]--
    }
  }

  return cardCounts
}

function chooseOptimalBluffValue(gameState, otherPlayerCards, botCards) {
  const cardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

  // Choose one of the top 3 values with some randomness
  const topIndex = Math.min(2, Math.floor(Math.random() * 3))
  return cardValues[Math.floor(Math.random() * cardValues.length)]
}

export default hardStrategy

