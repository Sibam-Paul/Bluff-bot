"use client"

import { useEffect, useRef, useState } from "react"
import { SpeechService } from "../../services/speech-service"
import { useToast } from "@/hooks/use-toast"

interface KeyboardShortcutsProps {
  cards: any[]
  selectedCards: any[]
  onCardSelect: (card: any) => void
  onPlace: () => void
  onRaise: () => void
  onPass: () => void
  isCurrentPlayerTurn: boolean
  isRaiseTime: boolean
  gameState: any
  exitRoom?: () => void
  exitGame?: () => void
}

export function KeyboardShortcuts({
  cards,
  selectedCards,
  onCardSelect,
  onPlace,
  onRaise,
  onPass,
  isCurrentPlayerTurn,
  isRaiseTime,
  gameState,
  exitRoom,
  exitGame,
}: KeyboardShortcutsProps) {
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audioMessages, setAudioMessages] = useState<{ blob: Blob; url: string }[]>([])
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [echoTesting, setEchoTesting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const echoRef = useRef<MediaRecorder | null>(null)
  const echoAudioRef = useRef<HTMLAudioElement | null>(null)
  const chatInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const speechService = SpeechService.getInstance()

  // Initialize audio elements
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => setIsPlaying(false)

    echoAudioRef.current = new Audio()

    // Create hidden chat input for focus management
    if (!chatInputRef.current) {
      const input = document.createElement("input")
      input.type = "text"
      input.id = "chat-input"
      input.style.position = "absolute"
      input.style.left = "-9999px"
      input.setAttribute("aria-label", "Chat message input")
      document.body.appendChild(input)
      chatInputRef.current = input
    }

    return () => {
      if (chatInputRef.current) {
        document.body.removeChild(chatInputRef.current)
      }
    }
  }, [])

  // Initialize media recorder
  useEffect(() => {
    const initializeMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setAudioChunks((chunks) => [...chunks, e.data])
          }
        }

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
          const audioUrl = URL.createObjectURL(audioBlob)
          setAudioMessages((messages) => [...messages, { blob: audioBlob, url: audioUrl }])
          setAudioChunks([])
          toast({
            title: "Voice message recorded",
            description: "Press 'v' to send or 'o' to play",
          })
        }

        setMediaRecorder(recorder)
      } catch (err) {
        console.error("Error accessing microphone:", err)
        toast({
          title: "Microphone access error",
          description: "Could not access your microphone. Voice features will be disabled.",
          variant: "destructive",
        })
      }
    }

    initializeMediaRecorder()
  }, [toast])

  // Start recording
  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      setRecording(true)
      setAudioChunks([])
      mediaRecorder.start()
      speechService.speak("Recording started")
      toast({
        title: "Recording started",
        description: "Release 'd' to stop recording",
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
      setRecording(false)
      speechService.speak("Recording stopped")
    }
  }

  // Send voice message
  const sendVoiceMessage = () => {
    if (audioMessages.length > 0) {
      const latestMessage = audioMessages[audioMessages.length - 1]
      // Here you would implement sending the voice message to other players
      toast({
        title: "Voice message sent",
        description: "Your voice message has been sent to other players",
      })
      speechService.speak("Voice message sent")
    } else {
      toast({
        title: "No voice message",
        description: "Record a voice message first by holding 'd'",
      })
      speechService.speak("No voice message to send")
    }
  }

  // Play latest voice message
  const playLatestVoice = () => {
    if (audioMessages.length > 0) {
      const latestMessage = audioMessages[audioMessages.length - 1]
      if (audioRef.current) {
        audioRef.current.src = latestMessage.url
        audioRef.current.play()
        setIsPlaying(true)
        setCurrentAudioIndex(audioMessages.length - 1)
        speechService.speak("Playing latest voice message")
      }
    } else {
      speechService.speak("No voice messages to play")
    }
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        speechService.speak("Paused")
      } else if (currentAudioIndex >= 0) {
        audioRef.current.play()
        setIsPlaying(true)
        speechService.speak("Playing")
      } else if (audioMessages.length > 0) {
        // If nothing is currently selected, play the latest
        playLatestVoice()
      }
    }
  }

  // Play previous audio
  const playPreviousAudio = () => {
    if (audioMessages.length > 0 && currentAudioIndex > 0) {
      const newIndex = currentAudioIndex - 1
      if (audioRef.current) {
        audioRef.current.src = audioMessages[newIndex].url
        audioRef.current.play()
        setIsPlaying(true)
        setCurrentAudioIndex(newIndex)
        speechService.speak(`Playing voice message ${newIndex + 1} of ${audioMessages.length}`)
      }
    } else {
      speechService.speak("No previous voice messages")
    }
  }

  // Play next audio
  const playNextAudio = () => {
    if (audioMessages.length > 0 && currentAudioIndex < audioMessages.length - 1) {
      const newIndex = currentAudioIndex + 1
      if (audioRef.current) {
        audioRef.current.src = audioMessages[newIndex].url
        audioRef.current.play()
        setIsPlaying(true)
        setCurrentAudioIndex(newIndex)
        speechService.speak(`Playing voice message ${newIndex + 1} of ${audioMessages.length}`)
      }
    } else {
      speechService.speak("No more voice messages")
    }
  }

  // Start echo test
  const startEchoTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)
        if (echoAudioRef.current) {
          echoAudioRef.current.src = audioUrl
          echoAudioRef.current.play()
        }
      }

      recorder.start()
      echoRef.current = recorder
      setEchoTesting(true)
      speechService.speak("Echo test started")
      toast({
        title: "Echo test started",
        description: "Release 'w' to hear your echo",
      })
    } catch (err) {
      console.error("Error starting echo test:", err)
      toast({
        title: "Echo test error",
        description: "Could not start echo test. Check microphone permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop echo test
  const stopEchoTest = () => {
    if (echoRef.current && echoRef.current.state === "recording") {
      echoRef.current.stop()
      setEchoTesting(false)
      speechService.speak("Echo test stopped")
    }
  }

  // Focus card by index
  const focusCard = (index: number) => {
    const cardElements = document.querySelectorAll("[data-card-id]")
    if (cardElements.length > 0 && index >= 0 && index < cardElements.length) {
      ;(cardElements[index] as HTMLElement).focus()
      const card = cards[index]
      speechService.speak(`Focused on ${card.value} of ${card.suit}`)
    }
  }

  // Say selected cards
  const saySelectedCards = () => {
    if (selectedCards.length === 0) {
      speechService.speak("No cards selected")
    } else {
      const cardText = selectedCards.map((card) => `${card.value} of ${card.suit}`).join(", ")
      speechService.speak(`Selected cards: ${cardText}`)
    }
  }

  // Say last game action
  const sayLastGameAction = () => {
    if (gameState && gameState.lastAction) {
      const action = gameState.lastAction
      const playerName = gameState.players.find((p: any) => p.id === action.playerId)?.name || "Unknown"

      let actionText = ""
      switch (action.type) {
        case "place":
          actionText = `${playerName} placed ${action.cards?.length || 0} cards as ${action.bluffText}`
          break
        case "raise":
          const targetName = gameState.players.find((p: any) => p.id === action.targetPlayerId)?.name || "Unknown"
          actionText = `${playerName} challenged ${targetName}`
          break
        case "pass":
          actionText = `${playerName} passed`
          break
        default:
          actionText = "Unknown action"
      }

      speechService.speak(`Last action: ${actionText}`)
    } else {
      speechService.speak("No previous actions")
    }
  }

  // Say all cards as sets
  const sayAllCardsAsSets = () => {
    // Group cards by value
    const cardGroups: Record<string, any[]> = {}

    cards.forEach((card) => {
      if (!cardGroups[card.value]) {
        cardGroups[card.value] = []
      }
      cardGroups[card.value].push(card)
    })

    // Create announcement text
    let announcement = "Your cards grouped by value: "

    Object.entries(cardGroups).forEach(([value, cards]) => {
      announcement += `${cards.length} ${value}s, `
    })

    speechService.speak(announcement)
  }

  // Announce all keyboard shortcuts
  const announceKeyboardShortcuts = () => {
    const shortcuts = [
      "Tab to navigate through cards",
      "J to place cards",
      "F to challenge",
      "Semicolon to pass",
      "H to hear selected cards",
      "S to focus first card",
      "L to focus last card",
      "G to hear last game action",
      "A to hear all cards grouped by value",
      "Backspace to focus chat input",
      "Tab to exit chat input",
      "F2 to hear these shortcuts",
      "Hold D to record voice",
      "V to send voice message",
      "E to play or pause voice",
      "O to play latest voice message",
      "Y to play previous voice message",
      "U to play next voice message",
      "Hold W for echo test",
      "X to exit room",
      "N to exit game",
    ]

    speechService.speak("Keyboard shortcuts: " + shortcuts.join(". "))
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field (except for our chat input)
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        if (e.key === "Tab" && document.activeElement === chatInputRef.current) {
          e.preventDefault()
          // Exit chat input mode
          document.activeElement.blur()
          speechService.speak("Exited chat input")
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case "j":
          if (isCurrentPlayerTurn && selectedCards.length > 0) {
            onPlace()
            speechService.speak("Placing cards")
          } else {
            speechService.speak("Cannot place cards now")
          }
          break

        case "f":
          if (isRaiseTime) {
            onRaise()
            speechService.speak("Challenging")
          } else {
            speechService.speak("Cannot challenge now")
          }
          break

        case ";":
          if (isCurrentPlayerTurn) {
            onPass()
            speechService.speak("Passing")
          } else {
            speechService.speak("Cannot pass now")
          }
          break

        case "h":
          saySelectedCards()
          break

        case "s":
          focusCard(0)
          break

        case "l":
          focusCard(cards.length - 1)
          break

        case "g":
          sayLastGameAction()
          break

        case "a":
          sayAllCardsAsSets()
          break

        case "backspace":
          if (chatInputRef.current) {
            chatInputRef.current.focus()
            speechService.speak("Chat input focused. Type your message and press Enter to send. Press Tab to exit.")
          }
          break

        case "f2":
          announceKeyboardShortcuts()
          break

        case "d":
          startRecording()
          break

        case "v":
          sendVoiceMessage()
          break

        case "e":
          togglePlayPause()
          break

        case "o":
          playLatestVoice()
          break

        case "y":
          playPreviousAudio()
          break

        case "u":
          playNextAudio()
          break

        case "w":
          startEchoTest()
          break

        case "x":
          if (exitRoom) {
            speechService.speak("Exiting room")
            exitRoom()
          }
          break

        case "n":
          if (exitGame) {
            speechService.speak("Exiting game")
            exitGame()
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "d":
          if (recording) {
            stopRecording()
          }
          break

        case "w":
          if (echoTesting) {
            stopEchoTest()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [
    cards,
    selectedCards,
    onCardSelect,
    onPlace,
    onRaise,
    onPass,
    isCurrentPlayerTurn,
    isRaiseTime,
    gameState,
    recording,
    echoTesting,
    exitRoom,
    exitGame,
  ])

  // Add data-card-id attributes to cards for focus management
  useEffect(() => {
    const addCardAttributes = () => {
      cards.forEach((card, index) => {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`)
        if (!cardElement) {
          const buttons = document.querySelectorAll("button")
          buttons.forEach((button) => {
            if (button.textContent?.includes(card.value) && button.textContent?.includes(card.suit)) {
              button.setAttribute("data-card-id", card.id)
            }
          })
        }
      })
    }

    // Run after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(addCardAttributes, 500)
    return () => clearTimeout(timeoutId)
  }, [cards])

  // Component doesn't render anything visible
  return null
}

