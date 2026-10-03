<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonPokerStore } from '../../../store/marathonPoker'
import PokerCard from '../../../components/PokerCard.vue'

const router = useRouter()
const store = useMarathonPokerStore()

const currentGroupIndex = ref(0)
const elapsed = ref(0)
const timerInterval = ref(null)

const deck = computed(() => store.currentDeck)

const memoryProgressText = computed(() => {
  const p = store.memoryProgress
  return `已记忆 ${p.completed}/${p.total} 副`
})

const deckProgressText = computed(() => {
  if (!store.decks.length) return ''
  return `当前副牌 ${store.currentDeckIndex + 1}/${store.decks.length}`
})

const totalGroups = computed(() => {
  const size = store.settings.groupSize || 3
  const remainder = 52 % size
  return remainder === 1 ? Math.floor(52 / size) : Math.ceil(52 / size)
})

const currentGroup = computed(() => {
  if (!deck.value) return []
  const size = store.settings.groupSize || 3
  const remainder = 52 % size
  const total = totalGroups.value
  const isLastGroupMerged = remainder === 1 && currentGroupIndex.value === total - 1
  const start = isLastGroupMerged ? (total - 1) * size : currentGroupIndex.value * size
  const end = isLastGroupMerged ? 52 : Math.min(start + size, 52)
  return deck.value.cards.slice(start, end)
})

const groupProgressText = computed(() => {
  return `第 ${currentGroupIndex.value + 1} / ${totalGroups.value} 组`
})

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

const formattedTime = computed(() => formatTime(elapsed.value))

const startTimer = () => {
  clearInterval(timerInterval.value)
  timerInterval.value = setInterval(() => {
    if (!store.memoryGlobalStart) {
      elapsed.value = 0
      return
    }
    if (store.memoryGlobalEnd) {
      elapsed.value = store.memoryGlobalEnd - store.memoryGlobalStart
      return
    }
    elapsed.value = Date.now() - store.memoryGlobalStart
  }, 500)
}

const prevGroup = () => {
  if (currentGroupIndex.value > 0) currentGroupIndex.value--
}

const nextGroup = () => {
  if (currentGroupIndex.value < totalGroups.value - 1) currentGroupIndex.value++
}

const finishCurrentDeck = () => {
  store.memorizeCompleteCurrentDeck()
}

const goReconstruct = () => {
  // 记忆阶段全局计时仅在点击“进入复原阶段”时停止
  if (!store.memoryGlobalEnd) {
    store.memoryGlobalEnd = Date.now()
  }
  store.startReconstruct()
  router.push('/marathon/poker/reconstruct')
}

const resetToSettings = () => {
  store.resetTraining()
  router.push('/marathon/poker/settings')
}

const deckIndex = ref(store.currentDeckIndex || 0)

const deckOptions = computed(() => {
  return store.decks.map((d, idx) => ({
    value: idx,
    label: `第 ${idx + 1} 副${d.memorized ? ' (已记忆)' : ''}`
  }))
})

watch(deckIndex, (newIndex) => {
  store.switchToMemoryDeck(newIndex)
})

watch(() => store.currentDeckIndex, (newIndex) => {
  if (deckIndex.value !== newIndex) {
    deckIndex.value = newIndex
  }
  currentGroupIndex.value = 0
})

onMounted(() => {
  if (!store.decks.length) {
    router.replace('/marathon/poker/settings')
    return
  }

  if (store.phase !== 'memorize') {
    store.startMemorize()
  }

  startTimer()
})

onUnmounted(() => {
  clearInterval(timerInterval.value)
})
</script>

<template>
  <div class="memory-container">
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="resetToSettings">←</button>
      <div class="header-center">
        <div class="title">马拉松扑克记忆</div>
        <div class="subtitle">{{ deckProgressText }} · {{ groupProgressText }}</div>
      </div>
      <div class="timer">{{ formattedTime }}</div>
    </div>

    <div class="toolbar">
      <div class="toolbar-item">
        <label>副牌</label>
        <select v-model.number="deckIndex" class="select">
          <option v-for="opt in deckOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="toolbar-left">{{ memoryProgressText }}</div>
      <div class="toolbar-right" v-if="store.isAllDecksMemorized">已完成全部记忆</div>
    </div>

    <main class="training-screen">
      <div class="card-display">
        <div class="cards-grid">
          <PokerCard
            v-for="(card, index) in currentGroup"
            :key="index"
            :suit="card.suit"
            :rank="card.rank"
          />
        </div>
      </div>

      <div class="pagination">
        <span>{{ groupProgressText }}</span>
      </div>

      <div class="controls">
        <button class="secondary-btn" @click="prevGroup" :disabled="currentGroupIndex === 0">上一组</button>

        <button
          v-if="currentGroupIndex < totalGroups - 1"
          class="secondary-btn"
          @click="nextGroup"
        >
          下一组
        </button>

        <button
          v-else-if="deck && !deck.memorized"
          class="primary-btn finish-btn"
          @click="finishCurrentDeck"
        >
          完成本副记忆
        </button>

        <span v-else class="completed-tip">本副已记忆</span>
      </div>

      <div v-if="store.isAllDecksMemorized" class="enter-reconstruct">
        <div class="enter-tip">可通过上下组按钮复查所有副牌，确认无误后进入复原</div>
        <button class="primary-btn" @click="goReconstruct">进入复原阶段</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #2c3e50;
  background: white;
}
.toolbar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-item label {
  color: #627069;
  font-size: 0.9rem;
}
.completed-tip {
  flex: 1;
  text-align: center;
  padding: 12px 30px;
  color: #285c48;
  font-weight: bold;
  font-size: 1.1rem;
}
.memory-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8f3;
}

.header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.header-center {
  flex: 1;
  text-align: center;
}

.title {
  color: #2c3e50;
  font-weight: 600;
}

.subtitle {
  margin-top: 2px;
  font-size: 0.85rem;
  color: #627069;
}

.timer {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: #e74c3c;
  min-width: 70px;
  text-align: right;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
}

.toolbar {
  background: white;
  padding: 10px 15px;
  border-bottom: 1px solid #edf1e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  color: #627069;
  font-size: 0.9rem;
}

.toolbar-right {
  color: #285c48;
  font-weight: 700;
  font-size: 0.9rem;
}

.training-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.card-display {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.pagination {
  text-align: center;
  margin: 15px 0;
  color: #627069;
}

.controls {
  display: flex;
  gap: 12px;
}

.enter-reconstruct {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.enter-tip {
  font-size: 14px;
  color: #627069;
  text-align: center;
  line-height: 1.4;
}


.primary-btn {
  background: linear-gradient(135deg, #285c48, #204b3b);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  flex: 1;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.secondary-btn {
  background: white;
  color: #285c48;
  border: 1px solid #285c48;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
}

.secondary-btn:disabled {
  border-color: #627069;
  color: #627069;
  opacity: 0.7;
  cursor: not-allowed;
}

.finish-btn {
  flex: 1;
}

@media (max-width: 600px) {
  .cards-grid {
    gap: 10px;
  }

  .primary-btn,
  .secondary-btn {
    padding: 10px 20px;
    font-size: 1rem;
  }
}
</style>
