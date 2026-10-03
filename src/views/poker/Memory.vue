<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePokerStore } from '../../store'
import PokerCard from '../../components/PokerCard.vue'

const router = useRouter()
const store = usePokerStore()

// Game State
const isStarted = ref(false)
const isCountingDown = ref(false)
const countdown = ref(5)
const startTime = ref(0)
const currentTime = ref(0)
const timerInterval = ref(null)
let countdownInterval = null
const groupSize = ref(store.settings.groupSize || 3)
const showBackConfirm = ref(false)

const currentPage = ref(0)

// Cards
const allCards = ref([])
const suits = ['diamond', 'club', 'heart', 'spade']
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const generateCards = () => {
  const cards = []
  suits.forEach(suit => {
    ranks.forEach(rank => {
      cards.push({ suit, rank })
    })
  })
  return cards
}

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const currentGroup = computed(() => {
  const remainder = 52 % groupSize.value
  const total = remainder === 1 ? Math.floor(52 / groupSize.value) : Math.ceil(52 / groupSize.value)
  const isLastGroupMerged = remainder === 1 && currentPage.value === total - 1
  const start = isLastGroupMerged ? (total - 1) * groupSize.value : currentPage.value * groupSize.value
  const end = isLastGroupMerged ? 52 : Math.min(start + groupSize.value, 52)
  return allCards.value.slice(start, end)
})

const totalPages = computed(() => {
  const remainder = 52 % groupSize.value
  return remainder === 1 ? Math.floor(52 / groupSize.value) : Math.ceil(52 / groupSize.value)
})

const startTraining = () => {
  isCountingDown.value = true
  countdown.value = 5
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      isCountingDown.value = false
      isStarted.value = true
      // 生成并洗牌
      allCards.value = shuffle(generateCards())
      // 保存到 store
      store.setShuffledCards(allCards.value)
      startTimer()
    }
  }, 1000)
}

const startTimer = () => {
  startTime.value = performance.now()
  timerInterval.value = setInterval(() => {
    currentTime.value = performance.now() - startTime.value
  }, 10)
}

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10)
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}`
}

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

const finishMemory = () => {
  clearInterval(timerInterval.value)
  store.setMemoryTime(currentTime.value)
  store.updateSettings({ groupSize: groupSize.value })
  router.push('/poker/reconstruct')
}

const handleBackClick = () => {
  if (isStarted.value || isCountingDown.value) {
    showBackConfirm.value = true
  } else {
    router.push('/poker/settings')
  }
}

const confirmBack = () => {
  clearInterval(timerInterval.value)
  showBackConfirm.value = false
  router.push('/poker/settings')
}

const cancelBack = () => {
  showBackConfirm.value = false
}

onUnmounted(() => {
  clearInterval(countdownInterval)
  if (timerInterval.value) clearInterval(timerInterval.value)
})


</script>

<template>
  <div class="memory-container">
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="handleBackClick">←</button>
      <div class="timer" v-if="isStarted">{{ formatTime(currentTime) }}s</div>
    </div>

    <div v-if="!isStarted && !isCountingDown" class="start-screen">
      <h2>扑克牌记忆训练</h2>
      <p>准备好后点击开始按钮</p>
      <button class="primary-btn" @click="startTraining">开始记忆</button>
    </div>

    <div v-if="isCountingDown" class="countdown-screen">
      <div class="countdown-number">{{ countdown }}</div>
      <p>即将开始...</p>
    </div>

    <div v-if="isStarted" class="training-screen">
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
        <span>第 {{ currentPage + 1 }} / {{ totalPages }} 组</span>
      </div>

      <div class="controls">
        <button class="secondary-btn" @click="prevPage" :disabled="currentPage === 0">上一组</button>
        <button 
          v-if="currentPage < totalPages - 1" 
          class="secondary-btn" 
          @click="nextPage"
        >下一组</button>
        <button 
          v-else 
          class="primary-btn finish-btn" 
          @click="finishMemory"
        >记好了</button>
      </div>
    </div>


    
    <!-- Back Confirm Modal -->
    <div v-if="showBackConfirm" class="modal-overlay">
      <div v-dialog class="modal-content">
        <p class="modal-message">确定要返回设置页面吗？当前训练进度将会丢失。</p>
        <div class="modal-actions">
          <button class="secondary-btn" @click="cancelBack">取消</button>
          <button class="primary-btn confirm-reset-btn" @click="confirmBack">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memory-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8f3;
  position: relative;
}

.header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.timer {
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: #e74c3c;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.start-screen, .countdown-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.countdown-number {
  font-size: 8rem;
  font-weight: bold;
  color: #285c48;
}

.training-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.card-display {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
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
  justify-content: space-between;
  gap: 20px;
}

.primary-btn {
  background: #285c48;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
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
}

.secondary-btn:disabled {
  border-color: #627069;
  color: #627069;
}

.finish-btn {
  background: #285c48;
  flex: 1;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 80%;
  max-width: 400px;
}

.modal-message {
  margin: 0 0 24px 0;
  font-size: 1rem;
  color: #34495e;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-actions .secondary-btn,
.modal-actions .primary-btn {
  flex: none;
  max-width: none;
  min-width: 80px;
}

.confirm-reset-btn {
  background: #e74c3c;
}

.setting-item {
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-item input {
  width: 60px;
  padding: 5px;
  font-size: 1rem;
}
@media (max-width: 600px) {
  .countdown-number {
    font-size: 5rem;
  }
  
  .cards-grid {
    gap: 10px;
  }
  
  .primary-btn, .secondary-btn {
    padding: 10px 20px;
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .cards-grid {
    max-width: 1000px;
    margin: 0 auto;
  }
}
</style>

