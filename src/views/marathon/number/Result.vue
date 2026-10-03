<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonNumberStore } from '../../../store/marathonNumber'

const router = useRouter()
const store = useMarathonNumberStore()

const collapsed = ref({})

const results = computed(() => store.results)

const formattedMemory = computed(() => store.formatTime(results.value.memoryTimeMs || 0))
const formattedReconstruct = computed(() => store.formatTime(results.value.reconstructTimeMs || 0))
const formattedTotal = computed(() => store.formatTime(results.value.totalTimeMs || 0))

const groupSize = computed(() => {
  const n = Number(store.settings.groupSize) || 6
  return Math.max(1, Math.min(10, n))
})

const needGroupSep = (i, len) => {
  return (i + 1) % groupSize.value === 0 && i !== len - 1
}

const toggleSegment = (idx) => {
  collapsed.value[idx] = !collapsed.value[idx]
}


const restart = () => {
  store.resetTraining()
  router.push('/marathon/number/settings')
}

const goHome = () => {
  store.resetTraining()
  router.push('/')
}

const typeText = (t) => {
  if (t === 'perfect') return '全对段'
  if (t === 'half') return '半对段'
  return '零分段'
}

onMounted(() => {
  store.ensureInited()
  if (store.phase !== 'result') {
    // 允许从未结算状态进入时，补一次结算
    store.finalizeToResult()
  }

  // 默认折叠全部（便于大量分段复盘）
  const map = {}
  for (let i = 0; i < (results.value.perSegment || []).length; i++) map[i] = true
  collapsed.value = map
})
</script>

