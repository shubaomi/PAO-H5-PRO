哼却<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNumberTrainingStore } from '../../store/numberTraining';

const router = useRouter();
const route = useRoute();
const store = useNumberTrainingStore();

// --- Reusable Composables (integrated in-component for simplicity) ---

// 1. Toast Notification Logic
const toasts = ref([]);
let toastId = 0;
function addToast(message, type = 'success') {
  const id = toastId++;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
}

// 2. Modal Logic
const defaultModal = {
  show: false,
  title: '',
  message: '',
  onConfirm: null,
  onCancel: null,
  confirmText: '确定',
  cancelText: '取消'
};

const modal = ref({ ...defaultModal });

function showModal(config) {
  modal.value = { ...defaultModal, ...config, show: true };
}



function handleModalConfirm() {
  const confirm = modal.value.onConfirm;
  modal.value.show = false;
  if (confirm) confirm();
}

function handleModalCancel() {
  const cancel = modal.value.onCancel;
  modal.value.show = false;
  if (cancel) cancel();
}



// 3. Help/Instructions Modal
const showHelp = ref(false);

function hardResetPageState() {
  clearInterval(timerInterval.value);
  stopRecallTimer();

  hasEnded.value = false;
  generatedLocked.value = false;
  collapsedConfig.value = false;
  selectedSlot.value = 0;

  trainingStartAt.value = 0;
  recallStartAt.value = 0;
  recallElapsedMs.value = 0;
  totalTimeMs.value = 0;

  // UI overlays
  modal.value = { ...defaultModal };
  showHelp.value = false;
  toasts.value = [];
  toastId = 0;

  // reset store to defaults
  store.$reset();
}


// --- Component State & Logic ---

const timerInterval = ref(null);
const hasEnded = ref(false);
const generatedLocked = ref(false);
const collapsedConfig = ref(false);
const slotContainerRef = ref(null);
const slotRefs = ref([]);
const selectedSlot = ref(0);

// Total time (memory + recall) for result display
const trainingStartAt = ref(0);
const totalTimeMs = ref(0);
const recallStartAt = ref(0);

// Recall stage timer (stopwatch)
const recallTimerInterval = ref(null);
const recallElapsedMs = ref(0);


