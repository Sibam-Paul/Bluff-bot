/**
 * AI Bot Personalities for Accessible-Bluff game
 * Defines different playstyles that affect decision-making
 */

export const Personalities = {
  // Aggressive bots bluff more often and challenge frequently
  AGGRESSIVE: {
    name: "Aggressive",
    description: "Bluffs often and challenges frequently",
    bluffProbabilityModifier: 0.3, // Increases base bluff probability
    challengeProbabilityModifier: 0.25, // Increases challenge probability
    multiCardPlayModifier: 0.2, // More likely to play multiple cards
    riskTolerance: 0.8, // High tolerance for risky plays
    adaptiveRate: 0.15, // Adapts strategy moderately
    voiceLines: {
      place: ["Boom! Take that!", "Watch this move!", "Try to beat that!"],
      challenge: ["I don't believe you!", "You're bluffing!", "Caught you!"],
      pass: ["I'll wait for now.", "Just watching for now.", "I'll get you next time."],
      win: ["Crushed it!", "Too easy!", "Better luck next time!"],
      lose: ["Impossible!", "Just got unlucky.", "Next time I'll get you."],
    },
  },

  // Cautious bots rarely bluff and only challenge when confident
  CAUTIOUS: {
    name: "Cautious",
    description: "Rarely bluffs and challenges only when confident",
    bluffProbabilityModifier: -0.2, // Decreases base bluff probability
    challengeProbabilityModifier: -0.15, // Decreases challenge probability
    multiCardPlayModifier: -0.1, // Less likely to play multiple cards
    riskTolerance: 0.3, // Low tolerance for risky plays
    adaptiveRate: 0.2, // Adapts strategy more quickly
    voiceLines: {
      place: ["I think this works.", "Let me try this.", "This seems safe."],
      challenge: [
        "I'm quite certain you're bluffing.",
        "The odds suggest you're not truthful.",
        "I've been tracking the cards...",
      ],
      pass: ["I'll pass for now.", "Not worth the risk.", "I need more information."],
      win: ["A careful strategy pays off.", "Patience is key.", "Calculated moves win games."],
      lose: ["I miscalculated.", "I need to reassess my approach.", "Back to the drawing board."],
    },
  },

  // Balanced bots use a mix of strategies
  BALANCED: {
    name: "Balanced",
    description: "Uses a mix of bluffing and honest play",
    bluffProbabilityModifier: 0.0, // Neutral bluff probability
    challengeProbabilityModifier: 0.0, // Neutral challenge probability
    multiCardPlayModifier: 0.0, // Standard card play behavior
    riskTolerance: 0.5, // Moderate tolerance for risky plays
    adaptiveRate: 0.25, // Adapts strategy quickly
    voiceLines: {
      place: ["Here's my play.", "Let's see how this goes.", "A solid move."],
      challenge: ["I'm calling your bluff.", "That doesn't add up.", "I'm challenging that."],
      pass: ["I'll pass.", "Not this time.", "Moving on."],
      win: ["Good game!", "That worked out well.", "A balanced approach wins."],
      lose: ["Well played.", "I'll adjust my strategy.", "Good game, everyone."],
    },
  },

  // Unpredictable bots have highly variable behavior
  UNPREDICTABLE: {
    name: "Unpredictable",
    description: "Behavior varies wildly from round to round",
    bluffProbabilityModifier: 0.1, // Slightly increased bluff probability
    challengeProbabilityModifier: 0.1, // Slightly increased challenge probability
    multiCardPlayModifier: 0.1, // Slightly more likely to play multiple cards
    riskTolerance: 0.6, // Moderate-high tolerance for risky plays
    adaptiveRate: 0.1, // Adapts strategy slowly
    randomnessFactor: 0.4, // High randomness in decisions
    voiceLines: {
      place: ["Hmm, what about this?", "Let's try something different.", "This might be interesting."],
      challenge: ["Wait a minute!", "Something's fishy here.", "Let's see what you really have!"],
      pass: ["Not yet...", "I'll wait.", "Passing for now."],
      win: ["Surprise!", "Bet you didn't see that coming!", "Unpredictability for the win!"],
      lose: ["Well that was unexpected.", "Interesting outcome.", "The dice didn't roll my way."],
    },
  },
}

/**
 * Assigns a random personality to a bot
 */
export function getRandomPersonality() {
  const personalities = Object.values(Personalities)
  return personalities[Math.floor(Math.random() * personalities.length)]
}

/**
 * Gets a personality based on difficulty level
 */
export function getPersonalityForDifficulty(difficultyLevel) {
  // For each difficulty level, we'll have a different distribution of personalities
  switch (difficultyLevel) {
    case "beginner":
      // Beginners are more likely to be cautious or balanced
      const beginnerDistribution = [
        Personalities.CAUTIOUS,
        Personalities.CAUTIOUS,
        Personalities.BALANCED,
        Personalities.AGGRESSIVE,
      ]
      return beginnerDistribution[Math.floor(Math.random() * beginnerDistribution.length)]

    case "intermediate":
      // Intermediate bots have a more even distribution
      return getRandomPersonality()

    case "advanced":
      // Advanced bots are more likely to be aggressive or unpredictable
      const advancedDistribution = [
        Personalities.AGGRESSIVE,
        Personalities.AGGRESSIVE,
        Personalities.BALANCED,
        Personalities.UNPREDICTABLE,
        Personalities.UNPREDICTABLE,
      ]
      return advancedDistribution[Math.floor(Math.random() * advancedDistribution.length)]

    default:
      return getRandomPersonality()
  }
}

