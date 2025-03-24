// Speech service for accessibility
export class SpeechService {
  static instance

  constructor() {
    this.speechSynthesis = window.speechSynthesis
    this.voices = []
    this.enabled = true
    this.volume = 1.0
    this.rate = 1.0
    this.pitch = 1.0
    this.preferredVoice = null

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
  static getInstance() {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService()
    }
    return SpeechService.instance
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.voices = this.speechSynthesis.getVoices()

    // Try to find a good default voice (preferably English)
    this.preferredVoice = this.voices.find((voice) => voice.lang.startsWith("en") && voice.default) || this.voices[0]
  }

  /**
   * Enable or disable speech
   */
  setEnabled(enabled) {
    this.enabled = enabled

    // Announce the change
    if (enabled) {
      this.speak("Screen reader enabled")
    }
  }

  /**
   * Set speech volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  setRate(rate) {
    this.rate = Math.max(0.1, Math.min(10, rate))
  }

  /**
   * Set speech pitch (0 to 2)
   */
  setPitch(pitch) {
    this.pitch = Math.max(0, Math.min(2, pitch))
  }

  /**
   * Set preferred voice by name or language
   */
  setVoice(nameOrLang) {
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
  getVoices() {
    return this.voices
  }

  /**
   * Speak text
   */
  speak(text, priority = false) {
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
  stop() {
    this.speechSynthesis.cancel()
  }

  /**
   * Pause speech
   */
  pause() {
    this.speechSynthesis.pause()
  }

  /**
   * Resume speech
   */
  resume() {
    this.speechSynthesis.resume()
  }

  /**
   * Check if speech is currently speaking
   */
  isSpeaking() {
    return this.speechSynthesis.speaking
  }

  /**
   * Announce a game event
   */
  announceGameEvent(event) {
    this.speak(event, true)
  }

  /**
   * Announce a player action
   */
  announcePlayerAction(playerName, action) {
    this.speak(`${playerName} ${action}`)
  }

  /**
   * Announce a card placement
   */
  announceCardPlacement(playerName, cardCount, cardValue) {
    const cardText = cardCount === 1 ? "card" : "cards"
    this.speak(`${playerName} placed ${cardCount} ${cardText} as ${cardValue}`)
  }

  /**
   * Announce a challenge
   */
  announceChallenge(challengerName, targetName) {
    this.speak(`${challengerName} challenged ${targetName}`, true)
  }

  /**
   * Announce challenge result
   */
  announceChallengeResult(success, playerName) {
    if (success) {
      this.speak(`Challenge successful! ${playerName} takes the cards.`)
    } else {
      this.speak(`Challenge failed! ${playerName} takes the cards.`)
    }
  }

  /**
   * Announce player turn
   */
  announcePlayerTurn(playerName) {
    this.speak(`${playerName}'s turn`)
  }

  /**
   * Announce game winner
   */
  announceWinner(playerName) {
    this.speak(`Game over! ${playerName} has won the game!`, true)
  }

  /**
   * Announce raise time
   */
  announceRaiseTime(seconds) {
    this.speak(`Raise time: ${seconds} seconds remaining`)
  }

  /**
   * Announce card selection
   */
  announceCardSelection(card, selected) {
    if (selected) {
      this.speak(`${card} selected`)
    } else {
      this.speak(`${card} unselected`)
    }
  }
}