const formatDuration = (ms) => {
  const totalSeconds = Math.floor((Number(ms) || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return hours === '00' ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
};

const formattedTotalTime = computed(() => formatDuration(totalTimeMs.value || store.results.totalTimeMs || 0));
const formattedMemoryTime = computed(() => formatDuration(store.results.memoryTimeMs || 0));
const formattedRecallTime = computed(() => formatDuration(store.results.recallTimeMs || 0));
const formattedRecallElapsed = computed(() => formatDuration(recallElapsedMs.value || 0));

function startRecallTimer() {
  clearInterval(recallTimerInterval.value);
  recallTimerInterval.value = setInterval(() => {
    if (!recallStartAt.value) return;
    recallElapsedMs.value = Math.max(0, Date.now() - recallStartAt.value);
  }, 1000);
}

function stopRecallTimer() {
  clearInterval(recallTimerInterval.value);
  recallTimerInterval.value = null;
}


const generatedNumberGroups = computed(() => formatGrouped(store.generatedNumber));

// --- Memory display: render as numbered lines (stable line indices while vertical scrolling) ---
const numberDisplayRef = ref(null);
const charMeasureRef = ref(null);
const displayWidthPx = ref(0);
const charWidthPx = ref(0);
let numberDisplayResizeObserver = null;

const updateDisplayMetrics = () => {
  const el = numberDisplayRef.value;
  displayWidthPx.value = el ? el.clientWidth : 0;

  const m = charMeasureRef.value;
  const rect = m ? m.getBoundingClientRect() : null;
  charWidthPx.value = rect ? rect.width : 0;
};

const groupsPerLine = computed(() => {
  const width = Number(displayWidthPx.value) || 0;
  const charW = Number(charWidthPx.value) || 0;
  if (!width || !charW) return 3;

  // 行号固定占位，确保两位数/三位数行号不会挤压首位数字对齐
  const lineNoPx = 46; // 约等于 3~4ch + padding
  const usablePx = Math.max(0, width - lineNoPx - 10);
  const usableChars = Math.floor(usablePx / charW);

  const rawSize = Number(store.settings.groupSize) || 4;
  const groupSize = Math.min(50, Math.max(1, rawSize));
  const estCharsPerGroup = groupSize + 2; // 数字 + 竖线 + 间隔

  return Math.max(1, Math.floor(usableChars / estCharsPerGroup));
});

const generatedNumberLines = computed(() => {
  const groups = generatedNumberGroups.value || [];
  const perLine = Math.max(1, Number(groupsPerLine.value) || 1);
  const lines = [];
  for (let i = 0; i < groups.length; i += perLine) {
    lines.push(groups.slice(i, i + perLine));
  }
  return lines;
});
const slotValues = computed(() => {
  const len = store.generatedNumber.length;
  const filled = store.userInput.slice(0, len).split('').map(ch => ch === ' ' ? '' : ch);
  const arr = Array.from({ length: len }, (_, i) => filled[i] || '');
  return arr;
});

const isTraining = computed(() => ['memorizing', 'recalling'].includes(store.trainingStatus));




const isMemorizing = computed(() => store.trainingStatus === 'memorizing');
const isRecalling = computed(() => store.trainingStatus === 'recalling');
const isFinished = computed(() => store.trainingStatus === 'finished');
const isConfigLocked = computed(() => isTraining.value || isFinished.value);
const groupSizeOptions = computed(() => Array.from({ length: 9 }, (_, i) => i + 2));




const formattedTime = computed(() => {

  if (store.timer.remainingTime < 0) return '00:00';
  const totalSeconds = Math.ceil(store.timer.remainingTime / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

const userInputCount = computed(() => store.userInput.replace(/\s+/g, '').length);

const inputProgress = computed(() => ({
  current: userInputCount.value,
  total: store.generatedNumber.length,
  completed: userInputCount.value >= store.generatedNumber.length && store.generatedNumber.length > 0
}));





function formatGrouped(str) {
  // 以“组”为原子单位展示，避免同组数字被拆成两行
  const rawSize = Number(store.settings.groupSize) || 4;
  const groupSize = Math.min(50, Math.max(1, rawSize));
  const groups = [];

  for (let i = 0; i < (str || '').length; i += groupSize) {
    groups.push(String(str).slice(i, i + groupSize));
  }

  return groups;
}


// --- Core Functions ---

function onGenerateClick(event) {
  event?.target?.blur();
  generateNumber();
}

function generateNumber() {
  const { length, mode } = store.settings;
  if (mode === 'no-repeat' && length > 10) {
    addToast('无重复模式下长度不能超过10', 'error');
    return;
  }

  let numberStr = '';
  if (mode === 'no-repeat') {
    const digits = Array.from({length: 10}, (_, i) => i);
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      numberStr += digits.splice(randomIndex, 1)[0];
    }
  } else {
    for (let i = 0; i < length; i++) {
      numberStr += Math.floor(Math.random() * 10);
    }
  }
  store.generatedNumber = numberStr;
  store.userInput = '';
  store.trainingStatus = 'idle';
  generatedLocked.value = true;
  addToast('新的随机数字已生成!');
}


function startTraining() {
  if (!store.generatedNumber) {
    addToast('请先生成随机数字', 'error');
    return;
  }
  collapsedConfig.value = true;
  hasEnded.value = false;
  store.trainingStatus = 'memorizing';

  // reset timers
  stopRecallTimer();
  recallElapsedMs.value = 0;

  trainingStartAt.value = Date.now();
  recallStartAt.value = 0;
  totalTimeMs.value = 0;

  store.results.memoryTimeMs = 0;
  store.results.recallTimeMs = 0;
  store.results.totalTimeMs = 0;


  store.timer.remainingTime = store.settings.duration * 60 * 1000;
  store.timer.isActive = true;
  store.timer.isPaused = false;

  timerInterval.value = setInterval(() => {
    if (hasEnded.value) {
      clearInterval(timerInterval.value);
      return;
    }
    store.timer.remainingTime -= 1000;
    if (store.timer.remainingTime <= 0) {
      store.timer.remainingTime = 0;
      endTraining('auto');
    }
  }, 1000);
}


function pauseTraining() {
  store.timer.isPaused = true;
  clearInterval(timerInterval.value);
}

function resumeTraining() {
  store.timer.isPaused = false;
  startInterval(); // Use a shared interval logic
}

function endTraining(source = 'manual') {
  if (hasEnded.value) return;
  if (source === 'manual') {
    clearInterval(timerInterval.value);
    store.timer.isPaused = true;
    showModal({
      title: '结束记忆',
      message: '确定要结束记忆并进入回忆阶段吗？',
      onConfirm: () => switchToRecalling(),
      onCancel: () => {
        store.timer.isPaused = false;
        startInterval();
      }
    });
    return;
  }
  hasEnded.value = true;
  switchToRecalling();
  if (source === 'auto') addToast('记忆时间到!', 'info');
}

function switchToRecalling() {
  hasEnded.value = true;
  clearInterval(timerInterval.value);
  store.timer.isActive = false;
  store.timer.remainingTime = Math.max(0, store.timer.remainingTime);
  store.trainingStatus = 'recalling';

  if (!recallStartAt.value) recallStartAt.value = Date.now();
  recallElapsedMs.value = 0;
  startRecallTimer();

  selectedSlot.value = 0;
  focusFirstEmpty();
}




function startInterval() {
    timerInterval.value = setInterval(() => {
        if (hasEnded.value) {
            clearInterval(timerInterval.value);
            return;
        }
        store.timer.remainingTime -= 1000;
        if (store.timer.remainingTime <= 0) {
            store.timer.remainingTime = 0;
            endTraining('auto');
        }
    }, 1000);
}


function submitAnswer() {
    const { current, total } = inputProgress.value;
    const msg = current < total && total > 0
      ? `已输入 ${current}/${total} 位，尚未完成全部输入，确定提交吗？`
      : '确定要提交当前答案进行核对吗？';
    showModal({
        title: '提交答案',
        message: msg,
        confirmText: '确定',
        onConfirm: () => {
            hasEnded.value = true;
            stopRecallTimer();

            const endAt = Date.now();
            const startAt = trainingStartAt.value || endAt;
            const recallStart = recallStartAt.value || endAt;

            const memoryMs = Math.max(0, recallStart - startAt);
            const recallMs = Math.max(0, endAt - recallStart);

            // 统计区只展示到“秒”，因此先截断到秒再相加，保证：
            // 显示的总用时 = 显示的记忆用时 + 显示的复原用时
            const memoryDisplayMs = Math.floor(memoryMs / 1000) * 1000;
            const recallDisplayMs = Math.floor(recallMs / 1000) * 1000;
            const totalDisplayMs = Math.max(0, memoryDisplayMs + recallDisplayMs);

            totalTimeMs.value = totalDisplayMs;
            store.results.memoryTimeMs = memoryDisplayMs;
            store.results.recallTimeMs = recallDisplayMs;
            store.results.totalTimeMs = totalDisplayMs;

            store.trainingStatus = 'finished';
            calculateResults();
        }
    });
}




function calculateResults() {
  const original = store.generatedNumber;
  const userInput = store.userInput.replace(/\s+/g, '');
  const len = Math.max(original.length, userInput.length);
  let correctCount = 0;
  let comparison = [];

  for (let i = 0; i < len; i++) {
    const originalChar = original[i];
    const userChar = userInput[i];

    if (originalChar !== undefined && userChar !== undefined) {
      if (originalChar === userChar) {
        correctCount++;
        comparison.push({ original: originalChar, user: userChar, status: 'correct' });
      } else {
        comparison.push({ original: originalChar, user: userChar, status: 'incorrect' });
      }
    } else if (originalChar !== undefined) {
      comparison.push({ original: originalChar, user: '-', status: 'missing' });
    } else {
      comparison.push({ original: '-', user: userChar, status: 'extra' });
    }
  }
  store.results.correctCount = correctCount;
  store.results.errorCount = original.length - correctCount;
  store.results.accuracy = original.length > 0 ? (correctCount / original.length) * 100 : 0;
  store.results.score = correctCount;
  store.results.comparison = comparison;
}

function resetTraining() {
    showModal({
        title: '重新开始训练',
        message: '确定要重新开始吗？当前进度和结果将被清空。',
        confirmText: '确定重新开始',
        onConfirm: () => {
            clearInterval(timerInterval.value);
            stopRecallTimer();

            hasEnded.value = false;
            generatedLocked.value = false;
            collapsedConfig.value = false;
            selectedSlot.value = 0;
            store.$reset();
            trainingStartAt.value = 0;
            recallStartAt.value = 0;
            recallElapsedMs.value = 0;
            totalTimeMs.value = 0;
            addToast('训练已重新开始', 'info');
        }
    });
}





// --- History Logic ---
const HISTORY_KEY = 'fast_number_history';
const history = ref([]);
const collapsedHistory = ref(true);


function loadHistory() {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) history.value = JSON.parse(data);
}

function saveHistory() {
    const newRecord = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        length: store.settings.length,
        accuracy: store.results.accuracy,
        score: store.results.score,
        details: {
            generatedNumber: store.generatedNumber,
            userInput: store.userInput
        }
    };
    history.value.unshift(newRecord);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value));
    collapsedHistory.value = false;
    addToast('记录已保存!');
}


