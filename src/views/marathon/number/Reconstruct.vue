<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonNumberStore } from '../../../store/marathonNumber'

const router = useRouter()
const store = useMarathonNumberStore()

// toast (same UX style as fast number)
const toasts = ref([])
let toastId = 0
function addToast(message, type = 'success') {
  const id = toastId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 2500)
}

// modal (same UX style as fast number)
const defaultModal = {
  show: false,
  title: '',
  message: '',
  onConfirm: null,
  onCancel: null,
  confirmText: '确定',
  cancelText: '取消'
}
const modal = ref({ ...defaultModal })
function showModal(config) {
  modal.value = { ...defaultModal, ...config, show: true }
}
function handleModalConfirm() {
  const confirm = modal.value.onConfirm
  modal.value.show = false
  if (confirm) confirm()
}
function handleModalCancel() {
  const cancel = modal.value.onCancel
  modal.value.show = false
  if (cancel) cancel()
}

function handleBackToSettings() {
  showModal({
    title: '返回设置',
    message: '确定要返回到设置阶段吗？当前复原进度将被清空。',
    confirmText: '确定返回',
    onConfirm: () => {
      store.resetTraining()
      router.push('/marathon/number/settings')
    }
  })
}


// countdown
const now = ref(Date.now())
const tick = ref(null)
const remainingMs = computed(() => {
  const deadline = store.reconstructDeadline
  if (!deadline) return store.reconstructDurationMs
  return Math.max(0, deadline - now.value)
})
const formattedRemaining = computed(() => store.formatTime(remainingMs.value))

// segment
const segmentIndex = computed(() => store.currentSegmentIndex)
const segmentCount = computed(() => store.segmentCount)
const isSubmitted = computed(() => {
  const list = Array.isArray(store.segmentSubmitted) ? store.segmentSubmitted : []
  return !!list[segmentIndex.value]
})

const segmentProgress = computed(() => {
  const list = Array.isArray(store.segmentSubmitted) ? store.segmentSubmitted : []
  const submitted = list.filter(Boolean).length
  return { submitted, total: store.segmentCount }
})


const prevSegment = () => {
  if (segmentIndex.value <= 0) return
  store.switchSegment(segmentIndex.value - 1)
}

const nextSegment = () => {
  if (segmentIndex.value >= segmentCount.value - 1) return
  store.switchSegment(segmentIndex.value + 1)
}

// per-segment slots (40)
const slotContainerRef = ref(null)
const slotRefs = ref([])
const selectedSlot = ref(0)

const segmentUserString = computed(() => {
  const list = Array.isArray(store.userSegments) ? store.userSegments : []
  return String(list[segmentIndex.value] || '').padEnd(40, ' ')
})
const slotValues = computed(() => {
  const s = segmentUserString.value
  return Array.from({ length: 40 }, (_, i) => {
    const ch = s[i]
    return ch === ' ' ? '' : ch
  })
})

const filledCount = computed(() => slotValues.value.filter(Boolean).length)

function selectSlot(idx, scroll = false) {
  if (idx < 0 || idx >= 40) return
  selectedSlot.value = idx
  nextTick(() => {
    if (scroll) scrollToSlot(idx)
  })
}

function scrollToSlot(idx) {
  const el = slotRefs.value[idx]
  const container = slotContainerRef.value
  if (!el || !container) return
  const rect = el.getBoundingClientRect()
  const crect = container.getBoundingClientRect()
  if (rect.top < crect.top || rect.bottom > crect.bottom) {
    const offset = rect.top - crect.top - 10
    container.scrollTop += offset
  }
}

function focusFirstEmpty() {
  const arr = slotValues.value
  const firstEmpty = arr.findIndex(v => !v)
  if (firstEmpty !== -1) selectSlot(firstEmpty, true)
}

function handleDigitInput(digit) {
  if (isSubmitted.value) return
  store.setUserDigit(segmentIndex.value, selectedSlot.value, digit)

  const arr = slotValues.value
  if (arr.every(v => v)) {
    selectSlot(selectedSlot.value, true)
    return
  }

  const nextEmpty = (() => {
    for (let i = selectedSlot.value + 1; i < arr.length; i++) if (!arr[i]) return i
    for (let i = 0; i < selectedSlot.value; i++) if (!arr[i]) return i
    return -1
  })()

  selectSlot(nextEmpty !== -1 ? nextEmpty : selectedSlot.value, true)
}

