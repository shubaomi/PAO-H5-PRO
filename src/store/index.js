import { defineStore } from 'pinia'

export const usePokerStore = defineStore('poker', {
  state: () => ({
    shuffledCards: [],
    reconstructedCards: [],
    memoryTime: 0,
    reconstructTime: 0,
    settings: {
      groupSize: 3
    }

  }),
  actions: {
    setShuffledCards(cards) {
      this.shuffledCards = cards
    },
    setReconstructedCards(cards) {
      this.reconstructedCards = cards
    },
    setMemoryTime(time) {
      this.memoryTime = time
    },
    setReconstructTime(time) {
      this.reconstructTime = time
    },
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
    }
  }
})
