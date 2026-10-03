import { defineStore } from 'pinia'

const SEGMENT_LEN = 40
const HISTORY_KEY = 'marathon_number_history'

const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0))

const defaultSettings = () => ({
  segmentCount: 10,
  memoryDurationMin: 30,
  enableReview: true,
  groupSize: 6
})

const defaultResults = () => ({
  totalScore: 0,
  perfectSegments: 0,
  halfSegments: 0,
  zeroSegments: 0,
  correctDigits: 0,

  memoryTimeMs: 0,
  reconstructTimeMs: 0,
  totalTimeMs: 0,

  perSegment: []
})

const formatTime = (ms) => {
  const totalSeconds = Math.floor((Number(ms) || 0) / 1000)
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return hours === '00' ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`
}

const buildSegments = (segmentCount) => {
  const count = clamp(segmentCount, 5, 30)
  const segments = []
  for (let i = 0; i < count; i++) {
    let s = ''
    for (let j = 0; j < SEGMENT_LEN; j++) s += Math.floor(Math.random() * 10)
    segments.push(s)
  }
  return segments
}

const emptyUserSegments = (segmentCount) => {
  const count = clamp(segmentCount, 5, 30)
  return Array.from({ length: count }, () => ''.padEnd(SEGMENT_LEN, ' '))
}

const emptyBoolArray = (segmentCount, val = false) => {
  const count = clamp(segmentCount, 5, 30)
  return Array.from({ length: count }, () => val)
}

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

const saveHistory = (list) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list || []))
  } catch {
    // ignore
  }
}

export const useMarathonNumberStore = defineStore('marathonNumber', {
  state: () => ({
    phase: 'settings', // settings | memorize | reconstruct | result
    settings: defaultSettings(),

    // training data
    originalSegments: [], // string[segmentCount], each length=40
    userSegments: [], // string[segmentCount], each length=40 with blanks as ' '
    segmentSubmitted: [], // boolean[segmentCount]
    currentSegmentIndex: 0,

    // timers
    memoryGlobalStart: 0,
    memoryGlobalEnd: 0,
    reconstructGlobalStart: 0,
    reconstructGlobalEnd: 0,

    // results
    results: defaultResults(),

    // history
    history: []
  }),

  getters: {
    segmentCount(state) {
      return clamp(state.settings.segmentCount, 5, 30)
    },

    memoryDurationMs(state) {
      return clamp(state.settings.memoryDurationMin, 15, 60) * 60 * 1000
    },

    reconstructDurationMs() {
      return this.memoryDurationMs * 2
    },

    memoryDeadline() {
      return this.memoryGlobalStart ? this.memoryGlobalStart + this.memoryDurationMs : 0
    },

    reconstructDeadline() {
      return this.reconstructGlobalStart ? this.reconstructGlobalStart + this.reconstructDurationMs : 0
    },

    isAllSubmitted(state) {
      return state.segmentSubmitted.length > 0 && state.segmentSubmitted.every(Boolean)
    }
  },

  actions: {
    initTraining(config = {}) {
      const nextSettings = {
        ...this.settings,
        ...config
      }
      nextSettings.segmentCount = clamp(nextSettings.segmentCount, 5, 30)
      nextSettings.memoryDurationMin = clamp(nextSettings.memoryDurationMin, 15, 60)
      nextSettings.groupSize = clamp(nextSettings.groupSize, 1, 10)
      nextSettings.enableReview = !!nextSettings.enableReview
      this.settings = nextSettings

      this.phase = 'settings'
      this.originalSegments = buildSegments(this.settings.segmentCount)
      this.userSegments = emptyUserSegments(this.settings.segmentCount)
      this.segmentSubmitted = emptyBoolArray(this.settings.segmentCount, false)
      this.currentSegmentIndex = 0

      this.memoryGlobalStart = 0
      this.memoryGlobalEnd = 0
      this.reconstructGlobalStart = 0
      this.reconstructGlobalEnd = 0

      this.results = defaultResults()
    },

    ensureInited() {
      if (!Array.isArray(this.originalSegments) || this.originalSegments.length === 0) {
        this.initTraining(this.settings)
      }
    },

    startMemory() {
      this.ensureInited()
      this.phase = 'memorize'
      if (!this.memoryGlobalStart) this.memoryGlobalStart = Date.now()
      this.memoryGlobalEnd = 0
      this.currentSegmentIndex = clamp(this.currentSegmentIndex, 0, this.segmentCount - 1)
    },

    stopMemory() {
      if (!this.memoryGlobalStart) this.memoryGlobalStart = Date.now()
      if (!this.memoryGlobalEnd) this.memoryGlobalEnd = Date.now()
    },

    startReconstruct() {
      this.ensureInited()
      this.phase = 'reconstruct'
      if (!this.reconstructGlobalStart) this.reconstructGlobalStart = Date.now()
      this.reconstructGlobalEnd = 0
      // 进入复原阶段默认从第 1 段开始
      this.currentSegmentIndex = 0
    },

    stopReconstruct() {
      if (!this.reconstructGlobalStart) this.reconstructGlobalStart = Date.now()
      if (!this.reconstructGlobalEnd) this.reconstructGlobalEnd = Date.now()
    },

    switchSegment(idx) {
      const next = clamp(idx, 0, this.segmentCount - 1)
      this.currentSegmentIndex = next
    },

    setUserDigit(segmentIndex, digitIndex, digit) {
      const sIdx = clamp(segmentIndex, 0, this.segmentCount - 1)
      const dIdx = clamp(digitIndex, 0, SEGMENT_LEN - 1)
      if (this.segmentSubmitted[sIdx]) return

      const ch = String(digit ?? '').slice(0, 1)
      if (!/^[0-9]$/.test(ch)) return

      const current = String(this.userSegments[sIdx] || '').padEnd(SEGMENT_LEN, ' ')
      const next = current.slice(0, dIdx) + ch + current.slice(dIdx + 1)
      this.userSegments[sIdx] = next
    },

    clearUserDigit(segmentIndex, digitIndex) {
      const sIdx = clamp(segmentIndex, 0, this.segmentCount - 1)
      const dIdx = clamp(digitIndex, 0, SEGMENT_LEN - 1)
      if (this.segmentSubmitted[sIdx]) return

      const current = String(this.userSegments[sIdx] || '').padEnd(SEGMENT_LEN, ' ')
      const next = current.slice(0, dIdx) + ' ' + current.slice(dIdx + 1)
      this.userSegments[sIdx] = next
    },

    resetSegmentInput(segmentIndex) {
      const sIdx = clamp(segmentIndex, 0, this.segmentCount - 1)
      if (this.segmentSubmitted[sIdx]) return
      this.userSegments[sIdx] = ''.padEnd(SEGMENT_LEN, ' ')
    },

    submitSegment(segmentIndex) {
      const sIdx = clamp(segmentIndex, 0, this.segmentCount - 1)
      this.segmentSubmitted[sIdx] = true
    },

    calculateScore() {
      this.ensureInited()

      const perSegment = []
      let totalScore = 0
      let perfectSegments = 0
      let halfSegments = 0
      let zeroSegments = 0
      let correctDigits = 0

      for (let i = 0; i < this.segmentCount; i++) {
        const original = String(this.originalSegments[i] || '').padEnd(SEGMENT_LEN, ' ')
        const user = String(this.userSegments[i] || '').padEnd(SEGMENT_LEN, ' ')

        let errors = 0
        let correct = 0
        const comparison = []

        for (let j = 0; j < SEGMENT_LEN; j++) {
          const o = original[j]
          const u = user[j]

          if (u === ' ' || u === undefined) {
            errors++
            comparison.push({ original: o, user: '-', status: 'missing' })
            continue
          }

          if (o === u) {
            correct++
            comparison.push({ original: o, user: u, status: 'correct' })
          } else {
            errors++
            comparison.push({ original: o, user: u, status: 'incorrect' })
          }
        }

        correctDigits += correct

        // 赛事规则：每段40位；全对=40分；1错=半分（20分）；>=2错=0分
        let segmentScore = 0
        let segmentType = 'zero'
        if (errors === 0) {
          segmentScore = SEGMENT_LEN
          segmentType = 'perfect'
          perfectSegments++
        } else if (errors === 1) {
          segmentScore = SEGMENT_LEN / 2
          segmentType = 'half'
          halfSegments++
        } else {
          segmentScore = 0
          segmentType = 'zero'
          zeroSegments++
        }

        totalScore += segmentScore
        perSegment.push({
          index: i,
          errors,
          correct,
          score: segmentScore,
          type: segmentType,
          comparison
        })
      }

      const now = Date.now()
      const memoryEnd = this.memoryGlobalEnd || now
      const reconstructEnd = this.reconstructGlobalEnd || now

      const memoryTimeMs = this.memoryGlobalStart ? Math.max(0, memoryEnd - this.memoryGlobalStart) : 0
      const reconstructTimeMs = this.reconstructGlobalStart ? Math.max(0, reconstructEnd - this.reconstructGlobalStart) : 0

      // 展示只到秒：先截断秒以下再相加，保证显示一致
      const memoryDisplayMs = Math.floor(memoryTimeMs / 1000) * 1000
      const reconstructDisplayMs = Math.floor(reconstructTimeMs / 1000) * 1000
      const totalDisplayMs = memoryDisplayMs + reconstructDisplayMs

      this.results = {
        totalScore,
        perfectSegments,
        halfSegments,
        zeroSegments,
        correctDigits,
        memoryTimeMs: memoryDisplayMs,
        reconstructTimeMs: reconstructDisplayMs,
        totalTimeMs: totalDisplayMs,
        perSegment
      }

      return this.results
    },

    finalizeToResult() {
      if (!this.memoryGlobalEnd && this.memoryGlobalStart) this.stopMemory()
      this.stopReconstruct()
      this.calculateScore()
      this.phase = 'result'

      // auto save history
      this.saveCurrentToHistory()
    },

    loadHistory() {
      this.history = loadHistory()
    },

    saveCurrentToHistory() {
      const res = this.results || defaultResults()
      const record = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        segmentCount: this.segmentCount,
        memoryDurationMin: clamp(this.settings.memoryDurationMin, 15, 60),
        reconstructDurationMin: clamp(this.settings.memoryDurationMin, 15, 60) * 2,
        totalScore: res.totalScore,
        perfectSegments: res.perfectSegments,
        halfSegments: res.halfSegments,
        zeroSegments: res.zeroSegments,
        correctDigits: res.correctDigits,
        memoryTimeMs: res.memoryTimeMs,
        reconstructTimeMs: res.reconstructTimeMs,
        totalTimeMs: res.totalTimeMs
      }

      const list = loadHistory()
      list.unshift(record)
      // keep last 30
      const next = list.slice(0, 30)
      saveHistory(next)
      this.history = next
    },

    deleteHistory(id) {
      const list = loadHistory().filter(r => r.id !== id)
      saveHistory(list)
      this.history = list
    },

    clearHistory() {
      saveHistory([])
      this.history = []
    },

    resetTraining() {
      const keep = { ...this.settings }
      this.$reset()
      this.settings = keep
      this.history = loadHistory()
    },

    formatTime(ms) {
      return formatTime(ms)
    }
  }
})

export const __test__ = {
  SEGMENT_LEN
}
