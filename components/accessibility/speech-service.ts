// Speech service for accessibility
export class SpeechService {
  private static instance: SpeechService
  private speechSynthesis: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private enabled = true
  private volume = 1.0
  private rate = 1.0
  private pitch = 1.0
  private preferredVoice: SpeechSynthesisVoice | null = null

  private constructor() {
    this.speechSynthesis = window.speechSynthesis
    this.loadVoices()

    // Try to load voices again if they're not available immediately
    if (this.voices.length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.loadVoices()
      })
    }
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService()
    }
    return SpeechService.instance
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    this.voices = this.speechSynthesis.getVoices()

    // Try to find a good default voice (preferably English)
    this.preferredVoice = this.voices.find((voice) => voice.lang.startsWith("en") && voice.default) || this.voices[0]
  }

  /**
   * Enable or disable speech
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled

    // Announce the change
    if (enabled) {
      this.speak("Screen reader enabled")
    }
  }

  /**
   * Set speech volume (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  public setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(10, rate))
  }

  /**
   * Set speech pitch (0 to 2)
   */
  public setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(2, pitch))
  }

  /**
   * Set preferred voice by name or language
   */
  public setVoice(nameOrLang: string): boolean {
    const voice = this.voices.find((v) => v.name.includes(nameOrLang) || v.lang.includes(nameOrLang))

    if (voice) {
      this.preferredVoice = voice
      return true
    }

    return false
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  /**
   * Speak text
   */
  public speak(text: string, priority = false): void {
    if (!this.enabled || !text) return

    // Cancel current speech if priority is true
    if (priority) {
      this.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)

    // Set voice properties
    utterance.volume = this.volume
    utterance.rate = this.rate
    utterance.pitch = this.pitch

    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice
    }

    this.speechSynthesis.speak(utterance)
  }

  /**
   * Stop all speech
   */
  public stop(): void {
    this.speechSynthesis.cancel()
  }

  /**
   * Pause speech
   */
  public pause(): void {
    this.speechSynthesis.pause()
  }

  /**
   * Resume speech
   */
  public resume(): void {
    this.speechSynthesis.resume()
  }

  /**
   * Check if speech is currently speaking
   */
  public isSpeaking(): boolean {
    return this.speechSynthesis.speaking
  }

  /**
   * Announce a game event
   */
  public announceGameEvent(event: string): void {
    this.speak(event, true)
  }

  /**
   * Announce a player action
   */
  public announcePlayerAction(playerName: string, action: string): void {
    this.speak(`${playerName} ${action}`)
  }

  /**
   * Announce a card placement
   */
  public announceCardPlacement(playerName: string, cardCount: number, cardValue: string): void {
    const cardText = cardCount === 1 ? "card" : "cards"
    this.speak(`${playerName} placed ${cardCount} ${cardText} as ${cardValue}`)
  }

  /**
   * Announce a challenge
   */
  public announceChallenge(challengerName: string, targetName: string): void {
    this.speak(`${challengerName} challenged ${targetName}`, true)
  }

  /**
   * Announce challenge result
   */
  public announceChallengeResult(success: boolean, playerName: string): void {
    if (success) {
      this.speak(`Challenge successful! ${playerName} takes the cards.`)
    } else {
      this.speak(`Challenge failed! ${playerName} takes the cards.`)
    }
  }

  /**
   * Announce player turn
   */
  public announcePlayerTurn(playerName: string): void {
    this.speak(`${playerName}'s turn`)
  }

  /**
   * Announce game winner
   */
  public announceWinner(playerName: string): void {
    this.speak(`Game over! ${playerName} has won the game!`, true)
  }

  /**
   * Announce raise time
   */
  public announceRaiseTime(seconds: number): void {
    this.speak(`Raise time: ${seconds} seconds remaining`)
  }

  /**
   * Announce card selection
   */
  public announceCardSelection(card: string, selected: boolean): void {
    if (selected) {
      this.speak(`${card} selected`)
    } else {
      this.speak(`${card} unselected`)
    }
  }
}