function deleteHistory(id) {
    showModal({
        title: '删除记录',
        message: '确定要删除这条历史记录吗？',
        confirmText: '确定',
        onConfirm: () => {
            history.value = history.value.filter(record => record.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value));
            addToast('记录已删除', 'info');
        }
    });
}


function clearHistory() {
    showModal({
        title: '清空历史记录',
        message: '确定要清空所有历史记录吗？此操作不可撤销。',
        confirmText: '全部清空',
        onConfirm: () => {
            history.value = [];
            localStorage.removeItem(HISTORY_KEY);
            addToast('历史记录已清空', 'info');
        }
    });
}

// --- Utility Functions ---
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        addToast('已复制到剪贴板');
    }).catch(() => {
        addToast('复制失败', 'error');
    });
}




function focusFirstEmpty() {


  const arr = slotValues.value;
  const firstEmpty = arr.findIndex(v => !v);
  if (firstEmpty !== -1) selectSlot(firstEmpty, true);
}

function selectSlot(idx, scroll = false) {
  if (idx < 0 || idx >= store.generatedNumber.length) return;
  selectedSlot.value = idx;
  nextTick(() => {
    if (scroll) scrollToSlot(idx);
  });
}

function scrollToSlot(idx) {
  const el = slotRefs.value[idx];
  const container = slotContainerRef.value;
  if (!el || !container) return;
  const rect = el.getBoundingClientRect();
  const crect = container.getBoundingClientRect();
  if (rect.top < crect.top || rect.bottom > crect.bottom) {
    const offset = rect.top - crect.top - 10;
    container.scrollTop += offset;
  }
}

