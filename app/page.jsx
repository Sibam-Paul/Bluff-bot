"use client"

import { useState } from "react"
import { CreateRoomForm } from "@/components/game-room/create-room-form"
import { GamePage } from "@/components/game-room/game-page"
// Add import for AccessibilityControls
import { AccessibilityControls } from "@/components/accessibility/accessibility-controls"

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameConfig, setGameConfig] = useState({
    roomId: "",
    roomName: "",
    userId: "",
    userName: "",
    botCount: 0,
    botDifficulty: "beginner",
  })

  const handleCreateRoom = (roomName, playerCount, botCount, botDifficulty) => {
    // In a real app, you would create a room on the server
    // For this example, we'll just generate a random room ID
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`
    const userId = `user-${Math.random().toString(36).substring(2, 9)}`
    const userName = "Player" // In a real app, this would come from authentication

    setGameConfig({
      roomId,
      roomName,
      userId,
      userName,
      botCount,
      botDifficulty,
    })

    setGameStarted(true)
  }

  // Modify the return statement to include AccessibilityControls
  return (
    <main className="min-h-screen p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Accessible Bluff Card Game</h1>

        {!gameStarted ? (
          <div className="max-w-md mx-auto">
            <CreateRoomForm onCreateRoom={handleCreateRoom} />
          </div>
        ) : (
          <GamePage
            roomId={gameConfig.roomId}
            roomName={gameConfig.roomName}
            userId={gameConfig.userId}
            userName={gameConfig.userName}
            botCount={gameConfig.botCount}
            botDifficulty={gameConfig.botDifficulty}
          />
        )}

        {/* Add AccessibilityControls */}
        {!gameStarted && <AccessibilityControls />}
      </div>
    </main>
  )
}

