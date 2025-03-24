"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CreateRoomForm({ onCreateRoom }) {
  const [roomName, setRoomName] = useState("")
  const [playerCount, setPlayerCount] = useState(4)
  const [botCount, setBotCount] = useState(0)
  const [botDifficulty, setBotDifficulty] = useState("beginner")

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreateRoom(roomName, playerCount, botCount, botDifficulty)
  }

  // Calculate maximum number of bots based on player count
  const maxBots = Math.max(0, playerCount - 1)

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create Game Room</CardTitle>
          <CardDescription>Set up a new Bluff game room with AI bots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              aria-label="Room name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-count">Total Players (including you)</Label>
            <Select
              value={playerCount.toString()}
              onValueChange={(value) => {
                const newCount = Number.parseInt(value)
                setPlayerCount(newCount)
                // Adjust bot count if needed
                if (botCount > newCount - 1) {
                  setBotCount(newCount - 1)
                }
              }}
            >
              <SelectTrigger id="player-count" aria-label="Select total number of players">
                <SelectValue placeholder="Select player count" />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} players
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-count">Number of AI Bots</Label>
            <Select value={botCount.toString()} onValueChange={(value) => setBotCount(Number.parseInt(value))}>
              <SelectTrigger id="bot-count" aria-label="Select number of AI bots">
                <SelectValue placeholder="Select bot count" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxBots + 1 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i} {i === 1 ? "bot" : "bots"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {botCount > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bot-difficulty">Bot Difficulty</Label>
              <Select value={botDifficulty} onValueChange={(value) => setBotDifficulty(value)}>
                <SelectTrigger id="bot-difficulty" aria-label="Select bot difficulty level">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (Easy)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (Normal)</SelectItem>
                  <SelectItem value="advanced">Advanced (Hard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Create Room
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

