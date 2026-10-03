<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonNumberStore } from '../../../store/marathonNumber'

const router = useRouter()
const store = useMarathonNumberStore()

const showHelp = ref(false)

// confirm modal (avoid mis-tap)
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

const segmentOptions = [5, 10, 15, 20, 25, 30]
const memoryOptions = [15, 30, 60]
const groupSizeOptions = Array.from({ length: 10 }, (_, i) => i + 1)

const confirmClearHistory = () => {
  showModal({
    title: '清空历史记录',
    message: '确定要清空全部历史记录吗？该操作不可恢复。',
    confirmText: '确定清空',
    onConfirm: () => store.clearHistory()
  })
}

const confirmDeleteHistory = (id) => {
  showModal({
    title: '删除历史记录',
    message: '确定要删除这条历史记录吗？该操作不可恢复。',
    confirmText: '确定删除',
    onConfirm: () => store.deleteHistory(id)
  })
}


const reconstructDurationMin = computed(() => (Number(store.settings.memoryDurationMin) || 0) * 2)

const startTraining = () => {
  store.initTraining({
    segmentCount: store.settings.segmentCount,
    memoryDurationMin: store.settings.memoryDurationMin,
    enableReview: store.settings.enableReview,
    groupSize: store.settings.groupSize
  })
  store.startMemory()
  router.push('/marathon/number/memory')
}

onMounted(() => {
  store.loadHistory()
})
</script>

<template>
  <div class="training-container">
    <!-- Header (match fast number training) -->
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="router.push('/')">←</button>
      <h2 class="title">马拉松数字训练</h2>
      <button class="help-btn" aria-label="操作说明" @click="showHelp = true">?</button>
    </div>

    <main class="training-main">
      <div class="config-area card">
        <div class="config-header">
          <h3 class="card-header">训练配置</h3>
        </div>

        <div class="config-grid">
          <div class="config-item">
            <label for="segmentCount">分段数量</label>
            <select id="segmentCount" v-model.number="store.settings.segmentCount">
              <option v-for="n in segmentOptions" :key="n" :value="n">{{ n }} 段（共 {{ n * 40 }} 位）</option>
            </select>
            <div class="config-tip">每段 40 位随机数字，按赛事标准分段记忆</div>
          </div>

          <div class="config-item">
            <label for="memoryDuration">记忆时长</label>
            <select id="memoryDuration" v-model.number="store.settings.memoryDurationMin">
              <option v-for="m in memoryOptions" :key="m" :value="m">{{ m }} 分钟</option>
            </select>
            <div class="config-tip">到期自动结束记忆阶段</div>
          </div>

          <div class="config-item">
            <label for="groupSize">分组数量</label>
            <select id="groupSize" v-model.number="store.settings.groupSize">
              <option v-for="n in groupSizeOptions" :key="n" :value="n">{{ n }} 位/组</option>
            </select>
            <div class="config-tip">记忆/结果展示时使用红色竖线分割每组数字（默认 6）</div>
          </div>

          <div class="config-item">
            <label>复原时长</label>
            <div class="readonly-value">{{ reconstructDurationMin }} 分钟</div>
            <div class="config-tip">自动关联：记忆时长 × 2（赛事规则）</div>
          </div>


          <div class="config-item">
            <label>分段复习</label>
            <div class="toggle-row">
              <input id="enableReview" type="checkbox" v-model="store.settings.enableReview" />
              <label for="enableReview" class="toggle-label">开启分段复习</label>
            </div>
            <div class="config-tip">开启后记忆阶段可自由切换分段复习，不中断计时</div>
          </div>
        </div>

        <div class="config-actions">
          <button class="primary-btn start-btn" @click="startTraining">开始训练</button>
        </div>
      </div>

      <!-- History (simple, aligned with fast number style) -->
      <div class="history-area card" v-if="store.history.length">
        <div class="history-header">
          <h3 class="card-header">历史记录</h3>
          <button class="secondary-btn mini clear-btn" @click="confirmClearHistory">清空</button>
        </div>

        <ul class="history-list">
          <li v-for="r in store.history" :key="r.id" class="history-item">
            <div class="history-item-summary">
              <span class="date">{{ r.date }}</span>
              <span>段数: {{ r.segmentCount }}</span>
              <span>总分: <b class="primary">{{ r.totalScore }}</b></span>
              <span>正确位: {{ r.correctDigits }}</span>
            </div>
            <div class="history-item-actions">
              <button class="secondary-btn mini" @click="confirmDeleteHistory(r.id)">删除</button>
            </div>
          </li>
        </ul>
      </div>
    </main>

    <!-- Confirm Modal -->
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

    <!-- Help Modal (match fast number help modal pattern) -->
    <div v-if="showHelp" class="modal-overlay help-overlay" @click.self="showHelp = false">
      <div v-dialog class="modal-content help-modal">
        <h4 class="modal-title">马拉松数字训练 - 操作说明</h4>
        <ul>
          <li><b>1. 配置</b>：设置分段数（每段 40 位）、记忆时长（15/30/60 分钟）、分组数量；复原时长自动为记忆时长×2。</li>
          <li><b>2. 记忆阶段</b>：倒计时进行中可切换分段复习（取决于“分段复习”开关）；到期自动结束，可提前点击“进入复原阶段”。</li>
          <li><b>3. 复原阶段</b>：按段输入 40 位数字；可切换分段修改；“提交当前分段”后该段锁定不可改。</li>
          <li><b>4. 计分规则</b>：每段 40 位：全对=40 分（全对段），1 错=20 分（半对段），≥2 错=0 分（零分段）。总分为各段得分之和。</li>
          <li><b>5. 结果复盘</b>：结果页支持分段折叠/展开对比，正确/错误/未填分别高亮显示。</li>
        </ul>
        <div class="modal-actions">
          <button class="primary-btn" @click="showHelp = false">我明白了</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Layout aligned to fast number training */
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

.title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
}

.icon-btn,
.help-btn {
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

.help-btn {
  font-size: 1.2rem;
  color: #e74c3c;
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
  margin: 0 0 20px 0;
  font-size: 1rem;
  font-weight: bold;
  color: #285c48;
  border-bottom: 1px solid #edf1e8;
  padding-bottom: 10px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
}

.config-item label {
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #627069;
}

.config-item select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
}

.config-tip {
  margin-top: 6px;
  font-size: 0.85rem;
  color: #627069;
}

.readonly-value {
  padding: 10px;
  border: 1px solid #edf1e8;
  border-radius: 6px;
  background: #f8f9fa;
  color: #627069;
  font-weight: 700;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.toggle-label {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 700;
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

.secondary-btn:hover {
  background: #f8f9fa;
  border-color: #627069;
}

.secondary-btn.mini {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.config-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.start-btn {
  width: 100%;
  max-width: 120px;
  padding: 15px;
  font-size: 1.1rem;
}

/* History */
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-header .card-header {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.clear-btn {
  color: #e74c3c;
  border-color: #e74c3c;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 6px;
  border-top: 1px solid #edf1e8;
}

.history-item-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #34495e;
  font-size: 0.9rem;
}

.history-item-summary .date {
  color: #627069;
}

.primary {
  color: #285c48;
}

/* Modal aligned to fast number training */
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

.help-overlay {
  align-items: flex-start;
  padding-top: 70px;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
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

.modal-message {
  margin: 0 0 18px 0;
  font-size: 1rem;
  color: #627069;
  line-height: 1.6;
  text-align: left;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
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
</style>