function handleDelete() {
  if (isSubmitted.value) return

  const idx = selectedSlot.value
  if (slotValues.value[idx]) {
    store.clearUserDigit(segmentIndex.value, idx)
    selectSlot(idx, true)
    return
  }

  for (let i = idx - 1; i >= 0; i--) {
    if (slotValues.value[i]) {
      store.clearUserDigit(segmentIndex.value, i)
      selectSlot(i, true)
      return
    }
  }
}

function resetCurrentSegment() {
  if (isSubmitted.value) return
  showModal({
    title: '重置当前分段',
    message: '确定要清空当前分段的输入吗？',
    confirmText: '确定清空',
    onConfirm: () => {
      store.resetSegmentInput(segmentIndex.value)
      selectSlot(0, true)
      addToast('已清空当前分段', 'info')
    }
  })
}

function submitCurrentSegment() {
  if (isSubmitted.value) return

  const doSubmit = () => {
    store.submitSegment(segmentIndex.value)
    addToast(`第 ${segmentIndex.value + 1} 段已提交并锁定`, 'success')
  }

  if (filledCount.value < 40) {
    showModal({
      title: '提交当前分段',
      message: `当前分段已填写 ${filledCount.value}/40 位，未填部分将按错误处理，仍要提交吗？`,
      onConfirm: doSubmit
    })
    return
  }

  doSubmit()
}

function finishAll() {
  const doFinish = () => {
    store.finalizeToResult()
    router.push('/marathon/number/result')
  }

  if (!store.isAllSubmitted) {
    showModal({
      title: '完成复原',
      message: '仍有分段未提交，未提交分段会按当前填写内容计分。确定完成并查看结果吗？',
      onConfirm: doFinish
    })
    return
  }

  showModal({
    title: '完成复原',
    message: '确定完成所有复原并查看结果吗？',
    onConfirm: doFinish
  })
}

watch(segmentIndex, () => {
  slotRefs.value = []
  selectedSlot.value = 0
  nextTick(() => focusFirstEmpty())
})

onMounted(() => {
  store.ensureInited()
  if (store.phase !== 'reconstruct') store.startReconstruct()

  nextTick(() => focusFirstEmpty())

  now.value = Date.now()
  clearInterval(tick.value)
  tick.value = setInterval(() => {
    now.value = Date.now()
    if (remainingMs.value <= 0) {
      clearInterval(tick.value)
      tick.value = null
      addToast('复原时间到，已自动结算', 'info')
      store.finalizeToResult()
      router.replace('/marathon/number/result')
    }
  }, 250)
})

onBeforeUnmount(() => {
  clearInterval(tick.value)
  tick.value = null
})
</script>

<template>
  <div class="training-container">
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="handleBackToSettings">←</button>
      <div class="header-center">
        <div class="title">马拉松数字 - 复原阶段</div>
        <div class="subtitle">第 {{ segmentIndex + 1 }} / {{ segmentCount }} 段 · {{ isSubmitted ? '已提交' : '未提交' }}</div>
      </div>
      <div class="timer-display recall">{{ formattedRemaining }}</div>
    </div>

    <main class="training-main">
      <div class="card">
        <div class="segment-bar">
          <button class="secondary-btn" :disabled="segmentIndex === 0" @click="prevSegment">上一段</button>
          <div class="segment-meta">
            <div class="meta-line">分段提交：{{ segmentProgress.submitted }} / {{ segmentProgress.total }}</div>
            <div class="meta-line">本段填写：{{ filledCount }} / 40</div>
          </div>
          <button class="secondary-btn" :disabled="segmentIndex >= segmentCount - 1" @click="nextSegment">下一段</button>
        </div>

        <div class="slot-input-wrapper">
          <div class="slot-header">
            <span class="slot-progress">当前槽位：{{ selectedSlot + 1 }}</span>
            <span class="slot-recall-timer">剩余：{{ formattedRemaining }}</span>
            <button class="secondary-btn mini" :disabled="isSubmitted" @click="focusFirstEmpty">跳到未填</button>
          </div>

          <div class="slot-grid" ref="slotContainerRef" :class="{ locked: isSubmitted }">
            <div
              v-for="(val, idx) in slotValues"
              :key="idx"
              :ref="el => slotRefs[idx] = el"
              class="slot-item" role="button" tabindex="0" :aria-label="`第 ${idx + 1} 位：${val || '未填写'}`" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()"
              :class="{ selected: selectedSlot === idx, filled: !!val, disabled: isSubmitted }"
              @click="!isSubmitted && selectSlot(idx, true)"
            >
              <div class="slot-value">{{ val || '' }}</div>
              <div class="slot-index">{{ idx + 1 }}</div>
            </div>
          </div>

          <div class="keypad">
            <button v-for="n in 10" :key="n" class="keypad-btn" :disabled="isSubmitted" @click="handleDigitInput((n % 10).toString())">{{ n % 10 }}</button>
            <button class="keypad-btn danger" :disabled="isSubmitted" @click="handleDelete">⌫</button>
            <button class="keypad-btn secondary" :disabled="isSubmitted" @click="resetCurrentSegment">清空本段</button>
          </div>
        </div>

        <div class="control-area">
          <button class="secondary-btn" :disabled="isSubmitted" @click="submitCurrentSegment">提交当前分段</button>
          <button class="primary-btn" @click="finishAll">完成所有复原，查看结果</button>
        </div>
      </div>
    </main>

    <div v-if="modal.show" class="modal-overlay" @click.self="handleModalCancel">
      <div v-dialog class="modal-content">
        <h4 class="modal-title">{{ modal.title }}</h4>
        <p class="modal-message">{{ modal.message }}</p>
        <div class="modal-actions">
          <button class="secondary-btn" @click="handleModalCancel">{{ modal.cancelText }}</button>
          <button class="primary-btn" @click="handleModalConfirm">{{ modal.confirmText }}</button>
        </div>
      </div>
    </div>

    <div class="toast-container">
      <TransitionGroup name="toast-fade">
        <div v-for="toast in toasts" :key="toast.id" :class="['toast-item', `toast-${toast.type}`]">
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.training-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f3f6;
  overflow: hidden;
}

