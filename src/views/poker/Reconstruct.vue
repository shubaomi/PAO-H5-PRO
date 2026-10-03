<script setup>
import { ref, onUnmounted, computed } from 'vue'

import { useRouter } from 'vue-router'
import { usePokerStore } from '../../store'
import PokerCard from '../../components/PokerCard.vue'

const router = useRouter()
const store = usePokerStore()

// State
const isStarted = ref(false)
const startTime = ref(0)
const currentTime = ref(0)
const timerInterval = ref(null)
const selectedIndex = ref(null) // Index of selected card in reconstructionRow
const showInstructions = ref(false)
const showResetConfirm = ref(false)
const showBackConfirm = ref(false)
const showFinishConfirm = ref(false)

const suits = ['diamond', 'club', 'heart', 'spade']
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const generateSortedSuit = (suit) => {
  return ranks.map(rank => ({ suit, rank, id: `${suit}-${rank}` }))
}

// Initial state generator
const getInitialSourceRows = () => ({
  diamond: generateSortedSuit('diamond'),
  club: generateSortedSuit('club'),
  heart: generateSortedSuit('heart'),
  spade: generateSortedSuit('spade')
})

const sourceRows = ref(getInitialSourceRows())
const reconstructionRow = ref(new Array(52).fill(null))
const placedCount = computed(() => reconstructionRow.value.filter(c => c !== null).length)

