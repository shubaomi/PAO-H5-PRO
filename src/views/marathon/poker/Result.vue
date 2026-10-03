<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonPokerStore } from '../../../store/marathonPoker'
import PokerCard from '../../../components/PokerCard.vue'

const router = useRouter()
const store = useMarathonPokerStore()

const deckIndex = ref(0)

const deckOptions = computed(() => {
  return store.decks.map((d, idx) => {
    const res = store.deckResults.find(r => r.deckId === d.id)
    const label = `第 ${idx + 1} 副${res ? `（${res.accuracy}%）` : ''}`
    return { value: idx, label }
  })
})

const deck = computed(() => store.decks[deckIndex.value] || null)

const reconstructionRow = computed(() => {
  if (!deck.value || !Array.isArray(deck.value.reconstructRow)) return new Array(52).fill(null)
  return deck.value.reconstructRow
})

const comparison = computed(() => {
  if (!deck.value) return []
  const items = []
  for (let i = 0; i < 52; i++) {
    const original = deck.value.cards[i]
    const user = reconstructionRow.value[i]
    const status = user && original && user.code === original.code ? 'correct' : (user ? 'incorrect' : 'missing')
    items.push({ original, user, status, index: i + 1 })
  }
  return items
})

const aggregate = computed(() => store.aggregateResult)

const memoryDurationMs = computed(() => {
  if (!store.memoryGlobalStart || !store.memoryGlobalEnd) return 0
  return Math.max(0, store.memoryGlobalEnd - store.memoryGlobalStart)
})

const reconstructDurationMs = computed(() => {
  if (!store.reconstructGlobalStart || !store.reconstructGlobalEnd) return 0
  return Math.max(0, store.reconstructGlobalEnd - store.reconstructGlobalStart)
})

// 由于网络延时/页面跳转等原因，展示层做一次校验：
// 若“总用时(按秒)”不等于“记忆+复原(按秒)”，则用总用时反推复原用时，避免用户困惑。
const totalDurationMs = computed(() => {
  const ms = Number(aggregate.value?.totalDurationMs) || 0
  return Math.max(0, ms)
})

const displayReconstructDurationMs = computed(() => {
  const totalSec = Math.floor(totalDurationMs.value / 1000)
  const memorySec = Math.floor(memoryDurationMs.value / 1000)
  const reconstructSec = Math.floor(reconstructDurationMs.value / 1000)

  if (!totalSec) return reconstructDurationMs.value
  if (totalSec === memorySec + reconstructSec) return reconstructDurationMs.value

  const adjustedSec = Math.max(0, totalSec - memorySec)
  return adjustedSec * 1000
})


