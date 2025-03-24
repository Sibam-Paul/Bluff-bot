// Game type definitions for Accessible-Bluff

export type DifficultyLevel = "beginner" | "intermediate" | "advanced"

export interface Card {
  id: string
  suit: string
  value: string
  isJoker?: boolean
}

export interface PlayerState {
  id: string
  name: string
  cardCount: number
  cards?: Card[]
  isBot?: boolean
  isActive: boolean
  isBlacklisted?: boolean
  isDisconnected?: boolean
}

export interface GameState {
  gameId: string
  players: PlayerState[]
  currentPlayerId: string
  lastAction: BluffAction | null
  discardPile: Card[]
  gameStage: "waiting" | "playing" | "finished"
  winner?: string
}

export interface Player {
  id: string
  name: string
  cards: Card[]
  isActive: boolean
  inactiveRounds: number
}

export type BluffActionType = "place" | "raise" | "pass"

export interface BluffAction {
  type: BluffActionType
  playerId: string
  cards?: Card[]
  bluffText?: string
  targetPlayerId?: string
  wasSuccessful?: boolean
}

