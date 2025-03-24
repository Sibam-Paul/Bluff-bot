// strategies/medium.js
const mediumStrategy = {
  makeMove: (gameState) => {
    const { previousMoves, possibleMoves } = gameState

    // Analyze the most frequent moves and bluff patterns
    const mostCommonMove = previousMoves.length
      ? previousMoves.reduce((acc, move) => {
          acc[move] = (acc[move] || 0) + 1
          return acc
        }, {})
      : {}

    const bestMove = Object.keys(mostCommonMove).reduce((a, b) => (mostCommonMove[a] > mostCommonMove[b] ? a : b), null)

    return possibleMoves.includes(bestMove) ? bestMove : possibleMoves[0]
  },

  shouldChallenge: (gameState, botCards) => {
    if (!gameState.lastAction || gameState.lastAction.type !== "place") return false

    // Get the claimed card value and the number of cards placed
    const claimedValue = gameState.lastAction.bluffText
    const numCardsPlaced = gameState.lastAction.cards.length

    // Base challenge probability
    let challengeProbability = 0.3

    // Increase probability if many cards were placed
    if (numCardsPlaced >= 3) {
      challengeProbability += 0.1 * (numCardsPlaced - 2)
    }

    // Increase probability if we have cards of the claimed value
    const cardsOfClaimedValue = botCards.filter((card) => card.value === claimedValue).length
    if (cardsOfClaimedValue > 0) {
      challengeProbability += 0.1 * cardsOfClaimedValue
    }

    // Check previous moves for patterns
    if (gameState.previousMoves && gameState.previousMoves.length > 0) {
      const playerMoves = gameState.previousMoves.filter((move) => move.playerId === gameState.lastAction.playerId)

      // If player has bluffed before, increase challenge probability
      if (playerMoves.some((move) => move.wasBluff)) {
        challengeProbability += 0.2
      }
    }

    return Math.random() < challengeProbability
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

    // Try to play cards that match the last played value if possible
    if (lastPlayedValue && cardGroups[lastPlayedValue] && cardGroups[lastPlayedValue].length > 0) {
      const cardsOfValue = cardGroups[lastPlayedValue]
      const numToPlay = Math.min(cardsOfValue.length, 1 + Math.floor(Math.random() * 2))
      const selectedCards = cardsOfValue.slice(0, numToPlay)

      // 30% chance to bluff
      const shouldBluff = Math.random() < 0.3

      if (shouldBluff) {
        // Choose a value close to the actual value
        const cardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
        const actualIndex = cardValues.indexOf(lastPlayedValue)
        if (actualIndex !== -1) {
          // Choose a value 1-2 steps away
          const offset = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
          const targetIndex = Math.max(0, Math.min(cardValues.length - 1, actualIndex + offset))
          return { selectedCards, bluffText: cardValues[targetIndex] }
        } else {
          // Random value
          const bluffValue = cardValues[Math.floor(Math.random() * cardValues.length)]
          return { selectedCards, bluffText: bluffValue }
        }
      } else {
        // Tell the truth
        return { selectedCards, bluffText: lastPlayedValue }
      }
    }

    // If we don't have matching cards, find the group with the most cards
    let bestValue = ""
    let maxCards = 0

    for (const [value, cards] of Object.entries(cardGroups)) {
      if (cards.length > maxCards) {
        maxCards = cards.length
        bestValue = value
      }
    }

    if (bestValue) {
      const numToPlay = Math.min(cardGroups[bestValue].length, 1 + Math.floor(Math.random() * 2))
      const selectedCards = cardGroups[bestValue].slice(0, numToPlay)

      // 50% chance to bluff
      const shouldBluff = Math.random() < 0.5

      if (shouldBluff || (lastPlayedValue && bestValue !== lastPlayedValue)) {
        // If we need to follow the last played value, bluff that value
        const cardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
        const bluffValue = lastPlayedValue || cardValues[Math.floor(Math.random() * cardValues.length)]
        return { selectedCards, bluffText: bluffValue }
      } else {
        // Tell the truth
        return { selectedCards, bluffText: bestValue }
      }
    }

    // Fallback
    return {
      selectedCards: [botCards[0]],
      bluffText: lastPlayedValue || botCards[0].value,
    }
  },
}

export default mediumStrategy