function resetRecall() {
  store.userInput = ''.padEnd(store.generatedNumber.length, ' ').trimEnd();
  selectedSlot.value = 0;
  nextTick(() => scrollToSlot(0));
}

function handleDigitInput(digit) {

  const len = store.generatedNumber.length;
  if (len === 0) return;
  if (selectedSlot.value < 0) return;
  const idx = selectedSlot.value;
  const arr = [...slotValues.value];
  const wasFilled = !!arr[idx];
  arr[idx] = digit;
  store.userInput = arr.map(v => v || ' ').join('');

  if (arr.every(v => v)) {
    selectSlot(idx, true);
    return;
  }

  // 若原本已有数字，则保持在当前槽位；否则沿用原有自动跳未填逻辑
  if (wasFilled) {
    selectSlot(idx, true);
    return;
  }


  const nextEmpty = (() => {
    for (let i = idx + 1; i < arr.length; i++) if (!arr[i]) return i;
    for (let i = 0; i < idx; i++) if (!arr[i]) return i;
    return -1;
  })();

  if (nextEmpty !== -1) {
    selectSlot(nextEmpty, true);
  } else {
    selectSlot(idx, true);
  }
}









onMounted(() => {
  // 从首页进入时，强制恢复到最初始状态
  if (route.query?.fresh) {
    hardResetPageState();
    // 清掉标记，避免后续刷新/返回重复触发
    router.replace({ path: route.path, query: {} });
  }

  loadHistory();

  nextTick(() => {
    updateDisplayMetrics();
    if (typeof ResizeObserver !== 'undefined') {
      numberDisplayResizeObserver = new ResizeObserver(() => updateDisplayMetrics());
      if (numberDisplayRef.value) numberDisplayResizeObserver.observe(numberDisplayRef.value);
    }
    window.addEventListener('resize', updateDisplayMetrics, { passive: true });
  });
});

onBeforeUnmount(() => {
  if (numberDisplayResizeObserver) numberDisplayResizeObserver.disconnect();
  numberDisplayResizeObserver = null;
  window.removeEventListener('resize', updateDisplayMetrics);

  clearInterval(timerInterval.value);
  stopRecallTimer();
});


</script>

