// strategies/easy.js
const easyStrategy = {
  makeMove: (gameState) => {
    const randomMove = gameState.possibleMoves[Math.floor(Math.random() * gameState.possibleMoves.length)]
    return randomMove || "pass"
  },

  shouldChallenge: (gameState) => {
    // Easy bots only challenge 20% of the time, regardless of the situation
    return Math.random() < 0.2
  },

  selectCardsAndBluff: (gameState, botCards) => {
    // Group cards by value
    const cardGroups = {}
    for (const card of botCards) {
      if (!cardGroups[card.value]) {
        cardGroups[card.value] = []
      }
      cardGroups[card.value].push(card)
    }

    // Pick a random group of cards
    const values = Object.keys(cardGroups)
    if (values.length === 0) return { selectedCards: [], bluffText: "" }

    const randomValue = values[Math.floor(Math.random() * values.length)]
    const cards = cardGroups[randomValue]

    // Play 1-2 cards
    const numToPlay = Math.min(cards.length, 1 + Math.floor(Math.random() * 2))
    const selectedCards = cards.slice(0, numToPlay)

    // 20% chance to bluff
    const shouldBluff = Math.random() < 0.2
    if (shouldBluff) {
      const possibleValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
      const bluffValue = possibleValues[Math.floor(Math.random() * possibleValues.length)]
      return { selectedCards, bluffText: bluffValue }
    } else {
      return { selectedCards, bluffText: randomValue }
    }
  },
}

export default easyStrategy

