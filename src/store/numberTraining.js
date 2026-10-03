import { defineStore } from 'pinia';

export const useNumberTrainingStore = defineStore('numberTraining', {
  state: () => ({
    settings: {
      length: 40,
      duration: 5, // in minutes
      mode: 'random', // 'random' or 'no-repeat'
      groupSize: 6 // digits per group separator
    },

    generatedNumber: '',
    userInput: '',
    timer: {
      startTime: 0,
      remainingTime: 0,
      isActive: false,
      isPaused: false
    },
    trainingStatus: 'idle', // idle, memorizing, recalling, finished
    results: {
      correctCount: 0,
      errorCount: 0,
      accuracy: 0,
      score: 0,

      memoryTimeMs: 0,
      recallTimeMs: 0,
      totalTimeMs: 0,

      comparison: [] // { char, status: 'correct' | 'incorrect' | 'missing' | 'extra' }
    }
  }),
  actions: {
    // Actions to generate number, start/stop timer, calculate results, etc.
  }
});