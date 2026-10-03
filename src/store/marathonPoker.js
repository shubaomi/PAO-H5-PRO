import { defineStore } from 'pinia'

const suits = ['spade', 'heart', 'club', 'diamond']
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const suitCodeMap = {
  spade: 'S',
  heart: 'H',
  club: 'C',
  diamond: 'D'
}

const createRawDeck = () => {
  const deck = []
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const rankCode = rank === '10' ? '10' : rank[0]
      const code = `${rankCode}${suitCodeMap[suit]}`
      deck.push({ suit, rank, code })
    })
  })
  return deck
}

const createSeededRandom = (seed) => {
  let seedNum = 0
  for (let i = 0; i < seed.length; i++) {
    seedNum += seed.charCodeAt(i) * (i + 1)
  }
  return () => {
    seedNum = (seedNum * 9301 + 49297) % 233280
    return seedNum / 233280
  }
}

const shuffleWithSeed = (array, seed) => {
  const arr = [...array]
  const random = createSeededRandom(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

const createDeckState = (id, seed, cards) => ({
  id,
  seed,
  cards,
  memorized: false,
  reconstructRow: new Array(52).fill(null),
  reconstructed: false,
  reconstructElapsedMs: 0,
  reconstructStartTime: 0
})

export const useMarathonPokerStore = defineStore('marathonPoker', {
  state: () => ({
    phase: 'settings',
    settings: {
      totalDecks: 2,
      groupSize: 3,
      memoryDuration: 0
    },

    decks: [],
    currentDeckIndex: 0,

    memoryGlobalStart: 0,
    memoryGlobalEnd: 0,

    reconstructGlobalStart: 0,
    reconstructGlobalEnd: 0,

    // 复原阶段全局计时（用于页面实时展示）
    reconstructCurrentTime: 0,
    reconstructTimerInterval: null,

    activeReconstructDeckId: '',

    deckResults: [],
    aggregateResult: null
  }),

  getters: {
    currentDeck(state) {
      if (!state.decks.length) return null
      return state.decks[state.currentDeckIndex] || null
    },

    isAllDecksMemorized(state) {
      return state.decks.length > 0 && state.decks.every(d => d.memorized)
    },

    isAllDecksReconstructed(state) {
      return state.decks.length > 0 && state.decks.every(d => d.reconstructed)
    },

    memoryProgress(state) {
      const completed = state.decks.filter(d => d.memorized).length
      const total = state.settings.totalDecks
      return {
        completed,
        total,
        percent: total > 0 ? (completed / total) * 100 : 0
      }
    },

    reconstructProgress(state) {
      const completed = state.decks.filter(d => d.reconstructed).length
      const total = state.settings.totalDecks
      return {
        completed,
        total,
        percent: total > 0 ? (completed / total) * 100 : 0
      }
    }
  },

  actions: {
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
    },

    initDecks(totalDecks, seedStrategy = 'random') {
      const validTotalDecks = Math.max(2, Math.min(10, Number(totalDecks) || 2))
      this.settings.totalDecks = validTotalDecks

      this.decks = []
      this.currentDeckIndex = 0
      this.phase = 'settings'

      this.memoryGlobalStart = 0
      this.memoryGlobalEnd = 0

      this.reconstructGlobalStart = 0
      this.reconstructGlobalEnd = 0
      this.reconstructCurrentTime = 0
      this.stopReconstructTimer()

      this.activeReconstructDeckId = ''
      this.deckResults = []
      this.aggregateResult = null

      for (let i = 0; i < validTotalDecks; i++) {
        const id = `deck-${i + 1}`
        const seed = seedStrategy === 'random'
          ? Math.random().toString(36).slice(2, 10)
          : `seed-${i + 1}`
        const raw = createRawDeck()
        const cards = shuffleWithSeed(raw, seed)
        this.decks.push(createDeckState(id, seed, cards))
      }
    },

    startMemorize() {
      if (!this.decks.length) {
        this.initDecks(this.settings.totalDecks, 'random')
      }
      this.phase = 'memorize'
      if (!this.memoryGlobalStart) this.memoryGlobalStart = Date.now()
      this.memoryGlobalEnd = 0
    },

    switchToMemoryDeck(index) {
      const idx = Number(index)
      if (Number.isNaN(idx)) return
      if (this.phase !== 'memorize') return
      if (idx < 0 || idx >= this.decks.length) return
      this.currentDeckIndex = idx
    },

    memorizeCompleteCurrentDeck() {
      if (this.phase !== 'memorize') return
      const deck = this.currentDeck
      if (!deck) return

      deck.memorized = true

      const nextIndex = this.decks.findIndex(d => !d.memorized)
      // 记忆阶段全局计时仅在“进入复原阶段”点击时停止
      if (nextIndex === -1) return

      this.currentDeckIndex = nextIndex
    },

    startReconstruct() {
      if (this.phase === 'reconstruct') return
      if (!this.isAllDecksMemorized) return

      this.phase = 'reconstruct'
      if (!this.reconstructGlobalStart) this.reconstructGlobalStart = Date.now()
      this.reconstructGlobalEnd = 0

      // 默认从第 1 副开始复原
      this.currentDeckIndex = 0
      if (this.decks[0]) {
        this._activateReconstructDeck(this.decks[0].id)
      }

      // 启动复原阶段全局计时（切换副牌不中断）
      this.reconstructCurrentTime = 0
      this.stopReconstructTimer()
      this.reconstructTimerInterval = setInterval(() => {
        if (!this.reconstructGlobalStart) return
        const end = this.reconstructGlobalEnd || Date.now()
        this.reconstructCurrentTime = Math.max(0, end - this.reconstructGlobalStart)
      }, 1000)
    },

    stopReconstructTimer() {
      if (this.reconstructTimerInterval) clearInterval(this.reconstructTimerInterval)
      this.reconstructTimerInterval = null
    },

    formatTime(ms) {
      const totalSeconds = Math.floor((Number(ms) || 0) / 1000)
      const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
      const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
      const seconds = (totalSeconds % 60).toString().padStart(2, '0')
      return `${hours}:${minutes}:${seconds}`
    },

    switchToReconstructDeck(deckIndex) {
      if (this.phase !== 'reconstruct') return
      const idx = Number(deckIndex)
      if (Number.isNaN(idx)) return
      if (idx < 0 || idx >= this.decks.length) return

      this._pauseActiveReconstructDeck()
      this.currentDeckIndex = idx
      this._activateReconstructDeck(this.decks[idx].id)
    },

    _activateReconstructDeck(deckId) {
      if (!deckId) return
      this.activeReconstructDeckId = deckId
      const deck = this.decks.find(d => d.id === deckId)
      if (!deck) return
      if (!deck.reconstructStartTime) deck.reconstructStartTime = Date.now()
    },

    _pauseActiveReconstructDeck() {
      const deckId = this.activeReconstructDeckId
      if (!deckId) return
      const deck = this.decks.find(d => d.id === deckId)
      if (!deck || !deck.reconstructStartTime) return
      deck.reconstructElapsedMs += Date.now() - deck.reconstructStartTime
      deck.reconstructStartTime = 0
    },

    setReconstructCardAt(deckId, index, card) {
      const deck = this.decks.find(d => d.id === deckId)
      if (!deck) return
      if (!Array.isArray(deck.reconstructRow)) deck.reconstructRow = new Array(52).fill(null)
      deck.reconstructRow[index] = card
      // 已提交副牌允许继续编辑：不自动取消“已提交”标识
    },

    swapReconstructSlots(deckId, a, b) {
      const deck = this.decks.find(d => d.id === deckId)
      if (!deck || !Array.isArray(deck.reconstructRow)) return
      const temp = deck.reconstructRow[a]
      deck.reconstructRow[a] = deck.reconstructRow[b]
      deck.reconstructRow[b] = temp
      // 已提交副牌允许继续编辑：不自动取消“已提交”标识
    },

    clearReconstruct(deckId) {
      const deck = this.decks.find(d => d.id === deckId)
      if (!deck) return
      deck.reconstructRow = new Array(52).fill(null)
      deck.reconstructed = false
      deck.reconstructElapsedMs = 0
      deck.reconstructStartTime = Date.now()
      this.activeReconstructDeckId = deckId
    },

    markCurrentDeckReconstructed() {
      if (this.phase !== 'reconstruct') return
      const deck = this.currentDeck
      if (!deck) return
      const isFull = deck.reconstructRow.every(c => !!c)
      if (!isFull) return

      // 停止该副计时
      if (deck.reconstructStartTime) {
        deck.reconstructElapsedMs += Date.now() - deck.reconstructStartTime
        deck.reconstructStartTime = 0
      }
      if (this.activeReconstructDeckId === deck.id) this.activeReconstructDeckId = ''

      deck.reconstructed = true
    },

    finalizeAllReconstruct() {
      if (this.phase !== 'reconstruct') return
      if (!this.isAllDecksReconstructed) return

      this._pauseActiveReconstructDeck()
      this.reconstructGlobalEnd = Date.now()
      this.reconstructCurrentTime = Math.max(0, this.reconstructGlobalEnd - (this.reconstructGlobalStart || this.reconstructGlobalEnd))
      this.stopReconstructTimer()

      let totalCorrect = 0
      const deckResults = []

      this.decks.forEach((deck) => {
        let correct = 0
        for (let i = 0; i < 52; i++) {
          const original = deck.cards[i]
          const user = deck.reconstructRow[i]
          if (original && user && user.code === original.code) correct++
        }
        totalCorrect += correct
        deckResults.push({
          deckId: deck.id,
          correct,
          total: 52,
          accuracy: ((correct / 52) * 100).toFixed(1),
          reconstructDurationMs: deck.reconstructElapsedMs
        })
      })

      const totalDecks = this.decks.length
      const totalCards = totalDecks * 52
      const overallAccuracy = totalCards > 0 ? ((totalCorrect / totalCards) * 100).toFixed(1) : '0.0'

      const totalDurationMs = this.memoryGlobalStart
        ? (this.reconstructGlobalEnd - this.memoryGlobalStart)
        : deckResults.reduce((sum, r) => sum + (r.reconstructDurationMs || 0), 0)

      this.deckResults = deckResults
      const totalError = Math.max(0, totalCards - totalCorrect)

      this.aggregateResult = {
        totalDecks,
        totalCorrect,
        totalError,
        totalCards,
        overallAccuracy,
        totalDurationMs
      }

      this.phase = 'result'
    },

    resetTraining() {
      // 保留 settings（副牌数/分组大小），仅清空本次训练过程数据
      this.decks = []
      this.currentDeckIndex = 0
      this.phase = 'settings'

      this.memoryGlobalStart = 0
      this.memoryGlobalEnd = 0

      this.reconstructGlobalStart = 0
      this.reconstructGlobalEnd = 0
      this.reconstructCurrentTime = 0
      this.stopReconstructTimer()

      this.activeReconstructDeckId = ''
      this.deckResults = []
      this.aggregateResult = null
    }
  }
})

export const __test__ = {
  createRawDeck,
  shuffleWithSeed
}
