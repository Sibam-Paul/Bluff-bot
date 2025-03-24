"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SpeechService } from "../../services/speech-service"
import { Volume2, VolumeX, Settings } from "lucide-react"

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [volume, setVolume] = useState(1.0)
  const [rate, setRate] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState("")

  useEffect(() => {
    // Initialize speech service
    const speechService = SpeechService.getInstance()

    // Load available voices
    const voices = speechService.getVoices()
    setAvailableVoices(voices)

    // Check if voices are loaded, if not, wait for them
    if (voices.length === 0) {
      const handleVoicesChanged = () => {
        const updatedVoices = speechService.getVoices()
        setAvailableVoices(updatedVoices)

        // Set default voice if available
        if (updatedVoices.length > 0) {
          const defaultVoice = updatedVoices.find((v) => v.default)?.name || updatedVoices[0].name
          setSelectedVoice(defaultVoice)
        }
      }

      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged)

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged)
      }
    } else if (voices.length > 0) {
      // Set default voice
      const defaultVoice = voices.find((v) => v.default)?.name || voices[0].name
      setSelectedVoice(defaultVoice)
    }
  }, [])

  // Update speech service when settings change
  useEffect(() => {
    const speechService = SpeechService.getInstance()
    speechService.setEnabled(speechEnabled)
    speechService.setVolume(volume)
    speechService.setRate(rate)
    speechService.setPitch(pitch)

    if (selectedVoice) {
      speechService.setVoice(selectedVoice)
    }
  }, [speechEnabled, volume, rate, pitch, selectedVoice])

  // Test speech
  const testSpeech = () => {
    const speechService = SpeechService.getInstance()
    speechService.speak("This is a test of the screen reader for the Accessible Bluff game.")
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility settings"
        className="fixed bottom-4 right-4 z-50"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-16 right-4 w-80 z-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Accessibility Settings</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility settings"
              >
                &times;
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <Label htmlFor="speech-toggle">Screen Reader</Label>
              </div>
              <Switch
                id="speech-toggle"
                checked={speechEnabled}
                onCheckedChange={setSpeechEnabled}
                aria-label="Toggle screen reader"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume-slider">Volume: {Math.round(volume * 100)}%</Label>
              <Slider
                id="volume-slider"
                min={0}
                max={1}
                step={0.1}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                aria-label="Adjust speech volume"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-slider">Speed: {rate.toFixed(1)}x</Label>
              <Slider
                id="rate-slider"
                min={0.5}
                max={2}
                step={0.1}
                value={[rate]}
                onValueChange={(values) => setRate(values[0])}
                aria-label="Adjust speech rate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitch-slider">Pitch: {pitch.toFixed(1)}</Label>
              <Slider
                id="pitch-slider"
                min={0.5}
                max={1.5}
                step={0.1}
                value={[pitch]}
                onValueChange={(values) => setPitch(values[0])}
                aria-label="Adjust speech pitch"
              />
            </div>

            {availableVoices.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="voice-select">Voice</Label>
                <select
                  id="voice-select"
                  className="w-full p-2 border rounded"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  aria-label="Select voice"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button onClick={testSpeech} className="w-full">
              Test Speech
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

