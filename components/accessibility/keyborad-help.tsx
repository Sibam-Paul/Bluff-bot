"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Keyboard, X } from "lucide-react"
import { SpeechService } from "../../services/speech-service"

export function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const speechService = SpeechService.getInstance()

  const shortcuts = [
    { key: "Tab", description: "Navigate through cards" },
    { key: "J", description: "Place cards" },
    { key: "F", description: "Challenge" },
    { key: ";", description: "Pass" },
    { key: "H", description: "Say selected cards" },
    { key: "S", description: "Move focus to first card" },
    { key: "L", description: "Move focus to last card" },
    { key: "G", description: "Say last game action" },
    { key: "A", description: "Say all cards as sets" },
    { key: "Backspace", description: "Focus chat input" },
    { key: "Tab", description: "Exit chat input" },
    { key: "F2", description: "Say all keyboard shortcuts" },
    { key: "Hold D", description: "Record voice" },
    { key: "V", description: "Send voice message" },
    { key: "E", description: "Play/pause voice" },
    { key: "O", description: "Play latest voice message" },
    { key: "Y", description: "Play previous audio" },
    { key: "U", description: "Play next audio" },
    { key: "Hold W", description: "Echo test" },
    { key: "X", description: "Exit room" },
    { key: "N", description: "Exit game" },
  ]

  const announceShortcuts = () => {
    const shortcutText = shortcuts.map((s) => `${s.key}: ${s.description}`).join(". ")
    speechService.speak("Keyboard shortcuts: " + shortcutText)
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setIsOpen(true)
          announceShortcuts()
        }}
        aria-label="Keyboard shortcuts"
        className="fixed bottom-4 left-4 z-50"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      {isOpen && (
        <Card
          className="fixed inset-0 z-50 m-4 md:inset-auto md:left-1/2 md:top-1/2 md:w-[500px] md:-translate-x-1/2 md:-translate-y-1/2"
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close keyboard shortcuts">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between border-b py-2">
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-sm">{shortcut.key}</kbd>
                  <span className="text-sm">{shortcut.description}</span>
                </div>
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                announceShortcuts()
              }}
            >
              Read Aloud
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}

