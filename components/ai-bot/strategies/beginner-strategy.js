/**
 * Beginner Strategy for AI Bots
 * Simple decision-making with minimal bluffing and basic challenge logic
 */

export class BeginnerStrategy {
  constructor(personality) {
    this.personality = personality
  }

  /**
   * Decides whether to challenge based on simple heuristics
   */
  decideChallenge(gameState, botCards, memory) {
    const lastAction = gameState.lastAction
    if (!lastAction || lastAction.type !== "place") return false

    // In beginner mode, the bot only rarely attempts to guess (challenge) the bluff
    // Adjust challenge probability based on personality
    const baseChallengeProbability = 0.2
    const adjustedProbability = baseChallengeProbability + (this.personality.challengeProbabilityModifier || 0)

    // If the challenge probability check passes, attempt to challenge
    if (Math.random() < adjustedProbability) {
      return true
    }

    return false
  }

  /**
   * Selects cards to play with simple strategy
   */
  selectCardsAndBluff(gameState, botCards, memory) {
    const lastPlayedValue = gameState.lastAction?.bluffText || null

    // Group cards by value
    const cardGroups = this.groupCardsByValue(botCards)

    // Try to play cards honestly first
    for (const [value, cards] of Object.entries(cardGroups)) {
      if (cards.length > 0) {
        // Beginners usually play 1-2 cards at a time
        const numToPlay = Math.min(cards.length, 1 + Math.floor(Math.random() * 2))
        const selectedCards = cards.slice(0, numToPlay)

        // Decide whether to bluff based on personality
        const baseBluffProb = 0.2
        const adjustedBluffProb = baseBluffProb + (this.personality.bluffProbabilityModifier || 0)
        const shouldBluff = Math.random() < adjustedBluffProb

        if (shouldBluff) {
          // Simple bluffing - just pick a random card value
          const possibleValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
          const bluffValue = possibleValues[Math.floor(Math.random() * possibleValues.length)]
          return { selectedCards, bluffText: bluffValue }
        } else {
          // Tell the truth
          return { selectedCards, bluffText: value }
        }
      }
    }

    // Fallback - just play the first card
    return {
      selectedCards: [botCards[0]],
      bluffText: botCards[0].value,
    }
  }

  /**
   * Groups cards by their value
   */
  groupCardsByValue(cards) {
    const groups = {}

    for (const card of cards) {
      if (!groups[card.value]) {
        groups[card.value] = []
      }
      groups[card.value].push(card)
    }

    return groups
  }
}

