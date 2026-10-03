<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonPokerStore } from '../../../store/marathonPoker'
import PokerCard from '../../../components/PokerCard.vue'

const router = useRouter()
const store = useMarathonPokerStore()

const deckIndex = ref(0)
const selectedIndex = ref(null)

const showBackConfirm = ref(false)

const deck = computed(() => store.currentDeck)


const deckOptions = computed(() => {
  return store.decks.map((d, idx) => {
    const label = `第 ${idx + 1} 副${d.reconstructed ? '（已提交）' : ''}`
    return { value: idx, label }
  })
})

const reconstructionRow = computed(() => {
  if (!deck.value) return new Array(52).fill(null)
  if (!Array.isArray(deck.value.reconstructRow)) return new Array(52).fill(null)
  return deck.value.reconstructRow
})

const placedCount = computed(() => reconstructionRow.value.filter(c => c).length)

const submittedCount = computed(() => store.decks.filter(d => d.reconstructed).length)

const globalProgressText = computed(() => {
  return `已提交：${submittedCount.value}/${store.decks.length}`
})

const formattedTime = computed(() => store.formatTime(store.reconstructCurrentTime))

const isSubmittingDeck = ref(false)
const isSubmittingAll = ref(false)

const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 2000)
}

const usedCodes = computed(() => {
  const set = new Set()
  reconstructionRow.value.forEach((c) => {
    if (c && c.code) set.add(c.code)
  })
  return set
})

const suitRows = computed(() => {
  const rows = {
    spade: [],
    heart: [],
    club: [],
    diamond: []
  }

  const full = createSourceDeck()
  full.forEach((card) => {
    if (usedCodes.value.has(card.code)) return
    rows[card.suit].push(card)
  })

  return rows
})

function createSourceDeck() {
  const list = []
  const suitOrder = ['diamond', 'club', 'heart', 'spade']
  const suitCodeMap = { spade: 'S', heart: 'H', club: 'C', diamond: 'D' }
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  suitOrder.forEach((suit) => {
    ranks.forEach((rank) => {
      const rankCode = rank === '10' ? '10' : rank[0]
      list.push({ suit, rank, code: `${rankCode}${suitCodeMap[suit]}` })
    })
  })

  return list
}

const getNextSlotIndex = () => {
  const row = reconstructionRow.value
  const filled = row.map((c, i) => (c ? i : -1)).filter(i => i >= 0)
  if (filled.length === 0) return row.findIndex(slot => slot === null)
  const maxIdx = Math.max(...filled)
  for (let i = maxIdx + 1; i < row.length; i++) {
    if (row[i] === null) return i
  }
  return row.findIndex(slot => slot === null)
}

const handleSourceCardClick = (card) => {
  if (!deck.value) return

  const deckId = deck.value.id

  if (selectedIndex.value !== null) {
    store.setReconstructCardAt(deckId, selectedIndex.value, card)
    selectedIndex.value = null
    return
  }

  const targetIndex = getNextSlotIndex()
  if (targetIndex !== -1) {
    store.setReconstructCardAt(deckId, targetIndex, card)
  }
}

const handleReconstructCardClick = (index) => {
  if (!deck.value) return

  if (selectedIndex.value === null) {
    selectedIndex.value = index
    return
  }

  if (selectedIndex.value === index) {
    selectedIndex.value = null
    return
  }

  store.swapReconstructSlots(deck.value.id, selectedIndex.value, index)
  selectedIndex.value = null
}

const isFull = computed(() => deck.value && deck.value.reconstructRow.every(c => !!c))

const submitCurrentDeck = async () => {
  if (!deck.value) return
  if (!isFull.value) {
    showToast('请完成52张牌的复原后再提交', 'error')
    return
  }

  if (isSubmittingDeck.value) return
  isSubmittingDeck.value = true
  try {
    store.markCurrentDeckReconstructed()
    showToast(`第 ${store.currentDeckIndex + 1} 副牌提交成功`, 'success')
  } finally {
    isSubmittingDeck.value = false
  }
}

const submitAll = async () => {
  if (isSubmittingAll.value) return
  if (!canSubmitAll.value) {
    showToast('请先提交所有副牌后再提交全部', 'error')
    return
  }
  isSubmittingAll.value = true
  try {
    store.finalizeAllReconstruct()
    router.push('/marathon/poker/result')
  } finally {
    isSubmittingAll.value = false
  }
}

const openBackConfirm = () => {
  showBackConfirm.value = true
}

const closeBackConfirm = () => {
  showBackConfirm.value = false
}

const confirmBackToSettings = () => {
  closeBackConfirm()
  store.resetTraining()
  router.push('/marathon/poker/settings')
}


const canSubmitAll = computed(() => store.isAllDecksReconstructed)

const resetCurrentDeck = () => {
  if (!deck.value) return
  store.clearReconstruct(deck.value.id)
  selectedIndex.value = null
}

watch(deckIndex, (val) => {
  if (val !== store.currentDeckIndex) {
    store.switchToReconstructDeck(val)
  }
  selectedIndex.value = null
})

watch(() => store.currentDeckIndex, (val) => {
  if (deckIndex.value !== val) {
    deckIndex.value = val
  }
})

onMounted(() => {
  if (!store.decks.length) {
    router.replace('/marathon/poker/settings')
    return
  }


  if (!store.isAllDecksMemorized) {
    router.replace('/marathon/poker/memory')
    return
  }

  if (store.phase !== 'reconstruct') {
    store.startReconstruct()
  }
  // 默认选中第 1 副（store 内部也会强制归零）
  deckIndex.value = store.currentDeckIndex
})

