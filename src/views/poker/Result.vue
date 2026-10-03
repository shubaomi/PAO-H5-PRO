<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePokerStore } from '../../store'
import PokerCard from '../../components/PokerCard.vue'


const router = useRouter()
const store = usePokerStore()

const shuffledCards = store.shuffledCards
const reconstructedCards = store.reconstructedCards

const origScrollRef = ref(null)
const reconScrollRef = ref(null)
let syncing = false

const syncScroll = (from) => {
  if (syncing) return
  syncing = true
  const source = from === 'orig' ? origScrollRef.value : reconScrollRef.value
  const target = from === 'orig' ? reconScrollRef.value : origScrollRef.value
  if (source && target) {
    target.scrollLeft = source.scrollLeft
  }
  requestAnimationFrame(() => { syncing = false })
}


const result = computed(() => {
  let correct = 0
  const comparison = []
  
  // Compare up to 52 cards
  for (let i = 0; i < 52; i++) {
    const original = shuffledCards[i]
    const reconstructed = reconstructedCards[i]
    
    const isMatch = original && reconstructed && 
                    original.suit === reconstructed.suit && 
                    original.rank === reconstructed.rank
    
    if (isMatch) correct++
    
    comparison.push({
      original,
      reconstructed,
      isMatch
    })
  }
  
  return {
    correct,
    incorrect: 52 - correct,
    accuracy: ((correct / 52) * 100).toFixed(1),
    comparison
  }
})

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10)
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}`
}

const restart = () => {
  router.push('/poker/memory')
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="result-container">
    <div class="header">
      <h2>训练结果</h2>
    </div>

    <main class="result-main">
      <section class="stats-card">
        <div class="stat-row">
          <div class="stat-item">
            <label>记忆时间</label>
            <span class="value">{{ formatTime(store.memoryTime) }}s</span>
          </div>
          <div class="stat-item">
            <label>复原时间</label>
            <span class="value">{{ formatTime(store.reconstructTime) }}s</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="stat-grid">
          <div class="stat-mini">
            <label>正确数量</label>
            <span class="value success">{{ result.correct }}</span>
          </div>
          <div class="stat-mini">
            <label>错误数量</label>
            <span class="value danger">{{ result.incorrect }}</span>
          </div>
          <div class="stat-mini">
            <label>正确率</label>
            <span class="value primary">{{ result.accuracy }}%</span>
          </div>
        </div>
      </section>

      <section class="comparison-section">
        <h3>详细核对</h3>
        <div class="comparison-container">
          <!-- Original Row -->
          <div class="comparison-row">
            <div class="row-label">原始序列</div>
            <div class="cards-scroll" ref="origScrollRef" @scroll="() => syncScroll('orig')">
              <div 
                v-for="(item, index) in result.comparison" 
                :key="'orig-'+index" 
                class="card-box" 
                :class="{ matched: item.isMatch }"
              >
                <PokerCard 
                  v-if="item.original"
                  :suit="item.original.suit" 
                  :rank="item.original.rank" 
                  size="small"
                  :isMismatched="!item.isMatch"
                />
                <div v-else class="empty-card"></div>
                <div class="index" :class="{ matched: item.isMatch }">{{ index + 1 }}</div>
              </div>
            </div>

          </div>

          <!-- Reconstructed Row -->
          <div class="comparison-row">
            <div class="row-label">你的复原</div>
            <div class="cards-scroll" ref="reconScrollRef" @scroll="() => syncScroll('recon')">
              <div 
                v-for="(item, index) in result.comparison" 
                :key="'recon-'+index" 
                class="card-box" 
                :class="{ matched: item.isMatch }"
              >
                <PokerCard 
                  v-if="item.reconstructed"
                  :suit="item.reconstructed.suit" 
                  :rank="item.reconstructed.rank" 
                  size="small"
                  :isMismatched="!item.isMatch"
                />
                <div v-else class="empty-card"></div>
                <div class="index" :class="{ matched: item.isMatch }">{{ index + 1 }}</div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>

    <div class="footer">
      <button class="secondary-btn" @click="goHome">返回首页</button>
      <button class="primary-btn" @click="restart">再次训练</button>
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
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 15px 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-mini label {
  font-size: 0.7rem;
  color: #627069;
}

.stat-mini .value {
  font-size: 1.2rem;
  font-weight: bold;
}

.value.success { color: #285c48; }
.value.danger { color: #e74c3c; }
.value.primary { color: #285c48; }

.comparison-section h3 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.comparison-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  padding: 15px;
  border-radius: 12px;
}

.comparison-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #627069;
}

.cards-scroll {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 15px 5px;
  background: #f9f9f9;
  border-radius: 8px;
}

.card-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 50px;
}

.card-box.matched :deep(.poker-card) {
  border: 2px solid #285c48;
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2);
}

.index.matched {
  color: #285c48;
  font-weight: 700;
}


.empty-card {
  width: 50px;
  height: 75px;
  background: #eee;
  border-radius: 4px;
  border: 1px dashed #ccc;
}

.index {
  font-size: 0.7rem;
  color: #627069;
}

.footer {
  padding: 15px;
  background: white;
  display: flex;
  gap: 15px;
}

.primary-btn {
  flex: 2;
  background: #285c48;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
}

.secondary-btn {
  flex: 1;
  background: white;
  color: #285c48;
  border: 1px solid #285c48;
  padding: 12px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
}
@media (max-width: 600px) {
  .stat-item .value {
    font-size: 1.2rem;
  }
  
  .stat-grid {
    gap: 5px;
  }
  
  .stat-mini .value {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .result-main {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }
}
</style>