<template>
  <div class="training-container">
    <!-- Header -->
    <div class="header">
      <button class="icon-btn" aria-label="返回" @click="router.push('/')">←</button>
      <h2 class="title">快速数字训练</h2>
      <button class="help-btn" aria-label="操作说明" @click="showHelp = true">?</button>
    </div>

    <!-- Main Content -->
    <main class="training-main">
      <!-- Config Area -->
      <div class="config-area card" :class="{ collapsed: collapsedConfig }">
        <div class="config-header">
          <h3 class="card-header">训练配置</h3>
          <button class="secondary-btn mini" @click="collapsedConfig = !collapsedConfig">{{ collapsedConfig ? '展开' : '收起' }}</button>
        </div>
        <Transition name="fade">
          <div v-show="!collapsedConfig">
            <div class="config-grid" :class="{ 'disabled': isConfigLocked }">
              <div class="config-item">
                <label for="num-length">数字长度</label>
                <input type="number" id="num-length" v-model.number="store.settings.length" min="10" max="200" step="10" :disabled="isConfigLocked">
              </div>
              <div class="config-item">
                <label for="train-duration">训练时长 (分钟)</label>
                <input type="number" id="train-duration" v-model.number="store.settings.duration" min="1" max="10" step="1" :disabled="isConfigLocked">
              </div>
              <div class="config-item">
                <label for="gen-mode">生成模式</label>
                <select id="gen-mode" v-model="store.settings.mode" :disabled="isConfigLocked">
                  <option value="random">纯随机数字</option>
                  <option value="no-repeat" :disabled="store.settings.length > 10">无重复数字</option>
                </select>
              </div>
              <div class="config-item">
                <label for="group-size">分组数量</label>
                <select id="group-size" v-model.number="store.settings.groupSize" :disabled="isConfigLocked">
                  <option v-for="n in groupSizeOptions" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
            <div class="config-actions">
              <button class="primary-btn" :class="{ 'generated-btn': !!store.generatedNumber }" @click="onGenerateClick" :disabled="isConfigLocked || isTraining || generatedLocked">生成随机数字</button>
              <button class="secondary-btn" @click="resetTraining" :disabled="isTraining">重新开始</button>
            </div>
          </div>
        </Transition>
      </div>






      <!-- Training Area -->
      <div class="training-area card" v-if="store.trainingStatus !== 'idle'">
        <div class="training-header" v-if="isMemorizing">
            <span class="timer-display">{{ formattedTime }}</span>
        </div>
        <div class="number-display-wrapper" v-show="isMemorizing || (isFinished && store.generatedNumber)">
          <div ref="numberDisplayRef" class="number-lines">
            <div v-for="(line, lineIdx) in generatedNumberLines" :key="`line-${lineIdx}`" class="number-line">
              <div class="line-no">{{ lineIdx + 1 }}</div>
              <div class="line-content">
                <span
                  v-for="(group, index) in line"
                  :key="`g-${lineIdx}-${index}`"
                  class="digit-group"
                  :class="{ oversized: String(group).length > 20 }"
                >
                  <span class="group-digits">{{ group }}</span>
                  <span class="group-sep">|</span>
                </span>
              </div>
            </div>
            <!-- hidden measure element: used to estimate monospace char width -->
            <span ref="charMeasureRef" class="char-measure">0</span>
          </div>
        </div>

        <div v-if="isRecalling" class="recall-prompt">请在下方输入你记忆的数字</div>
        <div class="slot-input-wrapper" v-if="isRecalling">
          <div class="slot-header">
            <span class="slot-progress">进度：{{ inputProgress.current }} / {{ inputProgress.total }}</span>
            <span class="slot-recall-timer">复原：{{ formattedRecallElapsed }}</span>
            <button class="secondary-btn mini" @click="focusFirstEmpty">跳到未填</button>
          </div>
          <div class="slot-grid" ref="slotContainerRef">
            <div
              v-for="(val, idx) in slotValues"
              :key="idx"
              :ref="el => slotRefs[idx] = el"
              class="slot-item" role="button" tabindex="0" :aria-label="`第 ${idx + 1} 位：${val || '未填写'}`" @keydown.enter.prevent="$event.currentTarget.click()" @keydown.space.prevent="$event.currentTarget.click()"
              :class="{ selected: selectedSlot === idx, filled: !!val }"
              @click="selectSlot(idx, true)"
            >
              <div class="slot-value">{{ val || '' }}</div>
              <div class="slot-index">{{ idx + 1 }}</div>
            </div>
          </div>
          <div class="keypad">
            <button
              v-for="digit in 10"
              :key="digit"
              class="keypad-btn"
              @click="handleDigitInput((digit % 10).toString())"
            >{{ digit % 10 }}</button>
          </div>
        </div>



      </div>

      <!-- Control Area -->
      <div class="control-area">
        <button v-if="store.trainingStatus === 'idle'" class="primary-btn start-btn" :disabled="!store.generatedNumber" @click="startTraining">{{ store.generatedNumber ? '开始训练' : '请先生成随机数字' }}</button>
        <template v-if="isMemorizing">
            <button v-if="!store.timer.isPaused" class="primary-btn" @click="pauseTraining">暂停训练</button>
            <button v-if="store.timer.isPaused" class="primary-btn resume-btn" @click="resumeTraining">继续训练</button>
            <button class="secondary-btn" @click="endTraining('manual')">结束记忆</button>
        </template>

        <template v-if="isRecalling">
            <button class="primary-btn submit-btn" @click="submitAnswer">提交答案</button>
            <button class="secondary-btn" @click="resetRecall">重置输入</button>
        </template>
      </div>


      <!-- Result Area -->
      <div class="result-area card" v-if="isFinished">
        <h3 class="card-header">结果统计</h3>
        <div class="result-rows">
          <div class="result-row">
            <div class="result-cell">
              <span class="label">正确数</span>
              <span class="result-value success">{{ store.results.correctCount }}</span>
            </div>
            <div class="result-cell">
              <span class="label">错误数</span>
              <span class="result-value danger">{{ store.results.errorCount }}</span>
            </div>
            <div class="result-cell">
              <span class="label">准确率</span>
              <span class="result-value primary">{{ store.results.accuracy.toFixed(2) }}%</span>
            </div>
          </div>

          <div class="result-row">
            <div class="result-cell">
              <span class="label">记忆用时</span>
              <span class="result-value">{{ formattedMemoryTime }}</span>
            </div>
            <div class="result-cell">
              <span class="label">复原用时</span>
              <span class="result-value">{{ formattedRecallTime }}</span>
            </div>
            <div class="result-cell">
              <span class="label">总用时</span>
              <span class="result-value">{{ formattedTotalTime }}</span>
            </div>
          </div>
        </div>
        <div class="comparison-area">
          <div class="comparison-header">
            <h4>详细对比</h4>
            <button class="copy-btn" @click="copyToClipboard(store.generatedNumber)">复制原文</button>
          </div>
            <p class="original-num"><strong>原始:</strong> <span v-for="(item, i) in store.results.comparison" :key="i" :class="item.status">{{ item.original }}</span></p>
            <p class="user-input-num"><strong>你的:</strong> <span v-for="(item, i) in store.results.comparison" :key="i" :class="item.status">{{ item.user }}</span></p>
        </div>
         <div class="result-actions">
            <button class="primary-btn" @click="saveHistory">保存记录</button>
            <button class="secondary-btn" @click="resetTraining">重新开始</button>
        </div>
      </div>



      <!-- History Area -->
       <div class="history-area card" v-if="history.length > 0">
        <div class="history-header">
            <h3 class="card-header">历史记录</h3>
            <div class="history-actions">
              <button class="secondary-btn clear-btn" @click="clearHistory">清空记录</button>
              <button class="secondary-btn mini" @click="collapsedHistory = !collapsedHistory">{{ collapsedHistory ? '展开' : '收起' }}</button>
            </div>
        </div>
        <Transition name="fade">
          <ul v-show="!collapsedHistory" class="history-list">
              <li v-for="record in history" :key="record.id" class="history-item">
                  <div class="history-item-summary">
                      <span>{{ record.date }}</span>
                      <span>长度: {{ record.length }}</span>
                      <span>正确率: {{ record.accuracy.toFixed(2) }}%</span>
                      <span>得分: {{ record.score }}</span>
                  </div>
                  <div class="history-item-actions">
                       <button class="secondary-btn delete-btn" @click="deleteHistory(record.id)">删除</button>
                  </div>
              </li>
          </ul>
        </Transition>
      </div>


    </main>

    <!-- Global Modals & Toasts -->
    <div v-if="modal.show" class="modal-overlay" @click.self="handleModalCancel">
      <div v-dialog class="modal-content">
        <h4 class="modal-title">{{ modal.title }}</h4>
        <p class="modal-message">{{ modal.message }}</p>
        <div class="modal-actions">
          <button class="secondary-btn" @click="handleModalCancel">{{ modal.cancelText }}</button>
          <button class="primary-btn" :class="modal.confirmClass" @click="handleModalConfirm">{{ modal.confirmText }}</button>
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

    <div v-if="showHelp" class="modal-overlay help-overlay" @click.self="showHelp = false">
        <div v-dialog class="modal-content help-modal">
            <h4 class="modal-title">快速数字训练 - 操作说明</h4>
            <ul>
                <li><b>1. 配置</b>：设置数字长度/时间/分组/模式；训练开始自动收起，需调整可展开。</li>
                <li><b>2. 生成</b>：点击“生成随机数字”得到题目；生成后按钮锁定为绿色，重新开始可解锁。</li>
                <li><b>3. 记忆</b>：点击“开始训练”进入计时；可暂停/继续；倒计时结束自动进入回忆。</li>
                <li><b>4. 回忆</b>：下方槽位逐个录入，也可选中某个槽位，点击数字键输入或修改当前槽位；点击“跳到未填”快速定位，槽位区可滑动。</li>
                <li><b>5. 提交</b>：未填满时提交会提示当前进度；结果页支持复制原文并保存历史。</li>
            </ul>
            <div class="modal-actions">
                <button class="primary-btn" @click="showHelp = false">我明白了</button>
            </div>
        </div>
    </div>



  </div>