const formatMMSS = (ms) => {
  const totalSeconds = Math.floor((Number(ms) || 0) / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

const restart = () => {
  store.resetTraining()
  router.push('/marathon/poker/settings')
}

const goHome = () => {
  store.resetTraining()
  router.push('/')
}

const originalScrollRef = ref(null)
const userScrollRef = ref(null)
let syncing = false

const syncScroll = (fromEl, toEl) => {
  if (!fromEl || !toEl) return
  if (syncing) return
  syncing = true
  toEl.scrollLeft = fromEl.scrollLeft
  // 释放标记，避免循环触发，同时保持无肉眼延迟
  setTimeout(() => {
    syncing = false
  }, 10)
}

const onOriginalScroll = (e) => {
  syncScroll(e.target, userScrollRef.value)
}

const onUserScroll = (e) => {
  syncScroll(e.target, originalScrollRef.value)
}

watch(deckIndex, () => {
  // 切换副牌时无需额外处理
})

onMounted(() => {
  if (!store.decks.length) {
    router.replace('/marathon/poker/settings')
    return
  }

  if (store.phase !== 'result' || !store.aggregateResult) {
    router.replace('/marathon/poker/reconstruct')
  }
})
</script>

<template>
  <div class="result-container">
    <div class="header">
      <h2>训练结果</h2>
    </div>

    <main class="result-main">
      <section class="stats-card" v-if="aggregate">
        <div class="stat-row">
          <div class="stat-item">
            <label>总副牌数</label>
            <span class="value primary">{{ aggregate.totalDecks }}</span>
          </div>
          <div class="stat-item">
            <label>全局正确率</label>
            <span class="value primary">{{ aggregate.overallAccuracy }}%</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="result-rows">
          <div class="result-row">
            <div class="result-cell">
              <span class="label">总正确数</span>
              <span class="value success">{{ aggregate.totalCorrect }}</span>
            </div>
            <div class="result-cell">
              <span class="label">总错误数</span>
              <span class="value danger">{{ aggregate.totalError }}</span>
            </div>
            <div class="result-cell">
              <span class="label">总数量</span>
              <span class="value primary">{{ aggregate.totalCards }}</span>
            </div>
          </div>

          <div class="result-row">
            <div class="result-cell">
              <span class="label">总记忆用时</span>
              <span class="value">{{ formatMMSS(memoryDurationMs) }}</span>
            </div>
            <div class="result-cell">
              <span class="label">总复原用时</span>
              <span class="value">{{ formatMMSS(displayReconstructDurationMs) }}</span>
            </div>
            <div class="result-cell">
              <span class="label">总用时</span>
              <span class="value">{{ formatMMSS(totalDurationMs) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-card" v-if="store.deckResults.length">
        <div class="section-title">单副牌成绩</div>
        <div class="deck-list">
          <div class="deck-item" v-for="(r, idx) in store.deckResults" :key="r.deckId">
            <div class="deck-left">第 {{ idx + 1 }} 副</div>
            <div class="deck-mid">{{ r.correct }}/{{ r.total }}（{{ r.accuracy }}%）</div>
            <div class="deck-right">{{ formatMMSS(r.reconstructDurationMs) }}</div>
          </div>
        </div>
      </section>

      <section class="comparison-section" v-if="deck">
        <div class="section-header">
          <h3>对比核对</h3>
          <select v-model.number="deckIndex" class="select">
            <option v-for="opt in deckOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div class="comparison-container">
          <div class="comparison-row">
            <div class="row-label">原始序列</div>
            <div ref="originalScrollRef" class="cards-scroll" @scroll="onOriginalScroll">
              <div
                v-for="(item, idx) in comparison"
                :key="`orig-${idx}`"
                class="card-box"
                :class="{ matched: item.status === 'correct' }"
              >
                <PokerCard
                  :suit="item.original.suit"
                  :rank="item.original.rank"
                  size="small"
                  :isMismatched="item.status !== 'correct'"
                  :isMatched="item.status === 'correct'"
                  :index="item.index"
                />
              </div>
            </div>
          </div>

          <div class="comparison-row">
            <div class="row-label">你的复原</div>
            <div ref="userScrollRef" class="cards-scroll" @scroll="onUserScroll">
              <div
                v-for="(item, idx) in comparison"
                :key="`user-${idx}`"
                class="card-box"
                :class="{ matched: item.status === 'correct' }"
              >
                <PokerCard
                  v-if="item.user"
                  :suit="item.user.suit"
                  :rank="item.user.rank"
                  size="small"
                  :isMismatched="item.status !== 'correct'"
                  :isMatched="item.status === 'correct'"
                  :index="item.index"
                />

                <div v-else class="empty-wrapper">
                  <div class="empty-card"></div>
                  <div class="empty-index" :class="{ ok: item.status === 'correct' }">{{ item.index }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div class="footer">
      <button class="secondary-btn" @click="goHome">返回首页</button>
      <button class="primary-btn" @click="restart">重新训练</button>
    </div>
  </div>
</template>

<style scoped>
.result-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8f3;
  overflow: hidden;
}

.header {
  padding: 15px;
  background: white;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.header h2 {
  margin: 0;
  color: #2c3e50;
}

.result-main {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.section-title {
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item label {
  font-size: 0.8rem;
  color: #627069;
  margin-bottom: 5px;
}

.stat-item .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.value.primary {
  color: #285c48;
}

.value.success {
  color: #285c48;
}

.value.danger {
  color: #e74c3c;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 15px 0;
}

.result-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.result-cell {
  flex: 1 1 0;
  min-width: 140px;
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.result-cell .label {
  color: #627069;
  font-weight: 700;
  font-size: 0.85rem;
}

.result-cell .value {
  font-weight: 800;
}


.deck-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deck-item {
  display: grid;
  grid-template-columns: 80px 1fr 70px;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8f9fa;
}

.deck-left {
  font-weight: 700;
  color: #2c3e50;
}

.deck-mid {
  color: #34495e;
}

.deck-right {
  text-align: right;
  color: #627069;
  font-family: monospace;
}

.comparison-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
}

.select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #2c3e50;
  background: white;
}

.comparison-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row-label {
  color: #627069;
  font-weight: 700;
}

.cards-scroll {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 15px 5px;
  background: #f9f9f9;
  border-radius: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.cards-scroll::-webkit-scrollbar {
  display: none;
}

.card-box {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 50px;
}

.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-card {
  width: 45px;
  height: 65px;
  border-radius: 4px;
  border: 1px dashed #ddd;
  background: #fafafa;
}

.empty-index {
  margin-top: 4px;
  font-size: 12px;
  color: #627069;
  font-family: monospace;
  text-align: center;
}

.empty-index.ok {
  color: #285c48;
  font-weight: 700;
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
  flex: 1;
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

@media (max-width: 600px) {
  .result-cell {
    min-width: 120px;
  }
}
</style>