.header {
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-center {
  flex: 1;
  text-align: center;
  padding: 0 8px;
}

.title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #34495e;
}

.subtitle {
  margin-top: 2px;
  font-size: 0.85rem;
  color: #627069;
}

.timer-display {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  min-width: 80px;
  text-align: right;
}

.timer-display.recall {
  color: #e67e22;
}

.training-main {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.segment-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.segment-meta {
  flex: 1;
  text-align: center;
  color: #34495e;
}

.meta-line {
  font-size: 0.9rem;
}

.slot-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  font-size: 0.95rem;
  color: #34495e;
}

.slot-progress {
  white-space: nowrap;
}

.slot-recall-timer {
  white-space: nowrap;
  font-family: monospace;
  font-weight: 700;
  color: #e67e22;
}

/* Adjust max-height to leave just enough space for the compact keypad */
.slot-grid {
  max-height: min(65vh, 580px);
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 5px;
  padding: 5px;
  border: 1px dashed #edf1e8;
  border-radius: 8px;
  background: #fafbfc;
}

.slot-item {
  background: white;
  border: 1px solid #dfe6e9;
  border-radius: 6px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.slot-item.selected {
  border-color: #1f7acb;
  box-shadow: 0 0 0 4px rgba(31, 122, 203, 0.32);
}


.slot-item.filled .slot-value {
  color: #285c48;
}

.slot-item.disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.slot-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #627069;
}


.slot-index {
  font-size: 0.7rem;
  color: #627069;
}

.keypad {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 5px;
  background: #f0f3f6;
  border-top: 1px solid #e0e6ed;
}

.keypad-btn {
  padding: 6px 0;
  border-radius: 6px;
  border: 1px solid #627069;
  background: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}


.keypad-btn:hover {
  background: #edf1e8;
}

.keypad-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.keypad-btn.danger {
  border-color: #e74c3c;
  color: #e74c3c;
}

.keypad-btn.secondary {
  border-color: #627069;
  color: #627069;
  font-size: 0.9rem;
}

.primary-btn,
.secondary-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  color: white;
  background: #285c48;
}

.primary-btn:hover {
  background: #204b3b;
}

.secondary-btn {
  border: 1px solid #627069;
  background: white;
  color: #627069;
}

.secondary-btn:disabled,
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn.mini {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.control-area {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.control-area .primary-btn {
  flex: 1;
  min-width: 220px;
}

.control-area .secondary-btn {
  flex: 1;
  min-width: 160px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-title {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  color: #34495e;
  text-align: left;
}

.modal-message {
  margin: 0 0 24px 0;
  font-size: 1rem;
  color: #627069;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Toast */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-item {
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #285c48;
}

.toast-error {
  background: #e74c3c;
}

.toast-info {
  background: #285c48;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.4s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
