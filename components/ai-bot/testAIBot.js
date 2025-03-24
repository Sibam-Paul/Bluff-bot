import { BotPlayer } from "./bot-player.js"

// Create test game state
const createTestGameState = () => {
  return {
    gameId: "test-game",
    players: [
      { id: "bot-1", name: "Bot 1", cardCount: 5, isActive: true },
      { id: "player-1", name: "Player 1", cardCount: 5, isActive: true },
    ],
    currentPlayerId: "bot-1",
    lastAction: {
      type: "place",
      playerId: "player-1",
      cards: [
        { id: "card-1", suit: "hearts", value: "A" },
        { id: "card-2", suit: "diamonds", value: "A" },
      ],
      bluffText: "A",
    },
    discardPile: [],
    gameStage: "playing",
    previousMoves: [],
    possibleMoves: ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"],
    opponentBluffPatterns: [],
  }
}

// Create test cards
const createTestCards = () => {
  return [
    { id: "card-3", suit: "clubs", value: "K" },
    { id: "card-4", suit: "spades", value: "K" },
    { id: "card-5", suit: "hearts", value: "Q" },
    { id: "card-6", suit: "diamonds", value: "10" },
    { id: "card-7", suit: "clubs", value: "7" },
  ]
}

// Test bot actions
const testBotActions = async () => {
  console.log("Testing bot actions...")

  // Create bots with different difficulty levels
  const easyBot = new BotPlayer("bot-1", "Easy Bot", "beginner")
  const mediumBot = new BotPlayer("bot-1", "Medium Bot", "intermediate")
  const hardBot = new BotPlayer("bot-1", "Hard Bot", "advanced")

  // Set test cards
  easyBot.cards = createTestCards()
  mediumBot.cards = createTestCards()
  hardBot.cards = createTestCards()

  // Create test game state
  const gameState = createTestGameState()

  // Test each bot's action
  console.log("Easy Bot:")
  const easyAction = await easyBot.decideAction(gameState)
  console.log(easyAction)

  console.log("\nMedium Bot:")
  const mediumAction = await mediumBot.decideAction(gameState)
  console.log(mediumAction)

  console.log("\nHard Bot:")
  const hardAction = await hardBot.decideAction(gameState)
  console.log(hardAction)

  // Test challenge behavior
  console.log("\nTesting challenge behavior...")

  // Create a game state with a suspicious last action
  const challengeGameState = {
    ...gameState,
    currentPlayerId: "player-1", // Not the bot's turn
    lastAction: {
      type: "place",
      playerId: "player-1",
      cards: [
        { id: "card-1", suit: "hearts", value: "2" },
        { id: "card-2", suit: "diamonds", value: "3" },
        { id: "card-3", suit: "clubs", value: "4" },
      ],
      bluffText: "A", // Claiming these are all Aces (suspicious)
    },
  }

  // Test each bot's challenge decision
  console.log("Easy Bot Challenge Decision:")
  const easyChallenge = await easyBot.decideAction(challengeGameState)
  console.log(easyChallenge)

  console.log("\nMedium Bot Challenge Decision:")
  const mediumChallenge = await mediumBot.decideAction(challengeGameState)
  console.log(mediumChallenge)

  console.log("\nHard Bot Challenge Decision:")
  const hardChallenge = await hardBot.decideAction(challengeGameState)
  console.log(hardChallenge)
}

// Run the tests
if (typeof window !== "undefined") {
  window.runBotTests = testBotActions
} else {
  testBotActions()
}

export default testBotActions