onUnmounted(() => {
  store.stopReconstructTimer()
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div class="reconstruct-container">
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="openBackConfirm">←</button>
      <div class="header-center">
        <div class="title">马拉松扑克复原</div>
        <div class="subtitle">{{ globalProgressText }} · 当前 {{ placedCount }}/52</div>
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
      <div class="toolbar-actions">
        
        <button class="secondary-btn mini danger" @click="resetCurrentDeck">重置本副</button>
      </div>
    </div>

    <main class="reconstruct-main">
      <div class="source-area">
        <div v-for="suit in ['diamond','club','heart','spade']" :key="suit" class="suit-row">
          <div class="suit-label">{{ suit === 'diamond' ? '♦️' : suit === 'club' ? '♣️' : suit === 'heart' ? '♥️' : '♠️' }}</div>
          <div class="static-row">
            <div v-for="card in suitRows[suit]" :key="card.code" class="card-wrapper" role="button" tabindex="0" :aria-label="`${card.suit} ${card.rank}`" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()" @click="handleSourceCardClick(card)">
              <PokerCard :suit="card.suit" :rank="card.rank" size="small" />
            </div>
          </div>
        </div>
      </div>

      <div class="reconstruct-area">
        <h3>复原区</h3>
        <div class="reconstruct-grid">
          <div
            v-for="(element, index) in reconstructionRow"
            :key="index"
            class="slot-wrapper" role="button" tabindex="0" :aria-label="`复原位置 ${index + 1}`" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()"
            :class="{ selected: selectedIndex === index }"
            @click="handleReconstructCardClick(index)"
          >
            <div class="slot-index">{{ index + 1 }}</div>
            <PokerCard v-if="element" :suit="element.suit" :rank="element.rank" size="small" />
          </div>
        </div>
      </div>
    </main>

    <div class="footer">
      <button class="secondary-btn" @click="submitCurrentDeck" :disabled="!isFull || isSubmittingDeck">{{ isSubmittingDeck ? '提交中...' : '提交本副' }}</button>
      <button class="primary-btn" @click="submitAll" :disabled="!canSubmitAll || isSubmittingAll">{{ isSubmittingAll ? '提交中...' : '提交全部' }}</button>
    </div>

    <Transition name="fade">
      <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>

    <div v-if="showBackConfirm" class="modal-overlay" @click="closeBackConfirm">
      <div v-dialog class="modal-content" @click.stop>
        <div class="modal-message">确定返回设置页重新开始逐副训练吗？当前训练进度将清空。</div>
        <div class="modal-actions">
          <button class="secondary-btn" @click="closeBackConfirm">取消</button>
          <button class="primary-btn" @click="confirmBackToSettings">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #285c48;
  color: #2c3e50;
  padding: 10px 14px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.12);
  z-index: 2000;
  font-size: 0.95rem;
  max-width: calc(100vw - 40px);
  text-align: center;
}

.toast.error {
  border-color: #e74c3c;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2500;
  padding: 20px;
}

.modal-content {
  background: white;
  padding: 18px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.modal-message {
  margin: 0 0 14px 0;
  color: #2c3e50;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-actions .secondary-btn,
.modal-actions .primary-btn {
  flex: none;
  min-width: 90px;
}


.reconstruct-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f3f6;
  overflow: hidden;
  position: relative;
}

.header {
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 100;
}

.header-center {
  flex: 1;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.subtitle {
  margin-top: 2px;
  font-size: 0.85rem;
  color: #627069;
}

.timer {
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: bold;
  color: #e67e22;
  min-width: 70px;
  text-align: right;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.toolbar {
  background: white;
  padding: 10px 15px;
  border-bottom: 1px solid #edf1e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #2c3e50;
  background: white;
}

.reconstruct-main {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.source-area {
  background: white;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.suit-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  min-height: 80px;
  border-bottom: 1px solid #eee;
}

.suit-row:last-child {
  border-bottom: none;
}

.suit-label {
  width: 30px;
  font-size: 1.2rem;
  text-align: center;
}

.static-row {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px;
}

.reconstruct-area {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.reconstruct-area h3 {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #627069;
  text-align: center;
}

.reconstruct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(55px, 1fr));
  gap: 10px;
  align-content: start;
  border: 2px dashed #edf1e8;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.slot-wrapper {
  width: 100%;
  aspect-ratio: 45 / 65;
  border: 1px dashed #ddd;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-wrapper :deep(.poker-card-wrapper) {
  width: 100%;
  height: 100%;
}

.slot-wrapper :deep(.poker-card) {
  width: 100%;
  height: 100%;
}


.slot-wrapper.selected {
  outline: 3px solid #285c48;
  outline-offset: 2px;
  transform: scale(1.05);
  z-index: 2;
}

.slot-index {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  color: #627069;
  z-index: 1;
  pointer-events: none;
}

.footer {
  padding: 15px;
  background: white;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
}

.primary-btn {
  flex: 2;
  height: 44px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  background: linear-gradient(135deg, #285c48, #204b3b);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  cursor: pointer;
}

.secondary-btn {
  flex: 1;
  height: 44px;
  border-radius: 8px;
  border: 1px solid #285c48;
  color: #285c48;
  background: white;
  font-weight: bold;
  cursor: pointer;
}

.secondary-btn:disabled,
.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.secondary-btn.mini {
  height: 36px;
  border-radius: 12px;
  font-size: 0.85rem;
  padding: 0 10px;
}

.secondary-btn.danger {
  color: #e74c3c;
  border-color: #e74c3c;
}

@media (max-width: 600px) {
  .suit-label { width: 20px; font-size: 1rem; }
  .reconstruct-main { padding: 5px; }
}
</style>