</template>

<style scoped>
/* General & Layout */
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
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 100;
}
.title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
}
.icon-btn, .help-btn {
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
.help-btn { font-size: 1.2rem; color: #e74c3c; }
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.card-header {
  margin: 0 0 20px 0;
  font-size: 1rem;
  font-weight: bold;
  color: #285c48;
  border-bottom: 1px solid #edf1e8;
  padding-bottom: 10px;
}

/* Config Area */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.config-item { display: flex; flex-direction: column; }
.config-item label { margin-bottom: 8px; font-size: 0.9rem; color: #627069; }
.config-item input, .config-item select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
}
.config-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* Button Styles */
.primary-btn, .secondary-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}
.primary-btn { color: white; background: #285c48; }
.primary-btn:hover { background: #204b3b; }
.generated-btn { background: #285c48; }
.secondary-btn {
  border: 1px solid #627069;
  background: white;
  color: #627069;
}
.secondary-btn:hover { background: #f8f9fa; border-color: #627069; }
.disabled { opacity: 0.6; pointer-events: none; }


/* Training Area */
.training-area { padding: 0; }
.training-header {
    text-align: center;
    padding: 10px;
    border-bottom: 1px solid #edf1e8;
}
.timer-display {
    font-family: monospace;
    font-size: 1.8rem;
    font-weight: bold;
    color: #e74c3c;
}
.number-display-wrapper { padding: 20px; }

.number-lines {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;

  font-size: 2rem;
  font-weight: bold;
  color: #34495e;

  max-height: 250px;
  overflow-y: auto;
  line-height: 1.6;
  padding-right: 6px;
}

.number-line {
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.line-no {
  flex: 0 0 46px;
  text-align: right;
  padding-right: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #627069;
  font-family: monospace;
}

.line-content {
  flex: 1;
  display: inline-flex;
  align-items: flex-end;
  flex-wrap: nowrap;
  gap: 10px 6px;
  min-width: 0;
}

.char-measure {
  position: absolute;
  top: -9999px;
  left: -9999px;
  visibility: hidden;
  pointer-events: none;
  font-family: monospace;
  font-size: 2rem;
}


.digit-group {
  display: inline-flex;
  align-items: flex-end;
  max-width: 100%;
  flex: 0 0 auto;
}

.group-digits {
  font-family: monospace;
  letter-spacing: 0.2em;
  white-space: nowrap;
}

/* 如果一组数字极长（超出一行），允许在组内断行以适配小屏 */
.digit-group.oversized {
  flex: 1 1 100%;
}

.digit-group.oversized .group-digits {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-all;
}
.recall-prompt {
    text-align: center;
    padding: 15px;
    color: #627069;
    font-style: italic;
    border-bottom: 1px solid #edf1e8;
}
.slot-input-wrapper { padding: 15px; display: flex; flex-direction: column; gap: 12px; }
.slot-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px 10px; font-size: 0.95rem; color: #34495e; }
.slot-progress { white-space: nowrap; }
.slot-recall-timer { white-space: nowrap; font-family: monospace; font-weight: 700; color: #e67e22; }
.slot-grid {
    max-height: 320px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
    padding: 8px;
    border: 1px dashed #edf1e8;
    border-radius: 10px;
    background: #fafbfc;
}
.slot-item {
    background: white;
    border: 1px solid #dfe6e9;
    border-radius: 8px;
    height: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.slot-item.selected { border-color: #1f7acb; box-shadow: 0 0 0 4px rgba(31,122,203,0.32); }
.slot-item.filled .slot-value { color: #285c48; }

.slot-value { font-size: 1.4rem; font-weight: 700; color: #627069; }
.slot-index { font-size: 0.75rem; color: #627069; }

.keypad {
    position: sticky;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 8px;
    padding: 10px;
    background: #ffffff;
    border: 1px solid #edf1e8;
    border-radius: 10px;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}
.keypad-btn {
    padding: 12px 0;
    border-radius: 10px;
    border: 1px solid #627069;
    background: #f8f9fa;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
}
.keypad-btn:hover { background: #edf1e8; }
.secondary-btn.mini {
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 0.85rem;
}




/* Control & Result Area */
.control-area { display: flex; justify-content: center; gap: 15px; padding: 10px 0; flex-wrap: wrap; }

.start-btn { width: 100%; max-width: 300px; padding: 15px; font-size: 1.2rem; }
.submit-btn { background-color: #285c48; }
.resume-btn { background-color: #204b3b; }
.resume-btn:hover { background-color: #1e9d54; }

.result-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 15px; }

.result-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
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
  font-size: 1rem;
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

.result-value.success { color: #285c48; }
.result-value.danger { color: #e74c3c; }
.result-value.primary { color: #285c48; }

.comparison-header { display: flex; justify-content: space-between; align-items: center; }
.comparison-area h4 { margin-bottom: 10px; color: #627069; }
.comparison-area p { font-size: 1.1rem; word-break: break-all; letter-spacing: 0.1em; line-height: 1.7; }
.comparison-area span { padding: 1px 0; }
.copy-btn {
    font-size: 0.8rem; padding: 4px 8px; border-radius: 12px;
    color: #285c48; border-color: #285c48;
}
.comparison-area .correct { color: #285c48; font-weight: bold; }
.comparison-area .incorrect { color: #e74c3c; font-weight: bold; text-decoration: line-through; }
.comparison-area .missing { color: #f39c12; background: #fdf3e1; }
.comparison-area .extra { color: #e74c3c; background: #fbe6e4; }

.group-sep {
    color: #e74c3c;
    font-weight: 700;
    padding: 0 3px;
}
.caret-current {
    background: #ffeaa7;
    color: #d35400;
    border-radius: 4px;
    padding: 1px 2px;
}
.input-preview {
    margin-top: 8px;
    padding: 8px 10px;
    background: #fffdf7;
    border: 1px dashed #f39c12;
    border-radius: 8px;
    font-family: monospace;
    color: #34495e;
    min-height: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    word-break: break-all;
}



/* History Area */

.history-area { margin-bottom: 30px; }
.history-header { display: flex; justify-content: space-between; align-items: center; }
.history-header .card-header { border-bottom: none; }
.clear-btn { padding: 5px 10px; font-size: 0.8rem; border-radius: 15px; color: #e74c3c; border-color: #e74c3c; }
.history-list { list-style: none; padding: 0; margin: 0; }
.history-item { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; padding: 15px 10px; border-bottom: 1px solid #edf1e8; }
.history-item:last-child { border-bottom: none; }
.history-item-summary { display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.9rem; color: #34495e; }
.delete-btn { padding: 5px 10px; font-size: 0.8rem; border-radius: 15px; color: #627069; border-color: #627069; }

/* Modal & Toast Styles */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center; z-index: 2000;
}
.help-overlay {
  align-items: flex-start;
  padding-top: 70px;
}
.modal-content {
  background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 420px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
.help-modal {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
.modal-title { margin: 0 0 12px 0; font-size: 1.2rem; color: #34495e; text-align: left; }
.modal-message { margin: 0 0 24px 0; font-size: 1rem; color: #627069; line-height: 1.6; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
.help-modal ul { padding-left: 20px; line-height: 1.6; color: #34495e; text-align: left; }
.help-modal li { margin-bottom: 8px; }



.toast-container {
    position: fixed; top: 20px; right: 20px; z-index: 3000;
    display: flex; flex-direction: column; gap: 10px;
}
.toast-item {
    padding: 12px 20px; border-radius: 8px; color: white; font-weight: bold; font-size: 0.9rem;
    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}
.toast-success { background: #285c48; }
.toast-error { background: #e74c3c; }
.toast-info { background: #285c48; }

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.4s ease; }
.toast-fade-enter-from, .toast-fade-leave-to {
    opacity: 0;
    transform: translateX(100%);
}
</style>
