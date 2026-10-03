<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonPokerStore } from '../../../store/marathonPoker'

const router = useRouter()
const store = useMarathonPokerStore()

const totalDecks = ref(store.settings.totalDecks || 2)
const groupSize = ref(store.settings.groupSize || 3)

const showHelp = ref(false)

const estimateMinutes = computed(() => totalDecks.value * 5)

const startTraining = () => {
  store.updateSettings({
    totalDecks: totalDecks.value,
    groupSize: groupSize.value,
    memoryDuration: 0
  })

  store.initDecks(totalDecks.value, 'random')
  store.startMemorize()
  router.push('/marathon/poker/memory')
}

const goHome = () => {
  router.push('/')
}

const openHelp = (e) => {
  e.stopPropagation()
  showHelp.value = true
}

const closeHelp = () => {
  showHelp.value = false
}
</script>

<template>
  <div class="marathon-settings-container" @click="closeHelp">
    <header class="header">
      <button class="icon-btn" aria-label="返回" @click.stop="goHome">←</button>
      <div class="header-center">
        <div class="title">马拉松扑克训练</div>
        <div class="subtitle">逐副完成记忆，再逐副复原并提交全部结果</div>
      </div>
      <button class="help-btn" aria-label="操作说明" @click="openHelp">?</button>
    </header>

    <div class="settings-card">
      <div class="setting-item">
        <label>总副牌数：{{ totalDecks }} 副</label>
        <input type="range" min="2" max="10" step="1" aria-label="总副牌数" v-model.number="totalDecks" />
        <div class="range-tips">
          <span>2 副</span>
          <span>10 副</span>
        </div>
      </div>

      <div class="setting-item">
        <label>分组大小：{{ groupSize }} 张/组</label>
        <input type="range" min="2" max="6" step="1" aria-label="分组大小" v-model.number="groupSize" />
        <div class="range-tips">
          <span>2</span>
          <span>6</span>
        </div>
      </div>

      <div class="estimate">预计记忆时间：约 {{ estimateMinutes }} 分钟</div>

      <button class="primary-btn" @click="startTraining">开始训练</button>
    </div>

    <Transition name="fade">
      <div v-if="showHelp" class="modal-overlay help-overlay" @click.self="closeHelp">
        <div v-dialog class="modal-content help-modal" @click.stop>
          <h4 class="modal-title">马拉松扑克训练 - 操作说明</h4>
          <ul>
            <li><b>1. 设置</b>：选择副牌数与分组大小，然后点击“开始训练”。</li>
            <li><b>2. 记忆</b>：按组浏览当前副牌；可通过“副牌”下拉切换任意副牌回看；完成一副后点击“完成本副记忆”。</li>
            <li><b>3. 复原</b>：填满 52 张后提交本副；可通过“副牌”下拉切换任意副牌复原；所有副牌都提交后才可提交全部。</li>
            <li><b>4. 结果</b>：查看全局正确率、用时与单副成绩，并在对比区核对原始序列与复原结果。</li>
          </ul>
          <div class="modal-actions">
            <button class="primary-btn" @click="closeHelp">我明白了</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.marathon-settings-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border-radius: 12px;
  margin-bottom: 16px;
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

.icon-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
}

.help-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #e74c3c;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.setting-item label {
  display: block;
  margin-bottom: 10px;
  color: #2c3e50;
  font-weight: 600;
}

.setting-item input[type="range"] {
  width: 100%;
}

.range-tips {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #627069;
}

.estimate {
  color: #627069;
  font-size: 0.95rem;
}

.primary-btn {
  height: 44px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  background: linear-gradient(135deg, #285c48, #204b3b);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  padding: 20px;
}

.help-overlay {
  align-items: flex-start;
  padding-top: 70px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.help-modal {
  padding: 24px;
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
  margin: 0;
}

.help-modal li {
  margin-bottom: 8px;
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}



.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
