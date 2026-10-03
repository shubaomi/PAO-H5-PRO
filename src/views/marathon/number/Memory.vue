<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonNumberStore } from '../../../store/marathonNumber'

const router = useRouter()
const store = useMarathonNumberStore()

const now = ref(Date.now())
const tick = ref(null)

const remainingMs = computed(() => {
  const deadline = store.memoryDeadline
  if (!deadline) return store.memoryDurationMs
  return Math.max(0, deadline - now.value)
})

const formattedRemaining = computed(() => store.formatTime(remainingMs.value))

const currentIndex = computed(() => store.currentSegmentIndex)
const segmentCount = computed(() => store.segmentCount)

const currentSegment = computed(() => {
  const s = store.originalSegments[currentIndex.value] || ''
  return String(s).slice(0, 40)
})

const groupedDigits = computed(() => {
  const groupSize = Number(store.settings.groupSize) || 6
  const groups = []
  for (let i = 0; i < currentSegment.value.length; i += groupSize) {
    groups.push(currentSegment.value.slice(i, i + groupSize))
  }
  return groups
})

const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => {
  if (currentIndex.value >= segmentCount.value - 1) return false
  // 未开启分段复习时，限制只能顺序向后（不允许回看）
  return true
})

const prevSegment = () => {
  if (!store.settings.enableReview) return
  if (!canPrev.value) return
  store.switchSegment(currentIndex.value - 1)
}

const nextSegment = () => {
  if (!canNext.value) return
  store.switchSegment(currentIndex.value + 1)
}

const goReconstruct = () => {
  // 记忆阶段计时停止点：点击进入复原阶段 或 倒计时结束自动进入
  store.stopMemory()
  // 进入复原阶段默认从第 1 段开始
  store.switchSegment(0)
  store.startReconstruct()
  router.push('/marathon/number/reconstruct')
}

onMounted(() => {
  store.ensureInited()
  if (store.phase !== 'memorize') store.startMemory()

  now.value = Date.now()
  clearInterval(tick.value)
  tick.value = setInterval(() => {
    now.value = Date.now()
    if (remainingMs.value <= 0) {
      clearInterval(tick.value)
      tick.value = null
      goReconstruct()
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
    <!-- Header aligned to fast number training -->
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="router.push('/marathon/number/settings')">←</button>
      <div class="header-center">
        <div class="title">马拉松数字 - 记忆阶段</div>
        <div class="subtitle">第 {{ currentIndex + 1 }} / {{ segmentCount }} 段（每段 40 位）</div>
      </div>
      <div class="timer-display">{{ formattedRemaining }}</div>
    </div>

    <main class="training-main">
      <div class="card">
        <h3 class="card-header">当前分段</h3>
        <div class="number-display-wrapper">
          <div class="number-display" @copy.prevent @cut.prevent @contextmenu.prevent>
            <span v-for="(g, idx) in groupedDigits" :key="idx" class="digit-group">
              <span class="group-digits">{{ g }}</span>
              <span v-if="idx !== groupedDigits.length - 1" class="group-sep">|</span>
            </span>
          </div>
        </div>

        <div class="segment-controls">
          <button class="secondary-btn" :disabled="!store.settings.enableReview || !canPrev" @click="prevSegment">上一段</button>
          <button class="secondary-btn" :disabled="!canNext" @click="nextSegment">下一段</button>
        </div>

        <div class="tips">
          <span v-if="store.settings.enableReview">可自由切换分段复习，计时不中断</span>
          <span v-else>已关闭分段复习：仅顺序浏览</span>
        </div>
      </div>

      <div class="control-area">
        <button class="primary-btn start-btn" @click="goReconstruct">确认记忆完成，进入复原阶段</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Align with fast number training base layout */
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
  color: #e74c3c;
  min-width: 80px;
  text-align: right;
}

.training-main {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: bold;
  color: #285c48;
  border-bottom: 1px solid #edf1e8;
  padding-bottom: 10px;
}

.number-display-wrapper {
  padding: 10px 0 0 0;
}

.number-display {
  user-select: none;
  -webkit-user-select: none;
  font-size: 2rem;
  font-weight: bold;
  color: #34495e;
  text-align: center;
  line-height: 1.6;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: 10px 6px;
  max-height: 260px;
  overflow-y: auto;
}

.digit-group {
  display: inline-flex;
  align-items: flex-end;
  max-width: 100%;
}

.group-digits {
  font-family: monospace;
  letter-spacing: 0.2em;
  white-space: nowrap;
}

.group-sep {
  color: #e74c3c;
  font-weight: 700;
  padding: 0 3px;
}

.segment-controls {
  margin-top: 16px;
  display: flex;
  gap: 12px;
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
  flex: 1;
  border: 1px solid #627069;
  background: white;
  color: #627069;
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tips {
  margin-top: 10px;
  color: #627069;
  font-size: 0.9rem;
  text-align: center;
}

.control-area {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.start-btn {
  width: 100%;
  max-width: 420px;
  padding: 15px;
  font-size: 1.05rem;
}

@media (max-width: 600px) {
  .number-display {
    font-size: 1.6rem;
  }
}
</style>
