"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GameController } from "./game-controller"
import { useToast } from "@/hooks/use-toast"

// Add imports for speech service
import { SpeechService } from "../../services/speech-service"
import { AccessibilityControls } from "../accessibility/accessibility-controls"

export function GamePage({ roomId, roomName, userId, userName, botCount, botDifficulty }) {
  const [gameState, setGameState] = useState(null)
  const [selectedCards, setSelectedCards] = useState([])
  const [bluffText, setBluffText] = useState("")
  const [showBluffInput, setShowBluffInput] = useState(false)
  const [isRaiseTime, setIsRaiseTime] = useState(false)
  const [raiseTimeRemaining, setRaiseTimeRemaining] = useState(9)
  const [playerCards, setPlayerCards] = useState([])
  const [gameController, setGameController] = useState(null)
  const { toast } = useToast()

  // Initialize game
  useEffect(() => {
    // Initialize speech service
    const speechService = SpeechService.getInstance()

    // Create initial game state
    const initialGameState = {
      gameId: roomId,
      players: [
        {
          id: userId,
          name: userName,
          cardCount: 0,
          isActive: true,
        },
      ],
      currentPlayerId: userId,
      lastAction: null,
      discardPile: [],
      gameStage: "waiting",
    }

    // Create game controller
    const controller = new GameController(
      initialGameState,
      botCount,
      botDifficulty,
      handleGameStateChange,
      handleBotAction,
    )

    setGameController(controller)

    // Create and shuffle deck
    const deck = createDeck()
    shuffleDeck(deck)

    // Deal cards to player
    const playerCards = dealCards(deck, botCount + 1)
    setPlayerCards(playerCards)

    // Start game
    controller.startGame(deck)

    // Announce game start
    speechService.speak(
      `Game started. ${botCount} bots with ${botDifficulty} difficulty. You have ${playerCards.length} cards.`,
    )

    // Cleanup on unmount
    return () => {
      controller.cleanup()
    }
  }, [roomId, roomName, userId, userName, botCount, botDifficulty])

  // Handle game state changes
  const handleGameStateChange = (newState) => {
    setGameState(newState)

    const speechService = SpeechService.getInstance()

    // Announce current player's turn
    if (newState.currentPlayerId !== gameState?.currentPlayerId) {
      const currentPlayerName = newState.players.find((p) => p.id === newState.currentPlayerId)?.name || "Unknown"
      speechService.announcePlayerTurn(currentPlayerName)
    }

    // Check if the game has ended
    if (newState.gameStage === "finished" && newState.winner) {
      const winnerName = newState.players.find((p) => p.id === newState.winner)?.name || "Unknown"
      speechService.announceWinner(winnerName)

      toast({
        title: "Game Over",
        description: `${winnerName} has won the game!`,
        duration: 5000,
      })
    }
  }

  // Handle bot actions
  const handleBotAction = (botId, action) => {
    const botName = gameState?.players.find((p) => p.id === botId)?.name || "Bot"
    const speechService = SpeechService.getInstance()

    switch (action.type) {
      case "place":
        speechService.announceCardPlacement(botName, action.cards?.length || 0, action.bluffText || "")

        toast({
          title: `${botName} placed cards`,
          description: `${botName} placed ${action.cards?.length || 0} cards as ${action.bluffText}`,
          duration: 3000,
        })

        // Start raise time
        setIsRaiseTime(true)
        setRaiseTimeRemaining(9)

        // Announce raise time
        speechService.announceRaiseTime(9)

        // Set a timer to end raise time
        setTimeout(() => {
          setIsRaiseTime(false)
        }, 9000)
        break

      case "raise":
        speechService.announceChallenge(
          botName,
          gameState?.lastAction?.playerId
            ? gameState.players.find((p) => p.id === gameState.lastAction?.playerId)?.name || "Unknown"
            : "Unknown",
        )

        toast({
          title: `${botName} challenged!`,
          description: `${botName} thinks someone is bluffing`,
          duration: 3000,
        })
        break

      case "pass":
        speechService.announcePlayerAction(botName, "passed")

        toast({
          title: `${botName} passed`,
          description: `${botName} chose to pass their turn`,
          duration: 2000,
        })
        break
    }
  }

  // Create a standard deck of cards
  const createDeck = () => {
    const suits = ["hearts", "diamonds", "clubs", "spades"]
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    const deck = []

    let id = 1
    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          id: `card-${id++}`,
          suit,
          value,
        })
      }
    }

    // Add jokers
    deck.push({
      id: `card-${id++}`,
      suit: "joker",
      value: "joker",
      isJoker: true,
    })

    deck.push({
      id: `card-${id++}`,
      suit: "joker",
      value: "joker",
      isJoker: true,
    })

    return deck
  }

  // Shuffle the deck
  const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
  }

  // Deal cards to players
  const dealCards = (deck, playerCount) => {
    const cardsPerPlayer = Math.floor(deck.length / playerCount)
    return deck.slice(0, cardsPerPlayer)
  }

  // Handle card selection
  const handleCardSelect = (card) => {
    if (gameState?.currentPlayerId !== userId) return

    const speechService = SpeechService.getInstance()
    const isSelected = selectedCards.some((c) => c.id === card.id)

    if (isSelected) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id))
      speechService.announceCardSelection(`${card.value} of ${card.suit}`, false)
    } else {
      setSelectedCards([...selectedCards, card])
      speechService.announceCardSelection(`${card.value} of ${card.suit}`, true)
    }
  }

  // Handle place action
  const handlePlace = () => {
    if (!gameState || selectedCards.length === 0) return

    const speechService = SpeechService.getInstance()

    // If this is the first play in a round, show bluff text input
    if (!gameState.lastAction || gameState.lastAction.type === "pass") {
      setShowBluffInput(true)
      speechService.speak("Select the card value you want to claim")
    } else {
      // Otherwise, use the last bluff text
      const action = {
        type: "place",
        playerId: userId,
        cards: selectedCards,
        bluffText: gameState.lastAction.bluffText,
      }

      // Remove selected cards from player's hand
      setPlayerCards(playerCards.filter((card) => !selectedCards.some((c) => c.id === card.id)))
      setSelectedCards([])

      // Announce the action
      speechService.announceCardPlacement("You", action.cards.length, action.bluffText || "")

      // Send action to game controller
      gameController?.handlePlayerAction(action)

      // Start raise time
      setIsRaiseTime(true)
      setRaiseTimeRemaining(9)

      // Announce raise time
      speechService.announceRaiseTime(9)

      // Set a timer to end raise time
      setTimeout(() => {
        setIsRaiseTime(false)
      }, 9000)
    }
  }

  // Handle bluff text submission
  const handleBluffSubmit = () => {
    if (!gameState || selectedCards.length === 0 || !bluffText) return

    const speechService = SpeechService.getInstance()

    const action = {
      type: "place",
      playerId: userId,
      cards: selectedCards,
      bluffText,
    }

    // Remove selected cards from player's hand
    setPlayerCards(playerCards.filter((card) => !selectedCards.some((c) => c.id === card.id)))
    setSelectedCards([])
    setBluffText("")
    setShowBluffInput(false)

    // Announce the action
    speechService.announceCardPlacement("You", action.cards.length, action.bluffText)

    // Send action to game controller
    gameController?.handlePlayerAction(action)

    // Start raise time
    setIsRaiseTime(true)
    setRaiseTimeRemaining(9)

    // Announce raise time
    speechService.announceRaiseTime(9)

    // Set a timer to end raise time
    setTimeout(() => {
      setIsRaiseTime(false)
    }, 9000)
  }

  // Handle raise (challenge) action
  const handleRaise = () => {
    if (!gameState || !gameState.lastAction || gameState.lastAction.type !== "place") return

    const speechService = SpeechService.getInstance()
    const targetPlayerName = gameState.players.find((p) => p.id === gameState.lastAction?.playerId)?.name || "Unknown"

    const action = {
      type: "raise",
      playerId: userId,
    }

    // Announce the challenge
    speechService.announceChallenge("You", targetPlayerName)

    // Send action to game controller
    gameController?.handlePlayerAction(action)

    // End raise time
    setIsRaiseTime(false)
  }

  // Handle pass action
  const handlePass = () => {
    if (!gameState) return

    const speechService = SpeechService.getInstance()

    const action = {
      type: "pass",
      playerId: userId,
    }

    // Announce the pass
    speechService.announcePlayerAction("You", "passed")

    // Send action to game controller
    gameController?.handlePlayerAction(action)
  }

  // Countdown timer for raise time
  useEffect(() => {
    let interval

    if (isRaiseTime) {
      interval = setInterval(() => {
        setRaiseTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setIsRaiseTime(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRaiseTime])

  // Render loading state
  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading game...</p>
      </div>
    )
  }

  // Get current player
  const isCurrentPlayerTurn = gameState.currentPlayerId === userId
  const currentPlayerName = gameState.players.find((p) => p.id === gameState.currentPlayerId)?.name || "Unknown"

  // Add the AccessibilityControls component to the return statement at the end
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4" aria-live="polite">
        {roomName} - Accessible Bluff Game
      </h1>

      {/* Player information */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {gameState.players.map((player) => (
          <Card
            key={player.id}
            className={`${player.id === gameState.currentPlayerId ? "border-green-500 border-2" : ""} 
                       ${player.isBlacklisted ? "bg-red-100" : ""} 
                       ${player.isDisconnected ? "bg-yellow-100" : ""}`}
          >
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>
                  {player.name} {player.isBot ? "(Bot)" : ""}
                </span>
                <span>{player.cardCount} cards</span>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Game status */}
      <div className="mb-6 text-center" aria-live="assertive">
        <p className="text-lg font-semibold">
          {isCurrentPlayerTurn ? "It's your turn!" : `Waiting for ${currentPlayerName} to play`}
        </p>

        {gameState.lastAction && gameState.lastAction.type === "place" && (
          <p>
            Last play: {gameState.lastAction.cards?.length || 0} cards as {gameState.lastAction.bluffText}
          </p>
        )}

        {isRaiseTime && (
          <div className="mt-2">
            <p className="text-red-500 font-bold">Raise time: {raiseTimeRemaining} seconds remaining</p>
          </div>
        )}
      </div>

      {/* Player's cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Cards ({playerCards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {playerCards.map((card) => (
              <button
                key={card.id}
                className={`p-2 border rounded-md ${
                  selectedCards.some((c) => c.id === card.id) ? "bg-green-100 border-green-500" : "bg-white"
                }`}
                onClick={() => handleCardSelect(card)}
                disabled={!isCurrentPlayerTurn}
                aria-label={`${card.value} of ${card.suit} ${selectedCards.some((c) => c.id === card.id) ? "selected" : ""}`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">{card.value}</div>
                  <div className="text-xs">{card.suit}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={handlePlace} disabled={!isCurrentPlayerTurn || selectedCards.length === 0} className="w-24">
          Place
        </Button>

        <Button
          onClick={handleRaise}
          disabled={!isRaiseTime || gameState.currentPlayerId === userId}
          className="w-24 bg-red-500 hover:bg-red-600"
        >
          Challenge
        </Button>

        <Button onClick={handlePass} disabled={!isCurrentPlayerTurn} className="w-24 bg-gray-500 hover:bg-gray-600">
          Pass
        </Button>
      </div>

      {/* Bluff text input */}
      {showBluffInput && (
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-2">Enter Bluff Text</h3>
          <p className="mb-2">What card value do you want to claim these are?</p>
          <div className="flex gap-2 flex-wrap">
            {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map((value) => (
              <Button
                key={value}
                variant={bluffText === value ? "default" : "outline"}
                onClick={() => setBluffText(value)}
                className="w-12"
                aria-label={`Select ${value} as bluff value`}
              >
                {value}
              </Button>
            ))}
          </div>
          <Button onClick={handleBluffSubmit} disabled={!bluffText} className="mt-4">
            Confirm
          </Button>
        </div>
      )}

      {/* Accessibility Controls */}
      <AccessibilityControls />
    </div>
  )
}