<template>
  <div class="training-container">
    <div class="header">
      <h2 class="title">训练结果</h2>
    </div>

    <main class="training-main">
      <section class="card">
        <h3 class="card-header">汇总统计</h3>

        <div class="score-big">
          <div class="score-label">总得分</div>
          <div class="score-value">{{ results.totalScore }}</div>
        </div>

        <div class="result-rows">
          <div class="result-row">
            <div class="result-cell">
              <span class="label">全对段数</span>
              <span class="result-value success">{{ results.perfectSegments }}</span>
            </div>
            <div class="result-cell">
              <span class="label">半对段数</span>
              <span class="result-value warn">{{ results.halfSegments }}</span>
            </div>
            <div class="result-cell">
              <span class="label">零分段数</span>
              <span class="result-value danger">{{ results.zeroSegments }}</span>
            </div>
          </div>

          <div class="result-row">
            <div class="result-cell">
              <span class="label">总正确位数</span>
              <span class="result-value primary">{{ results.correctDigits }}</span>
            </div>
            <div class="result-cell">
              <span class="label">分段数量</span>
              <span class="result-value primary">{{ store.segmentCount }}</span>
            </div>
            <div class="result-cell">
              <span class="label">每段位数</span>
              <span class="result-value">40</span>
            </div>
          </div>

          <div class="result-row">
            <div class="result-cell">
              <span class="label">记忆用时</span>
              <span class="result-value">{{ formattedMemory }}</span>
            </div>
            <div class="result-cell">
              <span class="label">复原用时</span>
              <span class="result-value">{{ formattedReconstruct }}</span>
            </div>
            <div class="result-cell">
              <span class="label">总用时</span>
              <span class="result-value">{{ formattedTotal }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="compare-header">
          <h3 class="card-header" style="margin-bottom:0">分段对比核对</h3>
          <div class="compare-tip">点击分段可展开/折叠</div>
        </div>

        <div class="segment-list">
          <div v-for="seg in results.perSegment" :key="seg.index" class="segment-item">
            <button class="segment-title" @click="toggleSegment(seg.index)">
              <div class="left">
                <span class="seg-no">第 {{ seg.index + 1 }} 段</span>
                <span class="badge" :class="seg.type">{{ typeText(seg.type) }}</span>
                <span class="score">得分 {{ seg.score }}</span>
              </div>
              <div class="right">{{ collapsed[seg.index] ? '展开' : '收起' }}</div>
            </button>

            <div v-show="!collapsed[seg.index]" class="segment-body">
              <div class="scroll-box">
                <div class="row">
                  <div class="row-label">原始序列</div>
                  <div class="digits">
                    <template v-for="(it, i) in seg.comparison" :key="`o-${seg.index}-${i}`">
                      <span class="digit" :class="it.status">{{ it.original }}</span>
                      <span v-if="needGroupSep(i, seg.comparison.length)" class="group-sep">|</span>
                    </template>
                  </div>
                </div>
                <div class="row">
                  <div class="row-label">你的复原</div>
                  <div class="digits">
                    <template v-for="(it, i) in seg.comparison" :key="`u-${seg.index}-${i}`">
                      <span class="digit" :class="it.status">{{ it.user }}</span>
                      <span v-if="needGroupSep(i, seg.comparison.length)" class="group-sep">|</span>
                    </template>
                  </div>
                </div>
              </div>

              <div class="segment-stats">
                <span>正确 {{ seg.correct }}/40</span>
                <span>错误 {{ seg.errors }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="control-area">
        <button class="secondary-btn" @click="goHome">返回首页</button>
        <button class="primary-btn" @click="restart">重新训练</button>
      </div>
    </main>
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
  justify-content: center;
  align-items: center;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
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

.score-big {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0 16px;
}

.score-label {
  color: #627069;
  font-weight: 700;
}

.score-value {
  font-size: 2.6rem;
  font-weight: 900;
  color: #285c48;
  font-family: monospace;
  margin-top: 4px;
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
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.result-cell .label {
  color: #627069;
  font-weight: 700;
  font-size: 0.9rem;
}

.result-value {
  font-weight: 800;
  font-family: monospace;
  color: #2c3e50;
}

.result-value.success {
  color: #285c48;
}

.result-value.warn {
  color: #f39c12;
}

.result-value.danger {
  color: #e74c3c;
}

.result-value.primary {
  color: #285c48;
}

.compare-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.compare-tip {
  color: #627069;
  font-size: 0.85rem;
}

.segment-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.segment-item {
  border: 1px solid #edf1e8;
  border-radius: 12px;
  overflow: hidden;
}

.segment-title {
  width: 100%;
  border: none;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
}

.segment-title .left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.seg-no {
  font-weight: 800;
  color: #2c3e50;
}

.badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  color: white;
}

.badge.perfect {
  background: #285c48;
}

.badge.half {
  background: #f39c12;
}

.badge.zero {
  background: #e74c3c;
}

.score {
  color: #285c48;
  font-weight: 800;
}

.segment-title .right {
  color: #627069;
  font-weight: 800;
}

.segment-body {
  background: #fafbfc;
  padding: 12px 14px;
}

.scroll-box {
  overflow-x: auto;
  padding-bottom: 6px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.row-label {
  font-size: 0.9rem;
  color: #627069;
  font-weight: 700;
}

.digits {
  display: inline-flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.group-sep {
  display: inline-flex;
  align-items: center;
  font-family: monospace;
  font-weight: 900;
  color: #e74c3c;
  padding: 0 2px;
}


.digit {
  width: 26px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: 800;
  font-family: monospace;
}

.digit.correct {
  color: #285c48;
}

.digit.incorrect {
  color: #e74c3c;
  text-decoration: line-through;
}

.digit.missing {
  color: #f39c12;
  background: #fdf3e1;
}

.segment-stats {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  color: #627069;
  font-weight: 700;
  font-size: 0.9rem;
}

.control-area {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
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
  flex: 1;
  min-width: 180px;
}

.primary-btn:hover {
  background: #204b3b;
}

.secondary-btn {
  border: 1px solid #285c48;
  background: white;
  color: #285c48;
  flex: 1;
  min-width: 140px;
}

@media (max-width: 600px) {
  .result-cell {
    min-width: 120px;
  }
}
</style>