const startTimer = () => {

  isStarted.value = true
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

const sortSuitRow = (suit) => {
  sourceRows.value[suit].sort((a, b) => {
    return ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
  })
}

// Interaction logic
const getNextSlotIndex = () => {
  const filled = reconstructionRow.value
    .map((c, i) => (c ? i : -1))
    .filter(i => i >= 0)
  if (filled.length === 0) {
    return reconstructionRow.value.findIndex(slot => slot === null)
  }
  const maxIdx = Math.max(...filled)
  for (let i = maxIdx + 1; i < reconstructionRow.value.length; i++) {
    if (reconstructionRow.value[i] === null) return i
  }
  return reconstructionRow.value.findIndex(slot => slot === null)
}

const handleSourceCardClick = (card, suit) => {
  if (!isStarted.value) return

  if (selectedIndex.value !== null) {
    const originalCard = reconstructionRow.value[selectedIndex.value]
    const sourceIndex = sourceRows.value[suit].findIndex(c => c.id === card.id)
    if (sourceIndex !== -1) {
      const [newCard] = sourceRows.value[suit].splice(sourceIndex, 1)
      reconstructionRow.value[selectedIndex.value] = newCard
      if (originalCard) {
        sourceRows.value[originalCard.suit].push(originalCard)
        sortSuitRow(originalCard.suit)
      }
      selectedIndex.value = null
    }
  } else {
    const targetIndex = getNextSlotIndex()
    if (targetIndex !== -1) {
      const sourceIndex = sourceRows.value[suit].findIndex(c => c.id === card.id)
      if (sourceIndex !== -1) {
        const [removed] = sourceRows.value[suit].splice(sourceIndex, 1)
        reconstructionRow.value[targetIndex] = removed
      }
    }
  }
}



const handleReconstructCardClick = (index) => {
  if (!isStarted.value) return

  if (selectedIndex.value === null) {
    selectedIndex.value = index
  } else if (selectedIndex.value === index) {
    selectedIndex.value = null
  } else {
    const temp = reconstructionRow.value[selectedIndex.value]
    reconstructionRow.value[selectedIndex.value] = reconstructionRow.value[index]
    reconstructionRow.value[index] = temp
    selectedIndex.value = null
  }
}



const resetPage = () => {
  showResetConfirm.value = true
}

const closeResetConfirm = () => {
  showResetConfirm.value = false
}

const confirmReset = () => {
  isStarted.value = false
  currentTime.value = 0
  if (timerInterval.value) clearInterval(timerInterval.value)
  sourceRows.value = getInitialSourceRows()
  reconstructionRow.value = new Array(52).fill(null)
  selectedIndex.value = null
  showResetConfirm.value = false
}


const scrollToArea = (selector) => {
  const el = document.querySelector(selector)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const toggleInstructions = (e) => {
  e.stopPropagation()
  showInstructions.value = !showInstructions.value
}

const closeInstructions = () => {
  showInstructions.value = false
}

const finishReconstruct = () => {
  const finalCards = reconstructionRow.value.filter(c => c !== null)
  if (finalCards.length < 52) {
    showFinishConfirm.value = true
  } else {
    completeFinish()
  }
}

const completeFinish = () => {
  clearInterval(timerInterval.value)
  const finalCards = reconstructionRow.value.filter(c => c !== null)
  store.setReconstructTime(currentTime.value)
  store.setReconstructedCards(finalCards)
  router.push('/poker/result')
}

const cancelFinish = () => {
  showFinishConfirm.value = false
}

const handleBackClick = () => {
  showBackConfirm.value = true
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
  if (timerInterval.value) clearInterval(timerInterval.value)
})
</script>

<template>
  <div class="reconstruct-container" @click="closeInstructions">
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="handleBackClick">←</button>
      <div class="timer-wrapper">
        <button class="nav-btn" @click="scrollToArea('.source-area')">卡牌区</button>
        <div class="timer">{{ formatTime(currentTime) }}</div>
        <button class="nav-btn" @click="scrollToArea('.reconstruct-area')">复原区</button>
      </div>
      <div class="right-icons">
        <div class="count">{{ placedCount }}/52</div>
        <button class="help-btn" aria-label="操作说明" @click="toggleInstructions">?</button>
      </div>

    </div>

    <main class="reconstruct-main">
      <!-- Instructions Modal (对齐快速数字训练风格) -->
      <Transition name="fade">
        <div v-if="showInstructions" class="modal-overlay help-overlay" @click.self="closeInstructions">
          <div v-dialog class="modal-content help-modal" @click.stop>
            <h4 class="modal-title">快速扑克训练 - 操作说明</h4>
            <ul>
              <li><b>1. 放牌</b>：点击花色区卡牌；若未选中槽位，则放入“已放置最大编号”后的下一个空槽；若 52 号槽已占满，则放入编号最小的空槽。</li>
              <li><b>2. 选槽</b>：点击复原区槽位进行选中（支持空槽）；再次点击同一槽位可取消选中。</li>
              <li><b>3. 交换</b>：选中后再点另一槽位，两槽内容互换（支持空槽互换）。</li>
              <li><b>4. 替换</b>：选中后再点花色卡牌，用新牌替换选中槽位，旧牌自动归回对应花色行并排序。</li>
              <li><b>5. 快速定位</b>：顶部“卡牌区/复原区”按钮可快速滚动到对应区域；问号可固定查看/关闭此说明。</li>
            </ul>
            <div class="modal-actions">
              <button class="primary-btn help-confirm-btn" @click="closeInstructions">我明白了</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Source Rows -->
      <div class="source-area">
        <div v-for="suit in suits" :key="suit" class="suit-row">
          <div class="suit-label">{{ suit === 'diamond' ? '♦️' : suit === 'club' ? '♣️' : suit === 'heart' ? '♥️' : '♠️' }}</div>
          <div class="static-row">
            <div 
              v-for="card in sourceRows[suit]" 
              :key="card.id" 
              class="card-wrapper" role="button" tabindex="0" :aria-label="`${card.suit} ${card.rank}`" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()" 
              @click="handleSourceCardClick(card, suit)"
            >
              <PokerCard :suit="card.suit" :rank="card.rank" size="small" />
            </div>
          </div>
        </div>
      </div>

      <!-- Reconstruction Row -->
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
      <template v-if="!isStarted">
        <button class="primary-btn start-btn" @click="startTimer">开始复原</button>
      </template>
      <template v-else>
        <button class="primary-btn finish-btn" @click="finishReconstruct">完成提交</button>
        <button class="secondary-btn reset-btn" @click="resetPage">重置</button>
      </template>
    </div>

    <!-- Reset Confirm Modal -->
    <div v-if="showResetConfirm" class="modal-overlay">
      <div v-dialog class="modal-content">
        <p class="modal-message">确定要重置当前复原进度吗？</p>
        <div class="modal-actions">
          <button class="secondary-btn" @click="closeResetConfirm">取消</button>
          <button class="primary-btn confirm-reset-btn" @click="confirmReset">确定</button>
        </div>
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

    <!-- Finish Confirm Modal -->
    <div v-if="showFinishConfirm" class="modal-overlay">
      <div v-dialog class="modal-content">
        <p class="modal-message">你当前只放了 {{ reconstructionRow.filter(c => c !== null).length }} 张牌，确定要完成吗？</p>
        <div class="modal-actions">
          <button class="secondary-btn" @click="cancelFinish">取消</button>
          <button class="primary-btn confirm-reset-btn" @click="completeFinish">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.timer-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timer {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: #e74c3c;
  min-width: 60px;
  text-align: center;
}

.nav-btn {
  background: #f8f9fa;
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.right-icons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.count {
  font-weight: bold;
  color: #34495e;
  font-size: 0.9rem;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.reconstruct-main {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
}

.instructions-toast {
  position: fixed;
  top: 70px;
  right: 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #285c48;
  border-radius: 8px;
  padding: 15px;
  width: 280px;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}


.instructions-toast h4 {
  margin: 0 0 10px 0;
  color: #285c48;
}

.instructions-toast ul {
  margin: 0;
  padding-left: 18px;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #2c3e50;
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
  display: block;
  width: 100%;
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
  width: 100%;
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

/* 让槽位与扑克牌尺寸保持一致并可自适应缩放 */
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



.empty-placeholder {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #627069;
  height: 150px;
}

.footer {
  padding: 15px;
  background: white;
  display: flex;
  justify-content: center;
  gap: 15px;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
}

.primary-btn {
  flex: 2;
  max-width: 250px;
  padding: 12px;
  border-radius: 25px;
  border: none;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  color: white;
}

.secondary-btn {
  flex: 1;
  max-width: 120px;
  padding: 12px;
  border-radius: 25px;
  border: 1px solid #627069;
  background: white;
  color: #627069;
  font-weight: bold;
  cursor: pointer;
}

.start-btn { background: #285c48; flex: 1; }
.finish-btn { background: #285c48; }
.reset-btn { color: #e74c3c; border-color: #e74c3c; }

.help-confirm-btn {
  background: #285c48;
  color: #fff;
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

.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  align-items: flex-start;
  padding-top: 70px;
}

.help-modal {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.modal-title {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  color: #34495e;
  text-align: left;
}

.help-modal ul {
  padding-left: 20px;
  line-height: 1.6;
  color: #34495e;
  text-align: left;
}

.help-modal li {
  margin-bottom: 8px;
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .suit-label { width: 20px; font-size: 1rem; }
  .reconstruct-main { padding: 5px; }
  .timer { font-size: 1.1rem; }
  .nav-btn { padding: 3px 6px; font-size: 0.7rem; }
}
</style>
